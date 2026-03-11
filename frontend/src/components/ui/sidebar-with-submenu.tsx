"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronsUpDown, Home, Puzzle, LayoutGrid, Layers, CreditCard, Receipt, HelpCircle, Settings, LogOut, Check } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NAV_ITEMS_CREATOR, NAV_ITEMS_FAN } from "@/lib/constants";
import { getInitials } from "@/lib/utils";

type MenuItem = { name: string; href: string; icon?: React.JSX.Element | string };

const Menu = ({ children, items }: { children: React.ReactNode; items: MenuItem[] }) => {
  const [isOpened, setIsOpened] = useState(false);

  return (
    <div>
      <button
        className="w-full flex items-center justify-between text-slate-600 p-2.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 duration-150"
        onClick={() => setIsOpened((v) => !v)}
        aria-expanded={isOpened}
        aria-controls="submenu"
      >
        <div className="flex items-center gap-x-2">{children}</div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 duration-150 ${isOpened ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpened && (
        <ul id="submenu" className="mx-4 px-2 border-l text-sm font-medium space-y-1 mt-1">
          {items.map((item, idx) => (
            <li key={idx}>
              <Link
                href={item.href}
                className="flex items-center gap-x-3 text-slate-600 p-2.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 duration-150"
              >
                {item.icon ? <div className="text-slate-400">{item.icon}</div> : null}
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function SidebarWithSubmenu({ profile }: { profile: any; wallet?: any }) {
  const pathname = usePathname();
  const supabase = createClient();
  
  // Choose standard menu items based on role, falling back to static ones
  const standardItems = profile?.role === 'fan' ? NAV_ITEMS_FAN : NAV_ITEMS_CREATOR;

  // We map the nav items to the component's required structure
  const navigation: MenuItem[] = standardItems.slice(0, 4).map(item => ({
    name: item.label,
    href: item.href,
    icon: <Home className="w-5 h-5" /> // Default icon, can be dynamic
  }));

  // Map icons properly using layout matching the screenshot reference
  if (navigation[0]) navigation[0].icon = <Home className="w-[1.125rem] h-[1.125rem]" />;
  if (navigation[1]) navigation[1].icon = <Puzzle className="w-[1.125rem] h-[1.125rem]" />;
  if (navigation[2]) navigation[2].icon = <LayoutGrid className="w-[1.125rem] h-[1.125rem]" />;
  if (navigation[3]) navigation[3].icon = <Layers className="w-[1.125rem] h-[1.125rem]" />;

  const navsFooter: MenuItem[] = [
    {
      href: "/help",
      name: "Help",
      icon: <HelpCircle className="w-[1.125rem] h-[1.125rem]" />,
    },
    {
      href: `/${profile?.role}/settings`,
      name: "Settings",
      icon: <Settings className="w-[1.125rem] h-[1.125rem]" />,
    },
  ];

  const nestedNav: MenuItem[] = [
    { name: "Cards", href: "#cards" },
    { name: "Checkouts", href: "#checkouts" },
    { name: "Payments", href: "#payments" },
    { name: "Get paid", href: "#get-paid" },
  ];

  const profileRef = useRef<HTMLButtonElement | null>(null);
  const [isProfileActive, setIsProfileActive] = useState(false);

  useEffect(() => {
    const handleProfile = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileActive(false);
      }
    };
    document.addEventListener("click", handleProfile);
    return () => document.removeEventListener("click", handleProfile);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const avatarSrc = profile?.avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop";

  return (
    <>
      <nav className="fixed top-0 left-0 w-full h-full border-r border-slate-200 bg-white space-y-6 sm:w-[260px]">
        <div className="flex flex-col h-full px-3 pt-6">
          <div className="flex items-center pl-2 mb-8">
            <div className="w-full flex items-center gap-x-3">
              <img
                src={avatarSrc}
                className="w-10 h-10 rounded-full object-cover"
                alt="User avatar"
              />
              <div className="flex-1 min-w-0">
                <span className="block text-slate-800 text-[15px] font-medium truncate">
                  {profile?.display_name || "Guest User"}
                </span>
                <span className="block text-slate-500 text-[13px] truncate">
                  {profile?.role === 'creator' ? 'Creator Account' : 'Fan Account'}
                </span>
              </div>

              <div className="relative text-right">
                <button
                  ref={profileRef}
                  className="p-1 rounded-md text-slate-400 hover:bg-slate-50 active:bg-slate-100"
                  onClick={() => setIsProfileActive((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={isProfileActive}
                  aria-controls="profile-menu"
                >
                  <ChevronsUpDown className="w-4 h-4" aria-hidden="true" />
                </button>

                {isProfileActive && (
                  <div
                    id="profile-menu"
                    role="menu"
                    className="absolute z-10 top-12 right-0 w-64 rounded-lg bg-white shadow-md border text-sm text-gray-600 overflow-hidden"
                  >
                    <div className="p-2 text-left">
                      <span className="block text-gray-500/80 p-2 truncate">@{profile?.username || "username"}</span>
                      <button
                        className="block w-full p-2 text-left rounded-md hover:bg-gray-50 active:bg-gray-100 duration-150"
                        role="menuitem"
                      >
                        Add another account
                      </button>

                      <div className="relative rounded-md hover:bg-gray-50 active:bg-gray-100 duration-150">
                        <ChevronDown className="w-4 h-4 absolute right-2 inset-y-0 my-auto pointer-events-none" />
                        <select className="w-full cursor-pointer appearance-none bg-transparent p-2 outline-none" defaultValue="">
                          <option value="" disabled hidden>
                            Theme
                          </option>
                          <option>Dark</option>
                          <option>Light</option>
                        </select>
                      </div>

                      <button onClick={handleLogout} className="flex items-center gap-2 w-full p-2 mt-1 text-left rounded-md text-red-600 hover:bg-red-50 active:bg-red-100 duration-150">
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-y-auto overflow-x-hidden flex-1 no-scrollbar">
            <ul className="text-[14px] font-medium flex-1 space-y-0.5">
              {navigation.map((item, idx) => {
                const isActive = pathname === item.href;
                return (
                  <li key={idx}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-x-3 p-2.5 rounded-lg duration-150 ${
                        isActive 
                          ? "bg-slate-50 text-slate-900" 
                          : "text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                      }`}
                    >
                      <div className={isActive ? "text-slate-700" : "text-slate-400"}>{item.icon}</div>
                      {item.name}
                    </Link>
                  </li>
                );
              })}

              <li>
                <Menu items={nestedNav}>
                  <CreditCard className="w-[1.125rem] h-[1.125rem] text-slate-400" />
                  Billing
                </Menu>
              </li>
            </ul>

            <div className="pt-4 mt-4">
              <ul className="text-[14px] font-medium space-y-0.5">
                {navsFooter.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-x-3 text-slate-600 p-2.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 duration-150"
                    >
                      <div className="text-slate-400">{item.icon}</div>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </nav>
      {/* Spacer matching standard desktop width to keep layout from breaking */}
      <div className="w-[260px] hidden sm:block shrink-0" />
    </>
  );
}
