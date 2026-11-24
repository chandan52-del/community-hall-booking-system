import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import dotenv from 'dotenv';

// Explicitly resolve backend/.env regardless of process working directory
const backendEnvPath = path.resolve(__dirname, '../../.env');
const cwdEnvPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(cwdEnvPath)) {
  dotenv.config({ path: cwdEnvPath });
} else {
  dotenv.config();
}

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  SHADOW_DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ [Config] Invalid Environment Variables:');
    const issues = result.error.issues || (result.error as { errors?: Array<{ path: Array<string | number>; message: string }> }).errors || [];
    issues.forEach((err) => {
      const fieldPath = Array.isArray(err.path) ? err.path.join('.') : String(err.path || '');
      console.error(`   - ${fieldPath}: ${err.message}`);
    });
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
