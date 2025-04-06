const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment');

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new appointment
router.post('/', async (req, res) => {
  console.log('Received appointment data:', req.body);
  const appointment = new Appointment(req.body);
  
  try {
    const newAppointment = await appointment.save();
    res.status(201).json(newAppointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get appointment by ID
router.get('/:id', getAppointment, (req, res) => {
  res.json(res.appointment);
});

// Update appointment
router.patch('/:id', getAppointment, async (req, res) => {
  Object.keys(req.body).forEach(key => {
    res.appointment[key] = req.body[key];
  });
  
  try {
    const updatedAppointment = await res.appointment.save();
    res.json(updatedAppointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete appointment
router.delete('/:id', getAppointment, async (req, res) => {
  try {
    await res.appointment.deleteOne();  // Change this line from remove() to deleteOne()
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