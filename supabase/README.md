# Supabase Integration

This directory contains Supabase Edge Functions and database migrations for email tracking functionality.

## Directory Structure

```
supabase/
├── functions/
│   ├── store-email-interaction/
│   │   ├── index.ts           # Edge Function to track email opens
│   │   └── README.md          # Function documentation
│   └── deno.json              # Deno configuration
└── migrations/
    └── 20241204_create_email_interaction_table.sql  # Database schema
```

## Setup

### Prerequisites

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Create a Supabase project at [supabase.com](https://supabase.com)

### Database Setup

1. Run the migration to create the email_interaction table:
   ```bash
   # Option 1: Using Supabase CLI
   supabase db push

   # Option 2: Copy the SQL from migrations/20241204_create_email_interaction_table.sql
   # and run it in the Supabase SQL Editor
   ```

### Deploy Edge Function

1. Login to Supabase:
   ```bash
   supabase login
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Deploy the function:
   ```bash
   supabase functions deploy store-email-interaction
   ```

4. Verify deployment:
   ```bash
   supabase functions list
   ```

### Configure Email Tool

1. Navigate to **Settings → Supabase Integration**

2. Enter the following configuration:
   - **Tracking URL**: `https://your-project.supabase.co/functions/v1/store-email-interaction`
   - **Supabase URL**: `https://your-project.supabase.co`
   - **Supabase Anon Key**: Your project's anon/public key (found in Project Settings → API)

3. Click **Save Settings**

## Features

### Email Open Tracking

The Edge Function automatically tracks when recipients open emails by:
1. Receiving GET requests from tracking pixels embedded in emails
2. Parsing query parameters (recipient, emailId, templateId, campaignId)
3. Storing interaction data in the `email_interaction` table
4. Returning a 1x1 transparent GIF image

### Analytics View

The migration includes a view `email_open_analytics` that provides aggregated metrics:
- Total opens per campaign
- Unique opens (distinct recipients)
- Number of emails opened
- First and last open timestamps

Query example:
```sql
SELECT * FROM email_open_analytics WHERE campaign_id = 'your-campaign-id';
```

## Local Development

### Run Function Locally

```bash
supabase functions serve store-email-interaction
```

### Test Function

```bash
curl "http://localhost:54321/functions/v1/store-email-interaction?recipient=test@example.com&emailId=test123&templateId=template1&campaignId=campaign1"
```

## Security

- Row Level Security (RLS) is enabled on the `email_interaction` table
- The function uses the service role key to bypass RLS for inserts
- CORS is configured to allow requests from any origin (suitable for tracking pixels)
- Authenticated users can read interaction data through policies

## Monitoring

View function logs:
```bash
supabase functions logs store-email-interaction
```

## Troubleshooting

### Function not receiving requests
- Verify the tracking URL in Settings matches your deployed function URL
- Check function logs for errors
- Ensure CORS is properly configured

### Database errors
- Verify the migration was applied successfully
- Check that the service role key has proper permissions
- Review RLS policies if data isn't being inserted

### Missing data
- Verify required parameters (recipient, emailId) are being passed
- Check that the tracking pixel is properly embedded in emails
- Review function logs for validation errors

## Cost Considerations

- Edge Functions: Free tier includes 500,000 invocations/month
- Database: Free tier includes 500 MB database size
- Monitor usage in your Supabase project dashboard
