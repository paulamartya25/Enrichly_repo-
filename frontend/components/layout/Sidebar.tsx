'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Zap, LogOut, Sparkles, ChevronRight } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-violet-400' },
    { href: '/jobs', label: 'Jobs', icon: Zap, color: 'text-blue-400' },
  ];

  return (
    <div className="flex h-screen w-64 flex-col" style={{
      background: 'linear-gradient(180deg, rgba(15,10,30,0.95) 0%, rgba(10,8,25,0.98) 100%)',
      borderRight: '1px solid rgba(139,92,246,0.15)',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Logo */}
      <div className="flex h-16 items-center px-5 gap-3" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{
          background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
          boxShadow: '0 0 20px rgba(124,58,237,0.4)'
        }}>
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-white">Job Automation</div>
          <div className="text-xs" style={{ color: 'rgba(139,92,246,0.7)' }}>Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-6 px-3 space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wider px-3 mb-3" style={{ color: 'rgba(139,92,246,0.5)' }}>
          Navigation
        </div>
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className={cn(
              'group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'text-white'
                : 'text-slate-400 hover:text-white'
            )} style={isActive ? {
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(37,99,235,0.15))',
              border: '1px solid rgba(139,92,246,0.3)',
              boxShadow: '0 0 20px rgba(124,58,237,0.1)'
            } : {
              border: '1px solid transparent',
            }}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg transition-all',
                  isActive ? 'bg-violet-600/30' : 'bg-white/5 group-hover:bg-white/10'
                )}>
                  <Icon className={cn('h-4 w-4', isActive ? 'text-violet-300' : link.color)} />
                </div>
                {link.label}
              </div>
              {isActive && <ChevronRight className="h-3 w-3 text-violet-400" />}
            </Link>
          );
        })}
      </div>

      {/* User section */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        <div className="rounded-xl p-3 mb-3" style={{
          background: 'rgba(139,92,246,0.05)',
          border: '1px solid rgba(139,92,246,0.1)'
        }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)'
            }}>
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{user?.email}</div>
              <div className="text-xs" style={{ color: 'rgba(139,92,246,0.6)' }}>Free Plan</div>
            </div>
          </div>
        </div>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200 text-slate-400 hover:text-red-400" style={{
          border: '1px solid transparent',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)', e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.borderColor = 'transparent')}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
