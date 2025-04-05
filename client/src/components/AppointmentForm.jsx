import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AppointmentForm = () => {
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    doctorName: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    status: 'scheduled'
  });
  
  const [submitMessage, setSubmitMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('http://localhost:8000/api/appointments', formData);
      setSubmitMessage('Appointment scheduled successfully!');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error scheduling appointment:', err);
      setSubmitMessage('Error scheduling appointment. Please try again.');
    }
  };

  return (
    <div className="appointment-form-container">
      <h2>Schedule New Appointment</h2>
      {submitMessage && (
        <div className={`message ${submitMessage.includes('Error') ? 'error' : 'success'}`}>
          {submitMessage}
        </div>
      )}
      <form onSubmit={handleSubmit} className="appointment-form">
        <div className="form-group">
          <label htmlFor="patientName">Patient Name</label>
          <input
            type="text"
            id="patientName"
            name="patientName"
            value={formData.patientName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="patientEmail">Email</label>
          <input
            type="email"
            id="patientEmail"
            name="patientEmail"
            value={formData.patientEmail}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="patientPhone">Phone</label>
          <input
            type="tel"
            id="patientPhone"
            name="patientPhone"
            value={formData.patientPhone}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="doctorName">Doctor Name</label>
          <select
            id="doctorName"
            name="doctorName"
            value={formData.doctorName}
            onChange={handleChange}
            required
          >
            <option value="">Select a doctor</option>
            <option value="Dr. Smith">Dr. Smith</option>
            <option value="Dr. Johnson">Dr. Johnson</option>
            <option value="Dr. Williams">Dr. Williams</option>
            <option value="Dr. Brown">Dr. Brown</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="appointmentDate">Appointment Date</label>
          <input
            type="date"
            id="appointmentDate"
            name="appointmentDate"
            value={formData.appointmentDate}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="appointmentTime">Appointment Time</label>
          <input
            type="time"
            id="appointmentTime"
            name="appointmentTime"
            value={formData.appointmentTime}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="reason">Reason for Visit</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        
        <button type="submit" className="submit-btn">Schedule Appointment</button>
      </form>
    </div>
  );
};

export default AppointmentForm;