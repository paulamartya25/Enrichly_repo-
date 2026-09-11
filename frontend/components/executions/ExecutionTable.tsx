import { Execution } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExecutionStatusBadge } from './ExecutionStatusBadge';
import { formatRelative, formatDuration } from '@/lib/utils';
import Link from 'next/link';

export function ExecutionTable({ executions }: { executions: Execution[] }) {
  if (!executions.length) {
    return <div className="p-4 text-center text-sm text-muted-foreground border rounded-md">No executions found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Started</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Trigger</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {executions.map((exec) => (
          <TableRow key={exec.id}>
            <TableCell>
              <Link href={`/executions/${exec.id}`} className="font-medium hover:underline">
                {exec.jobName || exec.jobId} #{exec.attempt}
              </Link>
            </TableCell>
            <TableCell>
              <ExecutionStatusBadge status={exec.status} />
            </TableCell>
            <TableCell>{formatRelative(exec.startedAt || exec.createdAt)}</TableCell>
            <TableCell>{formatDuration(exec.durationMs)}</TableCell>
            <TableCell className="capitalize">{exec.triggeredBy}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}