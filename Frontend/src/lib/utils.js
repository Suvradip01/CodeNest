import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function extractCode(text) {
  const fence = text.match(/```[a-zA-Z0-9]*\n([\s\S]*?)```/)
  if (fence && fence[1]) return fence[1].trim()
  return text
}

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

