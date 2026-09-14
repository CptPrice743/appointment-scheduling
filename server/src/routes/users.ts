import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, ne } from 'drizzle-orm';
import { users, doctors } from '../db/schema';
import { AppEnv, protect } from '../middleware/auth';
import { serializeUser } from '../utils/serializers';

export const userRouter = new Hono<AppEnv>();

userRouter.get('/profile/me', protect, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ message: 'User not found.' }, 404);
  }
  return c.json(user);
});

userRouter.patch('/profile/me', protect, async (c) => {
  const currentUser = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const { name, email } = body;

  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };
  if (name) updates.name = name;
  if (email) updates.email = email.toLowerCase().trim();

  if (Object.keys(updates).length <= 1) {
    return c.json({ message: 'No valid fields provided for update.' }, 400);
  }

  const db = drizzle(c.env.DB);

  if (updates.email) {
    const [existing] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, updates.email), ne(users.id, currentUser.id)))
      .limit(1);

    if (existing) {
      return c.json({ message: 'Email already in use.' }, 400);
    }
  }

  await db.update(users).set(updates).where(eq(users.id, currentUser.id));

  // If user is doctor, also update doctor name if name changed
  if (currentUser.role === 'doctor' && updates.name) {
    await db
      .update(doctors)
      .set({ name: updates.name, updatedAt: new Date().toISOString() })
      .where(eq(doctors.userId, currentUser.id));
  }

  const [updatedUser] = await db.select().from(users).where(eq(users.id, currentUser.id)).limit(1);
  let doctorProfile = null;
  if (updatedUser.doctorProfileId) {
    const [doc] = await db.select().from(doctors).where(eq(doctors.id, updatedUser.doctorProfileId)).limit(1);
    doctorProfile = doc;
  }

  return c.json(serializeUser(updatedUser, doctorProfile));
});
