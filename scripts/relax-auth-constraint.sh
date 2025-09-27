#!/bin/bash

# Script to relax the auth_user_id constraint in the database
# This allows adding users without auth accounts (e.g., drivers)

echo "🔧 Relaxing auth_user_id constraint to allow users without auth accounts..."

# Check if we're in the right directory
if [ ! -f "docs/relax_auth_user_id_constraint.sql" ]; then
    echo "❌ Error: relax_auth_user_id_constraint.sql not found. Please run this script from the project root."
    exit 1
fi

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found. Please install it first."
    echo "   Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're logged in to Supabase
if ! supabase status &> /dev/null; then
    echo "❌ Error: Not connected to Supabase. Please run 'supabase login' first."
    exit 1
fi

echo "📋 Running migration to relax auth_user_id constraint..."

# Run the migration
if supabase db reset --db-url "$(supabase status | grep 'DB URL' | awk '{print $3}')" < docs/relax_auth_user_id_constraint.sql; then
    echo "✅ Successfully relaxed auth_user_id constraint!"
    echo ""
    echo "🎉 You can now:"
    echo "   • Add users without email addresses"
    echo "   • Add drivers who won't use the software"
    echo "   • Create users with NULL auth_user_id"
    echo ""
    echo "💡 Note: Users with NULL auth_user_id cannot log in but can be assigned to jobs"
else
    echo "❌ Error: Failed to run migration. Please check the error messages above."
    exit 1
fi
