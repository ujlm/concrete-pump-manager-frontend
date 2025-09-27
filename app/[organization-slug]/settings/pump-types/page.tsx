import { getCurrentUser } from '@/lib/actions/dashboard';
import { getOrganizationPumpTypes } from '@/lib/actions/settings';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { PumpTypesTable } from '@/components/settings/pump-types-table';
import { CreatePumpTypeDialog } from '@/components/settings/create-pump-type-dialog';
import { redirect } from 'next/navigation';

interface PumpTypesSettingsPageProps {
  params: Promise<{
    'organization-slug': string;
  }>;
}

export default async function PumpTypesSettingsPage({
  params,
}: PumpTypesSettingsPageProps) {
  const { 'organization-slug': organizationSlug } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Check if user has permission to access pump types settings
  if (!user.roles.some(role => ['dispatcher', 'manager', 'organization_admin'].includes(role))) {
    redirect(`/${organizationSlug}`);
  }

  const pumpTypes = await getOrganizationPumpTypes(organizationSlug);

  return (
    <DashboardLayout
      user={user}
      title="Pump Types"
      description="Manage concrete pump types and their specifications"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Pump Types</h2>
            <p className="text-sm text-muted-foreground">
              Manage concrete pump types and their specifications
            </p>
          </div>
          <CreatePumpTypeDialog organizationSlug={organizationSlug} />
        </div>
        
        <PumpTypesTable
          pumpTypes={pumpTypes}
          organizationSlug={organizationSlug}
          currentUserRoles={user.roles}
        />
      </div>
    </DashboardLayout>
  );
}