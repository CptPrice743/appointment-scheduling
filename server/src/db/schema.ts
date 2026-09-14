import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['patient', 'doctor', 'admin'] }).notNull().default('patient'),
  doctorProfileId: text('doctor_profile_id'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const doctors = sqliteTable('doctors', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  specialization: text('specialization').notNull(),
  appointmentDuration: integer('appointment_duration').notNull().default(30),
  standardAvailability: text('standard_availability').notNull().default('[]'),
  availabilityOverrides: text('availability_overrides').notNull().default('[]'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(),
  patientUserId: text('patient_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  patientName: text('patient_name').notNull(),
  patientPhone: text('patient_phone').default(''),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  doctorUserId: text('doctor_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  appointmentDate: text('appointment_date').notNull(), // ISO string e.g. 2026-09-15T00:00:00.000Z
  startTime: text('start_time').notNull(), // HH:MM
  endTime: text('end_time').notNull(), // HH:MM
  duration: integer('duration').notNull(),
  reason: text('reason').notNull(),
  status: text('status', { enum: ['scheduled', 'completed', 'cancelled', 'noshow'] }).notNull().default('scheduled'),
  remarks: text('remarks').default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type User = typeof users.$inferSelect;
export type Doctor = typeof doctors.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
