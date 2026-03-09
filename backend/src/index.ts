import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file FIRST, before anything else
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { executeCode } from './execution/piston-service'; 
import { executeJavaScript } from './execution/javascript-service';
import { executionLimiter } from './middleware/security';

const app = express();

const corsOrigins = [
  'http://localhost:3000',                 // Local frontend development
  'http://127.0.0.1:3000',                 // Alternative localhost
  'https://collab-glow2.vercel.app',       // Production Vercel frontend
  /\.vercel\.app$/                          // Allow all Vercel preview deployments
];

const corsOptions = {
  origin: (origin: any, callback: any) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed pattern
    const isAllowed = corsOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.post('/api/execute', executionLimiter, async (req, res) => {
  try {
    const { code, language, stdin = '' } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    console.log(`[Execute] Language: ${language}, Code length: ${code.length}`);

    let result;
    switch (language) {
      case 'javascript':
        result = executeJavaScript(code, stdin);
        break;
      default:
        result = await executeCode(code, language, stdin);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({ 
      error: 'Execution failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    judge0_api_key_configured: !!process.env.JUDGE0_API_KEY
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    judge0_api_key_configured: !!process.env.JUDGE0_API_KEY,
    message: 'Backend is running successfully'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`📝 Judge0 API Key configured: ${process.env.JUDGE0_API_KEY ? '✓' : '✗'}`);
  console.log(`🔗 CORS enabled for: ${corsOptions.origin}\n`);
});

export default app;



