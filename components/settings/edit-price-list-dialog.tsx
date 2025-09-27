'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { priceListSchema, PriceListFormData } from '@/lib/validations/settings';
import { updatePriceList } from '@/lib/actions/settings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormField } from './form-field';
import { FormSection } from './form-section';
import { FormActions } from './form-actions';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface PriceList {
  id: string;
  name: string;
  description?: string;
  base_price_per_hour: number;
  base_price_per_cubic_meter: number;
  minimum_hours: number;
  travel_cost_per_km: number;
  setup_fee: number;
  overtime_multiplier: number;
  weekend_multiplier: number;
  holiday_multiplier: number;
  is_default: boolean;
  is_active: boolean;
}

interface EditPriceListDialogProps {
  priceList: PriceList;
  organizationSlug: string;
  trigger: React.ReactNode;
}

export function EditPriceListDialog({
  priceList,
  organizationSlug,
  trigger
}: EditPriceListDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<PriceListFormData>({
    resolver: zodResolver(priceListSchema),
    defaultValues: {
      name: priceList.name,
      description: priceList.description || '',
      base_price_per_hour: priceList.base_price_per_hour,
      base_price_per_cubic_meter: priceList.base_price_per_cubic_meter,
      minimum_hours: priceList.minimum_hours,
      travel_cost_per_km: priceList.travel_cost_per_km,
      setup_fee: priceList.setup_fee,
      overtime_multiplier: priceList.overtime_multiplier,
      weekend_multiplier: priceList.weekend_multiplier,
      holiday_multiplier: priceList.holiday_multiplier,
      is_default: priceList.is_default,
      is_active: priceList.is_active,
    },
  });

  const onSubmit = async (data: PriceListFormData) => {
    setIsSubmitting(true);

    try {
      const result = await updatePriceList(organizationSlug, priceList.id, data);

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Price List</DialogTitle>
          <DialogDescription>
            Update the pricing structure for concrete pump services.
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
            submitText="Update Price List"
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