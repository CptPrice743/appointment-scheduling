import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, sql, desc } from 'drizzle-orm';
import { users, doctors, appointments } from '../db/schema';
import { AppEnv, protect, isAdmin } from '../middleware/auth';
import { serializeUser, serializeDoctor, serializeAppointment } from '../utils/serializers';
import { ensureFreshDemoData } from '../db/seed';

export const adminRouter = new Hono<AppEnv>();

// Apply admin guard to all admin routes
adminRouter.use('*', protect, isAdmin);

// GET /api/admin/stats/dashboard
adminRouter.get('/stats/dashboard', async (c) => {
  await ensureFreshDemoData(c.env.DB);
  const db = drizzle(c.env.DB);
  const now = new Date();
  const todayStr = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString();
  const sevenDaysAgoStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Total Appointments
  const [totalRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments);
  const totalAppointments = totalRes?.count || 0;

  // 2. Appointments per doctor
  const apptsPerDoctorRaw = await db
    .select({
      _id: appointments.doctorId,
      doctorName: doctors.name,
      count: sql<number>`count(*)`,
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .groupBy(appointments.doctorId, doctors.name)
    .orderBy(desc(sql`count(*)`));

  const appointmentsPerDoctor = apptsPerDoctorRaw.map((row) => ({
    _id: row._id,
    doctorName: row.doctorName || 'Unknown Doctor',
    count: row.count,
  }));

  // 3. Appointments by status
  const apptsByStatusRaw = await db
    .select({
      status: appointments.status,
      count: sql<number>`count(*)`,
    })
    .from(appointments)
    .groupBy(appointments.status);

  const appointmentsByStatus = apptsByStatusRaw.map((row) => ({
    status: row.status,
    count: row.count,
  }));

  // 4. Upcoming appointments count
  const [upcomingRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(
      and(
        eq(appointments.status, 'scheduled'),
        sql`${appointments.appointmentDate} >= ${todayStr}`
      )
    );
  const upcomingAppointments = upcomingRes?.count || 0;

  // 5. New user registrations
  const [newUsersRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(sql`${users.createdAt} >= ${sevenDaysAgoStr}`);
  const newUserRegistrations = newUsersRes?.count || 0;

  return c.json({
    totalAppointments,
    appointmentsPerDoctor,
    appointmentsByStatus,
    upcomingAppointments,
    newUserRegistrations,
  });
});

// GET /api/admin/users
adminRouter.get('/users', async (c) => {
  const db = drizzle(c.env.DB);
  const allUsers = await db
    .select({
      user: users,
      doctor: doctors,
    })
    .from(users)
    .leftJoin(doctors, eq(users.id, doctors.userId));

  const result = allUsers.map(({ user, doctor }) => serializeUser(user, doctor));
  return c.json(result);
});

// PUT /api/admin/users/:userId/status
adminRouter.put('/users/:userId/status', async (c) => {
  const userId = c.req.param('userId');
  const { isActive } = await c.req.json().catch(() => ({}));

  if (typeof isActive !== 'boolean') {
    return c.json({ message: 'Invalid status value provided.' }, 400);
  }

  const db = drizzle(c.env.DB);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return c.json({ message: 'User not found' }, 404);
  }

  await db.update(users).set({ isActive, updatedAt: new Date().toISOString() }).where(eq(users.id, userId));

  const [updated] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return c.json({
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully.`,
    user: serializeUser(updated),
  });
});

// PUT /api/admin/users/:userId/role
adminRouter.put('/users/:userId/role', async (c) => {
  const userId = c.req.param('userId');
  const { role } = await c.req.json().catch(() => ({}));

  if (!['patient', 'doctor', 'admin'].includes(role)) {
    return c.json({ message: 'Invalid role specified.' }, 400);
  }

  const db = drizzle(c.env.DB);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return c.json({ message: 'User not found' }, 404);
  }

  await db.update(users).set({ role, updatedAt: new Date().toISOString() }).where(eq(users.id, userId));

  const [updated] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return c.json({
    message: `User role updated to ${role} successfully.`,
    user: serializeUser(updated),
  });
});

// DELETE /api/admin/users/:userId
adminRouter.delete('/users/:userId', async (c) => {
  const userId = c.req.param('userId');
  const db = drizzle(c.env.DB);

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return c.json({ message: 'User not found' }, 404);
  }

  await db.delete(appointments).where(eq(appointments.patientUserId, userId));
  await db.delete(appointments).where(eq(appointments.doctorUserId, userId));
  await db.delete(doctors).where(eq(doctors.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  return c.json({ message: 'User and associated records deleted successfully.' });
});

// GET /api/admin/doctors
adminRouter.get('/doctors', async (c) => {
  const db = drizzle(c.env.DB);
  const docList = await db
    .select({
      doctor: doctors,
      user: users,
    })
    .from(doctors)
    .leftJoin(users, eq(doctors.userId, users.id));

  const result = docList.map(({ doctor, user }) => ({
    ...serializeDoctor(doctor),
    userId: user ? serializeUser(user) : null,
  }));

  return c.json(result);
});

// GET /api/admin/doctors/:doctorId
adminRouter.get('/doctors/:doctorId', async (c) => {
  const doctorId = c.req.param('doctorId');
  const db = drizzle(c.env.DB);

  const [doc] = await db
    .select({
      doctor: doctors,
      user: users,
    })
    .from(doctors)
    .leftJoin(users, eq(doctors.userId, users.id))
    .where(eq(doctors.id, doctorId))
    .limit(1);

  if (!doc) {
    return c.json({ message: 'Doctor not found' }, 404);
  }

  return c.json({
    ...serializeDoctor(doc.doctor),
    userId: doc.user ? serializeUser(doc.user) : null,
  });
});

// POST /api/admin/doctors
adminRouter.post('/doctors', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { userId, name, specialization, appointmentDuration } = body;

  if (!userId || !name || !specialization || !appointmentDuration) {
    return c.json(
      { message: 'Please provide userId, name, specialization, and appointmentDuration.' },
      400
    );
  }

  const db = drizzle(c.env.DB);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return c.json({ message: `User with ID ${userId} not found.` }, 404);
  }

  const [existingDoc] = await db.select().from(doctors).where(eq(doctors.userId, userId)).limit(1);
  if (existingDoc) {
    return c.json({ message: `A doctor profile already exists for user ID ${userId}.` }, 400);
  }

  const doctorId = `doc-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const standardWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const defaultAvailability = JSON.stringify(
    standardWeekdays.map((day) => ({ dayOfWeek: day, startTime: '09:00', endTime: '17:00' }))
  );

  const newDoc = {
    id: doctorId,
    userId,
    name,
    specialization,
    appointmentDuration: parseInt(appointmentDuration),
    standardAvailability: defaultAvailability,
    availabilityOverrides: '[]',
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(doctors).values(newDoc);
  await db
    .update(users)
    .set({ role: 'doctor', doctorProfileId: doctorId, updatedAt: now })
    .where(eq(users.id, userId));

  return c.json(
    {
      message: 'Doctor profile created and linked successfully.',
      doctor: {
        ...serializeDoctor(newDoc as any),
        userId: serializeUser(user),
      },
    },
    201
  );
});

// PUT /api/admin/doctors/:doctorId
adminRouter.put('/doctors/:doctorId', async (c) => {
  const doctorId = c.req.param('doctorId');
  const body = await c.req.json().catch(() => ({}));
  const { name, specialization, appointmentDuration, standardAvailability, availabilityOverrides } = body;

  const updates: Partial<typeof doctors.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };
  if (name) updates.name = name;
  if (specialization) updates.specialization = specialization;
  if (typeof appointmentDuration !== 'undefined') {
    updates.appointmentDuration = parseInt(appointmentDuration);
  }
  if (standardAvailability) {
    updates.standardAvailability = JSON.stringify(standardAvailability);
  }
  if (availabilityOverrides) {
    updates.availabilityOverrides = JSON.stringify(availabilityOverrides);
  }

  const db = drizzle(c.env.DB);
  const [doc] = await db.select().from(doctors).where(eq(doctors.id, doctorId)).limit(1);
  if (!doc) {
    return c.json({ message: 'Doctor not found' }, 404);
  }

  await db.update(doctors).set(updates).where(eq(doctors.id, doctorId));

  const [updated] = await db
    .select({
      doctor: doctors,
      user: users,
    })
    .from(doctors)
    .leftJoin(users, eq(doctors.userId, users.id))
    .where(eq(doctors.id, doctorId))
    .limit(1);

  return c.json({
    message: 'Doctor details updated successfully.',
    doctor: {
      ...serializeDoctor(updated.doctor),
      userId: updated.user ? serializeUser(updated.user) : null,
    },
  });
});

// DELETE /api/admin/doctors/:doctorId
adminRouter.delete('/doctors/:doctorId', async (c) => {
  const doctorId = c.req.param('doctorId');
  const db = drizzle(c.env.DB);

  const [doc] = await db.select().from(doctors).where(eq(doctors.id, doctorId)).limit(1);
  if (!doc) {
    return c.json({ message: 'Doctor profile not found.' }, 404);
  }

  // Cancel future scheduled appointments
  const nowStr = new Date().toISOString();
  await db
    .update(appointments)
    .set({ status: 'cancelled', updatedAt: nowStr })
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.status, 'scheduled'),
        sql`${appointments.appointmentDate} >= ${nowStr}`
      )
    );

  await db.delete(doctors).where(eq(doctors.id, doctorId));

  // Revert user role to patient
  await db
    .update(users)
    .set({ role: 'patient', doctorProfileId: null, updatedAt: nowStr })
    .where(eq(users.id, doc.userId));

  return c.json({
    message: 'Doctor profile deleted, future appointments cancelled, and user role updated successfully.',
  });
});

// GET /api/admin/appointments/all
adminRouter.get('/appointments/all', async (c) => {
  const db = drizzle(c.env.DB);
  const { patientId, doctorId, status, dateStart, dateEnd } = c.req.query();

  const allAppts = await db
    .select({
      appointment: appointments,
      doctor: doctors,
      patient: users,
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .leftJoin(users, eq(appointments.patientUserId, users.id))
    .orderBy(desc(appointments.appointmentDate), appointments.startTime);

  let filtered = allAppts;
  if (patientId) {
    filtered = filtered.filter((r) => r.appointment.patientUserId === patientId);
  }
  if (doctorId) {
    filtered = filtered.filter((r) => r.appointment.doctorId === doctorId);
  }
  if (status) {
    filtered = filtered.filter((r) => r.appointment.status === status);
  }
  if (dateStart) {
    const startDate = new Date(dateStart).toISOString().split('T')[0];
    filtered = filtered.filter(
      (r) => new Date(r.appointment.appointmentDate).toISOString().split('T')[0] >= startDate
    );
  }
  if (dateEnd) {
    const endDate = new Date(dateEnd).toISOString().split('T')[0];
    filtered = filtered.filter(
      (r) => new Date(r.appointment.appointmentDate).toISOString().split('T')[0] <= endDate
    );
  }

  const result = filtered.map(({ appointment, doctor, patient }) =>
    serializeAppointment(appointment, doctor, patient ? serializeUser(patient) : null)
  );

  return c.json(result);
});

// PUT /api/admin/appointments/:appointmentId
adminRouter.put('/appointments/:appointmentId', async (c) => {
  const appointmentId = c.req.param('appointmentId');
  const body = await c.req.json().catch(() => ({}));
  const { appointmentDate, startTime, endTime, duration, status, reason, remarks, patientPhone } = body;

  const db = drizzle(c.env.DB);
  const [existing] = await db.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
  if (!existing) {
    return c.json({ message: 'Appointment not found.' }, 404);
  }

  const updates: Partial<typeof appointments.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };
  if (appointmentDate) updates.appointmentDate = new Date(appointmentDate).toISOString();
  if (startTime) updates.startTime = startTime;
  if (endTime) updates.endTime = endTime;
  if (duration) updates.duration = parseInt(duration);
  if (status) updates.status = status;
  if (reason) updates.reason = reason;
  if (remarks !== undefined) updates.remarks = remarks;
  if (patientPhone !== undefined) updates.patientPhone = patientPhone;

  await db.update(appointments).set(updates).where(eq(appointments.id, appointmentId));

  const [updated] = await db
    .select({
      appointment: appointments,
      doctor: doctors,
      patient: users,
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .leftJoin(users, eq(appointments.patientUserId, users.id))
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  return c.json({
    message: 'Appointment updated successfully by admin.',
    appointment: serializeAppointment(updated.appointment, updated.doctor, updated.patient ? serializeUser(updated.patient) : null),
  });
});

// DELETE /api/admin/appointments/:appointmentId
adminRouter.delete('/appointments/:appointmentId', async (c) => {
  const appointmentId = c.req.param('appointmentId');
  const db = drizzle(c.env.DB);

  const [existing] = await db.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
  if (!existing) {
    return c.json({ message: 'Appointment not found.' }, 404);
  }

  await db.delete(appointments).where(eq(appointments.id, appointmentId));
  return c.json({ message: `Appointment ${appointmentId} deleted successfully by admin.` });
});
