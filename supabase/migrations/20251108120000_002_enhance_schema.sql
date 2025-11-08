/*
  Migration 002: Enhanced Schema Features

  This migration adds additional features to improve the database:
  1. Currency conversion support
  2. Expense categories
  3. Recurring expenses
  4. Payment methods tracking
  5. Enhanced audit logging with IP addresses
  6. Soft delete support
  7. Notification preferences
*/

-- Add currency conversion support
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS exchange_rate numeric(10,6) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS original_currency text DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS converted_amount numeric(10,2);

-- Add expense categories
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS category text DEFAULT 'other'
CHECK (category IN ('food', 'transport', 'accommodation', 'entertainment', 'shopping', 'utilities', 'healthcare', 'education', 'other'));

-- Add payment methods
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash'
CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'digital_wallet', 'other'));

-- Add soft delete support
ALTER TABLE groups ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Add recurring expense support
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  currency text DEFAULT 'INR',
  category text DEFAULT 'other',
  payment_method text DEFAULT 'cash',
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  interval_count integer DEFAULT 1 CHECK (interval_count > 0),
  start_date date NOT NULL,
  end_date date,
  last_created_date date,
  next_due_date date NOT NULL,
  is_active boolean DEFAULT true,
  split_type text DEFAULT 'EQUAL' CHECK (split_type IN ('EQUAL', 'PERCENTAGE', 'EXACT', 'ITEM_WISE')),
  split_config jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create expense categories table for better organization
CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  color text DEFAULT '#6366f1',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Insert default categories
INSERT INTO expense_categories (name, description, icon, color, is_default) VALUES
('food', 'Food and dining expenses', 'restaurant', '#ef4444', true),
('transport', 'Transportation and travel', 'car', '#3b82f6', true),
('accommodation', 'Hotel and lodging', 'home', '#10b981', true),
('entertainment', 'Entertainment and leisure', 'gamepad', '#8b5cf6', true),
('shopping', 'Shopping and retail', 'shopping-bag', '#f59e0b', true),
('utilities', 'Utilities and bills', 'zap', '#6366f1', true),
('healthcare', 'Health and medical', 'heart', '#ec4899', true),
('education', 'Education and learning', 'book', '#14b8a6', true),
('other', 'Miscellaneous expenses', 'more-horizontal', '#6b7280', true)
ON CONFLICT (name) DO NOTHING;

-- Add notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  expense_created boolean DEFAULT true,
  expense_updated boolean DEFAULT true,
  settlement_completed boolean DEFAULT true,
  balance_reminder boolean DEFAULT true,
  group_invite boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Enhanced audit logging with additional context
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS session_id uuid,
ADD COLUMN IF NOT EXISTS request_id text;

-- Add indexes for new features
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_method ON expenses(payment_method);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_groups_deleted_at ON groups(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_next_due ON recurring_expenses(next_due_date);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_active ON recurring_expenses(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON audit_logs(session_id);

-- Update RLS policies for new tables
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_expenses
CREATE POLICY "Users can view recurring expenses in their groups"
  ON recurring_expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = recurring_expenses.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage recurring expenses they created"
  ON recurring_expenses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for expense_categories (public read, authenticated create/update own)
CREATE POLICY "Anyone can view expense categories"
  ON expense_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create categories"
  ON expense_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update existing RLS policies to respect soft delete
DROP POLICY IF EXISTS "Users can view expenses in their groups" ON expenses;
CREATE POLICY "Users can view non-deleted expenses in their groups"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND (
      group_id IS NULL AND auth.uid() = paid_by
      OR EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = expenses.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.deleted_at IS NULL
      )
    )
  );

-- Function to handle soft delete for expenses
CREATE OR REPLACE FUNCTION soft_delete_expense()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = now();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for soft delete
CREATE TRIGGER soft_delete_expense_trigger
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION soft_delete_expense();

-- Function to create expense from recurring template
CREATE OR REPLACE FUNCTION create_recurring_expense()
RETURNS void AS $$
DECLARE
  recurring recurring_expenses%ROWTYPE;
  expense_id uuid;
BEGIN
  FOR recurring IN
    SELECT * FROM recurring_expenses
    WHERE is_active = true
    AND next_due_date <= CURRENT_DATE
  LOOP
    -- Create the expense
    INSERT INTO expenses (
      description, amount, paid_by, paid_by_name, group_id,
      split_type, category, payment_method, currency, expense_date,
      type
    ) VALUES (
      recurring.description, recurring.amount, recurring.user_id,
      (SELECT name FROM users WHERE id = recurring.user_id LIMIT 1),
      recurring.group_id, recurring.split_type, recurring.category,
      recurring.payment_method, recurring.currency, CURRENT_DATE, 'manual'
    )
    RETURNING id INTO expense_id;

    -- Update next due date
    UPDATE recurring_expenses
    SET
      last_created_date = CURRENT_DATE,
      next_due_date = CASE
        WHEN recurring.frequency = 'daily' THEN CURRENT_DATE + (recurring.interval_count || ' days')::interval
        WHEN recurring.frequency = 'weekly' THEN CURRENT_DATE + (recurring.interval_count || ' weeks')::interval
        WHEN recurring.frequency = 'monthly' THEN CURRENT_DATE + (recurring.interval_count || ' months')::interval
        WHEN recurring.frequency = 'yearly' THEN CURRENT_DATE + (recurring.interval_count || ' years')::interval
      END,
      updated_at = now()
    WHERE id = recurring.id;

    -- Deactivate if end date reached
    IF recurring.end_date IS NOT NULL AND CURRENT_DATE >= recurring.end_date THEN
      UPDATE recurring_expenses
      SET is_active = false, updated_at = now()
      WHERE id = recurring.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create recurring expenses (would be called by a scheduled job)
-- CREATE TRIGGER create_recurring_expenses_trigger
--   AFTER INSERT ON recurring_expenses
--   FOR EACH ROW
--   EXECUTE FUNCTION create_recurring_expense();

-- Update existing timestamp trigger function to handle soft delete timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'expenses' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    NEW.updated_at = now();
    RETURN NEW;
  END IF;

  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NULL THEN
    NEW.updated_at = now();
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;