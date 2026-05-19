"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  Instagram,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/new", label: "New Post", icon: PlusCircle },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FDFDF9]/90 backdrop-blur-md border-b border-brand-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-rust flex items-center justify-center shadow-sm">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-brand-dark tracking-tight">PostFlow</span>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-cream text-brand-dark shadow-sm"
                        : "text-brand-gray hover:text-brand-dark hover:bg-brand-cream/50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
             <Link href="/dashboard/new" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-rust text-white text-sm font-semibold shadow-sm hover:bg-[#a94a3b] transition-colors">
               <PlusCircle className="w-4 h-4" />
               Create
             </Link>
             <div className="w-8 h-8 rounded-full bg-brand-peach flex items-center justify-center text-brand-dark font-bold text-sm shadow-sm cursor-pointer hover:opacity-90">
               P
             </div>
             {/* Mobile menu button */}
             <button 
               className="md:hidden p-2 text-brand-gray hover:text-brand-dark"
               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
             >
               {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-brand-cream bg-[#FDFDF9]">
          <nav className="px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "bg-brand-cream text-brand-dark"
                      : "text-brand-gray hover:text-brand-dark hover:bg-brand-cream/50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <Link
               href="/dashboard/new"
               onClick={() => setMobileMenuOpen(false)}
               className="mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand-rust text-white text-base font-semibold shadow-sm hover:bg-[#a94a3b] transition-colors w-full"
             >
               <PlusCircle className="w-5 h-5" />
               Create New Post
             </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
