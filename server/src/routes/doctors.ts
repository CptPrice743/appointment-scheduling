import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { doctors, users, appointments } from '../db/schema';
import { AppEnv, protect, isDoctor } from '../middleware/auth';
import { timeToMinutes, generateTimeSlots, getDayOfWeekString } from '../utils/timeUtils';
import { serializeDoctor, serializeAppointment } from '../utils/serializers';
import { ensureFreshDemoData } from '../db/seed';

export const doctorRouter = new Hono<AppEnv>();

// GET /api/doctors (Public / Authenticated list of doctors)
doctorRouter.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const docList = await db
    .select({
      doctor: doctors,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
      },
    })
    .from(doctors)
    .leftJoin(users, eq(doctors.userId, users.id));

  const result = docList.map(({ doctor, user }) => ({
    ...serializeDoctor(doctor),
    userId: user ? { ...user, _id: user.id } : null,
  }));

  return c.json(result);
});

// GET /api/doctors/list (Used by appointment dropdowns)
doctorRouter.get('/list', async (c) => {
  const db = drizzle(c.env.DB);
  const docList = await db.select().from(doctors);
  const result = docList.map((doc) => serializeDoctor(doc));
  return c.json(result);
});

// GET /api/doctors/appointments/my-schedule (Doctor's Schedule)
doctorRouter.get('/appointments/my-schedule', protect, isDoctor, async (c) => {
  const user = c.get('user');
  const doctorId = user.doctorProfile?.id || user.doctorProfile?._id;
  if (!doctorId) {
    return c.json({ message: 'Doctor profile not found.' }, 404);
  }

  if (user.id === 'user-doc-sarah') {
    await ensureFreshDemoData(c.env.DB);
  }

  const db = drizzle(c.env.DB);
  const appts = await db
    .select({
      appointment: appointments,
      patient: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(appointments)
    .leftJoin(users, eq(appointments.patientUserId, users.id))
    .where(eq(appointments.doctorId, doctorId))
    .orderBy(appointments.appointmentDate, appointments.startTime);

  const result = appts.map(({ appointment, patient }) =>
    serializeAppointment(appointment, user.doctorProfile, patient)
  );

  return c.json(result);
});

// GET /api/doctors/profile/me (Doctor's own profile)
doctorRouter.get('/profile/me', protect, isDoctor, async (c) => {
  const user = c.get('user');
  if (!user.doctorProfile) {
    return c.json({ message: 'Doctor profile not found for this user.' }, 404);
  }
  return c.json(user.doctorProfile);
});

// PATCH /api/doctors/profile/me
doctorRouter.patch('/profile/me', protect, isDoctor, async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const { specialization, appointmentDuration } = body;

  const updates: Partial<typeof doctors.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };
  if (specialization !== undefined) updates.specialization = specialization;
  if (appointmentDuration !== undefined) {
    const durationNum = parseInt(appointmentDuration);
    if (isNaN(durationNum) || durationNum <= 0) {
      return c.json({ message: 'Invalid appointment duration.' }, 400);
    }
    updates.appointmentDuration = durationNum;
  }

  if (Object.keys(updates).length <= 1) {
    return c.json({ message: 'No valid fields provided for update.' }, 400);
  }

  const doctorId = user.doctorProfile?.id || user.doctorProfile?._id;
  if (!doctorId) {
    return c.json({ message: 'Doctor profile ID not found.' }, 404);
  }

  const db = drizzle(c.env.DB);
  await db.update(doctors).set(updates).where(eq(doctors.id, doctorId));

  const [updatedDoctor] = await db.select().from(doctors).where(eq(doctors.id, doctorId)).limit(1);
  return c.json(serializeDoctor(updatedDoctor));
});

// GET /api/doctors/availability/standard
doctorRouter.get('/availability/standard', protect, isDoctor, async (c) => {
  const user = c.get('user');
  const doctorId = user.doctorProfile?.id || user.doctorProfile?._id;
  if (!doctorId) {
    return c.json({ message: 'Doctor profile ID not found.' }, 404);
  }

  const db = drizzle(c.env.DB);
  const [doc] = await db.select().from(doctors).where(eq(doctors.id, doctorId)).limit(1);
  if (!doc) {
    return c.json({ message: 'Doctor availability not found.' }, 404);
  }

  const parsed = JSON.parse(doc.standardAvailability || '[]');
  return c.json(parsed);
});

