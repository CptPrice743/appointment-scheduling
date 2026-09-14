import { Hono } from 'hono';
import { AppEnv } from '../middleware/auth';
import { seedDatabase } from '../db/seed';

export const demoRouter = new Hono<AppEnv>();

// POST /api/demo/reset - Cleans and reseeds database with fresh demo dataset
demoRouter.post('/reset', async (c) => {
  try {
    const result = await seedDatabase(c.env.DB);
    return c.json(result);
  } catch (err: any) {
    console.error('Error resetting demo database:', err);
    return c.json({ success: false, message: `Failed to reset demo data: ${err.message}` }, 500);
  }
});
