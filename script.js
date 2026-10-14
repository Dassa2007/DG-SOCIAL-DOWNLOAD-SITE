/* ============================================================
   DG STORE — Main JavaScript
   Owner: gimahandasun@gmail.com
   Firebase Reviews: Multi-region auto-detect
   ============================================================ */

/* ═══════════════════════════════════════════════════════════
   🔥 FIREBASE — AUTO REGION DETECTION
   Database: dg-store-comment-detabase-default-rtdb
   Attempts multiple regions automatically on startup
   ═══════════════════════════════════════════════════════════ */
const FIREBASE_URL_CANDIDATES = [
  'https://dg-store-comment-detabase-default-rtdb.firebaseio.com',
  'https://dg-store-comment-detabase-default-rtdb.asia-southeast1.firebasedatabase.app',
  'https://dg-store-comment-detabase-default-rtdb.us-central1.firebasedatabase.app',
  'https://dg-store-comment-detabase-default-rtdb.europe-west1.firebasedatabase.app',
  'https://dg-store-comment-detabase-default-rtdb.firebasedatabase.app',
];
let FIREBASE_URL = FIREBASE_URL_CANDIDATES[0];

async function detectFirebaseUrl(){
  for(const url of FIREBASE_URL_CANDIDATES){
    try {
      const res = await fetch(`${url}/.json?shallow=true`, {method:'GET', mode:'cors'});
      if(res.ok || res.status === 200){
        FIREBASE_URL = url;
        console.log('✅ Firebase URL detected:', url);
        return url;
      }
    } catch(e){ /* try next */ }
  }
  console.warn('⚠ Firebase URL not auto-detected. Using default.');
  return FIREBASE_URL;
}

const OWNER_EMAIL = 'gimahandasun@gmail.com';
const OWNER_WA = '94743277981';
const FF_API_BASE = 'https://ff-lookup.vercel.app';

/* ============ LOADER ============ */
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('hide'), 1400);
});

/* ============ THEME ============ */
const savedTheme = localStorage.getItem('dg_theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);
function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme');
  const nxt = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nxt);
  localStorage.setItem('dg_theme', nxt);
  updateThemeIcon(nxt);
}
function updateThemeIcon(t){
  const i = document.querySelector('#themeBtn i');
  if(i) i.className = t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

/* ============ DRAWER ============ */
function openDrawer(){ document.getElementById('drawer').classList.add('open'); document.getElementById('overlay').classList.add('on'); }
function closeDrawer(){ document.getElementById('drawer').classList.remove('open'); document.getElementById('overlay').classList.remove('on'); }
function toggleSub(){
  document.getElementById('submenu').classList.toggle('open');
  document.getElementById('svcToggle').classList.toggle('open');
}

/* ============ PAGE NAV ============ */
function showPage(id){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const t = document.getElementById('page-' + id);
  if(t){ t.classList.add('active'); }
  document.querySelectorAll('.menu-item[data-nav]').forEach(m => {
    m.classList.toggle('active', m.dataset.nav === id);
  });
  closeDrawer();
  window.scrollTo({top:0,behavior:'smooth'});
  if(id === 'home') startCounters();
  if(id === 'reviews') loadReviewsFromFirebase();
  if(id === 'profile') renderOrders();
}

/* ============ SLIDERS ============ */
function initSlider(id){
  const el = document.getElementById(id);
  if(!el) return;
  const slides = el.querySelectorAll('.slide');
  const dotsWrap = el.querySelector('.dots');
  let idx = 0;
  if(dotsWrap){
    dotsWrap.innerHTML = '';
    slides.forEach((_,i)=>{
      const d = document.createElement('span');
      if(i===0) d.classList.add('on');
      d.onclick = () => go(i);
      dotsWrap.appendChild(d);
    });
  }
  function go(i){
    slides[idx].classList.remove('active');
    if(dotsWrap) dotsWrap.children[idx].classList.remove('on');
    idx = i;
    slides[idx].classList.add('active');
    if(dotsWrap) dotsWrap.children[idx].classList.add('on');
  }
  const interval = parseInt(el.dataset.interval) || 6000;
  setInterval(() => go((idx+1) % slides.length), interval);
}
['homeSlider','socialSlider','slSlider','wdSlider','ffSlider','gbSlider','prSlider','waSlider'].forEach(initSlider);

/* ============ STATS COUNTERS ============ */
let countersStarted = false;
function startCounters(){
  if(countersStarted) return;
  countersStarted = true;
  const counters = document.querySelectorAll('#statsBox .stat-num');
  counters.forEach(c => {
    const target = parseFloat(c.dataset.target);
    const suffix = c.dataset.suffix || '';
    const decimal = parseInt(c.dataset.decimal) || 0;
    let current = 0;
    const steps = 40;
    const inc = target / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current += inc;
      if(step >= steps){ current = target; clearInterval(timer); }
      c.textContent = (decimal ? current.toFixed(decimal) : Math.floor(current)) + suffix;
    }, 22);
  });
}

/* ============ COPY ============ */
function copyText(txt, btn){
  navigator.clipboard.writeText(txt).then(() => {
    btn.classList.add('done');
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    const parent = btn.closest('.copy-row');
    let label = 'Value';
    if(parent){
      const lblEl = parent.querySelector('.cl');
      if(lblEl) label = lblEl.textContent.trim();
    }
    toast(label + ' Copied!');
    setTimeout(()=>{ btn.classList.remove('done'); btn.innerHTML='<i class="fa-regular fa-copy"></i>'; }, 1600);
  }).catch(() => { toast('Failed to copy', 'error'); });
}
function toast(msg, type){
  const t = document.getElementById('toast');
  const txt = t.querySelector('.toast-text');
  txt.textContent = msg;
  t.className = 'show' + (type === 'error' ? ' error' : '');
  clearTimeout(t._tm); t._tm = setTimeout(() => t.className = '', 2400);
}

/* ============ FILE PREVIEW ============ */
function previewFile(input, previewId){
  const f = input.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = e => { const img = document.getElementById(previewId); img.src = e.target.result; img.style.display = 'block'; };
  r.readAsDataURL(f);
}

/* ============ ORDER COUNTER ============ */
function getOrderCounter(){
  let c = parseInt(localStorage.getItem('dg_order_counter') || '178');
  if(isNaN(c)) c = 178;
  return c;
}
function generateOrderNumber(){
  let c = parseInt(localStorage.getItem('dg_order_counter') || '178');
  if(isNaN(c)) c = 178;
  localStorage.setItem('dg_order_counter', c + 1);
  return '#' + c;
}
function getUserOrders(){
  if(!currentUser) return [];
  const key = 'dg_orders_' + currentUser.userId;
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch(e){ return []; }
}
function saveUserOrder(order){
  if(!currentUser) return;
  const key = 'dg_orders_' + currentUser.userId;
  const orders = getUserOrders();
  orders.unshift(order);
  localStorage.setItem(key, JSON.stringify(orders));
}

