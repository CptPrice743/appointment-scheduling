const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment');
const { protect } = require('../middleware/authMiddleware');

// Get all appointments - modified to filter by userId if authenticated
router.get('/', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.id });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new appointment with time conflict validation - protected
router.post('/', protect, async (req, res) => {
  console.log('Received appointment data:', req.body);
  
  // Add userId to the appointment data
  const appointmentData = {
    ...req.body,
    userId: req.user.id
  };
  
  const appointment = new Appointment(appointmentData);
  
  try {
    // Parse request appointment date and time
    const reqDate = new Date(req.body.appointmentDate);
    const [hours, minutes] = req.body.appointmentTime.split(':').map(Number);
    const requestedDoctor = req.body.doctorName;
    
    // Set hours and minutes for requested appointment
    reqDate.setHours(hours, minutes, 0, 0);
    
    // Check if any SCHEDULED appointment exists for the SAME DOCTOR within one hour before/after
    const conflictingAppointments = await Appointment.find({
      status: 'scheduled',  // Only check for scheduled appointments
      doctorName: requestedDoctor, // Only check for the same doctor
      appointmentDate: {
        $gte: new Date(reqDate).setHours(0, 0, 0, 0),
        $lt: new Date(reqDate).setHours(23, 59, 59, 999)
      }
    });
    
    // Check each appointment for time conflict
    for (const existingAppt of conflictingAppointments) {
      const existingDate = new Date(existingAppt.appointmentDate);
      const [existingHours, existingMinutes] = existingAppt.appointmentTime.split(':').map(Number);
      existingDate.setHours(existingHours, existingMinutes, 0, 0);
      
      // Calculate time difference in minutes
      const timeDiff = Math.abs(existingDate - reqDate) / (1000 * 60);
      
      if (timeDiff < 60) {
        return res.status(400).json({ 
          message: `Time conflict: Dr. ${requestedDoctor.split(' ')[1]} already has a scheduled appointment within 1 hour of this time`
        });
      }
    }
    
    // If no conflicts, save the appointment
    const newAppointment = await appointment.save();
    res.status(201).json(newAppointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get appointment by ID - check ownership if authenticated
router.get('/:id', async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (appointment == null) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // If authenticated, check ownership
    if (req.user && req.user.id && appointment.userId) {
      if (appointment.userId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Not authorized to access this appointment' });
      }
    }
    
    res.appointment = appointment;
    next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}, (req, res) => {
  res.json(res.appointment);
});

// Update appointment - protected
router.patch('/:id', protect, getAppointment, async (req, res) => {
  // Check ownership
  if (res.appointment.userId && res.appointment.userId.toString() !== req.user.id.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this appointment' });
  }
  
  // Skip validation for the current appointment being updated
  const currentAppointmentId = res.appointment._id;
  
  // If status is being changed, no need for time validation
  if (req.body.status && req.body.status !== 'scheduled') {
    Object.keys(req.body).forEach(key => {
      res.appointment[key] = req.body[key];
    });
  } else if (req.body.appointmentDate || req.body.appointmentTime || req.body.doctorName) {
    // If changing time or doctor, validate conflicts
    try {
      // Use current values if not being updated
      const appointmentDate = req.body.appointmentDate || res.appointment.appointmentDate;
      const appointmentTime = req.body.appointmentTime || res.appointment.appointmentTime;
      const doctorName = req.body.doctorName || res.appointment.doctorName;
      
      // Parse date and time
      const reqDate = new Date(appointmentDate);
      const [hours, minutes] = appointmentTime.split(':').map(Number);
      
      // Set time
      reqDate.setHours(hours, minutes, 0, 0);
      
      // Find conflicting appointments
      const conflictingAppointments = await Appointment.find({
        _id: { $ne: currentAppointmentId }, // Exclude current appointment
        status: 'scheduled',
        doctorName: doctorName,
        appointmentDate: {
          $gte: new Date(reqDate).setHours(0, 0, 0, 0),
          $lt: new Date(reqDate).setHours(23, 59, 59, 999)
        }
      });
      
      // Check conflicts
      for (const existingAppt of conflictingAppointments) {
        const existingDate = new Date(existingAppt.appointmentDate);
        const [existingHours, existingMinutes] = existingAppt.appointmentTime.split(':').map(Number);
        existingDate.setHours(existingHours, existingMinutes, 0, 0);
        
        const timeDiff = Math.abs(existingDate - reqDate) / (1000 * 60);
        
        if (timeDiff < 60) {
          return res.status(400).json({ 
            message: `Time conflict: Dr. ${doctorName.split(' ')[1]} already has a scheduled appointment within 1 hour of this time`
          });
        }
      }
      
      // Update appointment fields
      Object.keys(req.body).forEach(key => {
        res.appointment[key] = req.body[key];
      });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  } else {
    // Update all other fields
    Object.keys(req.body).forEach(key => {
      res.appointment[key] = req.body[key];
    });
  }
  
  try {
    const updatedAppointment = await res.appointment.save();
    res.json(updatedAppointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete appointment - protected
router.delete('/:id', protect, getAppointment, async (req, res) => {
  // Check ownership
  if (res.appointment.userId && res.appointment.userId.toString() !== req.user.id.toString()) {
    return res.status(403).json({ message: 'Not authorized to delete this appointment' });
  }
  
  try {
    await res.appointment.deleteOne();
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware to get appointment by ID
async function getAppointment(req, res, next) {
  let appointment;
  
  try {
    appointment = await Appointment.findById(req.params.id);
    if (appointment == null) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  
  res.appointment = appointment;
  next();
}

module.exports = router;