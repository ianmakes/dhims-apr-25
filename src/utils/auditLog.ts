
import { supabase } from "@/integrations/supabase/client";

interface AuditLogParams {
  action: string;
  entity: string;
  entity_id: string;
  details: string;
}

/**
 * Records an action in the audit log
 * @param params Audit log parameters
 * @returns Promise that resolves when the audit log entry is created
 */
export const recordAuditLog = async (params: AuditLogParams): Promise<void> => {
  try {
    const { action, entity, entity_id, details } = params;
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user && action !== 'login') {
      console.warn("No user found for audit log");
    }
    
    // Create audit log entry
    await supabase.from('audit_logs').insert({
      username: user?.email || 'System',
      user_id: user?.id || null,
      action,
      entity,
      entity_id,
      details,
    });
    
  } catch (error) {
    console.error("Error recording audit log:", error);
    // Don't throw the error as audit logging should not interrupt the main flow
  }
};

/**
 * Log a create action
 */
export const logCreate = async (entity: string, entityId: string, details: string): Promise<void> => {
  return recordAuditLog({
    action: 'create',
    entity,
    entity_id: entityId,
    details
  });
};

/**
 * Log an update action
 */
export const logUpdate = async (entity: string, entityId: string, details: string): Promise<void> => {
  return recordAuditLog({
    action: 'update',
    entity,
    entity_id: entityId,
    details
  });
};

/**
 * Log a delete action
 */
export const logDelete = async (entity: string, entityId: string, details: string): Promise<void> => {
  return recordAuditLog({
    action: 'delete',
    entity,
    entity_id: entityId,
    details
  });
};

/**
 * Log a system action
 */
export const logSystem = async (entity: string, entityId: string, details: string): Promise<void> => {
  return recordAuditLog({
    action: 'system',
    entity,
    entity_id: entityId,
    details
  });
};

/**
 * Log a login action
 */
export const logLogin = async (userId: string, details: string = "User logged in"): Promise<void> => {
  return recordAuditLog({
    action: 'login',
    entity: 'auth',
    entity_id: userId,
    details
  });
};

/**
 * Log a logout action
 */
export const logLogout = async (userId: string, details: string = "User logged out"): Promise<void> => {
  return recordAuditLog({
    action: 'logout',
    entity: 'auth',
    entity_id: userId,
    details
  });
};

/**
 * Log a view action
 */
export const logView = async (entity: string, entityId: string, details: string): Promise<void> => {
  return recordAuditLog({
    action: 'view',
    entity,
    entity_id: entityId,
    details
  });
};

/**
 * Log a restore action
 */
export const logRestore = async (entity: string, entityId: string, details: string): Promise<void> => {
  return recordAuditLog({
    action: 'restore',
    entity,
    entity_id: entityId,
    details
  });
};