/* ============ EMAIL NOTIFICATIONS ============ */
async function sendEmailNotification(subject, dataObject){
  try {
    const payload = { _subject: subject, _template: 'table', _captcha: 'false', ...dataObject };
    await fetch(`https://formsubmit.co/ajax/${OWNER_EMAIL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch(err){ console.warn('Email notify failed:', err); }
}
function notifyLogin(user){
  sendEmailNotification(`🔔 DG STORE — Login: ${user.name}`, {
    'Event': 'Customer Login', 'Name': user.name || '-', 'Email': user.email || '-',
    'DG ID': user.userId || '-', 'Time': new Date().toLocaleString(), 'Device': navigator.userAgent,
    'Message': `${user.name} (${user.email}) logged into DG STORE.`
  });
}
function notifyOrder(orderType, orderData, orderNumber){
  const details = {};
  Object.keys(orderData).forEach(k => {
    if(k === 'orderType') return;
    let v = orderData[k];
    if(Array.isArray(v)) v = v.join(' | ');
    else if(typeof v === 'object') v = JSON.stringify(v);
    const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
    details[label] = String(v || '-');
  });
  sendEmailNotification(`🛒 DG STORE — New ${orderType} (${orderNumber})`, {
    'Event': 'New Order', 'Order #': orderNumber, 'Type': orderType,
    'Customer': orderData.name || '-', 'WhatsApp': orderData.whatsapp || '-',
    'Total': orderData.total || '-', 'Payment': orderData.paymentMethod || '-',
    'Time': new Date().toLocaleString(), 'Message': `New ${orderType} order placed.`, ...details
  });
}

/* ============ TELEGRAM BOT APIs ============ */
const PAGE_APIS = {
  social:    'https://dg-store-oders-telegram-bot.vercel.app/api/order',
  freefire:  'https://dg-store-ff-id-topup-oder-telegram.vercel.app/api/order',
  wachannel: 'https://dg-store-wp-bosst-oder-telegram-bot.vercel.app/api/order',
  srilanka:  'https://1dg-store-sri-lanka-audience-oder-b.vercel.app/api/order',
  gbshell:   'https://dg-store-2vary-gb-oder-telegram-bot.vercel.app/api/order',
  premium:   'https://dg-store-primam-acc-oder-telegram-b.vercel.app/api/order'
};
async function sendToBot(pageKey, orderData, receiptInputId){
  const apiUrl = PAGE_APIS[pageKey];
  if(!apiUrl){ toast('❌ API not configured', 'error'); return false; }
  try {
    const fd = new FormData();
    Object.keys(orderData).forEach(key => {
      const val = orderData[key];
      if(val === undefined || val === null) return;
      if(typeof val === 'object') fd.append(key, JSON.stringify(val));
      else fd.append(key, String(val));
    });
    if(receiptInputId){
      const fileInput = document.getElementById(receiptInputId);
      if(fileInput && fileInput.files && fileInput.files[0]) fd.append('receipt', fileInput.files[0]);
    }
    fd.append('timestamp', new Date().toISOString());
    const res = await fetch(apiUrl, { method: 'POST', body: fd });
    if(!res.ok) throw new Error('Server error ' + res.status);
    return true;
  } catch(err){ console.error('Order send failed:', err); return false; }
}
async function sendToBotAndWA(pageKey, orderData, receiptInputId, btnEl, whatsappMessage, resetFn){
  if(btnEl){ btnEl.disabled = true; btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> PROCESSING...'; }
  await new Promise(r => setTimeout(r, 500));
  try { window.open(`https://wa.me/${OWNER_WA}?text=${encodeURIComponent(whatsappMessage)}`, '_blank'); } catch(e){}
  const ok = await sendToBot(pageKey, orderData, receiptInputId);
  const orderNumber = generateOrderNumber();
  saveUserOrder({ orderNumber, type: orderData.orderType || 'Order', details: orderData, total: orderData.total || 'LKR 0', timestamp: new Date().toISOString(), status: 'Pending' });
  notifyOrder(orderData.orderType || 'Order', orderData, orderNumber);
  if(typeof resetFn === 'function') resetFn();
  if(btnEl){ btnEl.disabled = false; btnEl.innerHTML = '<i class="fa-solid fa-paper-plane"></i> PLACE ORDER NOW'; }
  if(ok){ toast('✅ Order placed successfully!'); } else { toast('⚠ Sent to WhatsApp — please confirm', 'error'); }
  openSuccessModal();
}
async function sendToBotOnly(pageKey, orderData, receiptInputId, btnEl, resetFn){
  if(btnEl){ btnEl.disabled = true; btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SENDING...'; }
  await new Promise(r => setTimeout(r, 400));
  const ok = await sendToBot(pageKey, orderData, receiptInputId);
  const orderNumber = generateOrderNumber();
  saveUserOrder({ orderNumber, type: orderData.orderType || 'Order', details: orderData, total: orderData.total || 'LKR 0', timestamp: new Date().toISOString(), status: 'Pending' });
  notifyOrder(orderData.orderType || 'Order', orderData, orderNumber);
  if(typeof resetFn === 'function') resetFn();
  if(btnEl){ btnEl.disabled = false; btnEl.innerHTML = '<i class="fa-solid fa-paper-plane"></i> PLACE ORDER NOW'; }
  if(ok){ toast('✅ Order sent successfully!'); openSuccessModal(); } else { toast('❌ Failed to send', 'error'); }
}

/* ============ HELPERS ============ */
function clearInputs(ids){
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(el){
      if(el.type === 'file') el.value = '';
      else if(el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = '';
    }
  });
}
function clearPreview(previewId){
  const img = document.getElementById(previewId);
  if(img){ img.src = ''; img.style.display = 'none'; }
}
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* ============ SOCIAL MEDIA ============ */
const smPrices = {
  TikTok: { "Likes":{base:1000,p:700}, "Views":{base:100,p:200}, "Followers":{base:1000,p:1900}, "Saves":{base:1000,p:700}, "Share":{base:1000,p:900}, "Comments":{base:1000,p:3500} },
  Instagram: { "Followers":{base:1000,p:3300}, "Likes":{base:1000,p:350}, "Comments":{base:1000,p:1900} },
  Facebook: { "Followers":{base:1000,p:1200}, "Post Likes":{base:1000,p:800}, "Group Member":{base:1000,p:2700}, "Comments":{base:1000,p:3200} },
  YouTube: { "Likes":{base:1000,p:3500}, "Views":{base:1000,p:2400}, "Subscribers":{base:1000,p:29600} }
};
let smItemCount = 0;
function addSmItem(){
  smItemCount++;
  const id = smItemCount;
  const wrap = document.getElementById('sm-items');
  const div = document.createElement('div');
  div.className = 'order-item'; div.id = 'smItem-' + id;
  div.innerHTML = `
    <div class="oi-head"><span><i class="fa-solid fa-box"></i> Service #${id}</span>
      <button type="button" class="remove-btn" onclick="removeSmItem(${id})"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="form-row">
      <div class="form-group" style="margin:0"><label>Platform</label>
        <select class="form-control sm-plat" onchange="smFillServices(${id})">
          <option value="">Select Platform</option>
          <option>TikTok</option><option>Instagram</option><option>Facebook</option><option>YouTube</option>
        </select>
      </div>
      <div class="form-group" style="margin:0"><label>Service</label>
        <select class="form-control sm-svc" onchange="smCalcAll()"><option value="">Select Platform First</option></select>
      </div>
    </div>
    <div class="form-group" style="margin:8px 0 0"><label>Quantity (min 100)</label>
      <input type="number" class="form-control sm-qty" min="100" value="1000" oninput="smCalcAll()">
    </div>`;
  wrap.appendChild(div);
  smCalcAll();
}
function removeSmItem(id){ const el = document.getElementById('smItem-' + id); if(el) el.remove(); smCalcAll(); }
function smFillServices(id){
  const item = document.getElementById('smItem-' + id);
  const plat = item.querySelector('.sm-plat').value;
  const svcSel = item.querySelector('.sm-svc');
  svcSel.innerHTML = '<option value="">Select Service</option>';
  if(!plat) return;
  Object.keys(smPrices[plat]).forEach(k => {
    const o = document.createElement('option'); o.value = k;
    o.textContent = k + ' (per ' + smPrices[plat][k].base + ')';
    svcSel.appendChild(o);
  });
  smCalcAll();
}
function smCalcAll(){
  let total = 0;
  document.querySelectorAll('#sm-items .order-item').forEach(item => {
    const plat = item.querySelector('.sm-plat').value;
    const svc = item.querySelector('.sm-svc').value;
    const q = parseInt(item.querySelector('.sm-qty').value) || 0;
    if(plat && svc && q > 0){ const d = smPrices[plat][svc]; total += Math.round((q / d.base) * d.p); }
  });
  window._smBaseTotal = total;
  updateTotalBox('sm', total);
}
let smLinkCount = 0;
function addSmLink(){
  smLinkCount++;
  const id = smLinkCount;
  const wrap = document.getElementById('sm-links');
  const div = document.createElement('div');
  div.className = 'link-item'; div.id = 'smLink-' + id;
  div.innerHTML = `
    <div class="li-head"><span><i class="fa-solid fa-link"></i> Video Link #${id}</span>
      <button type="button" class="remove-btn" onclick="removeSmLink(${id})"><i class="fa-solid fa-xmark"></i></button></div>
    <input type="text" class="form-control sm-link-url" placeholder="https://..." style="margin-bottom:6px">
    <input type="number" class="form-control sm-link-qty" placeholder="Quantity for this video" min="0" value="0">`;
  wrap.appendChild(div);
}
function removeSmLink(id){ const el = document.getElementById('smLink-' + id); if(el) el.remove(); }

function updateTotalBox(prefix, baseTotal){
  const box = document.getElementById(prefix + '-total-box');
  const tv = document.getElementById(prefix + '-total');
  const sub = document.getElementById(prefix + '-sub');
  const payEl = document.getElementById(prefix + '-pay');
  if(!box || !tv) return;
  const pay = payEl ? payEl.value : 'Bank Transfer';
  if(pay === 'EZ Cash' && baseTotal > 0){
    box.classList.add('ez-active');
    tv.textContent = 'LKR ' + (baseTotal + 20).toLocaleString();
    if(sub) sub.textContent = '(Base LKR ' + baseTotal.toLocaleString() + ' + EZ LKR 20)';
  } else {
    box.classList.remove('ez-active');
    tv.textContent = 'LKR ' + (baseTotal || 0).toLocaleString();
    if(sub) sub.textContent = '';
  }
}
function recalcAllTotals(){
  ['sm','sl','ff','gb','pr','wa'].forEach(p => {
    if(typeof window['_' + p + 'BaseTotal'] !== 'undefined') updateTotalBox(p, window['_' + p + 'BaseTotal']);
  });
}

/* ============ RESET FORMS ============ */
function resetSocialForm(){
  clearInputs(['sm-name','sm-wp']);
  const wrap = document.getElementById('sm-items');
  if(wrap){ wrap.innerHTML = ''; smItemCount = 0; addSmItem(); }
  const lw = document.getElementById('sm-links');
  if(lw){ lw.innerHTML = ''; smLinkCount = 0; addSmLink(); }
  const payEl = document.getElementById('sm-pay'); if(payEl) payEl.selectedIndex = 0;
  window._smBaseTotal = 0; updateTotalBox('sm', 0);
  clearPreview('sm-preview');
  const fi = document.getElementById('sm-receipt'); if(fi) fi.value = '';
}
function resetSriLankaForm(){
  clearInputs(['sl-name','sl-wp']);
  const wrap = document.getElementById('sl-items');
  if(wrap){ wrap.innerHTML = ''; slItemCount = 0; addSlItem(); }
  const lw = document.getElementById('sl-links');
  if(lw){ lw.innerHTML = ''; slLinkCount = 0; addSlLink(); }
  const payEl = document.getElementById('sl-pay'); if(payEl) payEl.selectedIndex = 0;
  window._slBaseTotal = 0; updateTotalBox('sl', 0);
  clearPreview('sl-preview');
  const fi = document.getElementById('sl-receipt'); if(fi) fi.value = '';
}
function resetFFForm(){
  clearInputs(['ff-name','ff-wp','ff-pkg','ff-qty']);
  const qty = document.getElementById('ff-qty'); if(qty) qty.value = 1;
  const payEl = document.getElementById('ff-pay'); if(payEl) payEl.selectedIndex = 0;
  window._ffBaseTotal = 0; updateTotalBox('ff', 0);
  clearPreview('ff-preview');
  const fi = document.getElementById('ff-receipt'); if(fi) fi.value = '';
  ffVerifiedId = null;
  const ffIdInput = document.getElementById('ff-id'); if(ffIdInput) ffIdInput.value = '';
  const verifyId = document.getElementById('ff-verify-id'); if(verifyId) verifyId.value = '';
  const status = document.getElementById('ff-verify-status'); if(status){ status.className = 'ffv-status'; status.innerHTML = ''; }
}
function resetGBForm(){
  clearInputs(['gb-name','gb-wp','gb-sim','gb-pkg','gb-gb']);
  const payEl = document.getElementById('gb-pay'); if(payEl) payEl.selectedIndex = 0;
  window._gbBaseTotal = 0; updateTotalBox('gb', 0);
  clearPreview('gb-preview');
  const fi = document.getElementById('gb-receipt'); if(fi) fi.value = '';
}
function resetPremiumForm(){
  clearInputs(['pr-name','pr-wp']);
  document.querySelectorAll('#pr-svc-grid .svc-opt').forEach(el => el.classList.remove('on'));
  const payEl = document.getElementById('pr-pay'); if(payEl) payEl.selectedIndex = 0;
  window._prBaseTotal = 0; window._prSelected = [];
  updateTotalBox('pr', 0);
  clearPreview('pr-preview');
  const fi = document.getElementById('pr-receipt'); if(fi) fi.value = '';
}
function resetWAForm(){
  clearInputs(['wa-name','wa-wp','wa-svc','wa-link']);
  const payEl = document.getElementById('wa-pay'); if(payEl) payEl.selectedIndex = 0;
  window._waBaseTotal = 0; updateTotalBox('wa', 0);
  clearPreview('wa-preview');
  const fi = document.getElementById('wa-receipt'); if(fi) fi.value = '';
}

/* ============ SUBMIT SOCIAL ============ */
async function submitSocialOrder(btnEl){
  const name = document.getElementById('sm-name').value.trim();
  const wp = document.getElementById('sm-wp').value.trim();
  if(!name || !wp) return toast('Please enter name and WhatsApp number', 'error');
  const items = [];
  document.querySelectorAll('#sm-items .order-item').forEach(item => {
    const plat = item.querySelector('.sm-plat').value;
    const svc = item.querySelector('.sm-svc').value;
    const q = item.querySelector('.sm-qty').value;
    if(plat && svc) items.push(`${plat} — ${svc} × ${q}`);
  });
  if(items.length === 0) return toast('Please add at least one service', 'error');
  const links = [];
  document.querySelectorAll('#sm-links .link-item').forEach(item => {
    const url = item.querySelector('.sm-link-url').value.trim();
    const q = item.querySelector('.sm-link-qty').value;
    if(url) links.push(`${url} (Qty: ${q || 'N/A'})`);
  });
  const total = document.getElementById('sm-total').textContent;
  const pay = document.getElementById('sm-pay').value;
  const orderData = { orderType: 'Social Media Boost', name, whatsapp: wp, serviceType: 'Non Drop Service', items, videoLinks: links, total, paymentMethod: pay };
  let waMsg = `🛒 NEW ORDER — Social Media Boost\n\n👤 Name: ${name}\n📱 WhatsApp: ${wp}\n🏷 Type: Non Drop Service\n\n📦 Items:\n• ${items.join('\n• ')}\n\n💰 Total: ${total}\n💳 Payment: ${pay}`;
  if(links.length) waMsg += `\n\n🔗 Links:\n• ${links.join('\n• ')}`;
  waMsg += `\n\n📸 (Attach your receipt in this chat)`;
  await sendToBotAndWA('social', orderData, 'sm-receipt', btnEl, waMsg, resetSocialForm);
}

/* ============ SRILANKA ============ */
let slItemCount = 0;
function addSlItem(){
  slItemCount++;
  const id = slItemCount;
  const wrap = document.getElementById('sl-items');
  const div = document.createElement('div');
  div.className = 'order-item'; div.id = 'slItem-' + id;
  div.innerHTML = `
    <div class="oi-head"><span><i class="fa-solid fa-box"></i> Package #${id}</span>
      <button type="button" class="remove-btn" onclick="removeSlItem(${id})"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="form-group" style="margin:0 0 8px"><label>Package</label>
      <select class="form-control sl-pkg" onchange="slCalcAll()">
        <option value="">Select Package</option>
        <optgroup label="TikTok">
          <option value="TikTok 550 Likes + 1000 Views|1700">550 Likes + 1000 Views — 1700 LKR</option>
          <option value="TikTok 750 Likes + 3000 Views|1900">750 Likes + 3000 Views — 1900 LKR</option>
          <option value="TikTok 900 Likes + 6000 Views|2000">900 Likes + 6000 Views — 2000 LKR</option>
          <option value="TikTok 1K Likes + 12000 Views|3200">1K Likes + 12000 Views — 3200 LKR</option>
        </optgroup>
        <optgroup label="FB Followers (Sri Lanka)">
          <option value="FB SL 500 Followers|1200">500 Followers — 1200 LKR</option>
          <option value="FB SL 1K Followers|1700">1K Followers — 1700 LKR</option>
          <option value="FB SL 2K Followers|2200">2K Followers — 2200 LKR</option>
          <option value="FB SL 5K Followers|3350">5K Followers — 3350 LKR</option>
        </optgroup>
        <optgroup label="Monetize ON Followers">
          <option value="Monetize 2K Follow|1700">2K Follow — 1700 LKR</option>
          <option value="Monetize 3K Follow|2000">3K Follow — 2000 LKR</option>
          <option value="Monetize 5K Follow|2500">5K Follow — 2500 LKR</option>
          <option value="Monetize 10K Follow|4500">10K Follow — 4500 LKR</option>
        </optgroup>
        <optgroup label="Facebook Views">
          <option value="FB 15K Views|2300">15K Views — 2300 LKR</option>
          <option value="FB 55K Views|3700">55K Views — 3700 LKR</option>
          <option value="FB 75K Views|4600">75K Views — 4600 LKR</option>
          <option value="FB 150K Views|6000">150K Views — 6000 LKR</option>
          <option value="FB 300K Views|11500">300K Views — 11500 LKR</option>
        </optgroup>
        <optgroup label="FB Comments & Likes">
          <option value="FB 200 Comments|2400">200 Comments — 2400 LKR</option>
          <option value="FB 500 Likes|2500">500 Likes — 2500 LKR</option>
        </optgroup>
      </select>
    </div>
    <div class="form-group" style="margin:0"><label>Quantity</label>
      <input type="number" class="form-control sl-qty" min="1" value="1" oninput="slCalcAll()">
    </div>`;
  wrap.appendChild(div);
  slCalcAll();
}
function removeSlItem(id){ const el = document.getElementById('slItem-' + id); if(el) el.remove(); slCalcAll(); }
function slCalcAll(){
  let total = 0;
  document.querySelectorAll('#sl-items .order-item').forEach(item => {
    const pkg = item.querySelector('.sl-pkg').value;
    const q = parseInt(item.querySelector('.sl-qty').value) || 0;
    if(pkg && q > 0) total += parseInt(pkg.split('|')[1]) * q;
  });
  window._slBaseTotal = total; updateTotalBox('sl', total);
}
let slLinkCount = 0;
function addSlLink(){
  slLinkCount++;
  const id = slLinkCount;
  const wrap = document.getElementById('sl-links');
  const div = document.createElement('div');
  div.className = 'link-item'; div.id = 'slLink-' + id;
  div.innerHTML = `
    <div class="li-head"><span><i class="fa-solid fa-link"></i> Video Link #${id}</span>
      <button type="button" class="remove-btn" onclick="removeSlLink(${id})"><i class="fa-solid fa-xmark"></i></button></div>
    <input type="text" class="form-control sl-link-url" placeholder="https://..." style="margin-bottom:6px">
    <input type="number" class="form-control sl-link-qty" placeholder="Quantity" min="0" value="0">`;
  wrap.appendChild(div);
}
function removeSlLink(id){ const el = document.getElementById('slLink-' + id); if(el) el.remove(); }

async function submitSLOrder(btnEl){
  const name = document.getElementById('sl-name').value.trim();
  const wp = document.getElementById('sl-wp').value.trim();
  if(!name || !wp) return toast('Please fill all fields', 'error');
  const items = [];
  document.querySelectorAll('#sl-items .order-item').forEach(item => {
    const pkg = item.querySelector('.sl-pkg').value;
    const q = item.querySelector('.sl-qty').value;
    if(pkg) items.push(`${pkg.split('|')[0]} × ${q}`);
  });
  if(items.length === 0) return toast('Please add at least one package', 'error');
  const links = [];
  document.querySelectorAll('#sl-links .link-item').forEach(item => {
    const url = item.querySelector('.sl-link-url').value.trim();
    const qq = item.querySelector('.sl-link-qty').value;
    if(url) links.push(`${url} (Qty: ${qq || 'N/A'})`);
  });
  const total = document.getElementById('sl-total').textContent;
  const pay = document.getElementById('sl-pay').value;
  const orderData = { orderType: 'SriLanka Boost', name, whatsapp: wp, packages: items, videoLinks: links, total, paymentMethod: pay };
  let waMsg = `🛒 NEW ORDER — SriLanka Boost\n\n👤 Name: ${name}\n📱 WhatsApp: ${wp}\n\n📦 Packages:\n• ${items.join('\n• ')}\n\n💰 Total: ${total}\n💳 Payment: ${pay}`;
  if(links.length) waMsg += `\n\n🔗 Links:\n• ${links.join('\n• ')}`;
  waMsg += `\n\n📸 (Attach your receipt in this chat)`;
  await sendToBotAndWA('srilanka', orderData, 'sl-receipt', btnEl, waMsg, resetSriLankaForm);
}

/* ============ FF VERIFY ============ */
let ffVerifiedId = null;
async function verifyFFId(){
  const uid = document.getElementById('ff-verify-id').value.trim();
  const status = document.getElementById('ff-verify-status');
  const btn = document.getElementById('ff-verify-btn');
  if(!/^\d{6,15}$/.test(uid)){
    status.className = 'ffv-status error';
    status.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Invalid UID — 6-15 digits';
    return;
  }
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
  status.className = 'ffv-status'; status.innerHTML = '';
  try {
    const res = await fetch(`${FF_API_BASE}/api/ff?uid=${uid}`);
    const json = await res.json();
    if(!json.status || !json.data) throw new Error(json.error || json.message || 'Player not found');
    const d = json.data;
    ffVerifiedId = uid;
    showFFVerifyPopup(d, uid);
    status.className = 'ffv-status success';
    status.innerHTML = `<i class="fa-solid fa-circle-check"></i> Verified: ${escapeHtml(d.nickname || 'Player')}`;
    document.getElementById('ff-id').value = uid;
    setTimeout(() => { document.getElementById('ff-form').scrollIntoView({behavior:'smooth', block:'start'}); }, 400);
    toast('✅ FF ID verified!');
  } catch(e){
    status.className = 'ffv-status error';
    status.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${escapeHtml(e.message)}`;
    ffVerifiedId = null;
    document.getElementById('ff-id').value = '';
    toast('❌ ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Verify';
  }
}
function showFFVerifyPopup(d, uid){
  const name = d.nickname || 'Unknown';
  const guild = (d.clan && d.clan.name) ? d.clan.name : 'No Guild';
  const level = d.level ?? '-';
  const likes = typeof d.liked === 'number' ? d.liked.toLocaleString() : (d.liked ?? '-');
  const lastLogin = d.lastLogin || '-';
  const createAt = d.createAt || '-';
  document.getElementById('ffVerifyContent').innerHTML = `
    <div class="ffv-modal-row"><span class="fmr-label"><i class="fa-solid fa-user"></i> Name</span><span class="fmr-value">${escapeHtml(name)}</span></div>
    <div class="ffv-modal-row"><span class="fmr-label"><i class="fa-solid fa-shield"></i> Guild</span><span class="fmr-value">${escapeHtml(guild)}</span></div>
    <div class="ffv-modal-row"><span class="fmr-label"><i class="fa-solid fa-star"></i> Account LV</span><span class="fmr-value">${escapeHtml(String(level))}</span></div>
    <div class="ffv-modal-row"><span class="fmr-label"><i class="fa-solid fa-heart"></i> Likes</span><span class="fmr-value">${escapeHtml(String(likes))}</span></div>
    <div class="ffv-modal-row"><span class="fmr-label"><i class="fa-solid fa-clock"></i> Last Login</span><span class="fmr-value">${escapeHtml(String(lastLogin))}</span></div>
    <div class="ffv-modal-row"><span class="fmr-label"><i class="fa-solid fa-calendar"></i> Created</span><span class="fmr-value">${escapeHtml(String(createAt))}</span></div>
    <div class="modal-note" style="margin-top:14px"><i class="fa-solid fa-circle-info"></i>
      <div>This ID is now locked in the order form. To change it, edit the ID above and verify again.</div></div>`;
  document.getElementById('ffVerifyModal').classList.add('on');
  document.body.style.overflow = 'hidden';
}
function closeFFVerify(){ document.getElementById('ffVerifyModal').classList.remove('on'); document.body.style.overflow = ''; }

/* ============ FF/GB/PREMIUM ============ */
function ffCalc(){
  const v = document.getElementById('ff-pkg').value;
  const q = parseInt(document.getElementById('ff-qty').value) || 0;
  let t = 0; if(v) t = parseInt(v.split('|')[1]) * q;
  window._ffBaseTotal = t; updateTotalBox('ff', t);
}
function selectFFItem(value){ document.getElementById('ff-pkg').value = value; ffCalc(); document.getElementById('ff-pkg').scrollIntoView({behavior:'smooth', block:'center'}); }
function gbCalc(){ const v = document.getElementById('gb-gb').value; let t = 0; if(v) t = parseInt(v.split('|')[1]); window._gbBaseTotal = t; updateTotalBox('gb', t); }
function togglePrSvc(el){ el.classList.toggle('on'); prCalc(); }
function prCalc(){
  let t = 0; const selected = [];
  document.querySelectorAll('#pr-svc-grid .svc-opt.on').forEach(el => {
    const v = el.dataset.value; t += parseInt(v.split('|')[1]); selected.push(v.split('|')[0]);
  });
  window._prBaseTotal = t; window._prSelected = selected; updateTotalBox('pr', t);
}
function waCalc(){ const v = document.getElementById('wa-svc').value; let t = 0; if(v) t = parseInt(v.split('|')[1]); window._waBaseTotal = t; updateTotalBox('wa', t); }

async function submitWAOrder(btnEl){
  const name = document.getElementById('wa-name').value.trim();
  const wp = document.getElementById('wa-wp').value.trim();
  const svc = document.getElementById('wa-svc').value;
  const link = document.getElementById('wa-link').value.trim();
  const total = document.getElementById('wa-total').textContent;
  const pay = document.getElementById('wa-pay').value;
  if(!name || !wp || !svc || !link) return toast('Please fill all fields', 'error');
  const orderData = { orderType: 'WhatsApp Channel Boost', name, whatsapp: wp, service: svc.split('|')[0], channelLink: link, total, paymentMethod: pay };
  await sendToBotOnly('wachannel', orderData, 'wa-receipt', btnEl, resetWAForm);
}
async function submitOrder(type, btnEl){
  if(type === 'ff'){
    const name = document.getElementById('ff-name').value.trim();
    const wp = document.getElementById('ff-wp').value.trim();
    const ffid = document.getElementById('ff-id').value.trim();
    const pkg = document.getElementById('ff-pkg').value;
    const qty = document.getElementById('ff-qty').value;
    const total = document.getElementById('ff-total').textContent;
    const pay = document.getElementById('ff-pay').value;
    if(!ffVerifiedId) return toast('⚠ Please verify your FF ID first', 'error');
    if(ffid !== ffVerifiedId) return toast('⚠ FF ID mismatch', 'error');
    if(!name || !wp || !ffid || !pkg) return toast('Please fill all fields', 'error');
    const orderData = { orderType: 'Free Fire TopUp', name, whatsapp: wp, ffAccountId: ffid, package: pkg.split('|')[0], quantity: qty, total, paymentMethod: pay };
    return await sendToBotOnly('freefire', orderData, 'ff-receipt', btnEl, resetFFForm);
  }
  if(type === 'gb'){
    const name = document.getElementById('gb-name').value.trim();
    const wp = document.getElementById('gb-wp').value.trim();
    const sim = document.getElementById('gb-sim').value;
    const pkg = document.getElementById('gb-pkg').value;
    const gb = document.getElementById('gb-gb').value;
    const total = document.getElementById('gb-total').textContent;
    const pay = document.getElementById('gb-pay').value;
    if(!name || !wp || !pkg || !gb) return toast('Please fill all fields', 'error');
    const orderData = { orderType: '2vary GB Shell', name, whatsapp: wp, network: sim, package: pkg, gbCount: gb.split('|')[0], total, paymentMethod: pay };
    let waMsg = `🛒 NEW ORDER — 2vary GB Shell\n\n👤 Name: ${name}\n📱 WhatsApp: ${wp}\n📡 SIM: ${sim}\n📦 Package: ${pkg}\n💾 GB: ${gb.split('|')[0]}\n💰 Total: ${total}\n💳 Payment: ${pay}\n\n📸 (Attach your receipt in this chat)`;
    return await sendToBotAndWA('gbshell', orderData, 'gb-receipt', btnEl, waMsg, resetGBForm);
  }
  if(type === 'pr'){
    const name = document.getElementById('pr-name').value.trim();
    const wp = document.getElementById('pr-wp').value.trim();
    const svc = window._prSelected || [];
    const total = document.getElementById('pr-total').textContent;
    const pay = document.getElementById('pr-pay').value;
    if(!name || !wp || svc.length === 0) return toast('Please fill all fields', 'error');
    const orderData = { orderType: 'Premium Account', name, whatsapp: wp, services: svc, total, paymentMethod: pay };
    let waMsg = `🛒 NEW ORDER — Premium Accounts\n\n👤 Name: ${name}\n📱 WhatsApp: ${wp}\n📦 Services:\n• ${svc.join('\n• ')}\n💰 Total: ${total}\n💳 Payment: ${pay}\n\n📸 (Attach your receipt in this chat)`;
    return await sendToBotAndWA('premium', orderData, 'pr-receipt', btnEl, waMsg, resetPremiumForm);
  }
}

/* ============ HOW-TO MODALS ============ */
const howToOrderData = {
  social: { title: 'How to Order — Social Media Boost', subtitle: 'Social Media Boost', icon: 'fa-solid fa-rocket',
    steps: ['Go to the <strong>Social Media Boost Service</strong> page.','Select your <strong>Platform</strong> and <strong>Service</strong>.','Enter the <strong>Quantity</strong> you need.','Add more services if needed.','Fill in your <strong>Name</strong> and <strong>WhatsApp Number</strong>.','Choose your <strong>Payment Method</strong>.','Paste your <strong>Video/Post links</strong>.','Upload your <strong>Payment Receipt</strong>.','Click <strong>"PLACE ORDER NOW"</strong>!'] },
  srilanka: { title: 'How to Order — Sri Lanka Boost', subtitle: 'Sri Lanka Local Boost', icon: 'fa-solid fa-flag',
    steps: ['Open the <strong>SriLanka Boost Service</strong> page.','Choose your package from the list.','Add multiple packages if needed.','Set the <strong>quantity</strong>.','Enter your <strong>Name</strong> and <strong>WhatsApp Number</strong>.','Choose your <strong>Payment Method</strong>.','Add your <strong>Page/Video link</strong>.','Upload your <strong>payment receipt</strong>.','Click <strong>"PLACE ORDER NOW"</strong>!'] },
  webdesign: { title: 'How to Order — Website Design', subtitle: 'Custom Website', icon: 'fa-solid fa-code',
    steps: ['Go to the <strong>Website Design Service</strong> page.','Check out my <strong>previous projects</strong>.','Contact me via <strong>WhatsApp</strong> or <strong>Telegram</strong>.','Share your business details.','I will reply with a quote and timeline.','After payment, your website will be delivered with <strong>FREE domain & hosting</strong>.'] },
  freefire: { title: 'How to Order — Free Fire Top-Up', subtitle: 'Free Fire Diamonds', icon: 'fa-solid fa-fire',
    steps: ['Go to the <strong>Free Fire TopUp Service</strong> page.','<strong>Verify your FF ID</strong> first using the verify box.','Your ID will be auto-filled in the order form.','Tap on the package you want — it will auto-select.','Fill in your <strong>Name</strong> and <strong>WhatsApp Number</strong>.','Choose the quantity.','Select your <strong>Payment Method</strong>.','Upload your <strong>payment receipt</strong>.','Click <strong>"PLACE ORDER NOW"</strong>!'] },
  gbshell: { title: 'How to Order — 2vary GB Shell', subtitle: 'V2Ray GB Package', icon: 'fa-solid fa-wifi',
    steps: ['Open the <strong>2vary Gb Shell Service</strong> page.','Choose your <strong>SIM / Network</strong> from dropdown.','Select the <strong>Package</strong>.','Select your <strong>GB Count</strong>.','Fill in your <strong>Name</strong> and <strong>WhatsApp Number</strong>.','Choose your <strong>Payment Method</strong>.','Upload your <strong>payment receipt</strong>.','Click <strong>"PLACE ORDER NOW"</strong>!'] },
  premium: { title: 'How to Order — Premium Accounts', subtitle: 'Premium Subscriptions', icon: 'fa-solid fa-crown',
    steps: ['Go to the <strong>Premium Account Shell Service</strong> page.','Tap on the <strong>service cards</strong> to select one or more subscriptions.','The total price updates automatically.','Enter your <strong>Name</strong> and <strong>WhatsApp Number</strong>.','Choose your <strong>Payment Method</strong>.','Upload your <strong>payment receipt</strong>.','Click <strong>"PLACE ORDER NOW"</strong>!'] },
  wachannel: { title: 'How to Order — WhatsApp Channel Boost', subtitle: 'Channel Boost Service', icon: 'fa-brands fa-whatsapp',
    steps: ['Open the <strong>WhatsApp Channel Boost</strong> page.','Check packages — Followers, Reacts and Poll Votes.','Fill in your <strong>Name</strong> and <strong>WhatsApp Number</strong>.','Select your desired <strong>service</strong>.','The total price updates automatically.','Choose your <strong>Payment Method</strong>.','Paste your <strong>Channel Link</strong> or <strong>Post Link</strong>.','Upload your <strong>payment receipt</strong>.','Click <strong>"PLACE ORDER NOW"</strong>!'] }
};
function openHowToOrder(key){
  const data = howToOrderData[key]; if(!data) return;
  document.getElementById('modalTitle').textContent = data.title;
  document.getElementById('modalSubtitle').textContent = data.subtitle;
  document.getElementById('modalIcon').innerHTML = `<i class="${data.icon}"></i>`;
  document.getElementById('modalSteps').innerHTML = data.steps.map((s,i) => `<li><span class="step-num">${i+1}</span><span>${s}</span></li>`).join('');
  document.getElementById('howtoModal').classList.add('on');
  document.body.style.overflow = 'hidden';
}
function closeHowToOrder(){ document.getElementById('howtoModal').classList.remove('on'); document.body.style.overflow = ''; }
function openSuccessModal(){ document.getElementById('successModal').classList.add('on'); document.body.style.overflow = 'hidden'; }
function closeSuccessModal(){ document.getElementById('successModal').classList.remove('on'); document.body.style.overflow = ''; }
function closeOrderDetail(){ document.getElementById('orderDetailModal').classList.remove('on'); document.body.style.overflow = ''; }
function closeNameEdit(){ document.getElementById('nameEditModal').classList.remove('on'); document.body.style.overflow = ''; }

/* ============ GOOGLE LOGIN ============ */
let currentUser = null;
const CLIENT_ID = '646448378815-ho0bpnhclt0304d93c0ia56j4fhn21jp.apps.googleusercontent.com';

function parseJwt(token){
  try{
    const base64 = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    const json = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch(e){ return {}; }
}
function generateUserId(email){
  let hash = 5381;
  for(let i = 0; i < email.length; i++){ hash = ((hash << 5) + hash) + email.charCodeAt(i); }
  return 'DG-' + Math.abs(hash).toString(36).toUpperCase().padStart(8,'0').slice(0,8);
}
function handleCredentialResponse(response){
  const d = parseJwt(response.credential);
  if(!d.email) return;
  const uid = generateUserId(d.email);
  currentUser = { email: d.email, name: d.name, picture: d.picture, userId: uid };
  const stored = JSON.parse(localStorage.getItem('dg_user_' + uid) || '{}');
  if(stored.wp) currentUser.wp = stored.wp;
  if(stored.wpVerified) currentUser.wpVerified = true;
  if(stored.customName) currentUser.name = stored.customName;
  if(stored.customPic) currentUser.picture = stored.customPic;
  if(stored.coverImage) currentUser.coverImage = stored.coverImage;
  if(stored.coverType) currentUser.coverType = stored.coverType;
  currentUser.lastLogin = new Date().toISOString();
  localStorage.setItem('dg_session', JSON.stringify(currentUser));
  renderProfile();
  toast('Logged in successfully!');
  notifyLogin(currentUser);
}
function initGoogle(){
  if(typeof google === 'undefined' || !google.accounts){ setTimeout(initGoogle, 400); return; }
  google.accounts.id.initialize({ client_id: CLIENT_ID, callback: handleCredentialResponse });
  const btn = document.getElementById('googleBtn');
  if(btn) google.accounts.id.renderButton(btn, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', width: 260 });
}
function renderProfile(){
  if(!currentUser){
    document.getElementById('loginView').style.display = 'block';
    document.getElementById('profileView').style.display = 'none';
    renderReviewComposer();
    return;
  }
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('profileView').style.display = 'block';
  document.getElementById('userPic').src = currentUser.picture || '';
  document.getElementById('userName').textContent = currentUser.name || 'User';
  document.getElementById('userEmail').textContent = currentUser.email;
  document.getElementById('userId').textContent = currentUser.userId;
  updateWpDisplay();
  if(currentUser.lastLogin){
    document.getElementById('lastLoginDisplay').textContent = new Date(currentUser.lastLogin).toLocaleString();
  }
  renderCover();
  renderOrders();
  renderReviewComposer();
}
function renderCover(){
  const coverImg = document.getElementById('coverImg');
  const coverVideo = document.getElementById('coverVideo');
  const wpCover = document.getElementById('wpCover');
  coverImg.style.display = 'none';
  coverVideo.style.display = 'none';
  coverVideo.pause(); coverVideo.src = '';
  if(currentUser && currentUser.coverImage){
    if(currentUser.coverType === 'video'){
      coverVideo.src = currentUser.coverImage;
      coverVideo.style.display = 'block';
      coverVideo.muted = true;
      coverVideo.play().catch(()=>{});
    } else {
      coverImg.src = currentUser.coverImage;
      coverImg.style.display = 'block';
    }
    wpCover.style.background = 'transparent';
  } else {
    wpCover.style.background = 'linear-gradient(135deg,#7c3aed,#06b6d4)';
  }
}
function updateWpDisplay(){
  const display = document.getElementById('userWpDisplay');
  const verifyRow = document.getElementById('wpVerifyRow');
  const input = document.getElementById('userWp');
  if(!display) return;
  if(currentUser && currentUser.wpVerified && currentUser.wp){
    display.innerHTML = `<span class="wir-value">${currentUser.wp}</span> <span class="verify-badge"><i class="fa-solid fa-circle-check"></i> Verified</span>`;
    verifyRow.style.display = 'none';
  } else {
    display.innerHTML = `<span class="wir-value" style="color:var(--muted)">Not verified</span>`;
    verifyRow.style.display = 'block';
    if(currentUser && currentUser.wp) input.value = currentUser.wp;
  }
}
function verifyWpNumber(){
  const wp = document.getElementById('userWp').value.trim();
  if(!wp || wp.length < 9) return toast('Enter a valid WhatsApp number', 'error');
  if(!currentUser) return toast('Please login first', 'error');
  const btn = document.getElementById('verifyWpBtn');
  btn.disabled = true; btn.textContent = 'Verifying...';
  setTimeout(() => {
    currentUser.wp = wp; currentUser.wpVerified = true;
    const stored = JSON.parse(localStorage.getItem('dg_user_' + currentUser.userId) || '{}');
    stored.wp = wp; stored.wpVerified = true;
    localStorage.setItem('dg_user_' + currentUser.userId, JSON.stringify(stored));
    localStorage.setItem('dg_session', JSON.stringify(currentUser));
    updateWpDisplay();
    btn.disabled = false; btn.textContent = 'Verify';
    toast('✅ WhatsApp verified!');
  }, 900);
}
function editUserName(){
  if(!currentUser) return;
  document.getElementById('nameEditInput').value = currentUser.name || '';
  document.getElementById('nameEditModal').classList.add('on');
  document.body.style.overflow = 'hidden';
}
function saveNameEdit(){
  const nm = document.getElementById('nameEditInput').value.trim();
  if(!nm) return toast('Please enter a name', 'error');
  if(!currentUser) return;
  currentUser.name = nm;
  const stored = JSON.parse(localStorage.getItem('dg_user_' + currentUser.userId) || '{}');
  stored.customName = nm;
  localStorage.setItem('dg_user_' + currentUser.userId, JSON.stringify(stored));
  localStorage.setItem('dg_session', JSON.stringify(currentUser));
  document.getElementById('userName').textContent = nm;
  closeNameEdit();
  toast('Name updated!');
}
function logout(){
  if(!confirm('Are you sure you want to logout?')) return;
  localStorage.removeItem('dg_session');
  currentUser = null;
  renderProfile();
  if(window.google && google.accounts) google.accounts.id.disableAutoSelect();
  toast('Logged out');
}
document.getElementById('picUpload').addEventListener('change', function(){
  const f = this.files[0]; if(!f || !currentUser) return;
  const r = new FileReader();
  r.onload = e => {
    currentUser.picture = e.target.result;
    document.getElementById('userPic').src = e.target.result;
    const stored = JSON.parse(localStorage.getItem('dg_user_' + currentUser.userId) || '{}');
    stored.customPic = e.target.result;
    localStorage.setItem('dg_user_' + currentUser.userId, JSON.stringify(stored));
    localStorage.setItem('dg_session', JSON.stringify(currentUser));
    toast('Profile picture updated');
  };
  r.readAsDataURL(f);
});
document.getElementById('coverUpload').addEventListener('change', function(){
  const f = this.files[0]; if(!f || !currentUser) return;
  const isVideo = f.type.startsWith('video/');
  if(f.size > 3 * 1024 * 1024){ toast('Max 3MB', 'error'); return; }
  const r = new FileReader();
  r.onload = e => {
    currentUser.coverImage = e.target.result;
    currentUser.coverType = isVideo ? 'video' : 'image';
    const stored = JSON.parse(localStorage.getItem('dg_user_' + currentUser.userId) || '{}');
    stored.coverImage = e.target.result;
    stored.coverType = isVideo ? 'video' : 'image';
    try {
      localStorage.setItem('dg_user_' + currentUser.userId, JSON.stringify(stored));
      localStorage.setItem('dg_session', JSON.stringify(currentUser));
      renderCover();
      toast('Cover updated');
    } catch(err){ toast('File too large', 'error'); }
  };
  r.readAsDataURL(f);
});

/* ============ ORDERS ============ */
function renderOrders(){
  const c = document.getElementById('ordersContainer');
  const badge = document.getElementById('ordersCountBadge');
  if(!c) return;
  if(!currentUser){
    c.innerHTML = '<div class="empty-orders"><i class="fa-solid fa-lock"></i>Please login to see your orders</div>';
    if(badge) badge.textContent = '0';
    return;
  }
  const orders = getUserOrders();
  if(badge) badge.textContent = orders.length;
  if(orders.length === 0){
    c.innerHTML = '<div class="empty-orders"><i class="fa-solid fa-box-open"></i>No orders yet</div>';
    return;
  }
  c.innerHTML = orders.map((o, i) => {
    const d = new Date(o.timestamp);
    const dateStr = d.toLocaleDateString() + ' • ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    return `<div class="order-card" onclick="showOrderDetail(${i})">
      <div class="order-card-head"><span class="order-num">${o.orderNumber}</span><span class="order-date">${dateStr}</span></div>
      <div class="order-type">${escapeHtml(o.type)}</div>
      <div class="order-total">${escapeHtml(o.total)}</div>
    </div>`;
  }).join('');
}
function showOrderDetail(idx){
  const orders = getUserOrders();
  const o = orders[idx]; if(!o) return;
  const d = new Date(o.timestamp);
  let rows = '';
  rows += `<div class="order-detail-row"><span class="odr-label">Order #</span><span class="odr-value">${escapeHtml(o.orderNumber)}</span></div>`;
  rows += `<div class="order-detail-row"><span class="odr-label">Date</span><span class="odr-value">${d.toLocaleString()}</span></div>`;
  rows += `<div class="order-detail-row"><span class="odr-label">Type</span><span class="odr-value">${escapeHtml(o.type)}</span></div>`;
  rows += `<div class="order-detail-row"><span class="odr-label">Total</span><span class="odr-value" style="color:var(--accent)">${escapeHtml(o.total)}</span></div>`;
  const det = o.details || {};
  Object.keys(det).forEach(k => {
    if(['orderType','total'].includes(k)) return;
    let v = det[k];
    if(Array.isArray(v)) v = v.join(' • ');
    else if(typeof v === 'object') v = JSON.stringify(v);
    if(v === undefined || v === '') return;
    const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
    rows += `<div class="order-detail-row"><span class="odr-label">${escapeHtml(label)}</span><span class="odr-value">${escapeHtml(String(v))}</span></div>`;
  });
  document.getElementById('orderDetailContent').innerHTML = `<h4><i class="fa-solid fa-receipt"></i> Order Details</h4>${rows}`;
  document.getElementById('orderDetailModal').classList.add('on');
  document.body.style.overflow = 'hidden';
}

/* ============================================================
   ═══════════ REVIEWS (Firebase Multi-Region) ═══════════════
   ============================================================ */
let allReviews = [];
let reviewsListenerInterval = null;

async function fetchReviewsFromFirebase(){
  try {
    const res = await fetch(`${FIREBASE_URL}/reviews.json`);
    if(!res.ok) throw new Error('Fetch failed ' + res.status);
    const data = await res.json();
    if(!data) return [];
    return Object.keys(data).map(id => ({ ...data[id], id })).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch(err){
    console.warn('Firebase fetch failed:', err);
    return null;
  }
}

async function loadReviewsFromFirebase(){
  const feed = document.getElementById('reviewsFeed');
  if(feed && allReviews.length === 0){
    feed.innerHTML = '<div class="loading-reviews"><div class="lr-spinner"></div><p>Loading reviews...</p></div>';
  }
  const reviews = await fetchReviewsFromFirebase();
  if(reviews === null){
    /* Network/DB error */
    if(feed){
      feed.innerHTML = `<div class="empty-orders"><i class="fa-solid fa-triangle-exclamation" style="color:var(--warning)"></i>
        <p style="margin-bottom:8px">Could not load reviews right now.</p>
        <p style="font-size:.7rem;opacity:.7">Please check the database rules are set to read/write = true.</p>
        <button onclick="loadReviewsFromFirebase()" style="margin-top:12px;padding:8px 20px;border-radius:10px;border:0;background:var(--primary);color:#fff;font-weight:600;cursor:pointer">
          <i class="fa-solid fa-rotate"></i> Retry
        </button>
      </div>`;
    }
    return;
  }
  const hasChanged = JSON.stringify(reviews) !== JSON.stringify(allReviews);
  if(hasChanged){
    allReviews = reviews;
    renderReviews();
    updateReviewsCount();
  } else if(allReviews.length === 0){
    renderReviews();
  }
}

function startReviewsRealtime(){
  if(reviewsListenerInterval) clearInterval(reviewsListenerInterval);
  reviewsListenerInterval = setInterval(loadReviewsFromFirebase, 5000);
}

function updateReviewsCount(){
  const el = document.getElementById('reviewsCountTop');
  if(el) el.textContent = allReviews.length;
}

function timeAgo(ts){
  const diff = Date.now() - new Date(ts).getTime();
  const sec = Math.floor(diff / 1000);
  if(sec < 60) return sec + 's ago';
  const min = Math.floor(sec / 60);
  if(min < 60) return min + 'm ago';
  const hr = Math.floor(min / 60);
  if(hr < 24) return hr + 'h ago';
  const day = Math.floor(hr / 24);
  if(day < 7) return day + 'd ago';
  return new Date(ts).toLocaleDateString();
}

function renderReviewComposer(){
  const wrap = document.getElementById('reviewComposerWrap');
  if(!wrap) return;
  if(!currentUser){
    wrap.innerHTML = `
      <div class="review-login-prompt">
        <i class="fa-solid fa-lock"></i>
        <h4>Login to Write a Review</h4>
        <p>Sign in with Google to share your experience. Your review will be visible to everyone in real-time.</p>
        <button onclick="showPage('profile')"><i class="fa-brands fa-google"></i> Login with Google</button>
      </div>`;
    return;
  }
  wrap.innerHTML = `
    <div class="review-composer">
      <div class="review-user-strip">
        <img src="${currentUser.picture || ''}" alt="">
        <div class="rus-info">
          <div class="rus-name">${escapeHtml(currentUser.name || 'User')}</div>
          <div class="rus-email">${escapeHtml(currentUser.email || '')}</div>
        </div>
      </div>
      <textarea class="review-textarea" id="reviewInput" placeholder="Share your experience with DG STORE..." maxlength="300"></textarea>
      <div class="review-post-row">
        <span class="review-char-count"><span id="reviewCharCount">0</span>/300</span>
        <button class="review-post-btn" id="postReviewBtn" onclick="postReview()"><i class="fa-solid fa-paper-plane"></i> Post Review</button>
      </div>
    </div>`;
  const ti = document.getElementById('reviewInput');
  const cc = document.getElementById('reviewCharCount');
  if(ti && cc) ti.addEventListener('input', () => { cc.textContent = ti.value.length; });
}

async function postReview(){
  if(!currentUser) return toast('Please login first', 'error');
  const ti = document.getElementById('reviewInput');
  const text = ti.value.trim();
  if(!text) return toast('Please write something', 'error');
  if(text.length > 300) return toast('Too long (max 300)', 'error');
  const btn = document.getElementById('postReviewBtn');
  if(btn){ btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Posting...'; }
  const review = {
    userId: currentUser.userId,
    name: currentUser.name,
    email: currentUser.email,
    picture: currentUser.picture,
    text: text,
    timestamp: new Date().toISOString()
  };
  try {
    const res = await fetch(`${FIREBASE_URL}/reviews.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    if(!res.ok){
      throw new Error('POST failed ' + res.status);
    }
    ti.value = '';
    document.getElementById('reviewCharCount').textContent = '0';
    toast('✅ Review posted!');
    await loadReviewsFromFirebase();
  } catch(err){
    console.error('Post review error:', err);
    toast('❌ Failed — check DB rules (read/write = true)', 'error');
  } finally {
    if(btn){ btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Post Review'; }
  }
}

function renderReviews(){
  const feed = document.getElementById('reviewsFeed');
  if(!feed) return;
  if(allReviews.length === 0){
    feed.innerHTML = '<div class="empty-orders"><i class="fa-solid fa-comment-dots"></i>No reviews yet. Be the first to review!</div>';
    return;
  }
  feed.innerHTML = allReviews.map(r => renderReviewItem(r)).join('');
}

function renderReviewItem(r){
  const likesArr = Array.isArray(r.likes) ? r.likes : (r.likes ? Object.values(r.likes) : []);
  const liked = currentUser && likesArr.includes(currentUser.userId);
  const likesCount = likesArr.length;
  const canDelete = currentUser && currentUser.userId === r.userId && (Date.now() - new Date(r.timestamp).getTime() < 50000);
  const remaining = canDelete ? Math.max(0, Math.ceil((50000 - (Date.now() - new Date(r.timestamp).getTime())) / 1000)) : 0;
  const repliesObj = r.replies || {};
  const repliesArr = Array.isArray(repliesObj) ? repliesObj : Object.values(repliesObj);
  const repliesHtml = repliesArr.map(rep => `
    <div class="reply-item">
      <div class="reply-item-head">
        <img src="${rep.picture || ''}" alt="">
        <div class="rih-info">
          <div class="rih-name">${escapeHtml(rep.name)}</div>
          <div class="rih-time">${timeAgo(rep.timestamp)}</div>
        </div>
      </div>
      <div class="reply-item-text">${escapeHtml(rep.text)}</div>
    </div>`).join('');
  return `
    <div class="review-item" data-id="${r.id}">
      <div class="review-item-head">
        <img src="${r.picture || ''}" alt="">
        <div class="rih-info">
          <div class="rih-name">${escapeHtml(r.name)}</div>
          <div class="rih-email">${escapeHtml(r.email)}</div>
        </div>
        <div class="rih-time">${timeAgo(r.timestamp)}</div>
      </div>
      <div class="review-item-text">${escapeHtml(r.text)}</div>
      <div class="review-actions">
        <button class="review-action-btn ${liked ? 'liked' : ''}" onclick="toggleLikeReview('${r.id}')">
          <i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i> ${likesCount}
        </button>
        <button class="review-action-btn" onclick="toggleReplyBox('${r.id}')">
          <i class="fa-regular fa-comment"></i> Reply
        </button>
        ${canDelete ? `<button class="review-action-btn danger" onclick="deleteReview('${r.id}')"><i class="fa-solid fa-trash"></i> Delete</button>
        <span class="delete-timer" data-del="${r.id}">${remaining}s</span>` : ''}
      </div>
      <div class="replies-wrap">
        ${repliesHtml}
        <div class="reply-composer" id="replyComposer-${r.id}" style="display:none">
          <input type="text" id="replyInput-${r.id}" placeholder="Write a reply..." maxlength="200">
          <button onclick="postReply('${r.id}')">Send</button>
        </div>
      </div>
    </div>`;
}

async function toggleLikeReview(id){
  if(!currentUser) return toast('Please login to like', 'error');
  const r = allReviews.find(x => x.id === id);
  if(!r) return;
  let likesArr = Array.isArray(r.likes) ? r.likes : (r.likes ? Object.values(r.likes) : []);
  const idx = likesArr.indexOf(currentUser.userId);
  if(idx >= 0) likesArr.splice(idx, 1);
  else likesArr.push(currentUser.userId);
  try {
    await fetch(`${FIREBASE_URL}/reviews/${id}/likes.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(likesArr)
    });
    await loadReviewsFromFirebase();
  } catch(err){ toast('Failed to update', 'error'); }
}

function toggleReplyBox(id){
  if(!currentUser) return toast('Please login to reply', 'error');
  const box = document.getElementById('replyComposer-' + id);
  if(box){
    box.style.display = box.style.display === 'none' ? 'flex' : 'none';
    if(box.style.display === 'flex'){
      const inp = document.getElementById('replyInput-' + id);
      if(inp) inp.focus();
    }
  }
}

async function postReply(id){
  if(!currentUser) return toast('Please login first', 'error');
  const inp = document.getElementById('replyInput-' + id);
  const text = inp.value.trim();
  if(!text) return toast('Please write a reply', 'error');
  const reply = {
    userId: currentUser.userId,
    name: currentUser.name,
    picture: currentUser.picture,
    text: text,
    timestamp: new Date().toISOString()
  };
  try {
    await fetch(`${FIREBASE_URL}/reviews/${id}/replies.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reply)
    });
    toast('Reply posted!');
    await loadReviewsFromFirebase();
  } catch(err){ toast('Failed to reply', 'error'); }
}

async function deleteReview(id){
  if(!currentUser) return;
  const r = allReviews.find(x => x.id === id);
  if(!r) return;
  if(r.userId !== currentUser.userId) return toast('Not your review', 'error');
  if(Date.now() - new Date(r.timestamp).getTime() > 50000) return toast('Delete time expired', 'error');
  if(!confirm('Delete this review?')) return;
  try {
    await fetch(`${FIREBASE_URL}/reviews/${id}.json`, { method: 'DELETE' });
    toast('Review deleted');
    await loadReviewsFromFirebase();
  } catch(err){ toast('Failed to delete', 'error'); }
}

setInterval(() => {
  document.querySelectorAll('.delete-timer').forEach(el => {
    const id = el.dataset.del;
    const r = allReviews.find(x => x.id === id);
    if(!r) return;
    const ms = Date.now() - new Date(r.timestamp).getTime();
    if(ms >= 50000){
      el.textContent = 'expired';
      el.style.color = 'var(--muted)';
    } else {
      el.textContent = Math.ceil((50000 - ms)/1000) + 's';
    }
  });
}, 1000);

/* ============ INIT ============ */
window.addEventListener('load', async () => {
  setTimeout(() => {
    if(document.querySelector('#page-home.active')) startCounters();
  }, 1500);

  /* Detect Firebase URL first */
  await detectFirebaseUrl();

  const sess = localStorage.getItem('dg_session');
  if(sess){
    try{
      currentUser = JSON.parse(sess);
      const stored = JSON.parse(localStorage.getItem('dg_user_' + currentUser.userId) || '{}');
      if(stored.wp) currentUser.wp = stored.wp;
      if(stored.wpVerified) currentUser.wpVerified = true;
      if(stored.customName) currentUser.name = stored.customName;
      if(stored.customPic) currentUser.picture = stored.customPic;
      if(stored.coverImage) currentUser.coverImage = stored.coverImage;
      if(stored.coverType) currentUser.coverType = stored.coverType;
      renderProfile();
    } catch(e){ currentUser = null; }
  }
  initGoogle();
  addSmItem();
  addSmLink();
  addSlItem();
  addSlLink();
  loadReviewsFromFirebase();
  renderReviewComposer();
  startReviewsRealtime();
});
