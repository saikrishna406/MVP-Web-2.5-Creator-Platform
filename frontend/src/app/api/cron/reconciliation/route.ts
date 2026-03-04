import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cron job: Nightly reconciliation
// Compares SUM(ledger) vs wallet balance for all users
export async function GET(request: NextRequest) {
    // Verify cron secret (Vercel sends this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    try {
        // Call reconcile_balances() — returns only mismatched rows
        const { data: mismatches, error } = await supabase.rpc('reconcile_balances');

        if (error) {
            console.error('[reconciliation] RPC error:', error);
            return NextResponse.json({ error: 'Reconciliation failed' }, { status: 500 });
        }

        const mismatchCount = mismatches?.length || 0;

        if (mismatchCount > 0) {
            console.error(`[reconciliation] ALERT: ${mismatchCount} balance mismatches found!`);

            // Log each mismatch as suspicious activity
            for (const m of mismatches) {
                await supabase.from('suspicious_activity_logs').insert({
                    user_id: m.user_id,
                    activity_type: 'balance_mismatch',
                    severity: 'critical',
                    description: `Token balance mismatch: wallet=${m.wallet_token_balance}, ledger=${m.ledger_token_sum}. Points mismatch: wallet=${m.wallet_points_balance}, ledger=${m.ledger_points_sum}`,
                    metadata: {
                        wallet_token_balance: m.wallet_token_balance,
                        ledger_token_sum: m.ledger_token_sum,
                        wallet_points_balance: m.wallet_points_balance,
                        ledger_points_sum: m.ledger_points_sum,
                    },
                });
            }
        }

        return NextResponse.json({
            success: true,
            mismatchCount,
            timestamp: new Date().toISOString(),
            message: mismatchCount === 0
                ? 'All balances reconciled successfully'
                : `${mismatchCount} mismatches detected and logged`,
        });
    } catch (error) {
        console.error('[reconciliation] Error:', error);
        return NextResponse.json({ error: 'Reconciliation failed' }, { status: 500 });
    }
}
