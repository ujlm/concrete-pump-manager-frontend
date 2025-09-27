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
  DollarSign,
  AlertCircle,
  Star
} from 'lucide-react';
import { EditPriceListDialog } from './edit-price-list-dialog';
import { deletePriceList } from '@/lib/actions/settings';
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
  created_at: string;
  updated_at?: string;
}

interface PriceListsTableProps {
  priceLists: PriceList[];
  organizationSlug: string;
  currentUserRoles: string[];
}

export function PriceListsTable({
  priceLists,
  organizationSlug,
  currentUserRoles
}: PriceListsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const filteredPriceLists = priceLists.filter(priceList =>
    priceList.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    priceList.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeletePriceList = async (priceListId: string) => {
    setIsDeleting(priceListId);

    try {
      const result = await deletePriceList(organizationSlug, priceListId);

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
    ['manager', 'organization_admin'].includes(role)
  );

  const canDelete = currentUserRoles.some(role =>
    ['manager', 'organization_admin'].includes(role)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search price lists..."
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
              <TableHead>Base Rates</TableHead>
              <TableHead>Multipliers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPriceLists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No price lists found matching your search.' : 'No price lists found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredPriceLists.map((priceList) => (
                <TableRow key={priceList.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {priceList.name}
                          </span>
                          {priceList.is_default && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        {priceList.description && (
                          <p className="text-sm text-gray-500">
                            {priceList.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {formatCurrency(priceList.base_price_per_hour)}/hr
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(priceList.base_price_per_cubic_meter)}/m³
                      </div>
                      <div className="text-xs text-gray-400">
                        Min {priceList.minimum_hours}h • Setup {formatCurrency(priceList.setup_fee)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        Overtime: {priceList.overtime_multiplier}x
                      </div>
                      <div className="text-sm text-gray-500">
                        Weekend: {priceList.weekend_multiplier}x
                      </div>
                      <div className="text-sm text-gray-500">
                        Holiday: {priceList.holiday_multiplier}x
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={priceList.is_active ? "default" : "secondary"}>
                        {priceList.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {priceList.is_default && (
                        <Badge variant="outline" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm text-gray-500">
                    {new Date(priceList.created_at).toLocaleDateString()}
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
                            onClick={() => navigator.clipboard.writeText(priceList.name)}
                          >
                            Copy name
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {canEdit && (
                            <EditPriceListDialog
                              priceList={priceList}
                              organizationSlug={organizationSlug}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  Edit price list
                                </DropdownMenuItem>
                              }
                            />
                          )}
                          {canDelete && !priceList.is_default && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => e.preventDefault()}
                                  disabled={isDeleting === priceList.id}
                                >
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  {isDeleting === priceList.id ? 'Deleting...' : 'Delete price list'}
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the price list "{priceList.name}" and may affect existing records.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePriceList(priceList.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={isDeleting === priceList.id}
                                  >
                                    {isDeleting === priceList.id ? 'Deleting...' : 'Delete'}
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
        Showing {filteredPriceLists.length} of {priceLists.length} price lists
      </div>
    </div>
  );
}