import { Elysia } from 'elysia';
import { requireAuth } from '../utils/jwt.js';

export const authMiddleware = new Elysia()
  .derive(({ headers }) => {
    const authResult = requireAuth(headers.authorization);
    return {
      auth: authResult,
      user: authResult.user
    };
  })
  .macro(({ onBeforeHandle }) => ({
    requireAuth(enabled: boolean) {
      if (!enabled) return;
      
      onBeforeHandle(({ auth, set }) => {
        if (!auth || !auth.success) {
          set.status = 401;
          return { error: auth?.error || 'Unauthorized' };
        }
      });
    }
  }));