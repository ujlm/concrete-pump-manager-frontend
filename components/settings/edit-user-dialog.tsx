'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userFormSchema, UserFormData } from '@/lib/validations/settings';
import { updateUser } from '@/lib/actions/settings';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Shield, ShieldCheck, Crown, Truck, Calculator, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  roles: string[];
  is_active: boolean;
}

interface EditUserDialogProps {
  user: User;
  organizationSlug: string;
  trigger: React.ReactNode;
}

const roles = [
  {
    value: 'pompist',
    label: 'Pompist',
    description: 'Can manage job assignments and pump operations',
    icon: User,
  },
  {
    value: 'dispatcher',
    label: 'Dispatcher',
    description: 'Can schedule jobs and coordinate pump assignments',
    icon: Truck,
  },
  {
    value: 'accountant',
    label: 'Accountant',
    description: 'Can manage invoicing and financial records',
    icon: Calculator,
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Can manage users and organization settings',
    icon: Shield,
  },
  {
    value: 'organization_admin',
    label: 'Organization Admin',
    description: 'Full access to all organization features',
    icon: Crown,
  },
];

export function EditUserDialog({
  user,
  organizationSlug,
  trigger
}: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email || '',
      phone: user.phone || '',
      roles: user.roles,
      is_active: user.is_active,
    },
  });

  const selectedRoles = form.watch('roles');

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);

    try {
      const result = await updateUser(organizationSlug, user.id, data);

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

  const handleRoleChange = (role: string, checked: boolean) => {
    const currentRoles = form.getValues('roles');
    if (checked) {
      form.setValue('roles', [...currentRoles, role], { shouldDirty: true });
    } else {
      form.setValue('roles', currentRoles.filter(r => r !== role), { shouldDirty: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information, roles, and account status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="First Name"
              name="first_name"
              form={form}
              placeholder="John"
              required
            />

            <FormField
              label="Last Name"
              name="last_name"
              form={form}
              placeholder="Doe"
              required
            />
          </div>

          <FormField
            label="Email Address"
            name="email"
            form={form}
            type="email"
            placeholder="john.doe@company.com"
            description="Optional - leave empty if the user won't access the software"
          />

          <FormField
            label="Phone Number"
            name="phone"
            form={form}
            type="tel"
            placeholder="+32 123 456 789"
            description="Optional contact phone number"
          />

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                Roles *
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select one or more roles for this user
              </p>
            </div>

            <div className="space-y-3">
              {roles.map((role) => {
                const IconComponent = role.icon;
                const isChecked = selectedRoles.includes(role.value);

                return (
                  <div key={role.value} className="flex items-start space-x-3">
                    <Checkbox
                      id={`edit-${role.value}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleRoleChange(role.value, checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`edit-${role.value}`}
                        className="flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        <IconComponent className="w-4 h-4 mr-2" />
                        {role.label}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {role.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {form.formState.errors.roles && (
              <p className="text-sm text-destructive">
                {form.formState.errors.roles.message}
              </p>
            )}
          </div>

          <FormField
            label="Account Status"
            name="is_active"
            form={form}
            type="checkbox"
            description="Inactive users cannot access the system"
          />

          <FormActions
            isSubmitting={isSubmitting}
            isDirty={form.formState.isDirty}
            submitText="Update User"
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