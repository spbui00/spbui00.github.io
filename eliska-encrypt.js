// Encrypts eliska-coupons.json (gitignored) with a password and writes the ciphertext
// to assets/data/eliska.json. Usage: node eliska-encrypt.js 'password'
//
// eliska-coupons.json format:
// [
//   { "question": "Kde jsme byli na prvním rande?",
//     "choices": ["Brno", "Praha", "Vídeň", "Olomouc", "Ostrava"],
//     "answer": "Vídeň",
//     "link": "https://revolut.me/..." },
//   ...
// ]
const fs = require('fs');
const { subtle } = globalThis.crypto;
const getRandomValues = a => crypto.getRandomValues(a);

const password = process.argv[2];
if (!password) throw new Error("usage: node eliska-encrypt.js 'password'");

const coupons = JSON.parse(fs.readFileSync('eliska-coupons.json', 'utf8'));
coupons.forEach((c, i) => {
  const bad = msg => { throw new Error(`coupon ${i + 1}: ${msg}`); };
  if (typeof c.question !== 'string' || !c.question) bad('missing "question"');
  if (!Array.isArray(c.choices) || c.choices.length !== 5) bad('"choices" must have exactly 5 items');
  if (!c.choices.includes(c.answer)) bad(`"answer" must be one of the choices, got ${JSON.stringify(c.answer)}`);
  if (!/^https:\/\//.test(c.link)) bad('"link" must start with https://');
});
const b64 = buf => Buffer.from(buf).toString('base64');

// Must match decrypt() in js/eliska.js
async function key(salt) {
  const base = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

(async () => {
  const salt = getRandomValues(new Uint8Array(16));
  const iv = getRandomValues(new Uint8Array(12));
  const k = await key(salt);
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(JSON.stringify(coupons)));

  // round-trip check before writing
  const back = JSON.parse(new TextDecoder().decode(await subtle.decrypt({ name: 'AES-GCM', iv }, k, ct)));
  if (JSON.stringify(back) !== JSON.stringify(coupons)) throw new Error('round-trip failed');

  fs.writeFileSync('assets/data/eliska.json', JSON.stringify({ salt: b64(salt), iv: b64(iv), ct: b64(ct) }));
  console.log(`Encrypted ${coupons.length} coupons into assets/data/eliska.json`);
})();
