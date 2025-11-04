/*
  # Initial Schema for Splitwise Clone

  ## Overview
  Complete database schema for expense splitting application with OCR support,
  event management, audit logging, and share/export capabilities.

  ## New Tables

  ### 1. users
  - `id` (uuid, primary key) - User unique identifier
  - `name` (text) - User display name
  - `email` (text, unique) - User email address
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. groups
  - `id` (uuid, primary key) - Group unique identifier
  - `name` (text) - Group name
  - `description` (text) - Optional group description
  - `type` (text) - Group type: 'trip', 'meal', 'event', 'general'
  - `created_by` (uuid) - Reference to users(id)
  - `total_expenses` (numeric) - Running total of all expenses
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. group_members
  - `id` (uuid, primary key) - Member record identifier
  - `group_id` (uuid) - Reference to groups(id)
  - `user_id` (uuid) - Reference to users(id)
  - `name` (text) - Member display name
  - `email` (text) - Member email
  - `dietary` (text) - Dietary preference: 'vegetarian', 'non-vegetarian', 'both'
  - `balance` (numeric) - Current balance in group
  - `joined_at` (timestamptz) - When member joined group

  ### 4. expenses
  - `id` (uuid, primary key) - Expense unique identifier
  - `description` (text) - Expense description
  - `amount` (numeric) - Total expense amount
  - `paid_by` (uuid) - Reference to users(id)
  - `paid_by_name` (text) - Name of payer (denormalized)
  - `group_id` (uuid) - Reference to groups(id), nullable
  - `split_type` (text) - 'EQUAL', 'PERCENTAGE', 'EXACT', 'ITEM_WISE'
  - `type` (text) - 'manual' or 'scan'
  - `image_url` (text) - Optional receipt image URL
  - `ocr_confidence` (numeric) - OCR parsing confidence score (0-1)
  - `vendor` (text) - Vendor/merchant name from OCR
  - `expense_date` (date) - Date of expense
  - `tax` (numeric) - Tax amount
  - `currency` (text) - Currency code (default 'INR')
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. expense_items
  - `id` (uuid, primary key) - Item unique identifier
  - `expense_id` (uuid) - Reference to expenses(id)
  - `name` (text) - Item name/description
  - `price` (numeric) - Item price
  - `quantity` (numeric) - Item quantity (default 1)
  - `category` (text) - 'vegetarian', 'non-vegetarian', 'other'
  - `created_at` (timestamptz) - Creation timestamp

  ### 6. expense_splits
  - `id` (uuid, primary key) - Split record identifier
  - `expense_id` (uuid) - Reference to expenses(id)
  - `expense_item_id` (uuid) - Reference to expense_items(id), nullable
  - `user_id` (uuid) - Reference to users(id)
  - `user_name` (text) - User name (denormalized)
  - `amount` (numeric) - Amount owed/paid
  - `percentage` (numeric) - Split percentage if applicable
  - `settled` (boolean) - Whether split has been settled
  - `settled_at` (timestamptz) - When split was settled
  - `created_at` (timestamptz) - Creation timestamp

  ### 7. event_snapshots
  - `id` (uuid, primary key) - Snapshot unique identifier
  - `group_id` (uuid) - Reference to groups(id)
  - `snapshot_data` (jsonb) - Complete snapshot of balances and expenses
  - `share_token` (text, unique) - Token for sharing snapshot
  - `created_by` (uuid) - Reference to users(id)
  - `created_at` (timestamptz) - Creation timestamp
  - `expires_at` (timestamptz) - Optional expiration date

  ### 8. audit_logs
  - `id` (uuid, primary key) - Log entry identifier
  - `entity_type` (text) - 'expense', 'group', 'member', etc.
  - `entity_id` (uuid) - ID of affected entity
  - `action` (text) - 'create', 'update', 'delete'
  - `user_id` (uuid) - Reference to users(id)
  - `before_data` (jsonb) - Data before change
  - `after_data` (jsonb) - Data after change
  - `metadata` (jsonb) - Additional context
  - `created_at` (timestamptz) - Timestamp of action

  ## Security
  - RLS enabled on all tables
  - Policies restrict access to group members and data owners
  - Audit logs are read-only for users

  ## Important Notes
  1. All monetary values use numeric type for precision
  2. Timestamps use timestamptz for timezone awareness
  3. Foreign keys enforce referential integrity
  4. Indexes added for common query patterns
  5. Triggers maintain updated_at timestamps automatically
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text DEFAULT '',
  type text DEFAULT 'general' CHECK (type IN ('trip', 'meal', 'event', 'general')),
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_expenses numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  dietary text DEFAULT 'both' CHECK (dietary IN ('vegetarian', 'non-vegetarian', 'both')),
  balance numeric(10,2) DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, email)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  description text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  paid_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  paid_by_name text NOT NULL,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  split_type text DEFAULT 'EQUAL' CHECK (split_type IN ('EQUAL', 'PERCENTAGE', 'EXACT', 'ITEM_WISE')),
  type text DEFAULT 'manual' CHECK (type IN ('manual', 'scan')),
  image_url text,
  ocr_confidence numeric(3,2) CHECK (ocr_confidence >= 0 AND ocr_confidence <= 1),
  vendor text,
  expense_date date DEFAULT CURRENT_DATE,
  tax numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'INR',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Expense items table (for itemized expenses)
CREATE TABLE IF NOT EXISTS expense_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  quantity numeric(5,2) DEFAULT 1 CHECK (quantity > 0),
  category text DEFAULT 'other' CHECK (category IN ('vegetarian', 'non-vegetarian', 'other')),
  created_at timestamptz DEFAULT now()
);

-- Expense splits table
CREATE TABLE IF NOT EXISTS expense_splits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  expense_item_id uuid REFERENCES expense_items(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  amount numeric(10,2) NOT NULL,
  percentage numeric(5,2) CHECK (percentage >= 0 AND percentage <= 100),
  settled boolean DEFAULT false,
  settled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Event snapshots table (for sharing)
CREATE TABLE IF NOT EXISTS event_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  snapshot_data jsonb NOT NULL,
  share_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64'),
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expense_items_expense_id ON expense_items(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_event_snapshots_token ON event_snapshots(share_token);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for groups
CREATE POLICY "Users can view groups they're members of"
  ON groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
  ON groups FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for group_members
CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group creators can manage members"
  ON group_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.created_by = auth.uid()
    )
  );

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses in their groups"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    group_id IS NULL AND auth.uid() = paid_by
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = expenses.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = paid_by);

CREATE POLICY "Expense payers can update their expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = paid_by)
  WITH CHECK (auth.uid() = paid_by);

CREATE POLICY "Expense payers can delete their expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = paid_by);

-- RLS Policies for expense_items
CREATE POLICY "Users can view items for expenses they can see"
  ON expense_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_items.expense_id
      AND (
        expenses.paid_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM group_members
          WHERE group_members.group_id = expenses.group_id
          AND group_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage items for their expenses"
  ON expense_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_items.expense_id
      AND expenses.paid_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_items.expense_id
      AND expenses.paid_by = auth.uid()
    )
  );

-- RLS Policies for expense_splits
CREATE POLICY "Users can view splits for expenses they can see"
  ON expense_splits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
      AND (
        expenses.paid_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM group_members
          WHERE group_members.group_id = expenses.group_id
          AND group_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage splits for their expenses"
  ON expense_splits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
      AND expenses.paid_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
      AND expenses.paid_by = auth.uid()
    )
  );

-- RLS Policies for event_snapshots
CREATE POLICY "Anyone can view snapshots with valid token"
  ON event_snapshots FOR SELECT
  TO authenticated
  USING (
    expires_at IS NULL OR expires_at > now()
  );

CREATE POLICY "Group members can create snapshots"
  ON event_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = event_snapshots.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- RLS Policies for audit_logs
CREATE POLICY "Users can view audit logs for their actions"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
