import { Badge } from "@/components/ui/badge";
import { ExecutionStatus } from "@/lib/types";

export function ExecutionStatusBadge({ status }: { status: ExecutionStatus }) {
  const map: Record<ExecutionStatus, { variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary', label: string }> = {
    queued: { variant: 'secondary', label: 'Queued' },
    running: { variant: 'warning', label: 'Running' },
    succeeded: { variant: 'success', label: 'Succeeded' },
    failed: { variant: 'destructive', label: 'Failed' },
    cancelled: { variant: 'secondary', label: 'Cancelled' },
  };

  const { variant, label } = map[status] || { variant: 'default', label: status };

  return (
    <Badge variant={variant} className={status === 'running' ? 'animate-pulse' : ''}>
      {label}
    </Badge>
  );
}