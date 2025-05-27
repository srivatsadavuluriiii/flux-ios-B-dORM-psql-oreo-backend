import { UserSyncService } from './user-sync.js';

// Export singleton instance
export const userSyncService = new UserSyncService();

// Re-export types
export type { FluxUser, UserProfile } from './user-sync.js'; 