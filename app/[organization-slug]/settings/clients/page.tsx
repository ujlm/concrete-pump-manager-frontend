import { getCurrentUser } from '@/lib/actions/dashboard';
import { getOrganizationClients } from '@/lib/actions/settings';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { ClientsTable } from '@/components/settings/clients-table';
import { CreateClientDialog } from '@/components/settings/create-client-dialog';
import { redirect } from 'next/navigation';

interface ClientsSettingsPageProps {
  params: Promise<{
    'organization-slug': string;
  }>;
}

export default async function ClientsSettingsPage({
  params,
}: ClientsSettingsPageProps) {
  const { 'organization-slug': organizationSlug } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Check if user has permission to access clients settings
  if (!user.roles.some(role => ['dispatcher', 'manager', 'organization_admin', 'accountant'].includes(role))) {
    redirect(`/${organizationSlug}`);
  }

  const clients = await getOrganizationClients(organizationSlug);

  return (
    <DashboardLayout
      user={user}
      title="Client Management"
      description="Manage your clients and their contact information"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Clients</h2>
            <p className="text-sm text-muted-foreground">
              Manage your clients and their contact information
            </p>
          </div>
          {user.roles.some(role => ['dispatcher', 'manager', 'organization_admin'].includes(role)) && (
            <CreateClientDialog organizationSlug={organizationSlug} />
          )}
        </div>
        
        <ClientsTable
          clients={clients}
          organizationSlug={organizationSlug}
          currentUserRoles={user.roles}
        />
      </div>
    </DashboardLayout>
  );
}