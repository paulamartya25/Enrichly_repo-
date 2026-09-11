'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Job, JobType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CronHelper } from './CronHelper';

const jobSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  jobType: z.enum(['http', 'webhook', 'noop']),
  cronExpression: z.string().optional(),
  maxRetries: z.coerce.number().min(0).default(3),
  retryDelaySeconds: z.coerce.number().min(0).default(60),
  isEnabled: z.boolean().default(true),
  config: z.any()
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobFormProps {
  initialData?: Partial<Job>;
  onSubmit: (data: Partial<Job>) => Promise<void>;
  isLoading: boolean;
}

export function JobForm({ initialData, onSubmit, isLoading }: JobFormProps) {
  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      jobType: initialData?.jobType || 'noop',
      cronExpression: initialData?.cronExpression || '',
      maxRetries: initialData?.maxRetries ?? 3,
      retryDelaySeconds: initialData?.retryDelaySeconds ?? 60,
      isEnabled: initialData?.isEnabled ?? true,
      config: initialData?.config || {}
    }
  });

  const jobType = form.watch('jobType');
  const cronExpression = form.watch('cronExpression');

  const handleSubmit = form.handleSubmit(async (data) => {
    // Clean up empty strings to undefined
    if (data.cronExpression === '') data.cronExpression = undefined;
    await onSubmit(data);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input {...form.register('name')} placeholder="e.g. Daily Data Sync" />
        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea {...form.register('description')} placeholder="What does this job do?" />
      </div>

      <div className="space-y-2">
        <Label>Job Type</Label>
        <Select 
          value={jobType} 
          onValueChange={(val: JobType) => form.setValue('jobType', val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a job type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="http">HTTP Request</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="noop">No-op (Testing)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {jobType === 'http' && (
        <div className="p-4 border rounded-md space-y-4 bg-muted/20">
          <h4 className="font-medium">HTTP Configuration</h4>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input 
              {...form.register('config.url')} 
              placeholder="https://api.example.com/data" 
            />
          </div>
          <div className="space-y-2">
            <Label>Method</Label>
            <Select 
              value={form.watch('config.method') || 'GET'} 
              onValueChange={(val) => form.setValue('config.method', val)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Body (JSON)</Label>
            <Textarea {...form.register('config.body')} placeholder='{"key": "value"}' />
          </div>
        </div>
      )}

      {jobType === 'webhook' && (
        <div className="p-4 border rounded-md space-y-4 bg-muted/20">
          <h4 className="font-medium">Webhook Configuration</h4>
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input {...form.register('config.url')} placeholder="https://hooks.slack.com/..." />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Schedule (Cron Expression)</Label>
        <Input {...form.register('cronExpression')} placeholder="*/5 * * * *" />
        {cronExpression && <CronHelper expression={cronExpression} />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Max Retries</Label>
          <Input type="number" {...form.register('maxRetries')} />
        </div>
        <div className="space-y-2">
          <Label>Retry Delay (Seconds)</Label>
          <Input type="number" {...form.register('retryDelaySeconds')} />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input 
          type="checkbox" 
          id="isEnabled" 
          className="w-4 h-4"
          {...form.register('isEnabled')}
        />
        <Label htmlFor="isEnabled">Enabled</Label>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Job'}
      </Button>
    </form>
  );
}