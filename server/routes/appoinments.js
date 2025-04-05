const express = require("express");
const router = express.Router();

let appointments = [
  { id: 1, doctor: "Dr. Smith", time: "10:00 AM", patient: "John Doe" },
  { id: 2, doctor: "Dr. Brown", time: "11:30 AM", patient: "Jane Doe" },
];

router.get("/", (req, res) => {
  res.json(appointments);
});

router.post("/", (req, res) => {
  const newAppointment = req.body;

  if (
    !newAppointment.doctor ||
    !newAppointment.time ||
    !newAppointment.patient
  ) {
    return res.status(400).json({ message: "Missing appointment details" });
  }

  //Generate id number based on the last id the array or 1 if empty
  newAppointment.id =
    appointments.length > 0 ? appointments[appointments.length - 1].id + 1 : 1;
  appointments.push(newAppointment);

  res
    .status(201)
    .json({ message: "Appointment scheduled", appointment: newAppointment });
});

module.exports = router;
