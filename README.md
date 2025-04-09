# Appointment Scheduling App

A full-stack web application built with the MERN stack (MongoDB, Express.js, React, Node.js) that allows users to register, log in, and schedule appointments.

## ✨ Features

* **User Authentication:**
    * Secure user registration and login system.
    * Password hashing using `bcryptjs`.
    * JWT (JSON Web Tokens) for session management and protected routes.
* **Appointment Management:**
    * Authenticated users can book new appointments with details like date, time, and description.
    * Users can view a list of their scheduled appointments.
* **Frontend:**
    * Built with React and Vite for a fast development experience.
    * Client-side routing using `react-router-dom`.
    * Global state management for authentication using React Context API.
    * Component-based architecture.
    * Styled using CSS (potentially Tailwind CSS, based on standard practices).
* **Backend:**
    * RESTful API built with Node.js and Express.js.
    * MongoDB database integration using Mongoose ODM.
    * Middleware for request processing and authentication checks.
* **Protected Routes:** Ensures only authenticated users can access appointment booking and listing features.

## 🛠️ Tech Stack

* **Frontend:**
    * React
    * Vite
    * React Router DOM
    * Axios (for API requests)
    * CSS / Tailwind CSS (likely)
* **Backend:**
    * Node.js
    * Express.js
    * MongoDB (Database)
    * Mongoose (ODM)
    * JSON Web Token (JWT)
    * bcryptjs (Password Hashing)
    * CORS
* **Development:**
    * Nodemon (for server auto-reload)
    * ESLint (for code linting)

## 📂 Project Structure
``` pgsql
📁 client
├── components
│   ├── Navbar.jsx
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── AppointmentForm.jsx
│   ├── AppointmentList.jsx
│   └── PrivateRoute.jsx
├── context
│   └── AuthContext.jsx
├── App.jsx
├── main.jsx
└── index.css

📁 server
├── models
│   ├── User.js
│   └── Appointment.js
├── routes
│   ├── authRoutes.js
│   └── appointmentRoutes.js
├── middleware
│   └── authMiddleware.js
└── server.js
```
## 📋 Prerequisites

* Node.js (v14 or later recommended)
* npm (usually comes with Node.js)
* MongoDB (running instance, either local or cloud-based like MongoDB Atlas)

## 🚀 Getting Started

Follow these steps to get the application running locally:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/CptPrice743/appointment-scheduling.git
    cd appointment-scheduling-main
    ```

2.  **Setup Backend:**
    * Navigate to the server directory:
        ```bash
        cd server
        ```
    * Install dependencies:
        ```bash
        npm install
        ```
    * Create a `.env` file in the `server` directory and add the following environment variables:
        ```env
        PORT=5000 # Or any port you prefer for the server
        MONGO_URI=<your_mongodb_connection_string>
        JWT_SECRET=<your_strong_jwt_secret_key>
        ```
        *Replace `<your_mongodb_connection_string>` with your actual MongoDB connection string.*
        *Replace `<your_strong_jwt_secret_key>` with a strong, random secret key.*
    * Start the server:
        ```bash
        npm run dev # If you have a dev script using nodemon
        # OR
        node server.js
        ```
        The backend server should now be running (usually on `http://localhost:5000`).

3.  **Setup Frontend:**
    * Open a *new* terminal window/tab.
    * Navigate to the client directory from the root project folder:
        ```bash
        cd ../client # Or cd client if you are in the root directory
        ```
    * Install dependencies:
        ```bash
        npm install
        ```
    * Start the client development server:
        ```bash
        npm run dev
        ```
        The React application should now be running (usually on `http://localhost:5173` or another port specified by Vite).

4.  **Access the Application:**
    Open your web browser and navigate to the URL provided by the Vite development server (e.g., `http://localhost:5173`).

## 🔑 Environment Variables

The following environment variables are required for the backend server (`server/.env`):

* `PORT`: The port on which the Express server will run.
* `MONGO_URI`: Your MongoDB connection string.
* `JWT_SECRET`: A secret key used for signing JSON Web Tokens. Make this long, random, and keep it secret.

## 📄 API Endpoints (Example)

The backend exposes the following main API routes:

* **Authentication:**
    * `POST /api/auth/register`: Register a new user.
    * `POST /api/auth/login`: Log in an existing user.
* **Appointments:**
    * `POST /api/appointments`: Create a new appointment (protected).
    * `GET /api/appointments`: Get all appointments for the logged-in user (protected).

*(Note: These routes are based on typical naming conventions found in `authRoutes.js` and `appointmentRoutes.js`. Verify the exact paths in the code if needed.)*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request