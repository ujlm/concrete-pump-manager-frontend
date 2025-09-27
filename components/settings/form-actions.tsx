'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FormActionsProps {
  isSubmitting: boolean;
  isDirty: boolean;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export function FormActions({
  isSubmitting,
  isDirty,
  onCancel,
  submitText = 'Save Changes',
  cancelText = 'Cancel',
  showCancel = true,
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3 pt-6 border-t">
      {showCancel && onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelText}
        </Button>
      )}
      <Button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="min-w-[120px]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          submitText
        )}
      </Button>
    </div>
  );
}