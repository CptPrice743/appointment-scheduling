import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { hashSync, compareSync } from 'bcrypt-ts';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users, doctors } from '../db/schema';
import { AppEnv, protect } from '../middleware/auth';
import { serializeUser } from '../utils/serializers';
import { DEMO_EMAILS, ensureFreshDemoData } from '../db/seed';

export const authRouter = new Hono<AppEnv>();

const timeRegex = /^\d{2}:\d{2}$/;
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEKENDS = ['Saturday', 'Sunday'];

authRouter.post('/register', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const {
    name,
    email,
    password,
    role,
    specialization,
    appointmentDuration,
    weekdayStartTime,
    weekdayEndTime,
    worksWeekends,
    weekendStartTime,
    weekendEndTime,
  } = body;

  if (!name || !email || !password || !role) {
    return c.json({ message: 'Please provide name, email, password, and role' }, 400);
  }
  if (!['patient', 'doctor'].includes(role)) {
    return c.json({ message: 'Invalid role specified' }, 400);
  }
  if (password.length < 6) {
    return c.json({ message: 'Password must be at least 6 characters' }, 400);
  }

  if (role === 'doctor') {
    if (!specialization || !appointmentDuration) {
      return c.json({ message: 'Doctors must provide specialization and default appointment duration.' }, 400);
    }
    const durationNum = parseInt(appointmentDuration);
    if (isNaN(durationNum) || durationNum <= 0) {
      return c.json({ message: 'Invalid appointment duration.' }, 400);
    }
    if (!weekdayStartTime || !timeRegex.test(weekdayStartTime)) {
      return c.json({ message: 'Invalid weekday start time format (HH:MM).' }, 400);
    }
    if (!weekdayEndTime || !timeRegex.test(weekdayEndTime)) {
      return c.json({ message: 'Invalid weekday end time format (HH:MM).' }, 400);
    }
    if (weekdayStartTime >= weekdayEndTime) {
      return c.json({ message: 'Weekday end time must be after start time.' }, 400);
    }
    if (worksWeekends) {
      if (!weekendStartTime || !timeRegex.test(weekendStartTime)) {
        return c.json({ message: 'Invalid weekend start time format (HH:MM).' }, 400);
      }
      if (!weekendEndTime || !timeRegex.test(weekendEndTime)) {
        return c.json({ message: 'Invalid weekend end time format (HH:MM).' }, 400);
      }
      if (weekendStartTime >= weekendEndTime) {
        return c.json({ message: 'Weekend end time must be after start time.' }, 400);
      }
    }
  }

  const db = drizzle(c.env.DB);
  const normalizedEmail = email.toLowerCase().trim();

  const [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (existingUser) {
    return c.json({ message: 'User already exists with this email' }, 400);
  }

  const hashedPassword = hashSync(password, 10);
  const userId = `user-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  let doctorId: string | null = null;
  let doctorRecord: any = null;

  if (role === 'doctor') {
    doctorId = `doc-${crypto.randomUUID()}`;
    const standardAvailability = WEEKDAYS.map((day) => ({
      dayOfWeek: day,
      startTime: weekdayStartTime,
      endTime: weekdayEndTime,
    }));
    if (worksWeekends) {
      WEEKENDS.forEach((day) => {
        standardAvailability.push({
          dayOfWeek: day,
          startTime: weekendStartTime,
          endTime: weekendEndTime,
        });
      });
    }

    doctorRecord = {
      id: doctorId,
      userId,
      name,
      specialization,
      appointmentDuration: parseInt(appointmentDuration),
      standardAvailability: JSON.stringify(standardAvailability),
      availabilityOverrides: '[]',
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(doctors).values(doctorRecord);
  }

  const userRecord = {
    id: userId,
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role: role as 'patient' | 'doctor',
    doctorProfileId: doctorId,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(users).values(userRecord);

  const secret = c.env.JWT_SECRET || 'appointment_secret_key_1234567890_edge_secure';
  const payload = {
    id: userId,
    role,
    ...(doctorId && { doctorId }),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 1 day
  };
  const token = await sign(payload, secret, 'HS256');
  const userResponse = serializeUser(userRecord as any, doctorRecord);

  return c.json({ token, user: userResponse }, 201);
});

authRouter.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ message: 'Please provide email and password' }, 400);
  }

  const db = drizzle(c.env.DB);
  const normalizedEmail = email.toLowerCase().trim();

  // If logging in as a demo user, ensure demo appointments are fresh for today
  if (DEMO_EMAILS.includes(normalizedEmail)) {
    await ensureFreshDemoData(c.env.DB);
  }

  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

  if (!user) {
    return c.json({ message: 'Invalid credentials' }, 401);
  }

  if (!user.isActive) {
    return c.json({ message: 'Your account has been deactivated. Please contact an administrator.' }, 403);
  }

  const isMatch = compareSync(password, user.password);
  if (!isMatch) {
    return c.json({ message: 'Invalid credentials' }, 401);
  }

  let doctorProfile = null;
  if (user.doctorProfileId) {
    const [doc] = await db.select().from(doctors).where(eq(doctors.id, user.doctorProfileId)).limit(1);
    doctorProfile = doc;
  } else if (user.role === 'doctor') {
    const [doc] = await db.select().from(doctors).where(eq(doctors.userId, user.id)).limit(1);
    doctorProfile = doc;
  }

  const secret = c.env.JWT_SECRET || 'appointment_secret_key_1234567890_edge_secure';
  const payload = {
    id: user.id,
    role: user.role,
    ...(doctorProfile && { doctorId: doctorProfile.id }),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 1 day
  };
  const token = await sign(payload, secret, 'HS256');
  const userResponse = serializeUser(user, doctorProfile);

  return c.json({ token, user: userResponse });
});

authRouter.get('/me', protect, async (c) => {
  return c.json(c.get('user'));
});
