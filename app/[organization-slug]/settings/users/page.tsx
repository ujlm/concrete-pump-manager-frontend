import { getCurrentUser } from '@/lib/actions/dashboard';
import { getOrganizationUsers } from '@/lib/actions/settings';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { UserManagementTable } from '@/components/settings/user-management-table';
import { InviteUserDialog } from '@/components/settings/invite-user-dialog';
import { AddUserDialog } from '@/components/settings/add-user-dialog';
import { redirect } from 'next/navigation';

interface UsersSettingsPageProps {
  params: Promise<{
    'organization-slug': string;
  }>;
}

export default async function UsersSettingsPage({
  params,
}: UsersSettingsPageProps) {
  const { 'organization-slug': organizationSlug } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Check if user has permission to access user management
  if (!user.roles.some(role => ['manager', 'organization_admin'].includes(role))) {
    redirect(`/${organizationSlug}`);
  }

  const users = await getOrganizationUsers(organizationSlug);

  return (
    <DashboardLayout
      user={user}
      title="User Management"
      description="Manage users in your organization, roles, and permissions"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">User Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage users in your organization, roles, and permissions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <AddUserDialog organizationSlug={organizationSlug} />
            <InviteUserDialog organizationSlug={organizationSlug} />
          </div>
        </div>
        
        <UserManagementTable
          users={users}
          organizationSlug={organizationSlug}
          currentUser={user}
        />
      </div>
    </DashboardLayout>
  );
}