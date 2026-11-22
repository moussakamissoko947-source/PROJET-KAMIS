import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { config } from './config.js';
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Support reverse proxies (Cloudflare, Render, Railway, Fly.io, etc.)
  app.set('trust proxy', 1);

  // Basic security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Keep flexible for dev & preview
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  // CORS configuration — autorise dynamiquement tout domaine légitime (tunnel, cloud, IP)
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Parsing middlewares
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/account', accountRoutes);
  app.use('/api', healthRoutes);

  // Serve static client if built (e.g. in production)
  const clientDist = path.resolve(process.cwd(), 'client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // Global error handler
  app.use(errorHandler);

  return app;
}
