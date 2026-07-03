/**
 * useProjectStore — re-exports the global Zustand project store.
 *
 * Kept here for backwards-compatibility so all existing imports
 * (`import { useProjectStore } from '../features/projects/useProjectStore'`)
 * continue to work without change.
 */
export { useProjectStore } from '../../store/useProjectStore'
