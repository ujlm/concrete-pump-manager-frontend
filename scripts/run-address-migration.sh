#!/bin/bash

# Script to add address columns to jobs table
# This fixes the "Could not find the 'address_city' column of 'jobs'" error

echo "🔧 Adding address columns to jobs table..."

# Check if we're in the right directory
if [ ! -f "scripts/add-address-columns-to-jobs.sql" ]; then
    echo "❌ Error: Please run this script from the concrete-pump-manager directory"
    exit 1
fi

# Check if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables"
    echo "You can find these in your Supabase project settings"
    exit 1
fi

# Run the migration
echo "📊 Executing migration..."
curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d @<(echo '{"sql": "'$(cat scripts/add-address-columns-to-jobs.sql | sed 's/"/\\"/g' | tr '\n' ' ')'"}')

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo "🎉 The jobs table now has address columns and the error should be resolved."
else
    echo "❌ Migration failed. Please check your Supabase credentials and try again."
    exit 1
fi
