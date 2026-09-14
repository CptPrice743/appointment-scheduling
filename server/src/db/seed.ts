import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users, doctors, appointments } from './schema';
import { hashSync } from 'bcrypt-ts';

export const DEMO_EMAILS = [
  'patient.john@example.com',
  'doctor.sarah@example.com',
  'admin@example.com',
];

export async function seedDatabase(d1: D1Database) {
  const db = drizzle(d1);

  // 1. Wipe existing records
  await db.delete(appointments);
  await db.delete(doctors);
  await db.delete(users);

  const now = new Date().toISOString();
  const passwordSalt = 10;

  // 2. Insert Admin
  const adminId = 'user-admin-01';
  await db.insert(users).values({
    id: adminId,
    name: 'System Admin',
    email: 'admin@example.com',
    password: hashSync('adminpassword123', passwordSalt),
    role: 'admin',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  // Standard 7-Day Demo Availability
  const standardWeekdays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const getStandardAvailability = (start = '09:00', end = '17:00') =>
    JSON.stringify(
      standardWeekdays.map((day) => ({
        dayOfWeek: day,
        startTime: start,
        endTime: end,
      }))
    );

  // 3. Insert Doctors
  const doctorData = [
    {
      userId: 'user-doc-sarah',
      doctorId: 'doc-sarah',
      name: 'Dr. Sarah Connor',
      email: 'doctor.sarah@example.com',
      password: 'doctorpassword123',
      specialization: 'Cardiology',
      duration: 30,
      startTime: '09:00',
      endTime: '17:00',
    },
    {
      userId: 'user-doc-house',
      doctorId: 'doc-house',
      name: 'Dr. Gregory House',
      email: 'doctor.house@example.com',
      password: 'doctorpassword123',
      specialization: 'Diagnostic Medicine',
      duration: 45,
      startTime: '10:00',
      endTime: '18:00',
    },
    {
      userId: 'user-doc-cuddy',
      doctorId: 'doc-cuddy',
      name: 'Dr. Lisa Cuddy',
      email: 'doctor.cuddy@example.com',
      password: 'doctorpassword123',
      specialization: 'Endocrinology',
      duration: 30,
      startTime: '08:30',
      endTime: '16:30',
    },
    {
      userId: 'user-doc-wilson',
      doctorId: 'doc-wilson',
      name: 'Dr. James Wilson',
      email: 'doctor.wilson@example.com',
      password: 'doctorpassword123',
      specialization: 'Oncology',
      duration: 45,
      startTime: '09:30',
      endTime: '17:30',
    },
  ];

  for (const doc of doctorData) {
    await db.insert(users).values({
      id: doc.userId,
      name: doc.name,
      email: doc.email,
      password: hashSync(doc.password, passwordSalt),
      role: 'doctor',
      doctorProfileId: doc.doctorId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(doctors).values({
      id: doc.doctorId,
      userId: doc.userId,
      name: doc.name,
      specialization: doc.specialization,
      appointmentDuration: doc.duration,
      standardAvailability: getStandardAvailability(doc.startTime, doc.endTime),
      availabilityOverrides: '[]',
      createdAt: now,
      updatedAt: now,
    });
  }

  // 4. Insert Patients
  const patientData = [
    { id: 'user-pat-john', name: 'John Doe', email: 'patient.john@example.com', phone: '555-0101' },
    { id: 'user-pat-jane', name: 'Jane Smith', email: 'patient.jane@example.com', phone: '555-0102' },
    { id: 'user-pat-robert', name: 'Robert Miller', email: 'patient.robert@example.com', phone: '555-0103' },
    { id: 'user-pat-emily', name: 'Emily Davis', email: 'patient.emily@example.com', phone: '555-0104' },
    { id: 'user-pat-michael', name: 'Michael Chen', email: 'patient.michael@example.com', phone: '555-0105' },
    { id: 'user-pat-sarahj', name: 'Sarah Jenkins', email: 'patient.sarah@example.com', phone: '555-0106' },
  ];

  for (const pat of patientData) {
    await db.insert(users).values({
      id: pat.id,
      name: pat.name,
      email: pat.email,
      password: hashSync('patientpassword123', passwordSalt),
      role: 'patient',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Helper for dynamic ISO dates
  const today = new Date();
  const getISODate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
  };

  // 5. Seed diverse baseline appointments
  const apptList = [
    // Today's appointments with Dr. Sarah
    {
      id: 'appt-01',
      patientUserId: 'user-pat-john',
      patientName: 'John Doe',
      patientPhone: '555-0101',
      doctorId: 'doc-sarah',
      doctorUserId: 'user-doc-sarah',
      appointmentDate: getISODate(0),
      startTime: '10:00',
      endTime: '10:30',
      duration: 30,
      reason: 'Routine cardiovascular checkup and ECG reading.',
      status: 'scheduled' as const,
      remarks: '',
    },
    {
      id: 'appt-02',
      patientUserId: 'user-pat-jane',
      patientName: 'Jane Smith',
      patientPhone: '555-0102',
      doctorId: 'doc-sarah',
      doctorUserId: 'user-doc-sarah',
      appointmentDate: getISODate(0),
      startTime: '11:00',
      endTime: '11:30',
      duration: 30,
      reason: 'Hypertension follow-up and prescription adjustment.',
      status: 'scheduled' as const,
      remarks: '',
    },
    // Tomorrow with Dr. Sarah
    {
      id: 'appt-03',
      patientUserId: 'user-pat-robert',
      patientName: 'Robert Miller',
      patientPhone: '555-0103',
      doctorId: 'doc-sarah',
      doctorUserId: 'user-doc-sarah',
      appointmentDate: getISODate(1),
      startTime: '14:00',
      endTime: '14:30',
      duration: 30,
      reason: 'Chest tightness following mild exertion.',
      status: 'scheduled' as const,
      remarks: '',
    },
    // Past completed with Dr. Sarah
    {
      id: 'appt-04',
      patientUserId: 'user-pat-john',
      patientName: 'John Doe',
      patientPhone: '555-0101',
      doctorId: 'doc-sarah',
      doctorUserId: 'user-doc-sarah',
      appointmentDate: getISODate(-3),
      startTime: '09:30',
      endTime: '10:00',
      duration: 30,
      reason: 'Annual preventive blood pressure screen.',
      status: 'completed' as const,
      remarks: 'Normal sinus rhythm. Blood pressure controlled at 118/76 mmHg. Return in 6 months.',
    },
    // Dr. House appointments
    {
      id: 'appt-05',
      patientUserId: 'user-pat-emily',
      patientName: 'Emily Davis',
      patientPhone: '555-0104',
      doctorId: 'doc-house',
      doctorUserId: 'user-doc-house',
      appointmentDate: getISODate(0),
      startTime: '14:00',
      endTime: '14:45',
      duration: 45,
      reason: 'Unexplained peripheral neuropathy and recurring low-grade fever.',
      status: 'scheduled' as const,
      remarks: '',
    },
    {
      id: 'appt-06',
      patientUserId: 'user-pat-michael',
      patientName: 'Michael Chen',
      patientPhone: '555-0105',
      doctorId: 'doc-house',
      doctorUserId: 'user-doc-house',
      appointmentDate: getISODate(-2),
      startTime: '11:00',
      endTime: '11:45',
      duration: 45,
      reason: 'Acute joint pain unresponsive to NSAIDs.',
      status: 'completed' as const,
      remarks: 'Diagnosed atypical seronegative arthritis. Started targeted biologics regimen.',
    },
    // Dr. Cuddy
    {
      id: 'appt-07',
      patientUserId: 'user-pat-sarahj',
      patientName: 'Sarah Jenkins',
      patientPhone: '555-0106',
      doctorId: 'doc-cuddy',
      doctorUserId: 'user-doc-cuddy',
      appointmentDate: getISODate(2),
      startTime: '09:00',
      endTime: '09:30',
      duration: 30,
      reason: 'Thyroid hormone adjustment after lab review.',
      status: 'scheduled' as const,
      remarks: '',
    },
  ];

  for (const appt of apptList) {
    await db.insert(appointments).values({
      ...appt,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { success: true, message: 'Database successfully seeded with demo dataset.' };
}

/**
 * Automatically ensures demo data is relative to today.
 * If the baseline appointment (appt-01) date doesn't match today's date,
 * re-rolls the dataset so that today, tomorrow, and future slots are fresh.
 */
export async function ensureFreshDemoData(d1: D1Database) {
  try {
    const db = drizzle(d1);
    const [sample] = await db
      .select({ appointmentDate: appointments.appointmentDate })
      .from(appointments)
      .where(eq(appointments.id, 'appt-01'))
      .limit(1);

    const todayISO = new Date().toISOString().split('T')[0];
    if (!sample || !sample.appointmentDate.startsWith(todayISO)) {
      console.log(`[Demo Sync] Expired or missing baseline detected. Rolling forward demo dates to ${todayISO}...`);
      await seedDatabase(d1);
    }
  } catch (err) {
    console.error('Failed to verify demo data freshness:', err);
  }
}

