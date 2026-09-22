import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let pgPool = null;
let pgliteInstance = null;
export async function getDbClient() {
    if (process.env.DATABASE_URL) {
        if (!pgPool) {
            pgPool = new pg.Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            });
            console.log('[DB] Connected to PostgreSQL via DATABASE_URL');
        }
        return {
            type: 'pg',
            pool: pgPool,
        };
    }
    if (!pgliteInstance) {
        const dataDir = path.resolve(__dirname, '../../data/postgres_db');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        const pidFile = path.join(dataDir, 'postmaster.pid');
        if (fs.existsSync(pidFile)) {
            try {
                fs.unlinkSync(pidFile);
                console.log('[DB] Removed stale postmaster.pid lock file');
            }
            catch {
                // ignore
            }
        }
        try {
            pgliteInstance = new PGlite(dataDir);
            await pgliteInstance.waitReady;
        }
        catch (err) {
            console.warn('[DB] Persistent PGlite encountered lock/WAL issue. Re-initializing clean storage...', err);
            try {
                fs.rmSync(dataDir, { recursive: true, force: true });
                fs.mkdirSync(dataDir, { recursive: true });
            }
            catch {
                // ignore
            }
            pgliteInstance = new PGlite(dataDir);
            await pgliteInstance.waitReady;
        }
        console.log(`[DB] Persistent embedded PostgreSQL (PGlite) initialized at ${dataDir}`);
    }
    return {
        type: 'pglite',
        client: pgliteInstance,
    };
}
export async function query(sql, params = []) {
    const db = await getDbClient();
    if (db.type === 'pg') {
        const res = await db.pool.query(sql, params);
        return {
            rows: res.rows,
            rowCount: res.rowCount ?? res.rows.length,
        };
    }
    else {
        // PGlite executes SQL with params
        const res = await db.client.query(sql, params);
        return {
            rows: res.rows || [],
            rowCount: res.rows?.length || 0,
        };
    }
}
export async function initDatabase() {
    const candidatePaths = [
        path.resolve(__dirname, 'schema.sql'),
        path.resolve(__dirname, '../db/schema.sql'),
        path.resolve(__dirname, '../../src/db/schema.sql'),
        path.resolve(process.cwd(), 'server/src/db/schema.sql'),
        path.resolve(process.cwd(), 'src/db/schema.sql'),
        path.resolve(process.cwd(), 'server/dist/db/schema.sql'),
        path.resolve(process.cwd(), 'dist/db/schema.sql'),
    ];
    let schemaSql = '';
    let foundPath = '';
    for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
            try {
                schemaSql = fs.readFileSync(p, 'utf8');
                foundPath = p;
                break;
            }
            catch {
                // try next candidate
            }
        }
    }
    if (!schemaSql) {
        throw new Error(`[DB Error] Could not locate schema.sql in candidate paths: ${candidatePaths.join(', ')}`);
    }
    console.log(`[DB] Initializing PostgreSQL schema from ${foundPath}...`);
    const db = await getDbClient();
    if (db.type === 'pg') {
        await db.pool.query(schemaSql);
    }
    else {
        // PGlite supports exec() for multi-statement SQL scripts
        await db.client.exec(schemaSql);
    }
    console.log('[DB] PostgreSQL schema initialized successfully.');
}
