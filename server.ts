import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from "./server/db.ts";
import apiRouter from './server/routes/api.ts';
import fs from 'fs';

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for reverse proxy environments (Google Cloud Run / nginx)
  app.set('trust proxy', 1);

  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Disabling CSP for Vite compatibility in dev/preview, should be configured specifically in prod
    crossOriginEmbedderPolicy: false,
    xFrameOptions: false // Allow embedding in AI Studio preview iframe
  }));
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? true : true, // Adjust origin appropriately
    credentials: true,
  }));
  
  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    validate: {
      xForwardedForHeader: false,
      forwardedHeader: false,
    },
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many auth attempts from this IP',
    standardHeaders: true,
    legacyHeaders: false,
    validate: {
      xForwardedForHeader: false,
      forwardedHeader: false,
    },
  });

  app.use('/api/', apiLimiter);
  app.use('/api/auth/', authLimiter);

  // Middleware for parsing JSON & forms
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'college-event-platform', timestamp: new Date().toISOString() });
  });

  // Mount API router
  app.use('/api', apiRouter);
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Vite middleware in development vs static file serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  await db.initFirestoreSync();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Event platform server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
