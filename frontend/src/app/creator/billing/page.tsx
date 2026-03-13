import { createClient } from '@/lib/supabase/server';
import {
    CreditCard, Coins, ArrowUpRight, ArrowDownRight,
    CheckCircle, Clock, Receipt, Sparkles
} from 'lucide-react';
import { formatTokens, formatCurrency, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
    title: 'Billing | Black Bolts',
    description: 'View your token purchases and transaction history.',
};

export default async function CreatorBillingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Wallet
    const { data: wallet } = await supabase
        .from('wallets')
        .select('token_balance, points_balance')
        .eq('user_id', user.id)
        .single();

    // Token transactions ledger
    const { data: transactions } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

    // Token packages available
    const { data: packages } = await supabase
        .from('token_packages')
        .select('*')
        .eq('is_active', true)
        .order('price_cents', { ascending: true });

    const totalEarned = transactions
        ?.filter(t => t.amount > 0 && t.type === 'earn')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

    const totalSpent = transactions
        ?.filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

    const card: React.CSSProperties = {
        background: 'var(--dash-card)',
        border: '1px solid var(--dash-border)',
        borderRadius: '16px',
        boxShadow: 'var(--dash-shadow-sm)',
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{
                    fontSize: '32px', fontWeight: 700, color: 'var(--dash-text-primary)',
                    letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '4px',
                }}>
                    Billing & Tokens
                </h1>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--dash-text-secondary)', margin: 0 }}>
                    Manage your token balance and view transaction history.
                </p>
            </div>

            {/* Balance Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                    {
                        label: 'Token Balance',
                        value: formatTokens(wallet?.token_balance || 0),
                        suffix: 'tokens',
                        icon: <Coins style={{ width: '20px', height: '20px' }} />,
                    },
                    {
                        label: 'Total Earned',
                        value: formatTokens(totalEarned),
                        suffix: 'from fans',
                        icon: <ArrowDownRight style={{ width: '20px', height: '20px' }} />,
                    },
                    {
                        label: 'Total Spent',
                        value: formatTokens(totalSpent),
                        suffix: 'on platform',
                        icon: <ArrowUpRight style={{ width: '20px', height: '20px' }} />,
                    },
                ].map((stat) => (
                    <div key={stat.label} style={{ ...card, padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--dash-text-secondary)', marginBottom: '10px', fontSize: '13px', fontWeight: 600 }}>
                            {stat.icon}{stat.label}
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--dash-text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                            {stat.value}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--dash-text-muted)', marginTop: '4px' }}>
                            {stat.suffix}
                        </div>
                    </div>
                ))}
            </div>

            {/* Buy Tokens */}
            {packages && packages.length > 0 && (
                <div style={{ ...card, marginBottom: '28px', overflow: 'hidden' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '20px 24px', borderBottom: '1px solid var(--dash-border)',
                        fontSize: '15px', fontWeight: 700, color: 'var(--dash-text-primary)',
                    }}>
                        <CreditCard style={{ width: '18px', height: '18px', color: 'var(--dash-text-secondary)' }} />
                        Buy More Tokens
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', padding: '20px 24px' }}>
                        {packages.map((pkg) => (
                            <Link
                                key={pkg.id}
                                href={`/fan/wallet`}
                                style={{
                                    display: 'flex', flexDirection: 'column', gap: '6px',
                                    padding: '16px', borderRadius: '12px', textDecoration: 'none',
                                    border: '1px solid var(--dash-border)', background: 'var(--dash-bg)',
                                    transition: 'border-color 0.15s, box-shadow 0.15s',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Sparkles style={{ width: '16px', height: '16px', color: 'var(--dash-text-secondary)' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dash-text-primary)' }}>{pkg.name}</span>
                                </div>
                                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--dash-text-primary)', letterSpacing: '-0.02em' }}>
                                    {formatTokens(pkg.token_amount)}
                                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dash-text-muted)', marginLeft: '4px' }}>tokens</span>
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-text-secondary)' }}>
                                    {formatCurrency(pkg.price_cents)}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Transaction History */}
            <div style={{ ...card, overflow: 'hidden' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '20px 24px', borderBottom: '1px solid var(--dash-border)',
                    fontSize: '15px', fontWeight: 700, color: 'var(--dash-text-primary)',
                }}>
                    <Receipt style={{ width: '18px', height: '18px', color: 'var(--dash-text-secondary)' }} />
                    Transaction History
                </div>

                {transactions && transactions.length > 0 ? (
                    <div>
                        {transactions.map((tx, i) => (
                            <div key={tx.id} style={{
                                display: 'flex', alignItems: 'center', gap: '14px',
                                padding: '14px 24px',
                                borderBottom: i < transactions.length - 1 ? '1px solid var(--dash-border)' : 'none',
                            }}>
                                {/* Icon */}
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: tx.amount > 0 ? 'var(--dash-success-bg)' : 'var(--dash-accent-soft)',
                                    color: tx.amount > 0 ? 'var(--dash-success-text)' : 'var(--dash-text-secondary)',
                                }}>
                                    {tx.amount > 0
                                        ? <ArrowDownRight style={{ width: '16px', height: '16px' }} />
                                        : <ArrowUpRight style={{ width: '16px', height: '16px' }} />
                                    }
                                </div>

                                {/* Description */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dash-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {tx.description || tx.type}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                        <Clock style={{ width: '11px', height: '11px', color: 'var(--dash-text-muted)' }} />
                                        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--dash-text-muted)' }}>
                                            {formatRelativeTime(tx.created_at)}
                                        </span>
                                        {tx.status === 'completed' && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600, color: 'var(--dash-success-text)' }}>
                                                <CheckCircle style={{ width: '11px', height: '11px' }} /> Completed
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Amount */}
                                <div style={{
                                    fontSize: '14px', fontWeight: 700, flexShrink: 0,
                                    color: tx.amount > 0 ? 'var(--dash-success-text)' : 'var(--dash-text-primary)',
                                }}>
                                    {tx.amount > 0 ? '+' : ''}{formatTokens(tx.amount)} tokens
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', padding: '48px 24px', gap: '10px',
                    }}>
                        <Receipt style={{ width: '28px', height: '28px', color: 'var(--dash-text-muted)' }} />
                        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--dash-text-muted)', margin: 0 }}>
                            No transactions yet.
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--dash-text-muted)', margin: 0 }}>
                            Transactions will appear here once fans unlock your content.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
