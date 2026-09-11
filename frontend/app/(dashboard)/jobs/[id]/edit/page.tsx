'use client';
import { use, useState } from 'react';
import { JobForm } from '@/components/jobs/JobForm';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['jobs', id],
    queryFn: () => api.jobs.get(id),
  });

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await api.jobs.update(id, data);
      router.push(`/jobs/${id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!job) return <div className="p-8 text-center text-muted-foreground">Job not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/jobs/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Edit Job: {job.name}</h2>
      </div>
      <div className="bg-card border rounded-lg p-6">
        <JobForm initialData={job} onSubmit={handleSubmit} isLoading={loading} />
      </div>
    </div>
  );
}