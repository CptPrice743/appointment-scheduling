import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppEnv } from './middleware/auth';
import { authRouter } from './routes/auth';
import { appointmentRouter } from './routes/appointments';
import { doctorRouter } from './routes/doctors';
import { userRouter } from './routes/users';
import { adminRouter } from './routes/admin';
import { demoRouter } from './routes/demo';

const app = new Hono<AppEnv>();

// Global CORS Middleware
app.use(
  '/*',
  cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    runtime: 'Cloudflare Worker (Edge)',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API routers
app.route('/api/auth', authRouter);
app.route('/api/appointments', appointmentRouter);
app.route('/api/doctors', doctorRouter);
app.route('/api/users', userRouter);
app.route('/api/admin', adminRouter);
app.route('/api/demo', demoRouter);

// Global Error Handler
app.onError((err, c) => {
  console.error('Unhandled Edge Error:', err);
  return c.json(
    {
      message: err.message || 'Internal Server Error',
    },
    500
  );
});

// SPA Asset Fallback
app.all('*', async (c) => {
  // If ASSETS binding is present (Cloudflare Workers Static Assets), delegate to it
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

export default app;
