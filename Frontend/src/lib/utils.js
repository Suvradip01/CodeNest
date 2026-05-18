import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Merges Tailwind CSS utility classes dynamically while resolving conflicting styles.
export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

// Extracts and cleans code text inside markdown blocks or returns plain strings.
export function extractCode(text) {
  const fence = text.match(/```[a-zA-Z0-9]*\n([\s\S]*?)```/)
  if (fence && fence[1]) return fence[1].trim()
  return text
}

// Scans diagnostic text lines using regex matching to identify runtime errors.
export function detectErrors(lines) {
  const errorPatterns = [
    /error/i,
    /exception/i,
    /traceback/i,
    /syntaxerror/i,
    /typeerror/i,
    /referenceerror/i,
    /segmentation fault/i,
    /undefined.*is not/i,
    /cannot read/i,
    /failed/i,
  ]

  return lines.some(line => errorPatterns.some(pattern => pattern.test(line)))
}

// Retrieves structured errors and HTTP statuses from Axios or standard exceptions.
export function getApiErrorMessage(error, fallback = 'Request failed') {
  const status = error?.response?.status
  const message =
    error?.response?.data?.error ||
    (typeof error?.response?.data === 'string' ? error.response.data : null) ||
    error?.message ||
    fallback

  return {
    status: status || 'unknown',
    message: typeof message === 'object' ? JSON.stringify(message) : String(message),
  }
}

