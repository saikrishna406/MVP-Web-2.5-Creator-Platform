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
        <div className="min-h-screen">
            <Sidebar profile={profile} wallet={wallet} />
            <main className="lg:ml-64 min-h-screen">
                <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
