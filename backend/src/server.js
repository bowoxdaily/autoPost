import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import settingsRoutes from './routes/settingsRoute.js';
import cronRoutes from './routes/cronRoute.js';
import logsRoutes from './routes/logsRoute.js';
import postRoutes from './routes/postRoute.js';
import authRoutes from './routes/authRoute.js';
import apiKeyRoutes from './routes/apiKeyRoute.js';
import userManagementRoutes from './routes/userManagementRoute.js';
import brandingRoutes from './routes/brandingRoute.js';
import userSettingsRoutes from './routes/userSettingsRoute.js';
import { initializeDatabase } from './utils/database.js';
import { runMigrations } from './utils/migrations.js';
import { authMiddleware } from './middleware/auth.js';
import { apiKeyAuth } from './middleware/roleAuth.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

if (!process.env.PORT) {
  console.warn('⚠️  PORT is not set. Falling back to 5000.');
}

app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Run migrations on startup
runMigrations().catch(err => {
  console.warn('⚠️  Migration warning:', err.message);
  console.log('📝 You may need to manually run: migrations/add_user_credentials.sql');
});

// Apply API key auth middleware (flexible auth: JWT or API key)
app.use(apiKeyAuth);

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Branding routes (public get, protected update)
app.use('/api/branding', brandingRoutes);

// API Key Management routes (protected)
app.use('/api/api-keys', authMiddleware, apiKeyRoutes);

// User Management routes (protected, Superuser required for most)
app.use('/api/users', userManagementRoutes);

// User Settings routes (protected - for user credentials: Gemini API, WordPress)
app.use('/api/user-settings', authMiddleware, userSettingsRoutes);

// Protected routes (require authentication)
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/cron', authMiddleware, cronRoutes);
app.use('/api/logs', authMiddleware, logsRoutes);
app.use('/api/posts', authMiddleware, postRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
