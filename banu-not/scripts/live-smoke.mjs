import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const nextBin = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
const baseUrlArgIndex = process.argv.indexOf('--url');
const requestedUrl = baseUrlArgIndex >= 0 ? process.argv[baseUrlArgIndex + 1] : process.env.LIVE_TEST_URL;

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: projectRoot, env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} ${args.join(' ')} exited with ${signal || code}`));
    });
  });
}

async function findFreePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test sunucusu için boş port alınamadı.');
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return address.port;
}

async function requestJson(baseUrl, route) {
  const response = await fetch(new URL(route, baseUrl), { signal: AbortSignal.timeout(10_000) });
  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { response, body };
}

async function assertResponse(baseUrl, route, check) {
  const { response, body } = await requestJson(baseUrl, route);
  const problem = check({ response, body });
  if (problem) throw new Error(`${route}: ${problem}`);
  console.log(`PASS ${route} (${response.status})`);
}

async function runChecks(baseUrl) {
  const homepage = await fetch(new URL('/', baseUrl), { signal: AbortSignal.timeout(10_000) });
  const html = await homepage.text();
  if (!homepage.ok || !html.includes('BANÜ NOT')) {
    throw new Error(`Ana sayfa beklenmedik yanıt verdi (${homepage.status}).`);
  }
  console.log(`PASS / (${homepage.status})`);

  await assertResponse(baseUrl, '/api/categories?type=universities', ({ response, body }) => {
    if (!response.ok || !body?.success) return 'Üniversite kataloğu yüklenemedi.';
    if (!Array.isArray(body.data) || body.data.length === 0) return 'Üniversite seed verisi bulunamadı.';
    return '';
  });

  await assertResponse(baseUrl, '/api/notes?limit=1', ({ response, body }) => {
    if (!response.ok || !body?.success) return 'Not listesi API isteği başarısız.';
    if (!Array.isArray(body.data?.notes) || body.data.notes.length === 0) return 'Demo not seed verisi bulunamadı.';
    if (typeof body.data?.pagination?.total !== 'number') return 'Sayfalama verisi dönmedi.';
    return '';
  });

  await assertResponse(baseUrl, '/api/auth/providers', ({ response, body }) => {
    if (!response.ok || !body || typeof body !== 'object') return 'Kimlik doğrulama sağlayıcıları yüklenemedi.';
    return '';
  });

  await assertResponse(baseUrl, '/api/admin?section=dashboard', ({ response, body }) => {
    if (response.status !== 403 || body?.success !== false) return 'Yetkisiz admin isteği engellenmedi.';
    return '';
  });

  for (const route of ['/kesfet', '/admin']) {
    const response = await fetch(new URL(route, baseUrl), { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`${route}: Sayfa ${response.status} yanıtı verdi.`);
    console.log(`PASS ${route} (${response.status})`);
  }
}

async function main() {
  if (requestedUrl) {
    const baseUrl = new URL(requestedUrl).toString();
    console.log(`Canlı smoke test hedefi: ${baseUrl}`);
    await runChecks(baseUrl);
    return;
  }

  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'banunot-live-'));
  const databasePath = path.join(tempDirectory, 'banunot.db');
  const testEnv = {
    ...process.env,
    BANUNOT_DB_PATH: databasePath,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'local-live-smoke-secret-only',
    NEXTAUTH_URL: '',
    NEXT_TELEMETRY_DISABLED: '1',
  };
  let server;
  let serverOutput = '';

  try {
    console.log('İzole test veritabanı hazırlanıyor…');
    await run(process.execPath, [path.join(projectRoot, 'scripts', 'seed-database.mjs')], {
      ...testEnv,
      NODE_ENV: 'development',
    });

    console.log('Üretim derlemesi alınıyor…');
    await run(process.execPath, [nextBin, 'build'], { ...testEnv, NODE_ENV: 'production' });

    const port = await findFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    server = spawn(process.execPath, [nextBin, 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
      cwd: projectRoot,
      env: { ...testEnv, NODE_ENV: 'production', NEXTAUTH_URL: baseUrl },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stdout.on('data', chunk => {
      const text = chunk.toString();
      serverOutput += text;
      process.stdout.write(text);
    });
    server.stderr.on('data', chunk => {
      const text = chunk.toString();
      serverOutput += text;
      process.stderr.write(text);
    });

    const startedAt = Date.now();
    let ready = false;
    while (Date.now() - startedAt < 30_000) {
      if (server.exitCode !== null) throw new Error(`Next.js sunucusu başlamadı.\n${serverOutput}`);
      try {
        const response = await fetch(baseUrl, { signal: AbortSignal.timeout(2_000) });
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {
        await new Promise(resolve => setTimeout(resolve, 350));
      }
    }
    if (!ready) throw new Error(`Next.js sunucusu zamanında yanıt vermedi.\n${serverOutput}`);

    console.log(`Canlı smoke test hedefi: ${baseUrl}`);
    await runChecks(baseUrl);
    console.log('Canlı smoke testleri başarıyla tamamlandı.');
  } finally {
    if (server && server.exitCode === null) {
      server.kill();
      await Promise.race([once(server, 'exit'), new Promise(resolve => setTimeout(resolve, 5_000))]);
    }
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
