require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/appointment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/appointment_scheduling';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    const saltRounds = parseInt(process.env.SALT_ROUNDS || '10');

    // 1. Admin User
    let admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('adminpassword123', saltRounds);
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      });
      console.log('Created Admin: admin@example.com');
    }

    const standardWeekdays = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
    ];

    // Helper to create or find Doctor
    async function upsertDoctor(name, email, password, specialization, duration, startTime = '09:00', endTime = '17:00') {
      let user = await User.findOne({ email });
      let doctorProfile = null;
      if (!user) {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const doctorId = new mongoose.Types.ObjectId();
        const availability = standardWeekdays.map(day => ({
          dayOfWeek: day,
          startTime,
          endTime,
        }));

        doctorProfile = await Doctor.create({
          _id: doctorId,
          userId: new mongoose.Types.ObjectId(),
          name,
          specialization,
          appointmentDuration: duration,
          standardAvailability: availability,
          availabilityOverrides: [],
        });

        user = await User.create({
          _id: doctorProfile.userId,
          name,
          email,
          password: hashedPassword,
          role: 'doctor',
          doctorProfile: doctorProfile._id,
          isActive: true,
        });
        console.log(`Created Doctor: ${name} (${email})`);
      } else {
        doctorProfile = await Doctor.findById(user.doctorProfile);
      }
      return { user, profile: doctorProfile };
    }

    // Helper to create or find Patient
    async function upsertPatient(name, email, password = 'patientpassword123') {
      let user = await User.findOne({ email });
      if (!user) {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        user = await User.create({
          name,
          email,
          password: hashedPassword,
          role: 'patient',
          isActive: true,
        });
        console.log(`Created Patient: ${name} (${email})`);
      }
      return user;
    }

    // --- Create Doctors ---
    const drSarah = await upsertDoctor(
      'Dr. Sarah Connor',
      'doctor.sarah@example.com',
      'doctorpassword123',
      'Cardiologist',
      30,
      '09:00',
      '17:00'
    );

    const drHouse = await upsertDoctor(
      'Dr. Gregory House',
      'doctor.house@example.com',
      'doctorpassword123',
      'Diagnostic Medicine',
      45,
      '10:00',
      '18:00'
    );

    const drCuddy = await upsertDoctor(
      'Dr. Lisa Cuddy',
      'doctor.cuddy@example.com',
      'doctorpassword123',
      'Endocrinology',
      30,
      '08:30',
      '16:30'
    );

    const drWilson = await upsertDoctor(
      'Dr. James Wilson',
      'doctor.wilson@example.com',
      'doctorpassword123',
      'Oncology',
      45,
      '09:30',
      '17:30'
    );

    // --- Create Patients ---
    const pJohn = await upsertPatient('John Doe', 'patient.john@example.com');
    const pJane = await upsertPatient('Jane Smith', 'patient.jane@example.com');
    const pRobert = await upsertPatient('Robert Miller', 'patient.robert@example.com');
    const pEmily = await upsertPatient('Emily Davis', 'patient.emily@example.com');
    const pMichael = await upsertPatient('Michael Chen', 'patient.michael@example.com');
    const pSarahJ = await upsertPatient('Sarah Jenkins', 'patient.sarah@example.com');

    // Remove old appointments to populate a fresh, comprehensive, full dashboard dataset
    await Appointment.deleteMany({});
    console.log('Cleared old appointments for fresh population.');

    // Helper for relative dates
    const today = new Date();
    const getDateRel = (daysOffset) => {
      const d = new Date(today);
      d.setDate(today.getDate() + daysOffset);
      return d;
    };

    const appointmentsData = [
      // === PATIENT: JOHN DOE (Multiple upcoming & past entries across doctors) ===
      {
        patientName: pJohn.name,
        patientUserId: pJohn._id,
        doctorUserId: drSarah.user._id,
        doctorId: drSarah.profile._id,
        patientPhone: '555-0101',
        appointmentDate: getDateRel(1), // Tomorrow
        startTime: '10:00',
        endTime: '10:30',
        duration: 30,
        reason: 'Routine cardiac checkup & blood pressure review',
        status: 'scheduled',
        remarks: 'Patient requested morning slot. Fasting blood work scheduled.'
      },
      {
        patientName: pJohn.name,
        patientUserId: pJohn._id,
        doctorUserId: drSarah.user._id,
        doctorId: drSarah.profile._id,
        patientPhone: '555-0101',
        appointmentDate: getDateRel(4),
        startTime: '14:30',
        endTime: '15:00',
        duration: 30,
        reason: 'Echocardiogram follow-up consultation',
        status: 'scheduled',
        remarks: 'Reviewing sonogram results.'
      },
      {
        patientName: pJohn.name,
        patientUserId: pJohn._id,
        doctorUserId: drHouse.user._id,
        doctorId: drHouse.profile._id,
        patientPhone: '555-0101',
        appointmentDate: getDateRel(8),
        startTime: '11:00',
        endTime: '11:45',
        duration: 45,
        reason: 'Chronic fatigue differential diagnostic panel',
        status: 'scheduled',
        remarks: 'Second opinion requested by primary care.'
      },
      {
        patientName: pJohn.name,
        patientUserId: pJohn._id,
        doctorUserId: drHouse.user._id,
        doctorId: drHouse.profile._id,
        patientPhone: '555-0101',
        appointmentDate: getDateRel(-1), // Yesterday
        startTime: '11:00',
        endTime: '11:45',
        duration: 45,
        reason: 'Investigation of recurring dizziness',
        status: 'completed',
        remarks: 'Symptoms resolved; advised staying hydrated and follow-up in 1 month.'
      },
      {
        patientName: pJohn.name,
        patientUserId: pJohn._id,
        doctorUserId: drCuddy.user._id,
        doctorId: drCuddy.profile._id,
        patientPhone: '555-0101',
        appointmentDate: getDateRel(-5),
        startTime: '09:00',
        endTime: '09:30',
        duration: 30,
        reason: 'Metabolic panel and HbA1c evaluation',
        status: 'completed',
        remarks: 'Blood sugar within optimal target ranges.'
      },
      {
        patientName: pJohn.name,
        patientUserId: pJohn._id,
        doctorUserId: drSarah.user._id,
        doctorId: drSarah.profile._id,
        patientPhone: '555-0101',
        appointmentDate: getDateRel(-12),
        startTime: '15:00',
        endTime: '15:30',
        duration: 30,
        reason: 'Treadmill stress test discussion',
        status: 'cancelled',
        remarks: 'Cancelled by patient due to business trip.'
      },

      // === PATIENT: JANE SMITH (Multiple upcoming & past entries) ===
      {
        patientName: pJane.name,
        patientUserId: pJane._id,
        doctorUserId: drHouse.user._id,
        doctorId: drHouse.profile._id,
        patientPhone: '555-0102',
        appointmentDate: getDateRel(2),
        startTime: '14:00',
        endTime: '14:45',
        duration: 45,
        reason: 'Differential diagnosis for persistent joint pain',
        status: 'scheduled',
        remarks: 'Patient bringing previous MRI and rheumatoid factor labs.'
      },
      {
        patientName: pJane.name,
        patientUserId: pJane._id,
        doctorUserId: drCuddy.user._id,
        doctorId: drCuddy.profile._id,
        patientPhone: '555-0102',
        appointmentDate: getDateRel(5),
        startTime: '10:30',
        endTime: '11:00',
        duration: 30,
        reason: 'Thyroid hormone adjustment consultation',
        status: 'scheduled',
        remarks: 'TSH slightly elevated on recent test.'
      },
      {
        patientName: pJane.name,
        patientUserId: pJane._id,
        doctorUserId: drWilson.user._id,
        doctorId: drWilson.profile._id,
        patientPhone: '555-0102',
        appointmentDate: getDateRel(9),
        startTime: '15:00',
        endTime: '15:45',
        duration: 45,
        reason: 'Preventative genetic screening review',
        status: 'scheduled',
        remarks: 'Family history consultation.'
      },
      {
        patientName: pJane.name,
        patientUserId: pJane._id,
        doctorUserId: drSarah.user._id,
        doctorId: drSarah.profile._id,
        patientPhone: '555-0102',
        appointmentDate: getDateRel(-2),
        startTime: '11:30',
        endTime: '12:00',
        duration: 30,
        reason: 'Follow-up ECG consultation',
        status: 'completed',
        remarks: 'Normal sinus rhythm confirmed. No abnormalities noted.'
      },
      {
        patientName: pJane.name,
        patientUserId: pJane._id,
        doctorUserId: drCuddy.user._id,
        doctorId: drCuddy.profile._id,
        patientPhone: '555-0102',
        appointmentDate: getDateRel(-7),
        startTime: '13:30',
        endTime: '14:00',
        duration: 30,
        reason: 'Quarterly endocrine assessment',
        status: 'completed',
        remarks: 'Adjusted levothyroxine dosage slightly.'
      },
      {
        patientName: pJane.name,
        patientUserId: pJane._id,
        doctorUserId: drHouse.user._id,
        doctorId: drHouse.profile._id,
        patientPhone: '555-0102',
        appointmentDate: getDateRel(-14),
        startTime: '16:00',
        endTime: '16:45',
        duration: 45,
        reason: 'Unexplained rash and localized edema',
        status: 'completed',
        remarks: 'Identified contact dermatitis; prescribed topical hydrocortisone.'
      },

      // === PATIENT: ROBERT MILLER ===
      {
        patientName: pRobert.name,
        patientUserId: pRobert._id,
        doctorUserId: drSarah.user._id,
        doctorId: drSarah.profile._id,
        patientPhone: '555-0103',
        appointmentDate: getDateRel(1),
        startTime: '11:30',
        endTime: '12:00',
        duration: 30,
        reason: 'Post-stent placement 6-month evaluation',
        status: 'scheduled',
        remarks: 'Check arterial blood pressures and anticoagulant compliance.'
      },
      {
        patientName: pRobert.name,
        patientUserId: pRobert._id,
        doctorUserId: drWilson.user._id,
        doctorId: drWilson.profile._id,
        patientPhone: '555-0103',
        appointmentDate: getDateRel(3),
        startTime: '10:15',
        endTime: '11:00',
        duration: 45,
        reason: 'Routine annual wellness and chest radiography review',
        status: 'scheduled',
        remarks: 'No active symptoms reported.'
      },
      {
        patientName: pRobert.name,
        patientUserId: pRobert._id,
        doctorUserId: drCuddy.user._id,
        doctorId: drCuddy.profile._id,
        patientPhone: '555-0103',
        appointmentDate: getDateRel(-3),
        startTime: '14:00',
        endTime: '14:30',
        duration: 30,
        reason: 'Type 2 diabetes insulin sensitivity check',
        status: 'completed',
        remarks: 'Dietary counseling provided. Schedule quarterly check.'
      },
      {
        patientName: pRobert.name,
        patientUserId: pRobert._id,
        doctorUserId: drHouse.user._id,
        doctorId: drHouse.profile._id,
        patientPhone: '555-0103',
        appointmentDate: getDateRel(-9),
        startTime: '10:30',
        endTime: '11:15',
        duration: 45,
        reason: 'Severe intermittent migraines with aura',
        status: 'completed',
        remarks: 'Prescribed sumatriptan. Neuro consult pending if recurring.'
      },

      // === PATIENT: EMILY DAVIS ===
      {
        patientName: pEmily.name,
        patientUserId: pEmily._id,
        doctorUserId: drSarah.user._id,
        doctorId: drSarah.profile._id,
        patientPhone: '555-0104',
        appointmentDate: getDateRel(2),
        startTime: '09:30',
        endTime: '10:00',
        duration: 30,
        reason: 'Palpitations after intense cardio exercises',
        status: 'scheduled',
        remarks: 'Patient requested Holter monitor test.'
      },
      {
        patientName: pEmily.name,
        patientUserId: pEmily._id,
        doctorUserId: drCuddy.user._id,
        doctorId: drCuddy.profile._id,
        patientPhone: '555-0104',
        appointmentDate: getDateRel(6),
        startTime: '11:30',
        endTime: '12:00',
        duration: 30,
        reason: 'Polycystic ovary syndrome (PCOS) hormone management',
        status: 'scheduled',
        remarks: 'Reviewing recent ultrasound scan.'
      },
      {
        patientName: pEmily.name,
        patientUserId: pEmily._id,
        doctorUserId: drHouse.user._id,
        doctorId: drHouse.profile._id,
        patientPhone: '555-0104',
        appointmentDate: getDateRel(-4),
        startTime: '15:00',
        endTime: '15:45',
        duration: 45,
        reason: 'Chronic sleep disturbance & night sweats',
        status: 'completed',
        remarks: 'Sleep study ordered. Initial blood labs benign.'
      },
      {
        patientName: pEmily.name,
        patientUserId: pEmily._id,
        doctorUserId: drSarah.user._id,
        doctorId: drSarah.profile._id,
        patientPhone: '555-0104',
        appointmentDate: getDateRel(-10),
        startTime: '16:00',
        endTime: '16:30',
        duration: 30,
        reason: 'Resting bradycardia inquiry',
        status: 'cancelled',
        remarks: 'Patient rescheduled due to personal conflict.'
      },

      // === PATIENT: MICHAEL CHEN ===
      {
        patientName: pMichael.name,
        patientUserId: pMichael._id,
        doctorUserId: drWilson.user._id,
        doctorId: drWilson.profile._id,
        patientPhone: '555-0105',
        appointmentDate: getDateRel(1),
        startTime: '13:00',
        endTime: '13:45',
        duration: 45,
        reason: 'Post-chemotherapy 1-year remission milestone check',
        status: 'scheduled',
        remarks: 'Full oncology surveillance protocol.'
      },
      {
        patientName: pMichael.name,
        patientUserId: pMichael._id,
        doctorUserId: drHouse.user._id,
        doctorId: drHouse.profile._id,
        patientPhone: '555-0105',
        appointmentDate: getDateRel(5),
        startTime: '14:15',
        endTime: '15:00',
        duration: 45,
        reason: 'Peripheral neuropathy symptoms in lower extremities',
        status: 'scheduled',
        remarks: 'Electromyography results ready for discussion.'
      },
      {
        patientName: pMichael.name,
        patientUserId: pMichael._id,
        doctorUserId: drSarah.user._id,
        doctorId: drSarah.profile._id,
        patientPhone: '555-0105',
        appointmentDate: getDateRel(-6),
        startTime: '10:30',
        endTime: '11:00',
        duration: 30,
        reason: 'Hypertension medication tolerance review',
        status: 'completed',
        remarks: 'Switched from lisinopril to amlodipine. BP stable at 124/82.'
      },
      {
        patientName: pMichael.name,
        patientUserId: pMichael._id,
        doctorUserId: drCuddy.user._id,
        doctorId: drCuddy.profile._id,
        patientPhone: '555-0105',
        appointmentDate: getDateRel(-15),
        startTime: '15:00',
        endTime: '15:30',
        duration: 30,
        reason: 'Adrenal function test workup',
        status: 'noshow',
        remarks: 'Patient failed to appear; clinic reached out to reschedule.'
      },

      // === PATIENT: SARAH JENKINS ===
      {
        patientName: pSarahJ.name,
        patientUserId: pSarahJ._id,
        doctorUserId: drCuddy.user._id,
        doctorId: drCuddy.profile._id,
        patientPhone: '555-0106',
        appointmentDate: getDateRel(3),
        startTime: '09:00',
        endTime: '09:30',
        duration: 30,
        reason: 'Gestational diabetes nutritional management',
        status: 'scheduled',
        remarks: 'First trimester follow-up.'
      },
      {
        patientName: pSarahJ.name,
        patientUserId: pSarahJ._id,
        doctorUserId: drSarah.user._id,
        doctorId: drSarah.profile._id,
        patientPhone: '555-0106',
        appointmentDate: getDateRel(7),
        startTime: '14:00',
        endTime: '14:30',
        duration: 30,
        reason: 'Shortness of breath on mild exertion',
        status: 'scheduled',
        remarks: 'Spirometry and basic cardiology evaluation requested.'
      },
      {
        patientName: pSarahJ.name,
        patientUserId: pSarahJ._id,
        doctorUserId: drWilson.user._id,
        doctorId: drWilson.profile._id,
        patientPhone: '555-0106',
        appointmentDate: getDateRel(-8),
        startTime: '11:30',
        endTime: '12:15',
        duration: 45,
        reason: 'Benign lymph node biopsy confirmation review',
        status: 'completed',
        remarks: 'Histopathology verified benign reactive lymphadenopathy.'
      },
      {
        patientName: pSarahJ.name,
        patientUserId: pSarahJ._id,
        doctorUserId: drHouse.user._id,
        doctorId: drHouse.profile._id,
        patientPhone: '555-0106',
        appointmentDate: getDateRel(-18),
        startTime: '12:00',
        endTime: '12:45',
        duration: 45,
        reason: 'Persistent unexplained fevers',
        status: 'completed',
        remarks: 'Mononucleosis serology positive. Supportive recovery outlined.'
      }
    ];

    await Appointment.insertMany(appointmentsData);
    console.log(`Successfully seeded ${appointmentsData.length} comprehensive appointments.`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedDatabase();
