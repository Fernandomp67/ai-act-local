import { defineConfig } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';
export default defineConfig({testDir:'./tests/e2e',timeout:60000,workers:1,use:{baseURL:'http://127.0.0.1:4321',screenshot:'only-on-failure',trace:'retain-on-failure'},webServer:{command:'node --import tsx src/server/main.ts',url:'http://127.0.0.1:4321/api/health',reuseExistingServer:false,timeout:30000,env:{AI_ACT_PORT:'4321',AI_ACT_AUDITS_DIR:path.join(os.tmpdir(),`ai-act-e2e-${process.pid}`)}}});
