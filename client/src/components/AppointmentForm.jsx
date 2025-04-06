import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const AppointmentForm = () => {
  const location = useLocation();
  const appointment = location.state?.appointment;
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [formData, setFormData] = useState(appointment ? {
    patientName: appointment.patientName,
    patientEmail: appointment.patientEmail,
    patientPhone: appointment.patientPhone,
    doctorName: appointment.doctorName,
    appointmentDate: appointment.appointmentDate.split('T')[0],
    appointmentTime: appointment.appointmentTime,
    reason: appointment.reason,
    status: appointment.status
  } : {
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
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
    setSubmitMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitMessage('');

    try {
      if (appointment) {
        await axios.patch(`http://localhost:8000/api/appointments/${appointment._id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSubmitMessage('Appointment updated successfully!');
      } else {
        await axios.post('http://localhost:8000/api/appointments', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSubmitMessage('Appointment scheduled successfully!');
      }
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
    } catch (err) {
      console.error('Error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Error scheduling appointment. Please try again.');
      }
    }
  };

  return (
    <div className="appointment-form-container">
      <h2>{appointment ? 'Edit Appointment' : 'Schedule New Appointment'}</h2>

      {submitMessage && (
        <div className="message success">
          {submitMessage}
        </div>
      )}

      {errorMessage && (
        <div className="message error">
          {errorMessage}
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

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button type="submit" className="submit-btn">
          {appointment ? 'Update Appointment' : 'Schedule Appointment'}
        </button>
      </form>
    </div>
  );
};

export default AppointmentForm;
