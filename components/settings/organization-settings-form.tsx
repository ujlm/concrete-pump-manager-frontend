'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { organizationSchema, OrganizationFormData } from '@/lib/validations/settings';
import { updateOrganization } from '@/lib/actions/settings';
import { FormSection } from './form-section';
import { FormField } from './form-field';
import { FormActions } from './form-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Truck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface OrganizationSettingsFormProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    primary_color?: string;
    secondary_color?: string;
    address_street?: string;
    address_city?: string;
    address_postal_code?: string;
    address_country?: string;
    phone?: string;
    email?: string;
    subscription_active?: boolean;
    max_users?: number;
    max_pumps?: number;
  };
  organizationSlug: string;
}

export function OrganizationSettingsForm({
  organization,
  organizationSlug,
}: OrganizationSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
      domain: organization.domain || '',
      primary_color: organization.primary_color || '#3B82F6',
      secondary_color: organization.secondary_color || '#1E40AF',
      address_street: organization.address_street || '',
      address_city: organization.address_city || '',
      address_postal_code: organization.address_postal_code || '',
      address_country: organization.address_country || 'Belgium',
      phone: organization.phone || '',
      email: organization.email || '',
    },
  });

  const onSubmit = async (data: OrganizationFormData) => {
    setIsSubmitting(true);

    try {
      const result = await updateOrganization(organizationSlug, data);

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
        form.reset(data);
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Subscription Info */}
      <FormSection
        title="Subscription Information"
        description="Your current subscription tier and limits"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
            <Crown className="h-5 w-5 text-yellow-600" />
            <div>
              <div className="font-medium">Professional</div>
              <div className="text-sm text-muted-foreground">Active subscription</div>
            </div>
            <Badge variant="default" className="ml-auto">
              Active
            </Badge>
          </div>

          <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium">{organization.max_users || 0} Users</div>
              <div className="text-sm text-muted-foreground">Maximum allowed</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
            <Truck className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium">{organization.max_pumps || 0} Pumps</div>
              <div className="text-sm text-muted-foreground">Maximum allowed</div>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Basic Information */}
      <FormSection
        title="Basic Information"
        description="Organization name, slug, and domain settings"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Organization Name"
            name="name"
            form={form}
            placeholder="Enter organization name"
            required
          />

          <FormField
            label="Organization Slug"
            name="slug"
            form={form}
            placeholder="organization-slug"
            description="Used in URLs and must be unique"
            required
          />

          <FormField
            label="Custom Domain"
            name="domain"
            form={form}
            placeholder="yourcompany.com"
            description="Optional custom domain for your organization"
            className="md:col-span-2"
          />
        </div>
      </FormSection>

      {/* Branding */}
      <FormSection
        title="Branding"
        description="Colors and visual identity for your organization"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Primary Color"
            name="primary_color"
            form={form}
            type="color"
            description="Main brand color used in the interface"
          />

          <FormField
            label="Secondary Color"
            name="secondary_color"
            form={form}
            type="color"
            description="Secondary brand color for accents"
          />
        </div>

        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground">Preview:</div>
          <div
            className="w-8 h-8 rounded border"
            style={{ backgroundColor: form.watch('primary_color') }}
          />
          <div
            className="w-8 h-8 rounded border"
            style={{ backgroundColor: form.watch('secondary_color') }}
          />
        </div>
      </FormSection>

      {/* Contact Information */}
      <FormSection
        title="Contact Information"
        description="Organization contact details and address"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Email Address"
            name="email"
            form={form}
            type="email"
            placeholder="contact@yourcompany.com"
            description="Main contact email for the organization"
          />

          <FormField
            label="Phone Number"
            name="phone"
            form={form}
            type="tel"
            placeholder="+32 123 456 789"
            description="Main contact phone number"
          />

          <FormField
            label="Street Address"
            name="address_street"
            form={form}
            placeholder="Street address"
            className="md:col-span-2"
          />

          <FormField
            label="City"
            name="address_city"
            form={form}
            placeholder="City"
          />

          <FormField
            label="Postal Code"
            name="address_postal_code"
            form={form}
            placeholder="1000"
          />

          <FormField
            label="Country"
            name="address_country"
            form={form}
            placeholder="Belgium"
            className="md:col-span-2"
          />
        </div>
      </FormSection>

      <FormActions
        isSubmitting={isSubmitting}
        isDirty={form.formState.isDirty}
        onCancel={() => form.reset()}
      />
    </form>
  );
}