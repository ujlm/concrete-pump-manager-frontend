'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pumpTypeSchema, PumpTypeFormData } from '@/lib/validations/settings';
import { updatePumpType } from '@/lib/actions/settings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormField } from './form-field';
import { FormActions } from './form-actions';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface PumpType {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
}

interface EditPumpTypeDialogProps {
  pumpType: PumpType;
  organizationSlug: string;
  trigger: React.ReactNode;
}

export function EditPumpTypeDialog({
  pumpType,
  organizationSlug,
  trigger
}: EditPumpTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<PumpTypeFormData>({
    resolver: zodResolver(pumpTypeSchema),
    defaultValues: {
      name: pumpType.name,
      capacity: pumpType.capacity,
      is_active: pumpType.is_active,
    },
  });

  const onSubmit = async (data: PumpTypeFormData) => {
    setIsSubmitting(true);

    try {
      const result = await updatePumpType(organizationSlug, pumpType.id, data);

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
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
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Pump Type</DialogTitle>
          <DialogDescription>
            Update the pump type specifications.
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
            submitText="Update Pump Type"
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