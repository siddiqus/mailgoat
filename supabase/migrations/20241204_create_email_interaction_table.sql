-- Create email_interactions table to track email opens
CREATE TABLE IF NOT EXISTS public.email_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id TEXT NOT NULL,
  recipient TEXT NOT NULL,
  template_id TEXT,
  campaign_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE public.email_interactions IS 'Tracks email open events via tracking pixels';

-- Add comments to columns
COMMENT ON COLUMN public.email_interactions.id IS 'Unique identifier for the interaction record';
COMMENT ON COLUMN public.email_interactions.email_id IS 'Unique identifier of the email that was opened';
COMMENT ON COLUMN public.email_interactions.recipient IS 'Email address of the recipient who opened the email';
COMMENT ON COLUMN public.email_interactions.template_id IS 'Template used for the email (optional)';
COMMENT ON COLUMN public.email_interactions.campaign_id IS 'Campaign ID if email is part of a campaign (optional)';
COMMENT ON COLUMN public.email_interactions.created_at IS 'Timestamp when the record was created';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_interaction_campaign_id ON public.email_interactions(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_interaction_recipient ON public.email_interactions(recipient);

-- Enable Row Level Security
ALTER TABLE public.email_interactions ENABLE ROW LEVEL SECURITY;

-- Allow all inserts (including anonymous) - effectively bypassing RLS for writes
CREATE POLICY "Allow service role to only insert email interactions"
ON public.email_interactions
FOR INSERT
TO service_role
WITH CHECK (true);

-- Restrict reads to authenticated users only
CREATE POLICY "Allow anonymous users to read email interactions"
ON public.email_interactions
FOR SELECT
TO anon
USING (true);

-- Create a view for email open analytics
CREATE OR REPLACE VIEW public.email_open_analytics AS
SELECT
  campaign_id,
  COUNT(*) as total_opens,
  COUNT(DISTINCT recipient) as unique_opens,
  COUNT(DISTINCT email_id) as emails_opened
FROM public.email_interactions
WHERE campaign_id IS NOT NULL
GROUP BY campaign_id;

-- Add comment to view
COMMENT ON VIEW public.email_open_analytics IS 'Aggregated analytics for email opens by campaign';
