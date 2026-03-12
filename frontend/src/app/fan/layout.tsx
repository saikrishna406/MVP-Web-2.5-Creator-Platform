import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';

export default async function FanLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!profile || profile.role !== 'fan') redirect('/login');

    const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

    return (
        <SidebarProvider>
            <AppSidebar profile={profile} wallet={wallet} />
            <SidebarInset
                className="overflow-x-hidden w-full flex-1"
                style={{ background: 'var(--dash-bg)' }}
            >
                <header
                    className="sticky top-0 z-30 flex w-full shrink-0 items-center px-8"
                    style={{
                        height: '56px',
                        background: 'var(--dash-header-bg)',
                        backdropFilter: 'blur(12px)',
                        borderBottom: '1px solid var(--dash-border)',
                    }}
                >
                    <SidebarTrigger className="-ml-2" style={{ color: 'var(--dash-text-secondary)' }} />
                    <span style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'var(--dash-text-primary)',
                        letterSpacing: '0.01em',
                        marginLeft: '8px',
                    }}>
                        Fan Dashboard
                    </span>
                    <div style={{ marginLeft: 'auto' }}>
                        <ThemeToggle />
                    </div>
                </header>
                <div
                    className="flex-1 w-full relative"
                    style={{
                        maxWidth: '1400px',
                        margin: '0 auto',
                        paddingLeft: '32px',
                        paddingRight: '32px',
                        paddingTop: '24px',
                        paddingBottom: '40px',
                    }}
                >
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
