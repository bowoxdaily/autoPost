import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './utils/database.js';

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

function lazyMiddleware(importer, exportName = 'default') {
  let cached = null;

  return async (req, res, next) => {
    try {
      if (!cached) {
        const mod = await importer();
        cached = mod[exportName];
      }

      return cached(req, res, next);
    } catch (error) {
      return next(error);
    }
  };
}

app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Run migrations only when explicitly enabled to avoid heavy startup checks on shared hosting.
if (process.env.RUN_MIGRATIONS_ON_STARTUP === 'true') {
  import('./utils/migrations.js')
    .then(({ runMigrations }) => runMigrations())
    .catch(err => {
      console.warn('⚠️  Migration warning:', err.message);
      console.log('📝 You may need to manually run: migrations/add_user_credentials.sql');
    });
} else {
  console.log('ℹ️  Skipping migration checks on startup (set RUN_MIGRATIONS_ON_STARTUP=true to enable).');
}

// Apply API key auth middleware (flexible auth: JWT or API key)
app.use(lazyMiddleware(() => import('./middleware/roleAuth.js'), 'apiKeyAuth'));

// Auth routes (public)
app.use('/api/auth', lazyMiddleware(() => import('./routes/authRoute.js')));

// Branding routes (public get, protected update)
app.use('/api/branding', lazyMiddleware(() => import('./routes/brandingRoute.js')));

// API Key Management routes (protected)
app.use('/api/api-keys', lazyMiddleware(() => import('./routes/apiKeyRoute.js')));

// User Management routes (protected, Superuser required for most)
app.use('/api/users', lazyMiddleware(() => import('./routes/userManagementRoute.js')));

// User Settings routes (protected - for user credentials: Gemini API, WordPress)
app.use('/api/user-settings', lazyMiddleware(() => import('./routes/userSettingsRoute.js')));

// Protected routes (require authentication)
app.use('/api/settings', lazyMiddleware(() => import('./routes/settingsRoute.js')));
app.use('/api/cron', lazyMiddleware(() => import('./routes/cronRoute.js')));
app.use('/api/logs', lazyMiddleware(() => import('./routes/logsRoute.js')));
app.use('/api/posts', lazyMiddleware(() => import('./routes/postRoute.js')));

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
