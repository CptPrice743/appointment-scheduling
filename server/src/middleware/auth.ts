import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users, doctors } from '../db/schema';
import { serializeUser } from '../utils/serializers';

export interface AppEnv {
  Bindings: {
    DB: D1Database;
    ASSETS: Fetcher;
    JWT_SECRET?: string;
  };
  Variables: {
    user: any;
  };
}

export async function protect(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ message: 'Not authorized, no token provided' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const secret = c.env.JWT_SECRET || 'appointment_secret_key_1234567890_edge_secure';

  try {
    const payload = await verify(token, secret, 'HS256') as any;
    if (!payload || !payload.id) {
      return c.json({ message: 'Invalid token payload' }, 401);
    }

    const db = drizzle(c.env.DB);
    const [userRecord] = await db.select().from(users).where(eq(users.id, payload.id)).limit(1);

    if (!userRecord || !userRecord.isActive) {
      return c.json({ message: 'User not found or account is deactivated' }, 401);
    }

    let doctorProfile = null;
    if (userRecord.doctorProfileId) {
      const [doc] = await db.select().from(doctors).where(eq(doctors.id, userRecord.doctorProfileId)).limit(1);
      doctorProfile = doc;
    } else if (userRecord.role === 'doctor') {
      const [doc] = await db.select().from(doctors).where(eq(doctors.userId, userRecord.id)).limit(1);
      doctorProfile = doc;
    }

    const hydratedUser = serializeUser(userRecord, doctorProfile);
    c.set('user', hydratedUser);
    await next();
  } catch (err: any) {
    console.error('Token verification failed:', err.message);
    return c.json({ message: 'Not authorized, token failed' }, 401);
  }
}

export async function isDoctor(c: Context<AppEnv>, next: Next) {
  const user = c.get('user');
  if (!user || user.role !== 'doctor') {
    return c.json({ message: 'Access denied. Doctor privileges required.' }, 403);
  }
  await next();
}

export async function isAdmin(c: Context<AppEnv>, next: Next) {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ message: 'Access denied. Admin privileges required.' }, 403);
  }
  await next();
}
