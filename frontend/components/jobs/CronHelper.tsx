import cronstrue from 'cronstrue';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function CronHelper({ expression }: { expression: string }) {
  if (!expression) return null;
  
  try {
    const description = cronstrue.toString(expression);
    return (
      <div className="flex items-center text-sm text-green-600 dark:text-green-400 mt-1">
        <CheckCircle2 className="w-4 h-4 mr-1" />
        {description}
      </div>
    );
  } catch (e) {
    return (
      <div className="flex items-center text-sm text-destructive mt-1">
        <AlertCircle className="w-4 h-4 mr-1" />
        Invalid cron expression
      </div>
    );
  }
}