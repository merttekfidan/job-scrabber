'use client';

import React from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Download,
  LogOut,
  Settings,
  Kanban,
  Brain,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'applications', label: 'Kanban', icon: Kanban, href: '/kanban' },
  { id: 'coach', label: 'Coach', icon: Brain, href: '/coach' },
];

type DashboardHeaderProps = {
  session: { user?: { email?: string | null; name?: string | null; image?: string | null } } | null;
  currentView: string;
  onRefresh: () => void;
  onExportCsv: () => void;
  onOpenProfile: () => void;
};

export const DashboardHeader = ({
  session,
  currentView,
  onRefresh,
  onExportCsv,
  onOpenProfile,
}: DashboardHeaderProps) => {
  return (
    <header
      className="sticky top-0 z-50 border-b border-white/10 bg-[#0f1117]/95 backdrop-blur-xl"
      style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
      role="banner"
    >
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="HuntIQ"
            className="h-8 w-8 rounded-lg object-cover"
          />
          <span className="text-lg font-bold tracking-tight text-white">
            HuntIQ
          </span>
        </div>

        <nav
          className="flex items-center rounded-lg border border-white/5 bg-gray-900/60 p-1 gap-0.5"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            const className = cn(
              'flex items-center gap-2 rounded-md px-4 py-1.5 text-base font-medium transition-all duration-200',
              isActive ? 'text-white shadow-lg' : 'text-gray-500 hover:text-gray-200'
            );
            const bgColor = '#667eea';
            const shadowColor = 'rgba(102,126,234,0.5)';
            const style = isActive
              ? { background: bgColor, boxShadow: `0 0 12px -2px ${shadowColor}` }
              : {};
            return (
              <Link
                key={item.id}
                href={item.href}
                className={className}
                style={style}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={16} aria-hidden />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-800/50 hover:text-white"
            title="Refresh"
            aria-label="Refresh data"
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-800/50 hover:text-white"
            title="Export CSV"
            aria-label="Export to CSV"
          >
            <Download size={16} />
          </button>

          <div className="ml-1 flex items-center gap-2 border-l border-white/10 pl-3">
            <button
              type="button"
              onClick={onOpenProfile}
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-800/50 hover:text-white"
              title="Profile Settings"
              aria-label="Open profile settings"
            >
              <Settings size={16} />
            </button>
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-full border border-white/10"
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                }}
                aria-hidden
              >
                {(session?.user?.email ?? 'U')[0].toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() =>
                signOut({ callbackUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/login` })
              }
              className="rounded-lg p-2 text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400"
              title="Logout"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
