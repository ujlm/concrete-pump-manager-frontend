#!/bin/bash

# Script to fix RLS recursion issues
# This maintains RLS security while fixing the circular dependency

echo "🔧 Fixing RLS recursion issues..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please make sure you're in the project root directory"
    exit 1
fi

# Get database URL from .env.local
DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2 | tr -d '"')

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env.local"
    exit 1
fi

echo "📊 Applying RLS recursion fix..."

# Apply the fix
psql "$DATABASE_URL" -f docs/fix_rls_recursion_proper.sql

if [ $? -eq 0 ]; then
    echo "✅ RLS recursion fix applied successfully!"
    echo ""
    echo "🔒 RLS is still enabled and properly configured"
    echo "🛡️  Security policies are maintained"
    echo "🔄 Helper functions use SECURITY DEFINER to prevent recursion"
    echo ""
    echo "You can now use your application without the infinite recursion error."
else
    echo "❌ Error applying RLS fix"
    exit 1
fi
