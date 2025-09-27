'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, ClientFormData } from '@/lib/validations/settings';
import { updateClient } from '@/lib/actions/settings';
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

interface Client {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address_street?: string;
  address_city?: string;
  address_postal_code?: string;
  address_country?: string;
  vat_number?: string;
  payment_terms?: number;
  credit_limit?: number;
  notes?: string;
  is_active: boolean;
}

interface EditClientDialogProps {
  client: Client;
  organizationSlug: string;
  trigger: React.ReactNode;
}

export function EditClientDialog({
  client,
  organizationSlug,
  trigger
}: EditClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name,
      contact_person: client.contact_person || '',
      email: client.email || '',
      phone: client.phone || '',
      address_street: client.address_street || '',
      address_city: client.address_city || '',
      address_postal_code: client.address_postal_code || '',
      address_country: client.address_country || 'Belgium',
      vat_number: client.vat_number || '',
      payment_terms: client.payment_terms || 30,
      credit_limit: client.credit_limit || 0,
      notes: client.notes || '',
      is_active: client.is_active,
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);

    try {
      const result = await updateClient(organizationSlug, client.id, data);

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
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update the client information and details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormSection
            title="Basic Information"
            description="Client name and primary contact details"
          >
            <div className="space-y-4">
              <FormField
                label="Company Name"
                name="name"
                form={form}
                placeholder="e.g., ABC Construction Ltd."
                required
              />

              <FormField
                label="Contact Person"
                name="contact_person"
                form={form}
                placeholder="e.g., John Smith"
                description="Primary contact at the company"
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Email Address"
                  name="email"
                  form={form}
                  type="email"
                  placeholder="contact@company.com"
                />

                <FormField
                  label="Phone Number"
                  name="phone"
                  form={form}
                  type="tel"
                  placeholder="+32 123 456 789"
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Address Information"
            description="Client's business address"
          >
            <div className="space-y-4">
              <FormField
                label="Street Address"
                name="address_street"
                form={form}
                placeholder="123 Main Street"
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="City"
                  name="address_city"
                  form={form}
                  placeholder="Brussels"
                />

                <FormField
                  label="Postal Code"
                  name="address_postal_code"
                  form={form}
                  placeholder="1000"
                />
              </div>

              <FormField
                label="Country"
                name="address_country"
                form={form}
                placeholder="Belgium"
              />
            </div>
          </FormSection>

          <FormSection
            title="Business Details"
            description="Tax and payment information"
          >
            <div className="space-y-4">
              <FormField
                label="VAT Number"
                name="vat_number"
                form={form}
                placeholder="BE0123456789"
                description="Company VAT registration number"
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Payment Terms (days)"
                  name="payment_terms"
                  form={form}
                  type="number"
                  placeholder="30"
                  description="Default payment terms in days"
                />

                <FormField
                  label="Credit Limit (€)"
                  name="credit_limit"
                  form={form}
                  type="number"
                  placeholder="10000"
                  description="Maximum credit limit"
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Additional Information"
            description="Notes and settings"
          >
            <div className="space-y-4">
              <FormField
                label="Notes"
                name="notes"
                form={form}
                description="Any additional notes about this client"
              >
                <Textarea
                  id="notes"
                  placeholder="Enter any additional information..."
                  {...form.register('notes')}
                />
              </FormField>

              <FormField
                label="Active"
                name="is_active"
                form={form}
                type="checkbox"
                description="Whether this client is available for new jobs"
              />
            </div>
          </FormSection>

          <FormActions
            isSubmitting={isSubmitting}
            isDirty={form.formState.isDirty}
            submitText="Update Client"
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