// PUT /api/doctors/availability/standard
doctorRouter.put('/availability/standard', protect, isDoctor, async (c) => {
  const user = c.get('user');
  const doctorId = user.doctorProfile?.id || user.doctorProfile?._id;
  if (!doctorId) {
    return c.json({ message: 'Doctor profile ID not found.' }, 404);
  }

  const body = await c.req.json().catch(() => ({}));
  const { availabilitySlots } = body;

  if (!Array.isArray(availabilitySlots)) {
    return c.json({ message: 'Availability slots must be an array.' }, 400);
  }

  const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeRegex = /^\d{2}:\d{2}$/;
  for (const slot of availabilitySlots) {
    if (!slot.dayOfWeek || !validDays.includes(slot.dayOfWeek)) {
      return c.json({ message: `Invalid or missing dayOfWeek: ${slot.dayOfWeek}` }, 400);
    }
    if (!slot.startTime || !timeRegex.test(slot.startTime)) {
      return c.json({ message: `Invalid or missing startTime format (HH:MM): ${slot.startTime}` }, 400);
    }
    if (!slot.endTime || !timeRegex.test(slot.endTime)) {
      return c.json({ message: `Invalid or missing endTime format (HH:MM): ${slot.endTime}` }, 400);
    }
    if (slot.startTime >= slot.endTime) {
      return c.json({ message: `End time must be after start time for ${slot.dayOfWeek}` }, 400);
    }
  }

  const db = drizzle(c.env.DB);
  await db
    .update(doctors)
    .set({
      standardAvailability: JSON.stringify(availabilitySlots),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(doctors.id, doctorId));

  return c.json(availabilitySlots);
});

// POST /api/doctors/availability/overrides
doctorRouter.post('/availability/overrides', protect, isDoctor, async (c) => {
  const user = c.get('user');
  const doctorId = user.doctorProfile?.id || user.doctorProfile?._id;
  if (!doctorId) {
    return c.json({ message: 'Doctor profile ID not found.' }, 404);
  }

  const body = await c.req.json().catch(() => ({}));
  const { date, isWorking, startTime, endTime } = body;

  if (!date) {
    return c.json({ message: 'Date is required for an override.' }, 400);
  }

  const overrideDate = new Date(date + 'T00:00:00Z');
  if (isNaN(overrideDate.getTime())) {
    return c.json({ message: 'Invalid date format. Use YYYY-MM-DD.' }, 400);
  }

  const timeRegex = /^\d{2}:\d{2}$/;
  if (isWorking) {
    if (!startTime || !timeRegex.test(startTime) || !endTime || !timeRegex.test(endTime)) {
      return c.json({ message: 'Start and end time in HH:MM format are required if working.' }, 400);
    }
    if (startTime >= endTime) {
      return c.json({ message: 'End time must be after start time.' }, 400);
    }
  }

  const db = drizzle(c.env.DB);
  const [doc] = await db.select().from(doctors).where(eq(doctors.id, doctorId)).limit(1);
  if (!doc) {
    return c.json({ message: 'Doctor profile not found.' }, 404);
  }

  let overrides: any[] = JSON.parse(doc.availabilityOverrides || '[]');
  const dateStr = overrideDate.toISOString().split('T')[0];

  const overrideEntry = {
    date: overrideDate.toISOString(),
    isWorking: !!isWorking,
    ...(isWorking && { startTime, endTime }),
  };

  const existingIdx = overrides.findIndex(
    (ov) => new Date(ov.date).toISOString().split('T')[0] === dateStr
  );

  if (existingIdx > -1) {
    overrides[existingIdx] = overrideEntry;
  } else {
    overrides.push(overrideEntry);
  }
  overrides.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  await db
    .update(doctors)
    .set({
      availabilityOverrides: JSON.stringify(overrides),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(doctors.id, doctorId));

  return c.json(overrideEntry);
});

// DELETE /api/doctors/availability/overrides/:date
doctorRouter.delete('/availability/overrides/:date', protect, isDoctor, async (c) => {
  const user = c.get('user');
  const doctorId = user.doctorProfile?.id || user.doctorProfile?._id;
  const dateParam = c.req.param('date');

  const overrideDate = new Date(dateParam + 'T00:00:00Z');
  if (isNaN(overrideDate.getTime())) {
    return c.json({ message: 'Invalid date format in URL. Use YYYY-MM-DD.' }, 400);
  }

  const db = drizzle(c.env.DB);
  const [doc] = await db.select().from(doctors).where(eq(doctors.id, doctorId)).limit(1);
  if (!doc) {
    return c.json({ message: 'Doctor profile not found.' }, 404);
  }

  const dateStr = overrideDate.toISOString().split('T')[0];
  let overrides: any[] = JSON.parse(doc.availabilityOverrides || '[]');
  const filtered = overrides.filter(
    (ov) => new Date(ov.date).toISOString().split('T')[0] !== dateStr
  );

  if (filtered.length === overrides.length) {
    return c.json({ message: 'Override for this date not found.' }, 404);
  }

  await db
    .update(doctors)
    .set({
      availabilityOverrides: JSON.stringify(filtered),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(doctors.id, doctorId));

  return c.json({ message: `Override for ${dateParam} deleted successfully.` });
});

// GET /api/doctors/:doctorId/available-slots
doctorRouter.get('/:doctorId/available-slots', protect, async (c) => {
  const doctorId = c.req.param('doctorId');
  const date = c.req.query('date');

  if (!doctorId) {
    return c.json({ message: 'Doctor ID is required.' }, 400);
  }
  if (!date) {
    return c.json({ message: 'Date query parameter is required.' }, 400);
  }

  const requestedDate = new Date(date + 'T00:00:00Z');
  if (isNaN(requestedDate.getTime())) {
    return c.json({ message: 'Invalid date format. Use YYYY-MM-DD.' }, 400);
  }

  const db = drizzle(c.env.DB);
  const [doctor] = await db.select().from(doctors).where(eq(doctors.id, doctorId)).limit(1);
  if (!doctor) {
    return c.json({ message: 'Doctor not found.' }, 404);
  }

  const duration = doctor.appointmentDuration;
  let dayStartTime: string | null = null;
  let dayEndTime: string | null = null;
  let isWorkingToday = false;

  const dateString = requestedDate.toISOString().split('T')[0];
  const overrides: any[] = JSON.parse(doctor.availabilityOverrides || '[]');
  const override = overrides.find(
    (ov) => new Date(ov.date).toISOString().split('T')[0] === dateString
  );

  if (override) {
    if (!override.isWorking) {
      return c.json([]);
    }
    isWorkingToday = true;
    dayStartTime = override.startTime;
    dayEndTime = override.endTime;
  } else {
    const dayOfWeek = getDayOfWeekString(requestedDate.getUTCDay());
    const standard: any[] = JSON.parse(doctor.standardAvailability || '[]');
    const rule = standard.find((slot) => slot.dayOfWeek === dayOfWeek);
    if (rule) {
      isWorkingToday = true;
      dayStartTime = rule.startTime;
      dayEndTime = rule.endTime;
    }
  }

  if (!isWorkingToday || !dayStartTime || !dayEndTime) {
    return c.json([]);
  }

  const potentialSlots = generateTimeSlots(dayStartTime, dayEndTime, duration);

  const existingAppts = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.status, 'scheduled')
      )
    );

  const apptsOnDate = existingAppts.filter(
    (a) => new Date(a.appointmentDate).toISOString().split('T')[0] === dateString
  );

  const finalAvailableSlots = potentialSlots.filter((slotStartTime) => {
    const slotStartMinutes = timeToMinutes(slotStartTime);
    const slotEndMinutes = slotStartMinutes + duration;
    for (const existing of apptsOnDate) {
      const existingStartMinutes = timeToMinutes(existing.startTime);
      const existingEndMinutes = timeToMinutes(existing.endTime);
      if (
        slotStartMinutes < existingEndMinutes &&
        slotEndMinutes > existingStartMinutes
      ) {
        return false; // Clash found
      }
    }
    return true;
  });

  return c.json(finalAvailableSlots);
});

// GET /api/doctors/:doctorId
doctorRouter.get('/:doctorId', async (c) => {
  const doctorId = c.req.param('doctorId');
  if (!doctorId) return c.json({ message: 'Doctor ID is required.' }, 400);

  const db = drizzle(c.env.DB);
  const [doc] = await db.select().from(doctors).where(eq(doctors.id, doctorId)).limit(1);
  if (!doc) {
    return c.json({ message: 'Doctor not found' }, 404);
  }
  return c.json(serializeDoctor(doc));
});
