'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ExecutionTable } from '@/components/executions/ExecutionTable';
import { Activity, CheckCircle, Clock, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  });

  const { data: executions, isLoading: execsLoading } = useQuery({
    queryKey: ['executions', 'recent'],
    queryFn: () => api.executions.list(), // Assume this returns recent by default
  });

  const activeJobs = jobs?.filter(j => j.isEnabled).length || 0;
  const totalJobs = jobs?.length || 0;
  const recentExecs = executions?.slice(0, 10) || [];
  
  const execsToday = executions?.filter(e => {
    const today = new Date();
    const created = new Date(e.createdAt);
    return created.getDate() === today.getDate() &&
           created.getMonth() === today.getMonth() &&
           created.getFullYear() === today.getFullYear();
  }).length || 0;

  const successfulExecs = executions?.filter(e => e.status === 'succeeded').length || 0;
  const successRate = executions?.length ? Math.round((successfulExecs / executions.length) * 100) : 0;

  if (jobsLoading || execsLoading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Jobs" value={totalJobs} icon={List} />
        <StatsCard title="Active Jobs" value={activeJobs} icon={Activity} />
        <StatsCard title="Executions Today" value={execsToday} icon={Clock} />
        <StatsCard title="Success Rate" value={`${successRate}%`} icon={CheckCircle} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <ExecutionTable executions={recentExecs} />
        </CardContent>
      </Card>
    </div>
  );
}
