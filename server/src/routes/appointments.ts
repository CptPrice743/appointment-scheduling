import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc } from 'drizzle-orm';
import { appointments, doctors, users } from '../db/schema';
import { AppEnv, protect } from '../middleware/auth';
import { timeToMinutes, getDayOfWeekString } from '../utils/timeUtils';
import { serializeAppointment } from '../utils/serializers';
import { ensureFreshDemoData } from '../db/seed';

export const appointmentRouter = new Hono<AppEnv>();

// GET /api/appointments/my-appointments
appointmentRouter.get('/my-appointments', protect, async (c) => {
  const user = c.get('user');
  if (user.role !== 'patient') {
    return c.json({ message: 'Access denied. Patients only.' }, 403);
  }

  if (user.id === 'user-pat-john') {
    await ensureFreshDemoData(c.env.DB);
  }

  const db = drizzle(c.env.DB);
  const patientAppts = await db
    .select({
      appointment: appointments,
      doctor: {
        id: doctors.id,
        name: doctors.name,
        specialization: doctors.specialization,
      },
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .where(eq(appointments.patientUserId, user.id))
    .orderBy(desc(appointments.appointmentDate), desc(appointments.startTime));

  const result = patientAppts.map(({ appointment, doctor }) =>
    serializeAppointment(appointment, doctor)
  );

  return c.json(result);
});

// POST /api/appointments (Patient booking)
appointmentRouter.post('/', protect, async (c) => {
  const user = c.get('user');
  if (user.role !== 'patient') {
    return c.json({ message: 'Only patients can book appointments.' }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const { doctorId, appointmentDate, startTime, reason, patientPhone } = body;

  if (!doctorId || !appointmentDate || !startTime || !reason) {
    return c.json(
      { message: 'Missing required fields (Doctor, Date, Start Time, Reason).' },
      400
    );
  }

  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    return c.json({ message: 'Invalid start time format (HH:MM).' }, 400);
  }

  const requestedDate = new Date(appointmentDate + 'T00:00:00Z');
  if (isNaN(requestedDate.getTime())) {
    return c.json({ message: 'Invalid appointment date provided.' }, 400);
  }
  const dateString = requestedDate.toISOString().split('T')[0];
  const formattedISODate = new Date(Date.UTC(
    requestedDate.getUTCFullYear(),
    requestedDate.getUTCMonth(),
    requestedDate.getUTCDate()
  )).toISOString();

  const db = drizzle(c.env.DB);
  const [doctor] = await db.select().from(doctors).where(eq(doctors.id, doctorId)).limit(1);

  if (!doctor) {
    return c.json({ message: 'Doctor not found.' }, 404);
  }

  // Parse availability rules and overrides
  const standardAvailability: any[] = JSON.parse(doctor.standardAvailability || '[]');
  const availabilityOverrides: any[] = JSON.parse(doctor.availabilityOverrides || '[]');

  // Availability checking
  let availableStartTime: string | null = null;
  let availableEndTime: string | null = null;
  let isWorking = false;

  const override = availabilityOverrides.find(
    (ov) => new Date(ov.date).toISOString().split('T')[0] === dateString
  );

  const doctorDisplayName = doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;

  if (override) {
    if (!override.isWorking) {
      return c.json({ message: `${doctorDisplayName} is not available on this date.` }, 400);
    }
    isWorking = true;
    availableStartTime = override.startTime;
    availableEndTime = override.endTime;
  } else {
    const dayOfWeek = getDayOfWeekString(requestedDate.getUTCDay());
    const rule = standardAvailability.find((s) => s.dayOfWeek === dayOfWeek);
    if (!rule) {
      return c.json({ message: `${doctorDisplayName} is not available on ${dayOfWeek}s.` }, 400);
    }
    isWorking = true;
    availableStartTime = rule.startTime;
    availableEndTime = rule.endTime;
  }

  if (!isWorking || !availableStartTime || !availableEndTime) {
    return c.json({ message: `${doctorDisplayName} is not taking appointments at this time.` }, 400);
  }

  const requestedStartMinutes = timeToMinutes(startTime);
  const availableStartMinutes = timeToMinutes(availableStartTime);
  const availableEndMinutes = timeToMinutes(availableEndTime);
  const duration = doctor.appointmentDuration;
  const requestedEndMinutes = requestedStartMinutes + duration;

  if (
    requestedStartMinutes < availableStartMinutes ||
    requestedEndMinutes > availableEndMinutes
  ) {
    return c.json(
      {
        message: `Requested time ${startTime} is outside ${doctorDisplayName}'s available hours (${availableStartTime} - ${availableEndTime}).`,
      },
      400
    );
  }

  // --- CLASH / OVERLAP DETECTION ---
  const existingAppts = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.status, 'scheduled')
      )
    );

  // Filter for matching date in UTC
  const apptsOnDate = existingAppts.filter(
    (a) => new Date(a.appointmentDate).toISOString().split('T')[0] === dateString
  );

  const calculatedEndTime = `${String(Math.floor(requestedEndMinutes / 60)).padStart(2, '0')}:${String(
    requestedEndMinutes % 60
  ).padStart(2, '0')}`;

  for (const existing of apptsOnDate) {
    const existingStartMinutes = timeToMinutes(existing.startTime);
    const existingEndMinutes = timeToMinutes(existing.endTime);
    // Overlap condition: (NewStart < ExistEnd) && (NewEnd > ExistStart)
    if (
      requestedStartMinutes < existingEndMinutes &&
      requestedEndMinutes > existingStartMinutes
    ) {
      console.log(
        `Clash found: ${startTime}-${calculatedEndTime} overlaps with existing ${existing.startTime}-${existing.endTime}`
      );
      return c.json(
        {
          message: `Time slot ${startTime} is already booked for ${doctorDisplayName} on this date.`,
        },
        400
      );
    }
  }

  const apptId = `appt-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const newAppointment = {
    id: apptId,
    patientUserId: user.id,
    patientName: user.name,
    patientPhone: patientPhone || '',
    doctorId: doctor.id,
    doctorUserId: doctor.userId,
    appointmentDate: formattedISODate,
    startTime,
    endTime: calculatedEndTime,
    duration,
    reason,
    status: 'scheduled' as const,
    remarks: '',
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(appointments).values(newAppointment);

  const populated = serializeAppointment(newAppointment, doctor, {
    id: user.id,
    name: user.name,
    email: user.email,
  });

  return c.json(populated, 201);
});

// GET /api/appointments/:id
appointmentRouter.get('/:id', protect, async (c) => {
  const user = c.get('user');
  const apptId = c.req.param('id');
  if (!apptId) {
    return c.json({ message: 'Appointment ID is required' }, 400);
  }
  const db = drizzle(c.env.DB);

  const [record] = await db
    .select({
      appointment: appointments,
      doctor: doctors,
      patient: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .leftJoin(users, eq(appointments.patientUserId, users.id))
    .where(eq(appointments.id, apptId))
    .limit(1);

  if (!record) {
    return c.json({ message: 'Appointment not found' }, 404);
  }

  const isPatientOwner = user.id === record.appointment.patientUserId;
  const isDoctorOwner = user.id === record.appointment.doctorUserId;
  const isAdminUser = user.role === 'admin';

  if (!isPatientOwner && !isDoctorOwner && !isAdminUser) {
    return c.json({ message: 'Not authorized to view this appointment' }, 403);
  }

  return c.json(serializeAppointment(record.appointment, record.doctor, record.patient));
});

// PATCH /api/appointments/:id
appointmentRouter.patch('/:id', protect, async (c) => {
  const user = c.get('user');
  const apptId = c.req.param('id');
  if (!apptId) {
    return c.json({ message: 'Appointment ID is required' }, 400);
  }
  const body = await c.req.json().catch(() => ({}));
  const { appointmentDate, startTime, reason, status, remarks } = body;

  const db = drizzle(c.env.DB);
  const [record] = await db
    .select({
      appointment: appointments,
      doctor: doctors,
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .where(eq(appointments.id, apptId))
    .limit(1);

  if (!record) {
    return c.json({ message: 'Appointment not found' }, 404);
  }

  const appt = record.appointment;
  const doctor = record.doctor;
  const isPatientOwner = user.id === appt.patientUserId;
  const isDoctorOwner = user.id === appt.doctorUserId;
  const isAdminUser = user.role === 'admin';

  if (!isPatientOwner && !isDoctorOwner && !isAdminUser) {
    return c.json({ message: 'Not authorized to update this appointment.' }, 403);
  }

  const updates: Partial<typeof appointments.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };

  // Date / Time / Reason Reschedule (allowed if currently scheduled)
  let requiresConflictCheck = false;
  let checkDate = appt.appointmentDate;
  let checkStartTime = appt.startTime;
  const duration = doctor?.appointmentDuration || appt.duration;

  if (appt.status === 'scheduled') {
    if (appointmentDate) {
      const dateObj = new Date(appointmentDate + 'T00:00:00Z');
      if (isNaN(dateObj.getTime())) {
        return c.json({ message: 'Invalid appointment date provided.' }, 400);
      }
      checkDate = new Date(Date.UTC(
        dateObj.getUTCFullYear(),
        dateObj.getUTCMonth(),
        dateObj.getUTCDate()
      )).toISOString();
      updates.appointmentDate = checkDate;
      requiresConflictCheck = true;
    }
    if (startTime) {
      if (!/^\d{2}:\d{2}$/.test(startTime)) {
        return c.json({ message: 'Invalid start time format (HH:MM).' }, 400);
      }
      checkStartTime = startTime;
      updates.startTime = startTime;
      requiresConflictCheck = true;
    }
    if (reason !== undefined) {
      updates.reason = reason;
    }
  } else if (
    appointmentDate ||
    startTime ||
    (reason !== undefined && reason !== appt.reason)
  ) {
    if (appointmentDate || startTime || Object.keys(body).length > 1) {
      return c.json(
        {
          message: `Cannot change date, time, or reason for appointments with status '${appt.status}'.`,
        },
        400
      );
    }
    if (reason !== undefined) updates.reason = reason;
  }

  // Status & Remarks handling
  if (isDoctorOwner || isAdminUser) {
    if (status) {
      if (!['completed', 'cancelled', 'scheduled', 'noshow'].includes(status)) {
        return c.json({ message: 'Invalid status value.' }, 400);
      }
      updates.status = status;
      if (status === 'scheduled' && (updates.appointmentDate || updates.startTime)) {
        requiresConflictCheck = true;
      }
    }
    if (remarks !== undefined) {
      updates.remarks = remarks;
    }
    if (updates.status === 'completed' || (status === 'completed' && !updates.status)) {
      const finalRemarks = updates.remarks !== undefined ? updates.remarks : appt.remarks;
      if (!finalRemarks || finalRemarks.trim() === '') {
        return c.json(
          { message: 'Remarks are required to mark an appointment as completed.' },
          400
        );
      }
    }
  } else if (isPatientOwner) {
    if (status && status !== 'cancelled') {
      return c.json({ message: 'Patients can only cancel appointments.' }, 403);
    }
    if (status === 'cancelled') {
      if (appt.status !== 'scheduled') {
        return c.json({ message: 'Only scheduled appointments can be cancelled.' }, 400);
      }
      updates.status = 'cancelled';
      requiresConflictCheck = false;
    }
    if (remarks !== undefined) {
      return c.json({ message: 'Patients cannot update remarks.' }, 403);
    }
  }

  // Conflict check if rescheduling
  const finalStatus = updates.status || appt.status;
  if (requiresConflictCheck && finalStatus === 'scheduled') {
    const startMinutes = timeToMinutes(checkStartTime);
    const endMinutes = startMinutes + duration;
    const checkEndTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(
      endMinutes % 60
    ).padStart(2, '0')}`;
    updates.endTime = checkEndTime;

    const checkDateString = new Date(checkDate).toISOString().split('T')[0];
    const existing = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, appt.doctorId),
          eq(appointments.status, 'scheduled')
        )
      );

    const onDate = existing.filter(
      (a) =>
        a.id !== appt.id &&
        new Date(a.appointmentDate).toISOString().split('T')[0] === checkDateString
    );

    for (const ex of onDate) {
      const exStart = timeToMinutes(ex.startTime);
      const exEnd = timeToMinutes(ex.endTime);
      if (startMinutes < exEnd && endMinutes > exStart) {
        return c.json(
          {
            message: `Time conflict: Dr. ${doctor?.name} is already booked at the new requested time.`,
          },
          400
        );
      }
    }
  } else if (updates.startTime && !requiresConflictCheck) {
    const startMinutes = timeToMinutes(updates.startTime);
    const endMinutes = startMinutes + duration;
    updates.endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(
      endMinutes % 60
    ).padStart(2, '0')}`;
  }

  await db.update(appointments).set(updates).where(eq(appointments.id, appt.id));

  const [updatedRecord] = await db
    .select({
      appointment: appointments,
      doctor: doctors,
      patient: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .leftJoin(users, eq(appointments.patientUserId, users.id))
    .where(eq(appointments.id, appt.id))
    .limit(1);

  return c.json(
    serializeAppointment(
      updatedRecord.appointment,
      updatedRecord.doctor,
      updatedRecord.patient
    )
  );
});

// DELETE /api/appointments/:id
appointmentRouter.delete('/:id', protect, async (c) => {
  return c.json(
    { message: 'Deletion not allowed. Cancel instead using PATCH.' },
    405
  );
});
