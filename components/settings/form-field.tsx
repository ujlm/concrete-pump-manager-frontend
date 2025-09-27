'use client';

import { ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  name: string;
  form: UseFormReturn<any>;
  type?: 'text' | 'email' | 'number' | 'tel' | 'color' | 'checkbox';
  placeholder?: string;
  description?: string;
  children?: ReactNode;
  required?: boolean;
  className?: string;
}

export function FormField({
  label,
  name,
  form,
  type = 'text',
  placeholder,
  description,
  children,
  required = false,
  className,
}: FormFieldProps) {
  const error = form.formState.errors[name];
  const isCheckbox = type === 'checkbox';

  if (children) {
    return (
      <div className={cn('space-y-2', className)}>
        <Label htmlFor={name} className={cn(required && 'after:content-["*"] after:text-destructive after:ml-1')}>
          {label}
        </Label>
        {children}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error.message as string}</p>
        )}
      </div>
    );
  }

  if (isCheckbox) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <Checkbox
          id={name}
          checked={form.watch(name)}
          onCheckedChange={(checked) => form.setValue(name, checked)}
          {...form.register(name)}
        />
        <div className="space-y-1">
          <Label
            htmlFor={name}
            className={cn(
              'text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              required && 'after:content-["*"] after:text-destructive after:ml-1'
            )}
          >
            {label}
          </Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {error && (
          <p className="text-sm text-destructive ml-2">{error.message as string}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className={cn(required && 'after:content-["*"] after:text-destructive after:ml-1')}>
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        className={cn(error && 'border-destructive focus-visible:ring-destructive')}
        {...form.register(name, { valueAsNumber: type === 'number' })}
      />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
}