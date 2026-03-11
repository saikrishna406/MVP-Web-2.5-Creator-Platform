"use client";

import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NAV_ITEMS_CREATOR, NAV_ITEMS_FAN } from "@/lib/constants";
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { 
  User,
  ChevronsUpDown,
  Home,
  LogOut,
  HelpCircle,
  Settings,
  Puzzle,
  LayoutGrid,
  Layers,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export function AppSidebar({ profile }: { profile: any; wallet?: any }) {
  const pathname = usePathname();
  const supabase = createClient();
  
  const standardItems = profile?.role === 'fan' ? NAV_ITEMS_FAN : NAV_ITEMS_CREATOR;
  
  const navigation = standardItems.slice(0, 4).map(item => ({
    title: item.label,
    url: item.href,
    icon: Home 
  }));

  if (navigation[0]) navigation[0].icon = Home;
  if (navigation[1]) navigation[1].icon = Puzzle;
  if (navigation[2]) navigation[2].icon = LayoutGrid;
  if (navigation[3]) navigation[3].icon = Layers;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const avatarSrc = profile?.avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop";
  const [isProfileActive, setIsProfileActive] = useState(false);
  const profileRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleProfile = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileActive(false);
      }
    };
    document.addEventListener("click", handleProfile);
    return () => document.removeEventListener("click", handleProfile);
  }, []);

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className="pt-12 pb-6 px-6 border-b border-sidebar-border">
         <div className="flex items-center gap-x-3">
            <img
            src={avatarSrc}
            className="w-10 h-10 rounded-full object-cover"
            alt="User avatar"
            />
            <div className="flex-1 min-w-0">
            <span className="block text-sidebar-foreground text-[14px] font-semibold tracking-tight truncate">
                {profile?.display_name || "Guest User"}
            </span>
            <span className="block text-sidebar-foreground/60 text-[12px] font-medium tracking-wide truncate mt-0.5">
                {profile?.role === 'creator' ? 'Creator Account' : 'Fan Account'}
            </span>
            </div>
            
            <div className="relative text-right">
                <button
                  ref={profileRef}
                  className="p-1 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent active:bg-sidebar-accent/80"
                  onClick={() => setIsProfileActive((v) => !v)}
                >
                  <ChevronsUpDown className="w-4 h-4" />
                </button>
                 {isProfileActive && (
                  <div className="absolute z-10 top-10 right-0 w-64 rounded-lg bg-background shadow-md border text-sm text-foreground overflow-hidden">
                    <div className="p-2 text-left">
                      <span className="block text-muted-foreground p-2 truncate">@{profile?.username || "username"}</span>
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full p-2 mt-1 text-left rounded-md text-red-600 hover:bg-red-50 duration-150">
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
            </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-6 pt-4 pb-2">
          <SidebarGroupLabel className="text-sm px-2 mb-2 text-sidebar-foreground/50 tracking-wider">NAVIGATION</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Billing">
                    <Link href="#">
                      <CreditCard />
                      <span>Billing</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto px-6 pb-8">
           <SidebarGroupContent>
             <SidebarMenu>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/help">
                      <HelpCircle />
                      <span>Help</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`/${profile?.role}/settings`}>
                      <Settings />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
             </SidebarMenu>
           </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  );
}
