'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock } from 'lucide-react';
import type { ConflictInfo } from '@/lib/types/calendar';

interface ConflictDialogProps {
  conflicts: ConflictInfo[];
  onAccept: () => void;
  onCancel: () => void;
}

export function ConflictDialog({
  conflicts,
  onAccept,
  onCancel,
}: ConflictDialogProps) {
  const errorConflicts = conflicts.filter(c => c.severity === 'error');
  const warningConflicts = conflicts.filter(c => c.severity === 'warning');

  const getConflictIcon = (type: ConflictInfo['type']) => {
    switch (type) {
      case 'overlap':
        return <Clock className="h-4 w-4" />;
      case 'travel_time':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getConflictColor = (severity: ConflictInfo['severity']) => {
    return severity === 'error' ? 'destructive' : 'secondary';
  };

  if (conflicts.length === 0) return null;

  return (
    <AlertDialog open onOpenChange={() => onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Schedule Conflicts Detected
          </AlertDialogTitle>
          <AlertDialogDescription>
            The following conflicts have been detected with this job placement:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 max-h-60 overflow-y-auto">
          {/* Error conflicts */}
          {errorConflicts.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-red-800 mb-2">
                Critical Conflicts ({errorConflicts.length})
              </h4>
              <div className="space-y-2">
                {errorConflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="text-red-600">
                      {getConflictIcon(conflict.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getConflictColor(conflict.severity)}>
                          {conflict.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="destructive" className="text-xs">
                          ERROR
                        </Badge>
                      </div>
                      <p className="text-sm text-red-800">{conflict.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning conflicts */}
          {warningConflicts.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-orange-800 mb-2">
                Warnings ({warningConflicts.length})
              </h4>
              <div className="space-y-2">
                {warningConflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <div className="text-orange-600">
                      {getConflictIcon(conflict.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getConflictColor(conflict.severity)}>
                          {conflict.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          WARNING
                        </Badge>
                      </div>
                      <p className="text-sm text-orange-800">{conflict.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Cancel Move
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onAccept}
            className={errorConflicts.length > 0 ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {errorConflicts.length > 0 ? 'Force Move' : 'Accept Warnings'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}