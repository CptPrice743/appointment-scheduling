# Doctor Appointment Scheduling Application ("DeadLines")

A high-performance, serverless edge web application designed for healthcare appointment scheduling. Built on the **Cloudflare Edge Stack** (Cloudflare Workers + Hono + Cloudflare D1 + Drizzle ORM + React 18 SPA) with **100% free hosting, zero cold boot delays, and zero server spin-down**.

---

## ✨ Key Features

- **⚡ Cloudflare Edge Architecture**: Runs globally on Cloudflare Workers V8 isolates with instant responses (<50ms) and zero sleep timeouts.
- **🚀 1-Click Demo Logins**: Test any persona instantly without typing credentials or filling registration forms.
- **🔄 In-App Role Switcher & Live Reset**: Sticky top demo bar allows switching between Patient, Doctor, and Admin with a single click, as well as an instant **"Reset Demo Data"** action.
- **🗓️ Intelligent Clash & Conflict Detection**: Strict validation preventing overlapping appointments (`slotStart < existEnd && slotEnd > existStart`), taking into account doctor duration, recurring weekday hours, and date overrides.
- **🛡️ Role-Based Access Control (RBAC)**: Distinct permissions and views for **Patients**, **Doctors**, and **Administrators**.
- **📊 Master Admin Oversight**: System-wide analytics, doctor workload charts, user moderation, and master appointment control.

---

## 🛠️ Modern Edge Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 6, React Router v6 | Fast, modern client SPA with Chart.js, Lucide icons, and React Calendar |
| **Edge Compute** | Cloudflare Workers & Static Assets | Single-domain execution serving both the static SPA and `/api/*` endpoints |
| **API Framework** | Hono 4 | Ultra-fast, lightweight web standard API framework built for edge runtimes |
| **Edge Database** | Cloudflare D1 (Serverless SQLite) | Relational database at the edge with zero maintenance and zero sleep |
| **ORM & Migrations**| Drizzle ORM & `drizzle-kit` | Type-safe SQL schema definition and local/remote database migrations |
| **Security & Auth** | Web Crypto API (`hono/jwt`), `bcrypt-ts` | Edge-compliant JWT issuance and bcrypt hashing without native Node binary locks |

---

## 👥 Demo Personas & Credentials

You can log in directly using the **1-Click Demo Buttons** on `/login` or the `/` landing page, or enter credentials manually:

| Persona | Email | Password | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient.john@example.com` | `patientpassword123` | Browse doctors, book slots, view/cancel appointments |
| **Doctor** | `doctor.sarah@example.com` | `doctorpassword123` | View appointment calendar, manage weekly hours and date overrides |
| **Admin** | `admin@example.com` | `adminpassword123` | View platform KPIs, analytics, user roster, doctor catalog, all bookings |

---

## 🚀 Quickstart (Local Development)

### 1. Prerequisites
- **Node.js**: v18 or later
- **npm**: v9 or later

### 2. Installation
Clone the repository and install all root and client dependencies:
```bash
git clone https://github.com/CptPrice743/appointment-scheduling.git
cd appointment-scheduling
npm install
cd client && npm install && cd ..
```

### 3. Database Migration & Local Seed
Run the local D1 migration to create the relational SQLite tables:
```bash
# Apply migrations to local Cloudflare D1
npm run db:migrate
```

To initialize or reset the seed database, start the local worker (Step 4) and click **[Reset Demo Data]** in the app banner, or run:
```bash
curl -X POST http://localhost:8787/api/demo/reset
```

### 4. Build Static Assets & Start Worker
Build the React SPA bundle:
```bash
npm run build:client
```

Start the local Cloudflare Worker (running API and serving client assets):
```bash
npm run dev
# Or: npx wrangler dev --port 8787
```

Open your browser at **`http://localhost:8787`** to interact with the application!

*(Optional) If you want live Vite Hot Module Reloading (HMR) during frontend UI editing, run in a separate terminal:*
```bash
npm run client
# Starts Vite on http://localhost:3000 (proxies /api requests to port 8787)
```

---

## 📂 Project Structure

```
appointment-scheduling/
├── client/                     # Frontend React SPA
│   ├── src/
│   │   ├── components/         # Reusable UI (Navbar, DemoBanner, etc.)
│   │   ├── context/            # AuthContext & global state
│   │   ├── pages/              # Patient, Doctor, Admin pages
│   │   ├── App.jsx             # Root router & route guards
│   │   └── main.jsx
│   ├── dist/                   # Built production bundle
│   └── vite.config.js          # Vite config (proxied to port 8787)
├── server/
│   ├── d1/
│   │   └── migrations/         # D1 SQL migration scripts
│   └── src/
│       ├── db/
│       │   ├── schema.ts       # Drizzle relational schema (users, doctors, appointments)
│       │   └── seed.ts         # Edge-compatible database seeder
│       ├── middleware/
│       │   └── auth.ts         # Web Crypto JWT authentication & RBAC guards
│       ├── routes/
│       │   ├── auth.ts         # /api/auth
│       │   ├── appointments.ts # /api/appointments (with clash detection)
│       │   ├── doctors.ts      # /api/doctors (availability & slots)
│       │   ├── users.ts        # /api/users
│       │   ├── admin.ts        # /api/admin
│       │   └── demo.ts         # /api/demo/reset
│       ├── utils/
│       │   ├── serializers.ts  # Mongoose-compatible _id serializer
│       │   └── timeUtils.ts    # Slot generation & clash helper functions
│       └── index.ts            # Hono application entrypoint
├── drizzle.config.ts           # Drizzle Kit configuration
├── wrangler.jsonc              # Cloudflare Worker & D1 binding configuration
├── ARCHITECTURE.md             # Detailed system architecture
├── DECISIONS.md                # Architecture Decision Records (ADRs)
└── AGENTS.md                   # Conventions & operating guidelines for AI agents
```

---

## 🧪 Testing & Verification

Automated end-to-end tests are performed with Playwright:
- Persona authentication verification for Patient, Doctor, and Admin.
- Dynamic slot clash conflict exclusion testing.
- Cross-persona scheduling synchronization.
- Console error validation (0 errors).