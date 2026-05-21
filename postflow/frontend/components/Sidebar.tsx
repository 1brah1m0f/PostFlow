"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  Zap,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/new", label: "New Post", icon: PlusCircle },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-[#1C1C1E] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-rust flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">PostFlow</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-brand-rust" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 space-y-2">
        <Link
          href="/dashboard/new"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-brand-rust text-white text-sm font-semibold hover:bg-[#a94a3b] transition-colors shadow-md shadow-brand-rust/20"
        >
          <PlusCircle className="w-4 h-4" />
          New Post
        </Link>

        {user && (
          <div className="pt-2 border-t border-white/[0.06]">
            <p className="text-xs text-white/30 px-1 pb-1.5 truncate">{user.email}</p>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] text-sm transition-all duration-200"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
