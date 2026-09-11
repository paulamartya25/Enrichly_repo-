'use client';
import { JobForm } from '@/components/jobs/JobForm';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const job = await api.jobs.create(data);
      router.push(`/jobs/${job.id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/jobs"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Create New Job</h2>
      </div>
      <div className="bg-card border rounded-lg p-6">
        <JobForm onSubmit={handleSubmit} isLoading={loading} />
      </div>
    </div>
  );
}