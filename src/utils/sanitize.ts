/**
 * Input sanitization utilities for frontend
 */

/**
 * Sanitize search input for safe use in queries
 * - Trims whitespace
 * - Limits length
 * - Escapes PostgreSQL LIKE wildcards
 * - Removes potentially dangerous characters
 */
export function sanitizeSearchInput(input: string, maxLength: number = 100): string {
  if (!input || typeof input !== 'string') return ''

  return input
    .trim()
    .slice(0, maxLength)
    // Escape PostgreSQL LIKE wildcards
    .replace(/[%_\\]/g, '\\$&')
    // Remove null bytes and control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
}

/**
 * Validate UUID format
 */
export function isValidUUID(value: string): boolean {
  if (!value || typeof value !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Validate demo employee ID format (emp-XX)
 */
export function isValidDemoId(value: string): boolean {
  if (!value || typeof value !== 'string') return false
  return /^emp-\d+$/.test(value) || /^team-\d+$/.test(value)
}

/**
 * Validate employee/team ID (either UUID or demo format)
 */
export function isValidId(value: string): boolean {
  return isValidUUID(value) || isValidDemoId(value)
}

/**
 * Sanitize user-provided text content
 */
export function sanitizeText(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return ''

  return input
    .trim()
    .slice(0, maxLength)
    // Remove null bytes and control characters (except newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * Escape HTML special characters for safe display
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return input.replace(/[&<>"']/g, char => htmlEscapes[char] || char)
}
