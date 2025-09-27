import { getCurrentUser } from '@/lib/actions/dashboard';
import { getOrganizationForSettings } from '@/lib/actions/settings';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { OrganizationSettingsForm } from '@/components/settings/organization-settings-form';
import { redirect } from 'next/navigation';

interface OrganizationSettingsPageProps {
  params: Promise<{
    'organization-slug': string;
  }>;
}

export default async function OrganizationSettingsPage({
  params,
}: OrganizationSettingsPageProps) {
  const { 'organization-slug': organizationSlug } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Check if user has permission to access organization settings
  if (!user.roles.some(role => ['manager', 'organization_admin'].includes(role))) {
    redirect(`/${organizationSlug}`);
  }

  const organization = await getOrganizationForSettings(organizationSlug);
  if (!organization) {
    redirect('/auth/login');
  }

  return (
    <DashboardLayout
      user={user}
      title="Organization Settings"
      description="Manage your organization details, branding, and subscription information"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Organization Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your organization details, branding, and subscription information
          </p>
        </div>
        
        <OrganizationSettingsForm
          organization={organization}
          organizationSlug={organizationSlug}
        />
      </div>
    </DashboardLayout>
  );
}