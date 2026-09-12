const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const imports = `
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
`;

code = code.replace("import fs from 'fs';", "import fs from 'fs';\n" + imports);

const securityMiddlewares = `
  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Disabling CSP for Vite compatibility in dev/preview, should be configured specifically in prod
    crossOriginEmbedderPolicy: false
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
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many auth attempts from this IP',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', apiLimiter);
  app.use('/api/auth/', authLimiter);
`;

code = code.replace("  // Middleware for parsing JSON & forms", securityMiddlewares + "\n  // Middleware for parsing JSON & forms");

fs.writeFileSync('server.ts', code);
console.log('patched server');
