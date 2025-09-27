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
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard
} from 'lucide-react';
import { EditClientDialog } from './edit-client-dialog';
import { deleteClient } from '@/lib/actions/settings';
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
  created_at: string;
  updated_at?: string;
}

interface ClientsTableProps {
  clients: Client[];
  organizationSlug: string;
  currentUserRoles: string[];
}

export function ClientsTable({
  clients,
  organizationSlug,
  currentUserRoles
}: ClientsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.address_city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClient = async (clientId: string) => {
    setIsDeleting(clientId);

    try {
      const result = await deleteClient(organizationSlug, clientId);

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
            placeholder="Search clients..."
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
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Terms</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No clients found matching your search.' : 'No clients found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {client.name}
                        </div>
                        {client.vat_number && (
                          <p className="text-sm text-gray-500">
                            VAT: {client.vat_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {client.contact_person && (
                        <div className="text-sm font-medium">
                          {client.contact_person}
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-3 h-3 mr-1.5" />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-3 h-3 mr-1.5" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {client.address_city && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-3 h-3 mr-1.5" />
                        <div>
                          {client.address_city}
                          {client.address_postal_code && (
                            <span className="text-gray-500">
                              , {client.address_postal_code}
                            </span>
                          )}
                          {client.address_country && client.address_country !== 'Belgium' && (
                            <div className="text-xs text-gray-400">
                              {client.address_country}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {client.payment_terms && (
                        <div className="text-sm">
                          {client.payment_terms} days
                        </div>
                      )}
                      {client.credit_limit && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CreditCard className="w-3 h-3 mr-1.5" />
                          {formatCurrency(client.credit_limit)}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={client.is_active ? "default" : "secondary"}>
                      {client.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-sm text-gray-500">
                    {new Date(client.created_at).toLocaleDateString()}
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
                            onClick={() => navigator.clipboard.writeText(client.name)}
                          >
                            Copy name
                          </DropdownMenuItem>
                          {client.email && (
                            <DropdownMenuItem
                              onClick={() => navigator.clipboard.writeText(client.email!)}
                            >
                              Copy email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {canEdit && (
                            <EditClientDialog
                              client={client}
                              organizationSlug={organizationSlug}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  Edit client
                                </DropdownMenuItem>
                              }
                            />
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              className="text-red-600"
                              disabled={isDeleting === client.id}
                              onClick={() => handleDeleteClient(client.id)}
                            >
                              {isDeleting === client.id ? 'Deactivating...' : 'Deactivate client'}
                            </DropdownMenuItem>
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
        Showing {filteredClients.length} of {clients.length} clients
      </div>
    </div>
  );
}