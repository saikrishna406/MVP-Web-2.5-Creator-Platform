import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';

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
        <div className="dashboard-layout">
            <Sidebar profile={profile} wallet={wallet} />
            <main className="lg:ml-64 min-h-screen">
                <div className="page-container pt-20 lg:pt-12">
                    {children}
                </div>
            </main>
        </div>
    );
}
