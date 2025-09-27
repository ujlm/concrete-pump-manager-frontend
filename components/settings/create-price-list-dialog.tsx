'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { priceListSchema, PriceListFormData } from '@/lib/validations/settings';
import { createPriceList } from '@/lib/actions/settings';
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
import { FormSection } from './form-section';
import { FormActions } from './form-actions';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface CreatePriceListDialogProps {
  organizationSlug: string;
  trigger?: React.ReactNode;
}

export function CreatePriceListDialog({
  organizationSlug,
  trigger
}: CreatePriceListDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<PriceListFormData>({
    resolver: zodResolver(priceListSchema),
    defaultValues: {
      name: '',
      description: '',
      base_price_per_hour: 0,
      base_price_per_cubic_meter: 0,
      minimum_hours: 2,
      travel_cost_per_km: 2.5,
      setup_fee: 150,
      overtime_multiplier: 1.5,
      weekend_multiplier: 1.25,
      holiday_multiplier: 2.0,
      is_default: false,
      is_active: true,
    },
  });

  const onSubmit = async (data: PriceListFormData) => {
    setIsSubmitting(true);

    try {
      const result = await createPriceList(organizationSlug, data);

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
            Add Price List
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Price List</DialogTitle>
          <DialogDescription>
            Set up a new pricing structure for concrete pump services.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormSection
            title="Basic Information"
            description="Name and description of the price list"
          >
            <div className="space-y-4">
              <FormField
                label="Name"
                name="name"
                form={form}
                placeholder="e.g., Standard Rates 2024"
                required
              />

              <FormField
                label="Description"
                name="description"
                form={form}
                description="Optional description of this price list"
              >
                <Textarea
                  id="description"
                  placeholder="e.g., Standard pricing for commercial concrete pumping services"
                  {...form.register('description')}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection
            title="Base Rates"
            description="Core pricing per hour and volume"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Price per Hour (€)"
                name="base_price_per_hour"
                form={form}
                type="number"
                placeholder="120"
                description="Base hourly rate"
                required
              />

              <FormField
                label="Price per m³ (€)"
                name="base_price_per_cubic_meter"
                form={form}
                type="number"
                placeholder="8"
                description="Rate per cubic meter"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Minimum Hours"
                name="minimum_hours"
                form={form}
                type="number"
                placeholder="2"
                description="Minimum billable hours"
                required
              />

              <FormField
                label="Setup Fee (€)"
                name="setup_fee"
                form={form}
                type="number"
                placeholder="150"
                description="One-time setup charge"
                required
              />
            </div>
          </FormSection>

          <FormSection
            title="Additional Costs"
            description="Travel and extra charges"
          >
            <FormField
              label="Travel Cost per KM (€)"
              name="travel_cost_per_km"
              form={form}
              type="number"
              placeholder="2.5"
              description="Cost per kilometer traveled"
              required
            />
          </FormSection>

          <FormSection
            title="Rate Multipliers"
            description="Premium rates for special circumstances"
          >
            <div className="grid grid-cols-3 gap-4">
              <FormField
                label="Overtime Multiplier"
                name="overtime_multiplier"
                form={form}
                type="number"
                placeholder="1.5"
                description="Multiplier for overtime hours"
                required
              />

              <FormField
                label="Weekend Multiplier"
                name="weekend_multiplier"
                form={form}
                type="number"
                placeholder="1.25"
                description="Weekend rate multiplier"
                required
              />

              <FormField
                label="Holiday Multiplier"
                name="holiday_multiplier"
                form={form}
                type="number"
                placeholder="2.0"
                description="Holiday rate multiplier"
                required
              />
            </div>
          </FormSection>

          <FormSection
            title="Settings"
            description="Price list status and default settings"
          >
            <div className="space-y-4">
              <FormField
                label="Set as Default"
                name="is_default"
                form={form}
                type="checkbox"
                description="Use this as the default price list for new jobs"
              />

              <FormField
                label="Active"
                name="is_active"
                form={form}
                type="checkbox"
                description="Whether this price list is available for use"
              />
            </div>
          </FormSection>

          <FormActions
            isSubmitting={isSubmitting}
            isDirty={form.formState.isDirty}
            submitText="Create Price List"
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