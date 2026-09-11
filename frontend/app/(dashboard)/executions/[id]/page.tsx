'use client';
import { use, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
import { ExecutionStatusBadge } from '@/components/executions/ExecutionStatusBadge';
import { LogViewer } from '@/components/executions/LogViewer';
import { formatDate, formatDuration } from '@/lib/utils';
import { useExecutionStream } from '@/lib/useExecutionStream';

export default function ExecutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState(false);

  const { data: execution, isLoading } = useQuery({
    queryKey: ['executions', id],
    queryFn: () => api.executions.get(id),
  });

  useExecutionStream((update) => {
    if (update.id === id) {
      queryClient.setQueryData(['executions', id], update);
    }
  });

  const handleCancel = async () => {
    if (!execution || execution.status !== 'queued') return;
    setActionLoading(true);
    try {
      await api.executions.cancel(id);
      queryClient.invalidateQueries({ queryKey: ['executions', id] });
    } catch (err) {
      alert('Failed to cancel');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!execution || (execution.status !== 'failed' && execution.status !== 'cancelled')) return;
    setActionLoading(true);
    try {
      await api.executions.retry(id);
      queryClient.invalidateQueries({ queryKey: ['executions', id] });
    } catch (err) {
      alert('Failed to retry');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!execution) return <div>Execution not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/jobs/${execution.jobId}`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold tracking-tight">
              Execution #{execution.attempt}
            </h2>
            <ExecutionStatusBadge status={execution.status} />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {execution.status === 'queued' && (
            <Button variant="outline" onClick={handleCancel} disabled={actionLoading}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
          )}
          {(execution.status === 'failed' || execution.status === 'cancelled') && (
            <Button onClick={handleRetry} disabled={actionLoading}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle>Metadata</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Job</div>
                <div>
                  <Link href={`/jobs/${execution.jobId}`} className="font-medium text-primary hover:underline">
                    {execution.jobName || execution.jobId}
                  </Link>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Triggered By</div>
                <div className="capitalize">{execution.triggeredBy}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div>{formatDate(execution.createdAt)}</div>
              </div>
              {execution.startedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Started</div>
                  <div>{formatDate(execution.startedAt)}</div>
                </div>
              )}
              {execution.finishedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Finished</div>
                  <div>{formatDate(execution.finishedAt)}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Duration</div>
                <div>{formatDuration(execution.durationMs)}</div>
              </div>
              {execution.workerId && (
                <div>
                  <div className="text-sm text-muted-foreground">Worker ID</div>
                  <div className="text-xs font-mono bg-muted p-1 rounded mt-1">{execution.workerId}</div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {execution.errorMessage && (
            <Card className="border-destructive bg-destructive/10">
              <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm">{execution.errorMessage}</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="md:col-span-2 flex flex-col h-full min-h-[500px]">
          <LogViewer logs={execution.logs} />
        </div>
      </div>
    </div>
  );
}