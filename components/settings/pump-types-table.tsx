'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  MoreHorizontal,
  Search,
  Truck,
  AlertCircle
} from 'lucide-react';
import { EditPumpTypeDialog } from './edit-pump-type-dialog';
import { deletePumpType } from '@/lib/actions/settings';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PumpType {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface PumpTypesTableProps {
  pumpTypes: PumpType[];
  organizationSlug: string;
  currentUserRoles: string[];
}

export function PumpTypesTable({
  pumpTypes,
  organizationSlug,
  currentUserRoles
}: PumpTypesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const filteredPumpTypes = pumpTypes.filter(pumpType =>
    pumpType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pumpType.capacity.toString().includes(searchTerm)
  );

  const handleDeletePumpType = async (pumpTypeId: string) => {
    setIsDeleting(pumpTypeId);

    try {
      const result = await deletePumpType(organizationSlug, pumpTypeId);

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
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
      setIsDeleting(null);
    }
  };

  const canEdit = currentUserRoles.some(role =>
    ['dispatcher', 'manager', 'organization_admin'].includes(role)
  );

  const canDelete = currentUserRoles.some(role =>
    ['manager', 'organization_admin'].includes(role)
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pump types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPumpTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No pump types found matching your search.' : 'No pump types found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredPumpTypes.map((pumpType) => (
                <TableRow key={pumpType.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Truck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {pumpType.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm font-medium">
                      {pumpType.capacity} m³/hr
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={pumpType.is_active ? "default" : "secondary"}>
                      {pumpType.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-sm text-gray-500">
                    {new Date(pumpType.created_at).toLocaleDateString()}
                  </TableCell>

                  <TableCell className="text-sm text-gray-500">
                    {pumpType.updated_at
                      ? new Date(pumpType.updated_at).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>

                  <TableCell>
                    {(canEdit || canDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(pumpType.name)}
                          >
                            Copy name
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {canEdit && (
                            <EditPumpTypeDialog
                              pumpType={pumpType}
                              organizationSlug={organizationSlug}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  Edit pump type
                                </DropdownMenuItem>
                              }
                            />
                          )}
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => e.preventDefault()}
                                  disabled={isDeleting === pumpType.id}
                                >
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  {isDeleting === pumpType.id ? 'Deleting...' : 'Delete pump type'}
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the pump type "{pumpType.name}" and may affect existing records.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePumpType(pumpType.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={isDeleting === pumpType.id}
                                  >
                                    {isDeleting === pumpType.id ? 'Deleting...' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredPumpTypes.length} of {pumpTypes.length} pump types
      </div>
    </div>
  );
}