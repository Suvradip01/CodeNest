/**
 * useVersionStore — re-exports the global Zustand version store.
 *
 * Kept here for backwards-compatibility so all existing imports
 * (`import { useVersionStore } from '../versioning/useVersionStore'`)
 * continue to work without change.
 */
export { useVersionStore } from '../../store/useVersionStore'
