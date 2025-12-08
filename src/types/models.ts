// Campaign types
export interface Campaign {
  id: string
  name: string
  color: string
  createdAt: string
  emailCount: number
  updatedAt?: string
}

export interface CampaignCreateData {
  name: string
  color: string
}

// Template types
export type TemplateType = 'email' | 'calendar'

export interface Template {
  id: string
  name: string
  type: TemplateType
  subject?: string
  htmlString: string
  parameters?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface TemplateCreateData {
  name: string
  type: TemplateType
  subject?: string
  htmlString: string
  parameters?: string[]
}

// Email History types
export interface EmailHistoryRecord {
  id: string
  emailId?: string
  templateName: string
  templateId: string
  template: Template
  recipients: string[]
  ccList: string[]
  subject: string
  htmlBody: string
  status: 'pending' | 'sent' | 'failed'
  campaignId: string | null
  sentAt?: string
  updatedAt?: string
}

export interface EmailData {
  id?: string
  recipients: string[]
  ccList?: string[]
  subject: string
  htmlBody?: string
  htmlString?: string
  campaignId?: string | null
}

// Calendar Invite History types
export interface CalendarInviteHistoryRecord {
  id: string
  templateName: string
  templateId: string
  template: Template
  recipient: string
  cc?: string
  subject: string
  message: string
  startTime: string
  endTime: string
  timezone: string
  attachmentName?: string
  status: 'sent' | 'failed'
  sentAt?: string
  createdAt?: string
}

// Analytics types
export interface EmailInteraction {
  id: string
  email_id: string
  campaign_id?: string
  template_id?: string
  recipient: string
  opened_at?: string
  created_at: string
}

export interface AnalyticsParams {
  campaignId?: string
  templateId?: string
}

export interface AnalyticsResult {
  success: boolean
  data: EmailInteraction[]
  count: number
}

export interface TrackingPixelParams {
  emailId: string
  campaignId?: string
  templateId: string
  recipient: string
  supabaseUrl?: string
}

// Import/Export types
export interface ImportResult {
  success: number
  errors: string[]
}

// Email sending types
export interface EmailSendOptions {
  template?: Template
  templateId?: string
  signal?: AbortSignal
  campaignId?: string | null
}

export interface BulkEmailResult {
  success: string[][]
  failures: string[][]
  campaignId: string | null
}

// Settings types
export interface WebhookHeader {
  key: string
  value: string
}

export interface BodyMapping {
  recipients: string
  ccList: string
  subject: string
  htmlBody: string
}

export interface WebhookSettings {
  url: string
  headers: WebhookHeader[]
  bodyMapping: BodyMapping
}

export interface SupabaseSettings {
  url: string
  key: string
}

export interface Settings {
  webhook: WebhookSettings
  supabase?: SupabaseSettings
  pixelTracking?: {
    enabled: boolean
  }
  calendarWebhook?: {
    url: string
    headers?: WebhookHeader[]
  }
  signature?: string
  defaultTimezone?: string
}
