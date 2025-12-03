# Get Email Interactions Edge Function

This Supabase Edge Function fetches email interaction records based on optional query parameters.

## Endpoint

```
GET /functions/v1/get-email-interactions
```

## Query Parameters

All parameters are optional. If both are omitted, all email interactions will be returned.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `campaignId` | string | No | Filter interactions by campaign ID |
| `templateId` | string | No | Filter interactions by template ID |

## Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email_id": "string",
      "recipient": "email@example.com",
      "template_id": "string",
      "campaign_id": "string",
      "created_at": "timestamp"
    }
  ],
  "count": 10
}
```

## Examples

### Get all interactions
```bash
curl 'https://your-project.supabase.co/functions/v1/get-email-interactions'
```

### Filter by campaign ID
```bash
curl 'https://your-project.supabase.co/functions/v1/get-email-interactions?campaignId=campaign123'
```

### Filter by template ID
```bash
curl 'https://your-project.supabase.co/functions/v1/get-email-interactions?templateId=template456'
```

### Filter by both campaign and template
```bash
curl 'https://your-project.supabase.co/functions/v1/get-email-interactions?campaignId=campaign123&templateId=template456'
```

## Deployment

```bash
supabase functions deploy get-email-interactions
```
