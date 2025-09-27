'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pumpTypeSchema, PumpTypeFormData } from '@/lib/validations/settings';
import { createPumpType } from '@/lib/actions/settings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField } from './form-field';
import { FormActions } from './form-actions';
import { Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface CreatePumpTypeDialogProps {
  organizationSlug: string;
  trigger?: React.ReactNode;
}

export function CreatePumpTypeDialog({
  organizationSlug,
  trigger
}: CreatePumpTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<PumpTypeFormData>({
    resolver: zodResolver(pumpTypeSchema),
    defaultValues: {
      name: '',
      capacity: 0,
      is_active: true,
    },
  });

  const onSubmit = async (data: PumpTypeFormData) => {
    setIsSubmitting(true);

    try {
      const result = await createPumpType(organizationSlug, data);

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
        form.reset();
        setOpen(false);
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Pump Type
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create Pump Type</DialogTitle>
          <DialogDescription>
            Add a new concrete pump type with its specifications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            label="Name"
            name="name"
            form={form}
            placeholder="e.g., Mobile Boom Pump 32M"
            description="Descriptive name for this pump type"
            required
          />

          <FormField
            label="Capacity"
            name="capacity"
            form={form}
            type="number"
            placeholder="120"
            description="Maximum output capacity in m³/hr"
            required
          />

          <FormField
            label="Active"
            name="is_active"
            form={form}
            type="checkbox"
            description="Whether this pump type is available for scheduling"
          />

          <FormActions
            isSubmitting={isSubmitting}
            isDirty={form.formState.isDirty}
            submitText="Create Pump Type"
            onCancel={() => {
              form.reset();
              setOpen(false);
            }}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}