import { Elysia } from 'elysia';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface LoginData {
  email: string;
  password: string;
}

export const authRoutes = new Elysia()
  .post('/login', async ({ body, set }) => {
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

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
      const token = jwt.sign(
        { 
          email: adminEmail,
          isAdmin: true 
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        token,
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
  
  .post('/verify', async ({ headers, set }) => {
    try {
      const authorization = headers.authorization;
      
      if (!authorization || !authorization.startsWith('Bearer ')) {
        set.status = 401;
        return { error: 'No token provided' };
      }

      const token = authorization.substring(7);
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
      
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      return {
        success: true,
        user: {
          email: decoded.email,
          isAdmin: decoded.isAdmin
        }
      };

    } catch (error) {
      set.status = 401;
      return { error: 'Invalid token' };
    }
  }); 