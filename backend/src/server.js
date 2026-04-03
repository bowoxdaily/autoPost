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
const resolvedPort = Number(
  process.env.PORT ||
  process.env.APP_PORT ||
  process.env.NODEJS_PORT ||
  process.env.PASSENGER_PORT ||
  0
);

if (!resolvedPort) {
  console.warn('⚠️  No port environment variable found. Using a random free port.');
}

app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Run migrations only when explicitly enabled to avoid heavy startup checks on shared hosting.
if (process.env.RUN_MIGRATIONS_ON_STARTUP === 'true') {
  runMigrations().catch(err => {
    console.warn('⚠️  Migration warning:', err.message);
    console.log('📝 You may need to manually run: migrations/add_user_credentials.sql');
  });
} else {
  console.log('ℹ️  Skipping migration checks on startup (set RUN_MIGRATIONS_ON_STARTUP=true to enable).');
}

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

function startServer(port) {
  const server = app.listen(port, () => {
    const actualPort = server.address()?.port;
    console.log(`🚀 Server running on http://localhost:${actualPort}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use.`);

      if (port) {
        process.exit(1);
      }

      console.log('↻ Retrying with a random free port...');
      startServer(0);
      return;
    }

    console.error('❌ Server failed to start:', error);
    process.exit(1);
  });
}

startServer(resolvedPort);
