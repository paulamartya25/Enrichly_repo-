'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ExecutionTable } from '@/components/executions/ExecutionTable';
import { Activity, CheckCircle, Clock, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const statCards = [
  { title: 'Total Jobs', key: 'totalJobs', icon: Zap, gradient: 'from-violet-600 to-purple-600', glow: 'rgba(124,58,237,0.3)', bg: 'rgba(124,58,237,0.08)' },
  { title: 'Active Jobs', key: 'activeJobs', icon: Activity, gradient: 'from-blue-600 to-cyan-600', glow: 'rgba(37,99,235,0.3)', bg: 'rgba(37,99,235,0.08)' },
  { title: 'Runs Today', key: 'execsToday', icon: Clock, gradient: 'from-emerald-600 to-teal-600', glow: 'rgba(5,150,105,0.3)', bg: 'rgba(5,150,105,0.08)' },
  { title: 'Success Rate', key: 'successRate', icon: CheckCircle, gradient: 'from-orange-500 to-pink-600', glow: 'rgba(249,115,22,0.3)', bg: 'rgba(249,115,22,0.08)' },
];

export default function DashboardPage() {
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  });

  const { data: executions, isLoading: execsLoading } = useQuery({
    queryKey: ['executions', 'recent'],
    queryFn: () => api.executions.list(),
  });

  const activeJobs = jobs?.filter(j => j.isEnabled).length || 0;
  const totalJobs = jobs?.length || 0;
  const recentExecs = executions?.slice(0, 10) || [];
  const execsToday = executions?.filter(e => {
    const today = new Date();
    const created = new Date(e.createdAt);
    return created.toDateString() === today.toDateString();
  }).length || 0;
  const successfulExecs = executions?.filter(e => e.status === 'succeeded').length || 0;
  const successRate = executions?.length ? Math.round((successfulExecs / executions.length) * 100) : 0;

  const stats = { totalJobs, activeJobs, execsToday, successRate: `${successRate}%` };

  if (jobsLoading || execsLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor your automation platform at a glance</p>
        </div>
        <Link href="/jobs/new" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:scale-105" style={{
          background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
          boxShadow: '0 0 20px rgba(124,58,237,0.3)'
        }}>
          <Zap className="h-4 w-4" /> New Job
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key as keyof typeof stats];
          return (
            <div key={card.key} className="rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] cursor-default" style={{
              background: card.bg,
              border: `1px solid ${card.glow.replace('0.3', '0.2')}`,
              boxShadow: `0 0 30px ${card.glow.replace('0.3', '0.08')}`
            }}>
              <div className="flex items-center justify-between mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient}`} style={{ boxShadow: `0 0 15px ${card.glow}` }}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground opacity-50" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{value}</div>
              <div className="text-xs text-muted-foreground">{card.title}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Executions */}
      <div className="rounded-2xl overflow-hidden" style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(139,92,246,0.1)',
      }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
          <div>
            <h2 className="text-base font-semibold text-white">Recent Executions</h2>
            <p className="text-xs text-muted-foreground">Last {recentExecs.length} runs across all jobs</p>
          </div>
          <Link href="/jobs" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
            View all jobs <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="p-6">
          <ExecutionTable executions={recentExecs} />
        </div>
      </div>
    </div>
  );
}
