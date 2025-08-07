import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import bcrypt from 'bcryptjs';
import { JWTService, requireAuth } from './utils/jwt.js';

// Mock data for websites since we don't have database setup
let mockWebsites: any[] = [];
let nextWebsiteId = 1;

interface LoginData {
  email: string;
  password: string;
}

const app = new Elysia()
  .use(cors({
    origin: true,
    credentials: true,
  }))
  
  // Health check
  .get('/health', () => ({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'JWT Auth Server Running'
  }))
  
  // Login endpoint
  .post('/auth/login', async ({ body, set }) => {
    try {
      const { email, password } = body as LoginData;
      
      if (!email || !password) {
        set.status = 400;
        return { error: 'Email and password are required' };
      }

      // Check against environment variables
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        set.status = 500;
        return { error: 'Server configuration error' };
      }

      if (email !== adminEmail) {
        set.status = 401;
        return { error: 'Invalid credentials' };
      }

      // For env-based auth, we'll hash the password in memory for comparison
      const isValidPassword = await bcrypt.compare(password, adminPassword);
      
      // If the env password isn't hashed, compare directly
      const isDirectMatch = password === adminPassword;
      
      if (!isValidPassword && !isDirectMatch) {
        set.status = 401;
        return { error: 'Invalid credentials' };
      }

      // Generate JWT tokens
      const payload = { 
        email: adminEmail,
        isAdmin: true 
      };
      
      const token = JWTService.generateToken(payload);
      const refreshToken = JWTService.generateRefreshToken(payload);

      return {
        success: true,
        token,
        refreshToken,
        user: {
          email: adminEmail,
          isAdmin: true
        }
      };

    } catch (error) {
      console.error('Login error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Verify token endpoint
  .post('/auth/verify', async ({ headers, set }) => {
    const authResult = requireAuth(headers.authorization);
    
    if (!authResult.success) {
      set.status = 401;
      return { error: authResult.error };
    }

    return {
      success: true,
      user: {
        email: authResult.user!.email,
        isAdmin: authResult.user!.isAdmin
      }
    };
  })
  
  // Refresh token endpoint
  .post('/auth/refresh', async ({ body, set }) => {
    try {
      const { refreshToken } = body as { refreshToken: string };
      
      if (!refreshToken) {
        set.status = 400;
        return { error: 'Refresh token is required' };
      }

      const decoded = JWTService.verifyToken(refreshToken);
      
      // Generate new access token
      const newToken = JWTService.generateToken({
        email: decoded.email,
        isAdmin: decoded.isAdmin
      });

      return {
        success: true,
        token: newToken,
        user: {
          email: decoded.email,
          isAdmin: decoded.isAdmin
        }
      };

    } catch (error) {
      set.status = 401;
      return { error: 'Invalid refresh token' };
    }
  })
  
  // Protected test endpoint
  .get('/protected', async ({ headers, set }) => {
    const authResult = requireAuth(headers.authorization);
    
    if (!authResult.success) {
      set.status = 401;
      return { error: authResult.error };
    }

    return {
      success: true,
      message: 'This is a protected endpoint',
      user: authResult.user,
      timestamp: new Date().toISOString()
    };
  })
  
  // Analytics endpoints (clean implementation - no mock data)
  .get('/analytics/websites', async ({ headers, set }) => {
    try {
      const authResult = requireAuth(headers.authorization);
      
      if (!authResult.success) {
        set.status = 401;
        return { error: authResult.error };
      }

      // Return empty array - no websites until user adds them
      return [];
    } catch (error) {
      console.error('Error in /analytics/websites:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .post('/analytics/websites', async ({ body, headers, set }) => {
    try {
      const authResult = requireAuth(headers.authorization);
      
      if (!authResult.success) {
        set.status = 401;
        return { error: authResult.error };
      }

      const { domain, name } = body as { domain: string; name: string };

      if (!domain || !domain.trim()) {
        set.status = 400;
        return { error: 'Domain is required' };
      }

      // For now, return a placeholder response
      // In production, this would save to database
      set.status = 501;
      return {
        error: 'Website creation not implemented yet',
        message: 'This feature requires database setup. Please use the full collector API with database.'
      };
    } catch (error) {
      console.error('Error in POST /analytics/websites:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .get('/analytics/stats/:websiteId', async ({ params, query, headers, set }) => {
    try {
      const authResult = requireAuth(headers.authorization);
      
      if (!authResult.success) {
        set.status = 401;
        return { error: authResult.error };
      }

      // Return empty stats - no data until tracking is set up
      return {
        pageviews: 0,
        uniqueVisitors: 0,
        bounceRate: 0,
        avgDuration: 0,
        liveVisitors: 0
      };
    } catch (error) {
      console.error('Error in /analytics/stats:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .get('/analytics/pages/:websiteId', async ({ params, query, headers, set }) => {
    try {
      const authResult = requireAuth(headers.authorization);
      
      if (!authResult.success) {
        set.status = 401;
        return { error: authResult.error };
      }

      // Return empty array - no data until tracking is set up
      return [];
    } catch (error) {
      console.error('Error in /analytics/pages:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .get('/analytics/countries/:websiteId', async ({ params, query, headers, set }) => {
    try {
      const authResult = requireAuth(headers.authorization);
      
      if (!authResult.success) {
        set.status = 401;
        return { error: authResult.error };
      }

      // Return empty array - no data until tracking is set up
      return [];
    } catch (error) {
      console.error('Error in /analytics/countries:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .get('/analytics/referrers/:websiteId', async ({ params, query, headers, set }) => {
    try {
      const authResult = requireAuth(headers.authorization);
      
      if (!authResult.success) {
        set.status = 401;
        return { error: authResult.error };
      }

      // Return empty array - no data until tracking is set up
      return [];
    } catch (error) {
      console.error('Error in /analytics/referrers:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .delete('/analytics/websites/:websiteId', async ({ params, headers, set }) => {
    try {
      const authResult = requireAuth(headers.authorization);
      
      if (!authResult.success) {
        set.status = 401;
        return { error: authResult.error };
      }

      // For now, return not implemented
      // In production, this would delete from database
      set.status = 501;
      return {
        error: 'Website deletion not implemented yet',
        message: 'This feature requires database setup. Please use the full collector API with database.'
      };
    } catch (error) {
      console.error('Error in DELETE /analytics/websites:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // CORS preflight
  .options('*', () => {
    return new Response('', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  })
  
  .listen(process.env.PORT || 3001);

console.log(`🚀 JWT Auth Server running at http://localhost:${app.server?.port}`);
console.log(`📋 Available endpoints:`);
console.log(`   POST /auth/login - Login to get JWT token`);
console.log(`   POST /auth/verify - Verify JWT token`);
console.log(`   POST /auth/refresh - Refresh JWT token`);
console.log(`   GET /protected - Test protected endpoint`);
console.log(`   GET /health - Health check`);
console.log(`   GET /analytics/websites - Get websites list`);
console.log(`   POST /analytics/websites - Add new website`);
console.log(`   DELETE /analytics/websites/:id - Delete website`);
console.log(`   GET /analytics/stats/:id - Get website stats`);
console.log(`   GET /analytics/pages/:id - Get top pages`);
console.log(`   GET /analytics/countries/:id - Get top countries`);
console.log(`   GET /analytics/referrers/:id - Get top referrers`);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});