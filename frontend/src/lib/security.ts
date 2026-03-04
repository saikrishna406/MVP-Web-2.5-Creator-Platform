// ==========================================
// Stage 6.3: Suspicious Activity Logger
// ==========================================

import { SupabaseClient } from '@supabase/supabase-js';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface SuspiciousActivityParams {
    userId: string | null;
    activityType: string;
    severity: Severity;
    description: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
    endpoint?: string;
}

/**
 * Log suspicious activity to the database for review.
 * Uses service-role client — never call with user client.
 */
export async function logSuspiciousActivity(
    serviceClient: SupabaseClient,
    params: SuspiciousActivityParams
): Promise<void> {
    try {
        await serviceClient.from('suspicious_activity_logs').insert({
            user_id: params.userId,
            activity_type: params.activityType,
            severity: params.severity,
            description: params.description,
            metadata: params.metadata || {},
            ip_address: params.ipAddress || null,
            user_agent: params.userAgent || null,
            endpoint: params.endpoint || null,
        });
    } catch (err) {
        // Never let logging failure crash the request
        console.error('[SECURITY] Failed to log suspicious activity:', err);
    }
}

/**
 * Extract IP from Next.js request headers.
 */
export function getClientIp(headers: Headers): string | null {
    return (
        headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headers.get('x-real-ip') ||
        null
    );
}
