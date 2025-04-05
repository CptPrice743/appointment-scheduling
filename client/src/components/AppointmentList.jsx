import React from 'react';

function AppointmentList({ appointments }) {
  return (
    <div>
      <h2>Appointments</h2>
      {appointments.length === 0 ? (
        <p>No appointments scheduled.</p>
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

export default AppointmentList;
