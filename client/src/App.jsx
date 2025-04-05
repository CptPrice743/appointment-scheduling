// client/src/App.js
import React, { useEffect, useState } from 'react';

function App() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    // Fetch appointments from the backend API
    fetch('/api/appointments')
      .then((res) => res.json())
      .then((data) => setAppointments(data))
      .catch((error) => console.error('Error fetching appointments:', error));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Doctor Appointment Scheduling</h1>
      <h2>Appointments</h2>
      {appointments.length === 0 ? (
        <p>Loading appointments...</p>
      ) : (
        <ul>
          {appointments.map((apt) => (
            <li key={apt.id}>
              <strong>{apt.doctor}</strong> with {apt.patient} at {apt.time}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
