import { SupabaseService, ServiceResponse, handleServiceError } from './SupabaseService';

interface AuditLogData {
  entity_type: string;
  entity_id: string;
  action: 'create' | 'update' | 'delete';
  user_id: string;
  before_data?: any;
  after_data?: any;
  metadata?: any;
}

export const AuditService = {
  log: async (logData: AuditLogData): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();

      const { error } = await client
        .from('audit_logs')
        .insert({
          entity_type: logData.entity_type,
          entity_id: logData.entity_id,
          action: logData.action,
          user_id: logData.user_id,
          before_data: logData.before_data || null,
          after_data: logData.after_data || null,
          metadata: logData.metadata || {},
        });

      if (error) {
        console.error('Audit log error:', error);
      }

      return { success: !error };
    } catch (error) {
      console.error('Audit log exception:', error);
      return { success: false };
    }
  },

  getEntityLogs: async (entityType: string, entityId: string): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();

      const { data, error } = await client
        .from('audit_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  getUserLogs: async (userId: string, limit: number = 50): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();

      const { data, error } = await client
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      return handleServiceError(error);
    }
  },
};
