import LocalStorageSettingsRepository from "../repositories/LocalStorageSettingsRepository";
import axios from "axios";

const settingsRepository = new LocalStorageSettingsRepository();

/**
 * Apply body mapping to email data based on webhook configuration
 * @param {Object} emailData - Email data with recipients, ccList, subject, htmlBody
 * @param {Object} bodyMapping - Mapping configuration from settings (property name mappings)
 * @returns {Object} Mapped email data
 */
export const applyBodyMapping = (emailData, bodyMapping) => {
  const mappedBody = {};

  // Map each email field to its configured property name
  if (bodyMapping.recipients && bodyMapping.recipients.length > 0) {
    mappedBody[bodyMapping.recipients] = emailData.recipients.join(";");
  } else {
    throw new Error("No recipients provided");
  }
  if (bodyMapping.ccList && bodyMapping.ccList.length > 0) {
    mappedBody[bodyMapping.ccList] = emailData.ccList.join(";");
  } else {
    mappedBody[bodyMapping.ccList] = "";
  }
  if (bodyMapping.subject) {
    mappedBody[bodyMapping.subject] = emailData.subject;
  }
  if (bodyMapping.htmlBody) {
    mappedBody[bodyMapping.htmlBody] =
      emailData.htmlBody || emailData.htmlString;
  }

  return mappedBody;
};

/**
 * Send a single email using configured webhook
 * @param {Object} emailData - Email data with recipients, ccList, subject, htmlBody
 * @returns {Promise<Object>} Response from webhook
 */
export const sendSingleEmail = async (emailData) => {
  // Load webhook settings
  const settings = await settingsRepository.getSettings();

  if (!settings.webhook.url) {
    throw new Error(
      "Webhook URL not configured. Please configure it in Settings."
    );
  }

  // Apply body mapping from settings
  const mappedBody = applyBodyMapping(emailData, settings.webhook.bodyMapping);

  // Prepare headers
  const headers = {
    "Content-Type": "application/json",
  };

  // Add custom headers from settings
  settings.webhook.headers.forEach((header) => {
    if (header.key.trim() !== "") {
      headers[header.key] = header.value;
    }
  });

  await axios.post(settings.webhook.url, mappedBody, {
    headers,
  });
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send bulk emails using configured webhook
 * @param {Array<Object>} bulkEmailData - Array of email data objects
 * @returns {Promise<Object>} Response from webhook
 */
export const sendBulkEmails = async (bulkEmailData) => {
  const results = {
    success: [],
    failures: [],
  };
  for (const emailData of bulkEmailData) {
    try {
      await sendSingleEmail(emailData);
      results.success.push(emailData.recipients);
      await sleep(1000);
    } catch (error) {
      results.failures.push(emailData.recipients);
    }
  }

  return results;
};

/**
 * Test webhook with sample data
 * @param {string} webhookUrl - Webhook URL
 * @param {Array} webhookHeaders - Custom headers
 * @param {Object} bodyMapping - Body mapping configuration
 * @returns {Promise<Object>} Test result
 */
export const testWebhook = async (webhookUrl, webhookHeaders, bodyMapping) => {
  const testPayload = {
    recipients: ["test@example.com"],
    ccList: ["cc@example.com"],
    subject: "Test Email Subject",
    htmlBody: "<p>This is a test email body</p>",
  };

  // Apply body mapping
  const mappedBody = applyBodyMapping(testPayload, bodyMapping);

  const headers = {
    "Content-Type": "application/json",
  };

  // Add custom headers
  webhookHeaders.forEach((header) => {
    if (header.key.trim() !== "") {
      headers[header.key] = header.value;
    }
  });

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(mappedBody),
  });

  return {
    ok: response.ok,
    status: response.status,
    data: response.ok ? await response.json() : null,
  };
};
