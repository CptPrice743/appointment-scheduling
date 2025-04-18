import React, { useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import "./Home.css";
import {
  Calendar,
  Clock,
  Shield,
  CheckCircle,
  Layout,
  Bell,
} from "lucide-react";

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);

  if (isAuthenticated) return null;

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>DeadLines</h1>
          <p className="hero-subtitle">Simplify your healthcare journey</p>
          <p className="hero-description">
            Book appointments with ease, get smart reminders, and manage your
            healthcare schedule in one place.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-button primary">
              Get Started
            </Link>
            <Link to="/login" className="cta-button secondary">
              Sign In
            </Link>
          </div>
        </div>
        <div className="hero-image">
          {/* Abstract shape for visual interest */}
          <div className="shape-1"></div>
          <div className="shape-2"></div>
          <div className="shape-3"></div>
        </div>
      </div>

      {/* Highlight Stats */}
      <div className="stats-section">
        <div className="stat-item">
          <span className="stat-number">98%</span>
          <span className="stat-label">Customer Satisfaction</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">50k+</span>
          <span className="stat-label">Appointments Booked</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">5k+</span>
          <span className="stat-label">Healthcare Providers</span>
        </div>
      </div>

      {/* Features Section */}
      <section className="section-heading">
        <h2>Everything you need to manage your healthcare</h2>
        <p>
          Deadlines makes healthcare scheduling simple, secure, and stress-free.
        </p>
      </section>

      <div className="features-section">
        <div className="feature-card">
          <div className="feature-icon">
            <Calendar size={24} />
          </div>
          <h3>Easy Scheduling</h3>
          <p>
            Find available slots and book appointments with your preferred
            healthcare providers in minutes.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Clock size={24} />
          </div>
          <h3>Smart Conflict Detection</h3>
          <p>
            Our intelligent system prevents double-bookings and ensures your
            schedule stays organized.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <CheckCircle size={24} />
          </div>
          <h3>Appointment Management</h3>
          <p>
            View, reschedule, or cancel appointments with just a few clicks at
            any time.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Layout size={24} />
          </div>
          <h3>Personal Dashboard</h3>
          <p>
            Access your complete appointment history and upcoming schedule in a
            clean, intuitive interface.
          </p>
        </div>
      </div>

      {/* Testimonial Section */}
      <section className="testimonials-section">
        <h2>What our users are saying</h2>
        <div className="testimonials-container">
          <div className="testimonial">
            <p>
              "Deadlines has transformed how I manage my health appointments.
              The interface is intuitive and the reminders are a lifesaver!"
            </p>
            <div className="testimonial-author">Sarah M., Patient</div>
          </div>
          <div className="testimonial">
            <p>
              "As a busy professional, I appreciate how quickly I can schedule
              appointments and receive confirmations. Excellent service!"
            </p>
            <div className="testimonial-author">Michael T., Patient</div>
          </div>
          <div className="testimonial">
            <p>
              "The conflict detection feature alone has saved me from so many
              scheduling headaches. I recommend Deadlines to everyone."
            </p>
            <div className="testimonial-author">Jessica K., Patient</div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta">
        <h2>Ready to simplify your healthcare journey?</h2>
        <p>
          Join thousands of users who are managing their healthcare appointments
          with ease.
        </p>
        <div className="cta-buttons">
          <Link to="/register" className="cta-button primary">
            Create Your Account
          </Link>
          <Link to="/login" className="cta-button secondary">
            Login
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Deadlines</h3>
            <p>Simplifying healthcare, one appointment at a time.</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Company</h4>
              <ul>
                <li>
                  <a href="#">About Us</a>
                </li>
                <li>
                  <a href="#">Our Team</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
                <li>
                  <a href="#">Contact</a>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <ul>
                <li>
                  <a href="#">Help Center</a>
                </li>
                <li>
                  <a href="#">Blog</a>
                </li>
                <li>
                  <a href="#">FAQs</a>
                </li>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Connect</h4>
              <ul>
                <li>
                  <a href="#">Twitter</a>
                </li>
                <li>
                  <a href="#">LinkedIn</a>
                </li>
                <li>
                  <a href="#">Facebook</a>
                </li>
                <li>
                  <a href="#">Instagram</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} Deadlines. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
