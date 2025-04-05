import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/appointments');
        setAppointments(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div className="appointment-list">
      <h2>Scheduled Appointments</h2>
      {appointments.length === 0 ? (
        <p>No appointments scheduled yet.</p>
      ) : (
        <div className="appointment-cards">
          {appointments.map(appointment => (
            <div key={appointment._id} className="appointment-card">
              <div className={`status-badge ${appointment.status}`}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </div>
              <h3>{appointment.patientName}</h3>
              <p><strong>Doctor:</strong> {appointment.doctorName}</p>
              <p><strong>Date:</strong> {formatDate(appointment.appointmentDate)}</p>
              <p><strong>Time:</strong> {appointment.appointmentTime}</p>
              <p><strong>Reason:</strong> {appointment.reason}</p>
              <p><strong>Contact:</strong> {appointment.patientEmail}, {appointment.patientPhone}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;