import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import bcrypt from 'bcryptjs';
import { JWTService, requireAuth } from './utils/jwt.js';

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
  
  // CORS preflight
  .options('*', () => {
    return new Response('', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});