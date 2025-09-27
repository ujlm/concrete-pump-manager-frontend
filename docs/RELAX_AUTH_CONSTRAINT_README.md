# Relax Auth User ID Constraint

This migration allows adding users to the organization without requiring them to have authentication accounts. This is useful for drivers and other team members who won't use the software themselves but need to be in the system for job assignments.

## What This Migration Does

1. **Removes NOT NULL constraint** from `auth_user_id` column in the `users` table
2. **Updates foreign key constraint** to allow NULL values
3. **Modifies unique constraint** to handle NULL `auth_user_id` values
4. **Updates RLS policies** to work with users who don't have auth accounts
5. **Updates helper functions** to handle NULL `auth_user_id`

## Before Running the Migration

⚠️ **Important**: Make sure you have a backup of your database before running this migration.

## How to Run the Migration

### Option 1: Using the Script (Recommended)

```bash
# From the project root directory
./scripts/relax-auth-constraint.sh
```

### Option 2: Manual SQL Execution

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f docs/relax_auth_user_id_constraint.sql
```

### Option 3: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `docs/relax_auth_user_id_constraint.sql`
4. Execute the SQL

## What Happens After the Migration

### ✅ You Can Now:

- **Add users without email addresses** - Perfect for drivers who won't use the software
- **Add users without auth accounts** - They exist in the system but can't log in
- **Assign users to jobs** - Even users without auth accounts can be assigned to jobs
- **Track user information** - Names, phone numbers, roles, etc.

### 🔒 Security Notes:

- Users with `auth_user_id = NULL` **cannot log in** to the system
- They can only be managed by users with proper permissions (managers, organization admins)
- RLS policies ensure proper access control

### 📋 User Types After Migration:

1. **Full Users** (`auth_user_id` present, `email` present)
   - Can log in and use the software
   - Created via "Invite User" functionality

2. **System Users** (`auth_user_id = NULL`, `email` may or may not be present)
   - Cannot log in
   - Created via "Add User" functionality
   - Perfect for drivers, contractors, etc.

## Testing the Migration

After running the migration, test that you can:

1. ✅ Add a user without an email address
2. ✅ Add a user with an email but no auth account
3. ✅ View users without auth accounts in the user management table
4. ✅ Edit users without auth accounts
5. ✅ Assign users without auth accounts to jobs

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Re-add NOT NULL constraint (this will fail if you have users with NULL auth_user_id)
ALTER TABLE users ALTER COLUMN auth_user_id SET NOT NULL;

-- Re-add the original unique constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_user_id_organization_id_unique;
ALTER TABLE users ADD CONSTRAINT users_auth_user_id_organization_id_key UNIQUE (auth_user_id, organization_id);
```

⚠️ **Warning**: Rolling back will fail if you have any users with `auth_user_id = NULL`. You would need to either delete those users or assign them auth accounts first.

## Support

If you encounter any issues with this migration, please check:

1. Database connection and permissions
2. Supabase CLI installation and login status
3. Database backup before running the migration

The migration is designed to be safe and reversible, but always backup your data first!
