"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, Calendar, Plus, Settings, HelpCircle, LogOut } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem('token');
    router.push('/login');
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { name: 'Calendar', path: '/dashboard/calendar', icon: Calendar },
    { name: 'Create Post', path: '/dashboard/new', icon: Plus, isAction: true },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-20 bg-pf-white/60 backdrop-blur-md rounded-[2.5rem] py-8 flex flex-col items-center shadow-soft border border-pf-brown/5 sticky top-8 h-[calc(100vh-4rem)]">
      <nav className="flex flex-col gap-8 items-center w-full flex-1">
        {navItems.map((item) => {
          const isActive = item.path === '/dashboard' 
            ? pathname === '/dashboard'
            : pathname.startsWith(item.path);
            
          const Icon = item.icon;

          return (
            <Link 
              key={item.path} 
              href={item.path}
              title={item.name}
              className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center
                ${item.isAction ? 'bg-pf-green text-pf-white shadow-lg hover:bg-pf-green/90' : ''}
                ${!item.isAction && isActive ? 'text-pf-brown bg-pf-brown/5' : ''}
                ${!item.isAction && !isActive ? 'text-pf-brown/60 hover:text-pf-brown hover:bg-pf-brown/5' : ''}
              `}
            >
              <Icon size={24} strokeWidth={item.isAction || isActive ? 2.5 : 2} />
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-8 items-center w-full mt-auto">
        <button className="p-2 text-pf-brown/60 hover:text-pf-brown transition-colors">
          <HelpCircle size={24} strokeWidth={2} />
        </button>
        <button
          onClick={handleLogout}
          title="Log out"
          className="p-2 text-pf-brown/60 hover:text-red-500 transition-colors"
        >
          <LogOut size={24} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
