'use client';
import { usePathname } from 'next/navigation';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/jobs': 'Jobs',
};

export function TopBar() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const title = titles['/' + segments[0]] || 'Job Platform';

  return (
    <header className="flex h-14 items-center justify-between px-6" style={{
      background: 'rgba(5,5,16,0.6)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid transparent',
      backgroundClip: 'padding-box',
      boxShadow: 'inset 0 -1px 0 0 rgba(255,255,255,0.06), 0 1px 0 0 rgba(168,85,247,0.15)',
    }}>
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full animate-pulse" style={{
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          boxShadow: '0 0 8px rgba(168,85,247,0.8)'
        }} />
        <h1 className="text-sm font-semibold" style={{
          background: 'linear-gradient(90deg, #c084fc, #f472b6, #60a5fa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full rounded-full" style={{
            width: '60%',
            background: 'linear-gradient(90deg, #a855f7, #ec4899, #f97316)',
            animation: 'shimmer 3s ease-in-out infinite'
          }} />
        </div>
        <span className="text-xs" style={{ color: 'rgba(168,85,247,0.6)' }}>Live</span>
      </div>
    </header>
  );
}