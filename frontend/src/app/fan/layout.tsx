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
        <div className="min-h-screen bg-background">
            <Sidebar profile={profile} wallet={wallet} />
            <main className="lg:ml-[280px] min-h-screen transition-all duration-300">
                <div className="px-6 py-8 pt-20 lg:px-10 lg:py-10 max-w-5xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
