/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const JSZip = require('jszip');

async function main() {
  const root = process.cwd();
  const cookie = (await fs.readFile('.env.backup-cookie', 'utf8')).trim();
  const response = await fetch('https://ecliptic.website/api/admin/backup?type=recovery', {
    headers: { cookie, 'user-agent': 'codex-backup' }, signal: AbortSignal.timeout(180000),
  });
  if (!response.ok) throw new Error('Recovery export HTTP ' + response.status);
  const snapshot = await response.json();
  if (!snapshot.storage || !snapshot.environment) throw new Error('Recovery export not deployed yet');
  const zip = new JSZip();
  const folder = zip.folder('ecliptic-web');
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const file of files) folder.file(file, await fs.readFile(path.join(root, file)));
  folder.file('scripts/create-recovery-backup.cjs', await fs.readFile(__filename));
  const failures = [];
  const cache = new Map();
  async function asset(value) {
    if (!value || value.startsWith('/')) return value;
    if (cache.has(value)) return cache.get(value);
    let bytes, extension;
    try {
      if (value.startsWith('data:')) {
        const match = value.match(/^data:image\/([^;,]+);base64,(.*)$/s);
        if (!match) throw new Error('Unsupported data image');
        bytes = Buffer.from(match[2], 'base64'); extension = match[1].replace('svg+xml', 'svg').replace('jpeg', 'jpg');
      } else {
        let result = await fetch(value, { signal: AbortSignal.timeout(20000) });
        if (!result.ok) result = await fetch(value, { headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://ecliptic.website/' }, signal: AbortSignal.timeout(20000) });
        if (!result.ok) throw new Error('HTTP ' + result.status);
        const type = result.headers.get('content-type') || '';
        if (!type.includes('image')) throw new Error('Not an image');
        extension = type.includes('svg') ? 'svg' : type.includes('webp') ? 'webp' : type.includes('png') ? 'png' : type.includes('icon') ? 'ico' : type.includes('gif') ? 'gif' : 'jpg';
        bytes = Buffer.from(await result.arrayBuffer());
      }
      const name = createHash('sha256').update(bytes).digest('hex').slice(0, 24) + '.' + extension;
      folder.file('public/backup-assets/' + name, bytes);
      const local = '/backup-assets/' + name; cache.set(value, local); return local;
    } catch (error) {
      failures.push({ url: value.slice(0, 300), error: error.message }); return value;
    }
  }
  const products = structuredClone(snapshot.products);
  for (const product of products) {
    product.icon = await asset(product.icon);
    if (product.offerIcon) product.offerIcon = await asset(product.offerIcon);
    for (const offer of product.offers) if (offer.icon) offer.icon = await asset(offer.icon);
  }
  const storage = { ...snapshot.productStorage, order: products.map(p => p.slug), overrides: Object.fromEntries(products.map(p => [p.slug, p])) };
  for (const file of files.filter(file => /\.(tsx?|jsx?|mjs|cjs)$/.test(file))) {
    let source = await fs.readFile(path.join(root, file), 'utf8');
    for (const [url, local] of cache) if (url.startsWith('http')) source = source.replaceAll(url, local);
    folder.file(file, source);
  }
  folder.file('backup-data/admin/products-storage.json', JSON.stringify(storage, null, 2));
  folder.file('backup-data/admin/site-settings.json', JSON.stringify(snapshot.settings, null, 2));
  folder.file('backup-data/admin/analytics-events-v2.json', JSON.stringify(snapshot.analytics.events));
  for (const [name, base64] of Object.entries(snapshot.storage)) {
    folder.file('backup-storage/' + name, Buffer.from(base64, 'base64'));
    if (!name.startsWith('admin/')) folder.file('backup-data/' + name, Buffer.from(base64, 'base64'));
  }
  folder.file('backup-storage/admin/products-storage.json', JSON.stringify(storage));
  folder.file('recovery-snapshot.json', JSON.stringify(snapshot));
  folder.file('.env.recovery', Object.entries(snapshot.environment).map(([key, value]) => key + '=' + JSON.stringify(value)).join('\n') + '\n');
  folder.file('scripts/restore-storage.cjs', `const fs=require('node:fs/promises'),path=require('node:path'),{parseEnv}=require('node:util');\nasync function run(){Object.assign(process.env,parseEnv(await fs.readFile('.env.recovery','utf8')));const {put}=require('@vercel/blob');async function walk(dir,prefix=''){for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name),name=prefix+e.name;if(e.isDirectory())await walk(f,name+'/');else{await put(name,await fs.readFile(f),{access:'private',allowOverwrite:true,addRandomSuffix:false});console.log('Restored',name);}}}await walk('backup-storage');}run().catch(e=>{console.error(e.message);process.exitCode=1});\n`);
  folder.file('RESTORE.txt', `Ecliptic Store recovery backup\n\n1. Install Node.js 24, unpack ecliptic-web. Run npm ci.\n2. LOCAL: data and assets are bundled in backup-data and public/backup-assets. Run npm run dev.\n3. PRODUCTION: create a Vercel project and PRIVATE Blob store; restore environment values from .env.recovery in Vercel. If the old store was deleted, replace BLOB_STORE_ID with the new store ID and use a new BLOB_READ_WRITE_TOKEN to restore. Never publish .env.recovery to GitHub.\n4. Run node scripts/restore-storage.cjs with credentials for the destination Blob store. Deploy with vercel --prod.\n5. Restore domain ecliptic.website and DNS in Vercel. Restore Telegram webhook to https://ecliptic.website/api/telegram/webhook using TELEGRAM_WEBHOOK_SECRET.\n6. After storage restore, customers, orders, referrals and analytics are read from restored Blob data.\n\nContains private customer records and credentials. Keep the archive private. Domain registration, Vercel account and service access must still be available or recreated. node_modules and .next are regenerated by npm ci and npm run build.\n`);
  const manifest = { generatedAt: snapshot.generatedAt, commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), products: products.length, sourceFiles: files.length, storageFiles: Object.keys(snapshot.storage).length, localizedImages: cache.size, failures };
  folder.file('BACKUP-MANIFEST.json', JSON.stringify(manifest, null, 2));
  await fs.mkdir('admin-backups', { recursive: true });
  const output = path.join(root, 'admin-backups', 'ecliptic-FULL-RECOVERY-' + new Date().toISOString().replace(/[:.]/g, '-') + '.zip');
  const bytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  await fs.writeFile(output, bytes);
  const verify = await JSZip.loadAsync(bytes, { checkCRC32: true });
  if (!verify.file('ecliptic-web/backup-storage/customers/store-v1.json')) throw new Error('Customer storage is missing');
  console.log(JSON.stringify({ output, bytes: bytes.length, ...manifest }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
