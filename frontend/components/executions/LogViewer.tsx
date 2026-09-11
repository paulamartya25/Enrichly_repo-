import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function LogViewer({ logs }: { logs?: string }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 bg-muted/50 border-b">
        <CardTitle className="text-sm">Logs</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="bg-zinc-950 text-zinc-50 p-4 h-full min-h-[400px] overflow-auto font-mono text-sm leading-relaxed">
          {logs ? (
            <pre className="whitespace-pre-wrap break-all">{logs}</pre>
          ) : (
            <span className="text-zinc-500 italic">No logs available.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}