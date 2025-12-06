import { createClient } from '@supabase/supabase-js'
import LocalStorageSettingsRepository from '../repositories/LocalStorageSettingsRepository'

const settingsRepository = new LocalStorageSettingsRepository()

let supabaseClient = null
let currentConfig = null

/**
 * Get or create a Supabase client instance
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient>}
 */
export async function getSupabaseClient() {
  const settings = await settingsRepository.getSettings()

  if (!settings?.supabase?.url || !settings?.supabase?.key) {
    throw new Error('Supabase configuration not found. Please configure Supabase settings first.')
  }

  const config = {
    url: settings.supabase.url,
    key: settings.supabase.key,
  }

  // Create new client if config changed or client doesn't exist
  if (
    !supabaseClient ||
    !currentConfig ||
    currentConfig.url !== config.url ||
    currentConfig.key !== config.key
  ) {
    console.log('Creating new Supabase client for:', config.url)
    supabaseClient = createClient(config.url, config.key, {
      auth: {
        persistSession: false, // Don't persist auth session in browser storage
        autoRefreshToken: false,
      },
    })
    currentConfig = config
  }

  return supabaseClient
}

/**
 * Reset the Supabase client (useful when settings change)
 */
export function resetSupabaseClient() {
  supabaseClient = null
  currentConfig = null
}

/**
 * Get email interactions with optional filters for campaign_id and template_id
 * @param {Object} filters - Optional filters
 * @param {string} [filters.campaign_id] - Filter by campaign ID
 * @param {string} [filters.template_id] - Filter by template ID
 * @returns {Promise<Array>} Array of email interactions
 */
export async function getEmailInteractions(filters = {}) {
  const client = await getSupabaseClient()

  let query = client.from('email_interactions').select('*')

  // Apply conditional where clauses
  if (filters.campaign_id) {
    query = query.eq('campaign_id', filters.campaign_id)
  }

  if (filters.template_id) {
    query = query.eq('template_id', filters.template_id)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch email interactions: ${error.message}`)
  }

  return data || []
}
