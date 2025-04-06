import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppointmentList from './components/AppointmentList';
import AppointmentForm from './components/AppointmentForm';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/" element={<AppointmentList />} />
            <Route path="/add" element={<AppointmentForm />} />
            <Route path="/edit/:id" element={<AppointmentForm />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;