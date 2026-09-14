import { User, Doctor, Appointment } from '../db/schema';

export function serializeDoctor(doc: Doctor | null | undefined) {
  if (!doc) return null;
  return {
    ...doc,
    _id: doc.id,
    standardAvailability: typeof doc.standardAvailability === 'string'
      ? JSON.parse(doc.standardAvailability || '[]')
      : doc.standardAvailability || [],
    availabilityOverrides: typeof doc.availabilityOverrides === 'string'
      ? JSON.parse(doc.availabilityOverrides || '[]').map((ov: any) => ({
          ...ov,
          date: ov.date ? new Date(ov.date).toISOString() : ov.date,
        }))
      : doc.availabilityOverrides || [],
  };
}

export function serializeUser(user: User | null | undefined, doctorProfile?: Doctor | null) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return {
    ...safeUser,
    _id: safeUser.id,
    doctorProfile: doctorProfile ? serializeDoctor(doctorProfile) : null,
  };
}

export function serializeAppointment(
  appt: Appointment,
  doctor?: Doctor | { id: string; name: string; specialization?: string; appointmentDuration?: number } | null,
  patient?: { id: string; name: string; email?: string } | null
) {
  return {
    ...appt,
    _id: appt.id,
    appointmentDate: new Date(appt.appointmentDate).toISOString(),
    doctorId: doctor
      ? {
          ...doctor,
          _id: (doctor as any).id,
          ...((doctor as any).standardAvailability
            ? { standardAvailability: typeof (doctor as any).standardAvailability === 'string'
                ? JSON.parse((doctor as any).standardAvailability)
                : (doctor as any).standardAvailability }
            : {}),
        }
      : appt.doctorId,
    patientUserId: patient
      ? {
          ...patient,
          _id: patient.id,
        }
      : appt.patientUserId,
  };
}
