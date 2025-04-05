import React, { useEffect, useState } from 'react';
import AppointmentList from './components/AppointmentList';
import AppointmentForm from './components/AppointmentForm';

function App() {
  const [appointments, setAppointments] = useState([]);

  // Fetch appointments from the backend API
  const fetchAppointments = () => {
    fetch('http://localhost:5000/api/appointments')
      .then((res) => res.json())
      .then((data) => setAppointments(data))
      .catch((error) => console.error('Error fetching appointments:', error));
  };

  // Load appointments when the component mounts
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Function to add a new appointment
  const addAppointment = (appointmentData) => {
    fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to schedule appointment');
        }
        return res.json();
      })
      .then((result) => {
        console.log(result.message);
        // Refresh the appointment list after adding
        fetchAppointments();
      })
      .catch((error) => console.error('Error adding appointment:', error));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Doctor Appointment Scheduling</h1>
      <AppointmentForm addAppointment={addAppointment} />
      <AppointmentList appointments={appointments} />
    </div>
  );
}

export default App;
