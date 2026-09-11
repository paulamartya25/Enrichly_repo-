'use client';
import { use, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Play, Edit, Trash2 } from 'lucide-react';
import { ExecutionTable } from '@/components/executions/ExecutionTable';
import { useExecutionStream } from '@/lib/useExecutionStream';
import { useRouter } from 'next/navigation';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isTriggering, setIsTriggering] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['jobs', id],
    queryFn: () => api.jobs.get(id),
  });

  const { data: executions } = useQuery({
    queryKey: ['executions', { jobId: id }],
    queryFn: () => api.executions.list().then(res => res.filter(e => e.jobId === id)),
  });

  useExecutionStream((update) => {
    if (update.jobId === id) {
      queryClient.invalidateQueries({ queryKey: ['executions', { jobId: id }] });
      queryClient.invalidateQueries({ queryKey: ['jobs', id] });
    }
  });

  const handleTrigger = async () => {
    setIsTriggering(true);
    try {
      await api.jobs.trigger(id);
      queryClient.invalidateQueries({ queryKey: ['executions', { jobId: id }] });
    } catch (err) {
      alert('Failed to trigger job');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this job?')) {
      await api.jobs.delete(id);
      router.push('/jobs');
    }
  };

  if (isLoading) return <div>Loading job...</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/jobs"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
            <span>{job.name}</span>
            <Badge variant={job.isEnabled ? 'success' : 'secondary'}>
              {job.isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleTrigger} disabled={isTriggering || !job.isEnabled}>
            <Play className="mr-2 h-4 w-4" /> Run Now
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/jobs/${job.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Description</div>
                <div>{job.description || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="uppercase">{job.jobType}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Schedule</div>
                <div className="font-mono">{job.cronExpression || 'Manual only'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Retries</div>
                <div>{job.maxRetries} (delay: {job.retryDelaySeconds}s)</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                {JSON.stringify(job.config, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader><CardTitle>Execution History</CardTitle></CardHeader>
            <CardContent>
              <ExecutionTable executions={executions || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}