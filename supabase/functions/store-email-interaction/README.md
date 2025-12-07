# Store Email Interaction Edge Function

This Supabase Edge Function tracks email opens by storing interaction data when recipients open emails with tracking pixels.

## Table Schema

Create the following table in your Supabase database:

```sql
-- Create email_interaction table
CREATE TABLE IF NOT EXISTS public.email_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id TEXT NOT NULL,
  recipient TEXT NOT NULL,
  template_id TEXT NOT NULL,
  campaign_id TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_email_interaction_campaign_id ON public.email_interactions(campaign_id);
CREATE INDEX idx_email_interaction_recipient ON public.email_interactions(recipient);

-- Enable Row Level Security (optional)
ALTER TABLE public.email_interactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to insert (optional)
CREATE POLICY "Allow service role to insert email interactions"
ON public.email_interactions
FOR INSERT
TO service_role
WITH CHECK (true);
```

## Deployment

Deploy this function to Supabase:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy store-email-interaction
```

## Usage

### Request Format

Make a GET request to the function URL with query parameters:

```
GET https://your-project.supabase.co/functions/v1/store-email-interaction?r=user@example.com&e=abc123&t=template1&c=campaign1
```

### Query Parameters

- `r` (required): Email address of the recipient
- `e` (required): Unique identifier for the email
- `t` (optional): Template ID used for the email
- `c` (optional): Campaign ID if the email is part of a campaign

### Response

The function returns a 1x1 transparent GIF image, making it suitable for use as a tracking pixel:

```html
<img src="https://your-project.supabase.co/functions/v1/store-email-interaction?r=user@example.com&e=abc123" width="1" height="1" />
```

## Configuration in Email Tool

1. Go to Settings → Supabase Integration
2. Enter your tracking URL:
   ```
   https://your-project.supabase.co/functions/v1/store-email-interaction
   ```
3. Enter your Supabase URL and anon key
4. Save settings

The tracking pixel will be automatically embedded in all outgoing emails.

## Environment Variables

The function requires these environment variables (automatically set by Supabase):

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## Error Handling

The function handles various error cases:

- **400 Bad Request**: Missing required parameters (recipient or emailId)
- **500 Internal Server Error**: Database errors or other server issues

Even if an error occurs, a 1x1 pixel is returned to prevent broken images in emails.
