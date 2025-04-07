import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/appointments', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAppointments(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setLoading(false);
      }
    };
  
    if (token) {
      fetchAppointments();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await axios.patch(`http://localhost:8000/api/appointments/${id}`, { status: 'cancelled' }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const res = await axios.get('http://localhost:8000/api/appointments', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAppointments(res.data);
      } catch (err) {
        console.error('Error cancelling appointment:', err);
      }
    }
  };

  const handleEdit = (appointment) => {
    navigate(`/edit/${appointment._id}`, { state: { appointment } });
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime12Hour = (timeStr) => {
    const [hour, minute] = timeStr.split(':');
    const date = new Date();
    date.setHours(+hour);
    date.setMinutes(+minute);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  

  const scheduledAppointments = appointments.filter(apt => apt.status === 'scheduled');
  const otherAppointments = appointments.filter(apt => apt.status !== 'scheduled');

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }



  return (
    <div className="appointment-list">
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', marginTop: '10px', color: '#2c3e50' }}>
        Welcome, {user?.name}!
      </h1>
      <h2>Scheduled Appointments</h2>
      {scheduledAppointments.length === 0 ? (
        <p>No appointments scheduled yet.</p>
      ) : (
        <div className="appointment-cards">
          {scheduledAppointments.map(appointment => (
            <div key={appointment._id} className="appointment-card">
              <div className={`status-badge ${appointment.status}`}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </div>
              <h3>{appointment.patientName}</h3>
              <p><strong>Doctor:</strong> {appointment.doctorName}</p>
              <p><strong>Date:</strong> {formatDate(appointment.appointmentDate)}</p>
              <p><strong>Time:</strong> {formatTime12Hour(appointment.appointmentTime)}</p>
              <p><strong>Reason:</strong> {appointment.reason}</p>
              <p><strong>Email:</strong> {appointment.patientEmail}</p>
              <p><strong>Phone:</strong> {appointment.patientPhone}</p>
              <div className="appointment-actions">
                <button className="status-badge edit" onClick={() => handleEdit(appointment)}>Edit</button>
                <button className="status-badge cancel" onClick={() => handleCancel(appointment._id)}>Cancel</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2>History</h2>
      {otherAppointments.length === 0 ? (
        <p>No completed or cancelled appointments.</p>
      ) : (
        <div className="appointment-cards">
          {otherAppointments.map(appointment => (
            <div key={appointment._id} className="appointment-card">
              <div className={`status-badge ${appointment.status}`}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </div>
              <h3>{appointment.patientName}</h3>
              <p><strong>Doctor:</strong> {appointment.doctorName}</p>
              <p><strong>Date:</strong> {formatDate(appointment.appointmentDate)}</p>
              <p><strong>Time:</strong> {formatTime12Hour(appointment.appointmentTime)}</p>
              <p><strong>Reason:</strong> {appointment.reason}</p>
              <p><strong>Email:</strong> {appointment.patientEmail}</p>
              <p><strong>Phone:</strong> {appointment.patientPhone}</p>
              <div className="appointment-actions">
                <button className="status-badge edit" onClick={() => handleEdit(appointment)}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
