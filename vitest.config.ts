import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    fileParallelism: false,
    testTimeout: 50000,
    hookTimeout: 50000,
    globals: true,
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/twm_db',
      JWT_SECRET: process.env.JWT_SECRET || 'twm_development_session_secret_change_in_production_min_32_chars!',
      INTEGRATION_ENCRYPTION_KEY: process.env.INTEGRATION_ENCRYPTION_KEY || 'twm_production_master_encryption_key_change_in_production_32b!',
      SMC_GLOBAL_AP_CODE: process.env.SMC_GLOBAL_AP_CODE || 'AP123456',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
