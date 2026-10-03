const $ = id => document.getElementById(id);
const used = () => JSON.parse(localStorage.getItem('eliska-used') || '[]');
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
let DATA, coupons, current;

// Must match key() in eliska-encrypt.js
async function decrypt(password) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: unb64(DATA.salt), iterations: 210000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(DATA.iv) }, key, unb64(DATA.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}

function show(id) {
  for (const s of ['login', 'vouchers', 'redeem']) $(s).hidden = s !== id;
}

function renderGrid() {
  const u = used();
  $('grid').innerHTML = '';
  coupons.forEach((_, idx) => {
    const i = idx + 1, done = u.includes(i);
    const div = document.createElement('div');
    div.className = 'voucher' + (done ? ' used' : '');
    div.innerHTML = `<span class="amount">100 Kč</span><span class="muted">Kupón ${i}/${coupons.length}</span>`;
    const btn = document.createElement('button');
    btn.className = 'btn' + (done ? ' btn-outline' : '');
    btn.textContent = done ? 'Vybráno' : 'Vybrat';
    btn.disabled = done;
    btn.onclick = () => openVoucher(i);
    div.append(btn);
    $('grid').append(div);
  });
  show('vouchers');
}

function openVoucher(i) {
  current = i;
  const c = coupons[i - 1];
  $('redeem-title').textContent = `Kupón ${i}/${coupons.length}`;
  $('question').textContent = c.question;
  $('wrong').hidden = true;
  $('reward').hidden = true;
  $('quiz').hidden = false;
  $('quiz').innerHTML = '';
  // Fisher-Yates shuffle, fresh order each time she opens the coupon
  const choices = [...c.choices];
  for (let j = choices.length - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    [choices[j], choices[k]] = [choices[k], choices[j]];
  }
  for (const choice of choices) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline';
    btn.textContent = choice;
    btn.onclick = () => choice === c.answer ? reveal(c) : ($('wrong').hidden = false);
    $('quiz').append(btn);
  }
  show('redeem');
}

function reveal(c) {
  const qr = qrcode(0, 'M');
  qr.addData(c.link);
  qr.make();
  $('qr').innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2 });
  $('claim').href = c.link;
  $('quiz').hidden = true;
  $('wrong').hidden = true;
  $('reward').hidden = false;
}

async function login(password) {
  // Written by: node eliska-encrypt.js 'password'
  DATA ??= await (await fetch('assets/data/eliska.json')).json();
  coupons = await decrypt(password); // throws on wrong password
  sessionStorage.setItem('eliska-pw', password);
  renderGrid();
}

$('login').onsubmit = async e => {
  e.preventDefault();
  try { await login($('pw').value); } catch { $('err').hidden = false; }
};
$('done').onclick = () => {
  localStorage.setItem('eliska-used', JSON.stringify([...used(), current]));
  renderGrid();
};
$('back').onclick = e => { e.preventDefault(); renderGrid(); };

const saved = sessionStorage.getItem('eliska-pw');
if (saved) login(saved).catch(() => {});
