import React, { useState } from 'react';

function AppointmentForm({ addAppointment }) {
  // Local state for the form fields
  const [formData, setFormData] = useState({
    doctor: '',
    time: '',
    patient: '',
  });

  // Update form data on input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    addAppointment(formData);
    // Clear the form after submission
    setFormData({ doctor: '', time: '', patient: '' });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <h2>Schedule a New Appointment</h2>
      <div>
        <label>
          Doctor:
          <input
            type="text"
            name="doctor"
            value={formData.doctor}
            onChange={handleChange}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Time:
          <input
            type="text"
            name="time"
            value={formData.time}
            onChange={handleChange}
            placeholder="e.g., 2:30 PM"
            required
          />
        </label>
      </div>
      <div>
        <label>
          Patient:
          <input
            type="text"
            name="patient"
            value={formData.patient}
            onChange={handleChange}
            required
          />
        </label>
      </div>
      <button type="submit">Schedule Appointment</button>
    </form>
  );
}

export default AppointmentForm;
