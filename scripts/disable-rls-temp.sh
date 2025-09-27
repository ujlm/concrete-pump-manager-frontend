#!/bin/bash

# Temporary fix to disable RLS on users table
# This prevents the infinite recursion error

echo "🔧 Temporarily disabling RLS on users table to fix infinite recursion..."

# Check if we're in the right directory
if [ ! -f "docs/disable_rls_users_temp.sql" ]; then
    echo "❌ Error: disable_rls_users_temp.sql not found. Please run this script from the project root."
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

echo "📋 Disabling RLS on users table..."

# Get the database URL
DB_URL=$(supabase status | grep 'DB URL' | awk '{print $3}')

if [ -z "$DB_URL" ]; then
    echo "❌ Error: Could not get database URL from supabase status"
    exit 1
fi

# Run the SQL
if psql "$DB_URL" -f docs/disable_rls_users_temp.sql; then
    echo "✅ Successfully disabled RLS on users table!"
    echo ""
    echo "🎉 The infinite recursion error should now be resolved."
    echo ""
    echo "⚠️  IMPORTANT NOTES:"
    echo "   • RLS is now disabled on the users table"
    echo "   • This is a temporary fix for development"
    echo "   • You should re-enable RLS with proper policies for production"
    echo "   • All users can now access all user data (use with caution)"
    echo ""
    echo "💡 To re-enable RLS later, you'll need to create proper policies that don't cause recursion."
else
    echo "❌ Error: Failed to disable RLS. Please check the error messages above."
    exit 1
fi
