import { SupabaseService, ServiceResponse, handleServiceError } from './SupabaseService';
import { AuditService } from './AuditService';

interface GroupMember {
  userId?: string;
  name: string;
  email: string;
  dietary?: 'vegetarian' | 'non-vegetarian' | 'both';
  balance?: number;
}

interface CreateGroupData {
  name: string;
  description?: string;
  type?: 'trip' | 'meal' | 'event' | 'general';
  members?: GroupMember[];
}

export const GroupService = {
  createGroup: async (groupData: CreateGroupData): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();
      const currentUserId = SupabaseService.getCurrentUserId();

      const { data: group, error: groupError } = await client
        .from('groups')
        .insert({
          name: groupData.name,
          description: groupData.description || '',
          type: groupData.type || 'general',
          created_by: currentUserId,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      const { data: currentUser } = await client
        .from('users')
        .select('name, email')
        .eq('id', currentUserId)
        .single();

      const membersToAdd: any[] = [
        {
          group_id: group.id,
          user_id: currentUserId,
          name: currentUser?.name || 'You',
          email: currentUser?.email || 'you@example.com',
          dietary: 'both',
        },
      ];

      if (groupData.members && groupData.members.length > 0) {
        for (const member of groupData.members) {
          membersToAdd.push({
            group_id: group.id,
            user_id: member.userId || null,
            name: member.name,
            email: member.email,
            dietary: member.dietary || 'both',
          });
        }
      }

      const { error: membersError } = await client
        .from('group_members')
        .insert(membersToAdd);

      if (membersError) throw membersError;

      await AuditService.log({
        entity_type: 'group',
        entity_id: group.id,
        action: 'create',
        user_id: currentUserId,
        after_data: { ...group, members: membersToAdd },
      });

      return { success: true, data: group };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  getUserGroups: async (userId: string): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();

      const { data: groups, error } = await client
        .from('groups')
        .select(`
          *,
          group_members (
            id,
            user_id,
            name,
            email,
            dietary,
            balance,
            joined_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: groups || [] };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  getGroupById: async (groupId: string): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();

      const { data: group, error } = await client
        .from('groups')
        .select(`
          *,
          group_members (
            id,
            user_id,
            name,
            email,
            dietary,
            balance,
            joined_at
          ),
          expenses (
            id,
            description,
            amount,
            paid_by_name,
            expense_date,
            type
          )
        `)
        .eq('id', groupId)
        .single();

      if (error) throw error;

      return { success: true, data: group };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  addGroupMember: async (groupId: string, member: GroupMember): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();
      const currentUserId = SupabaseService.getCurrentUserId();

      const { data: newMember, error } = await client
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: member.userId || null,
          name: member.name,
          email: member.email,
          dietary: member.dietary || 'both',
        })
        .select()
        .single();

      if (error) throw error;

      await AuditService.log({
        entity_type: 'group_member',
        entity_id: newMember.id,
        action: 'create',
        user_id: currentUserId,
        after_data: newMember,
        metadata: { group_id: groupId },
      });

      return { success: true, data: newMember };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  removeGroupMember: async (groupId: string, memberId: string): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();
      const currentUserId = SupabaseService.getCurrentUserId();

      const { data: member, error: fetchError } = await client
        .from('group_members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (fetchError) throw fetchError;

      const { error: deleteError } = await client
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (deleteError) throw deleteError;

      await AuditService.log({
        entity_type: 'group_member',
        entity_id: memberId,
        action: 'delete',
        user_id: currentUserId,
        before_data: member,
        metadata: { group_id: groupId },
      });

      return { success: true };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  updateGroup: async (groupId: string, updates: Partial<CreateGroupData>): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();
      const currentUserId = SupabaseService.getCurrentUserId();

      const { data: before } = await client
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      const { data: group, error } = await client
        .from('groups')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;

      await AuditService.log({
        entity_type: 'group',
        entity_id: groupId,
        action: 'update',
        user_id: currentUserId,
        before_data: before,
        after_data: group,
      });

      return { success: true, data: group };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  deleteGroup: async (groupId: string): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();
      const currentUserId = SupabaseService.getCurrentUserId();

      const { data: group } = await client
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      const { error } = await client
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      await AuditService.log({
        entity_type: 'group',
        entity_id: groupId,
        action: 'delete',
        user_id: currentUserId,
        before_data: group,
      });

      return { success: true };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  updateMemberBalance: async (groupId: string, memberId: string, newBalance: number): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();

      const { data, error } = await client
        .from('group_members')
        .update({ balance: newBalance })
        .eq('id', memberId)
        .eq('group_id', groupId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return handleServiceError(error);
    }
  },
};
