import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';

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
            <SidebarInset className="bg-[#000000] overflow-x-hidden w-full flex-1">
                <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center gap-2 border-b border-white/10 bg-[#000000]/80 backdrop-blur-md px-4 shadow-sm">
                    <SidebarTrigger className="-ml-2 text-zinc-400 hover:text-white" />
                    <span className="font-semibold text-sm tracking-wide text-zinc-200">Fan Dashboard</span>
                </header>
                <div className="flex-1 p-6 lg:p-10 w-full relative">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
