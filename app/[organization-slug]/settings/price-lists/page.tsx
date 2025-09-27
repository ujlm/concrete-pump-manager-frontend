import { getCurrentUser } from '@/lib/actions/dashboard';
import { getOrganizationPriceLists } from '@/lib/actions/settings';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { PriceListsTable } from '@/components/settings/price-lists-table';
import { CreatePriceListDialog } from '@/components/settings/create-price-list-dialog';
import { redirect } from 'next/navigation';

interface PriceListsSettingsPageProps {
  params: Promise<{
    'organization-slug': string;
  }>;
}

export default async function PriceListsSettingsPage({
  params,
}: PriceListsSettingsPageProps) {
  const { 'organization-slug': organizationSlug } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Check if user has permission to access price lists settings
  if (!user.roles.some(role => ['accountant', 'manager', 'organization_admin'].includes(role))) {
    redirect(`/${organizationSlug}`);
  }

  const priceLists = await getOrganizationPriceLists(organizationSlug);

  return (
    <DashboardLayout
      user={user}
      title="Price Lists"
      description="Manage pricing structures for concrete pump services"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Price Lists</h2>
            <p className="text-sm text-muted-foreground">
              Manage pricing structures for concrete pump services
            </p>
          </div>
          {user.roles.some(role => ['manager', 'organization_admin'].includes(role)) && (
            <CreatePriceListDialog organizationSlug={organizationSlug} />
          )}
        </div>
        
        <PriceListsTable
          priceLists={priceLists}
          organizationSlug={organizationSlug}
          currentUserRoles={user.roles}
        />
      </div>
    </DashboardLayout>
  );
}