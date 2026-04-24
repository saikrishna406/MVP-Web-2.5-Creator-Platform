"use client";

import "./app-sidebar.css";
import type { Profile, Wallet as WalletType } from "@/types";

import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  User,
  FileText,
  ShoppingBag,
  BarChart3,
  Settings,
  Plus,
  LogOut,
  Wallet,
  MoreHorizontal,
  Zap,
  Crown,
  CalendarDays,
  Flame,
  Share2,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

const CREATOR_NAV = [
  { href: "/creator",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/creator/memberships",  label: "Memberships",  icon: Crown           },
  { href: "/creator/events",       label: "Events",       icon: CalendarDays    },
  { href: "/creator/founder-pass", label: "Founder Pass", icon: Flame           },
  { href: "/creator/revenue",      label: "Revenue",      icon: BarChart3       },
  { href: "/creator/posts",        label: "Posts",        icon: FileText        },
  { href: "/creator/social",       label: "Social",       icon: Share2          },
];

// "Create" and "Profile" are rendered separately in the component (special styling)
// "Settings" goes in the footer above More

const FAN_NAV = [
  { href: "/fan",        label: "Dashboard", icon: LayoutDashboard },
  { href: "/fan/feed",   label: "Feed",      icon: FileText        },
  { href: "/fan/wallet", label: "Wallet",    icon: Wallet          },
  { href: "/fan/store",  label: "Store",     icon: ShoppingBag     },
];

export function AppSidebar({ profile, wallet }: { profile: Partial<Profile> | null; wallet?: Partial<WalletType> | null }) {
  const pathname = usePathname();
  const supabase = createClient();
  const navItems = profile?.role === "fan" ? FAN_NAV : CREATOR_NAV;

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node))
        setMoreOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isActive = (href: string) =>
    href === "/creator" || href === "/fan"
      ? pathname === href || pathname === href + "/"
      : pathname.startsWith(href);

  const isProfileActive = isActive(`/${profile?.role}/profile`);

  return (
    <Sidebar
      variant="sidebar"
      collapsible="offcanvas"
      className="border-r-0 ig-sidebar"
    >
      {/* ── Logo ── */}
      <SidebarHeader className="ig-sidebar__header">
        <Link href={`/${profile?.role ?? "creator"}`} className="ig-sidebar__logo">
          <div className="ig-sidebar__logo-icon">
            <Zap size={18} className="text-white" />
          </div>
          <span className="ig-sidebar__logo-text">Black Bolts</span>
        </Link>
      </SidebarHeader>

      {/* ── Main Nav: Dashboard → Posts → Create ── */}
      <SidebarContent className="ig-sidebar__content">
        <nav className="ig-sidebar__nav">
          {/* Dashboard + Posts from array */}
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`ig-sidebar__item${active ? " ig-sidebar__item--active" : ""}`}
              >
                <item.icon
                  size={26}
                  strokeWidth={active ? 2.2 : 1.75}
                  className="ig-sidebar__icon"
                />
                <span className="ig-sidebar__label">{item.label}</span>
              </Link>
            );
          })}

          {/* Create */}
          {profile?.role === "creator" && (
            <Link
              href="/creator/posts/new"
              className={`ig-sidebar__item${pathname.startsWith("/creator/posts/new") ? " ig-sidebar__item--active" : ""}`}
            >
              <span className="ig-sidebar__create-icon">
                <Plus size={20} strokeWidth={2} />
              </span>
              <span className="ig-sidebar__label">Create</span>
            </Link>
          )}
        </nav>
      </SidebarContent>

      {/* ── Footer: Profile → Settings → More ── */}
      <SidebarFooter className="ig-sidebar__footer">

        {/* Profile */}
        <Link
          href={`/${profile?.role}/profile`}
          className={`ig-sidebar__item${isProfileActive ? " ig-sidebar__item--active" : ""}`}
        >
          <div className="ig-sidebar__avatar">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile?.display_name}
                className="ig-sidebar__avatar-img"
              />
            ) : (
              <span className="ig-sidebar__avatar-initials">
                {getInitials(profile?.display_name || "U")}
              </span>
            )}
          </div>
          <span className={`ig-sidebar__label${isProfileActive ? " ig-sidebar__label--bold" : ""}`}>
            Profile
          </span>
        </Link>

        {/* Settings */}
        <Link
          href={`/${profile?.role}/settings`}
          className={`ig-sidebar__item${isActive(`/${profile?.role}/settings`) ? " ig-sidebar__item--active" : ""}`}
        >
          <Settings size={26} strokeWidth={isActive(`/${profile?.role}/settings`) ? 2.2 : 1.75} className="ig-sidebar__icon" />
          <span className="ig-sidebar__label">Settings</span>
        </Link>

        {/* More (logout dropdown) */}
        <div ref={moreRef} className="ig-sidebar__more-wrap">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="ig-sidebar__item ig-sidebar__item--btn"
          >
            <span className="ig-sidebar__more-icon">
              <MoreHorizontal size={22} strokeWidth={1.75} />
            </span>
            <span className="ig-sidebar__label">More</span>
          </button>

          {moreOpen && (
            <div className="ig-sidebar__more-dropdown">
              <p className="ig-sidebar__more-username">@{profile?.username}</p>
              <button onClick={handleLogout} className="ig-sidebar__logout-btn">
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>

      </SidebarFooter>
    </Sidebar>
  );
}

