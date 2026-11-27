// Prints the QR code rows for data/guide.js (D.qr). Only needed if the tool's public address ever changes.
//
//   npm install qrcode          (once, on your computer; it is not part of the published tool)
//   node _build/make-qr.mjs     (run from the tool's folder, then paste the line it prints into data/guide.js)
//
// Error correction is level H, the highest, so the code still scans with the app's logo over its centre.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QR = createRequire(import.meta.url)('qrcode');
const box = { window: {} }; vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', 'guide.js'), 'utf8'), box);
const url = box.window.SLES.data.config.toolUrl;
const q = QR.create(url, { errorCorrectionLevel: 'H' }), n = q.modules.size, rows = [];
for (let r = 0; r < n; r++) { let bits = ''; for (let c = 0; c < n; c++) bits += q.modules.get(r, c) ? '1' : '0'; rows.push(BigInt('0b' + bits).toString(16).padStart(Math.ceil(n / 4), '0')); }
console.log(`// QR code for ${url} (${n} by ${n} modules, error correction H)`);
console.log(`  D.qr = '${rows.join(',')}';`);
