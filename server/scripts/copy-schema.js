import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root for server (one directory up from scripts)
const serverRoot = path.resolve(__dirname, '..');
const srcSchema = path.resolve(serverRoot, 'src', 'db', 'schema.sql');
const distDbDir = path.resolve(serverRoot, 'dist', 'db');
const distSchema = path.resolve(distDbDir, 'schema.sql');

console.log('[Build] Executing copy-schema.js...');
console.log(`[Build] Source: ${srcSchema}`);
console.log(`[Build] Target: ${distSchema}`);

if (!fs.existsSync(srcSchema)) {
  console.error(`[Build Error] Source schema file not found at: ${srcSchema}`);
  process.exit(1);
}

if (!fs.existsSync(distDbDir)) {
  fs.mkdirSync(distDbDir, { recursive: true });
}

fs.copyFileSync(srcSchema, distSchema);

if (fs.existsSync(distSchema)) {
  const stats = fs.statSync(distSchema);
  console.log(`[Build Success] Successfully copied schema.sql (${stats.size} bytes) to ${distSchema}`);
} else {
  console.error('[Build Error] Target schema file was not created.');
  process.exit(1);
}
