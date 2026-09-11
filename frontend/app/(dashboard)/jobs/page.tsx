'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, Search, Play, Settings } from 'lucide-react';
import { formatRelative } from '@/lib/utils';
import { ExecutionStatusBadge } from '@/components/executions/ExecutionStatusBadge';
import { useExecutionStream } from '@/lib/useExecutionStream';
import { useQueryClient } from '@tanstack/react-query';

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  });

  useExecutionStream((update) => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  });

  const filteredJobs = jobs?.filter(j => 
    j.name.toLowerCase().includes(search.toLowerCase()) ||
    j.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
        <Button asChild>
          <Link href="/jobs/new"><Plus className="mr-2 h-4 w-4" /> New Job</Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search jobs..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading jobs...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No jobs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map(job => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                        {job.name}
                      </Link>
                      {job.description && <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{job.description}</p>}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="uppercase text-[10px]">{job.jobType}</Badge></TableCell>
                    <TableCell><span className="text-sm font-mono">{job.cronExpression || '-'}</span></TableCell>
                    <TableCell>
                      <Badge variant={job.isEnabled ? 'success' : 'secondary'}>
                        {job.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.recentExecutions?.[0] ? (
                        <div className="flex items-center space-x-2">
                          <ExecutionStatusBadge status={job.recentExecutions[0].status} />
                          <span className="text-xs text-muted-foreground">{formatRelative(job.recentExecutions[0].startedAt)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/jobs/${job.id}`}><Settings className="h-4 w-4" /></Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}