let data;
const main=document.querySelector('main');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL=v=>{try{const u=new URL(v,location.href);return ['http:','https:'].includes(u.protocol)?esc(u.href):''}catch{return ''}};
const link=(href,text,style='')=>`<a class="button ${style}" href="${esc(href)}">${esc(text)}</a>`;
const intro=(label,title,description)=>`<div class="pageintro"><span class="eyebrow">${esc(label)}</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div>`;
const cards=()=>`<div class="cards">${data.services.filter(s=>s.active).map(s=>`<a class="card" href="#service/${esc(s.id)}"><span class="number">${esc(s.symbol)}</span><h3>${esc(s.name)}</h3><p>${esc(s.tag)}</p><span class="arrow" aria-hidden="true">↗</span></a>`).join('')}</div>`;
const health=()=>`<div class="feature"><div><span class="eyebrow">A LITTLE CARE GOES A LONG WAY</span><h2>Know your tech.<br>Before it lets you down.</h2><p>A health check for your working computer or CCTV system, with clear findings and practical next steps.</p>${link('#health','Explore health checks ↗','accent')}</div><div class="checklist">${data.healthItems.map(t=>`<div class="check">${esc(t)}</div>`).join('')}</div></div>`;
const contacts=()=>`${data.phone?link('tel:'+data.phone,data.phoneDisplay || 'Call A2Z'):''}${data.whatsapp?link('https://wa.me/'+data.whatsapp.replace(/\D/g,''),'WhatsApp','accent'):''}${data.email?link('mailto:'+data.email,'Email us','outline'):''}`;

function applyBrand() {
  const tokens = {ink:'--ink', paper:'--paper', surface:'--surface', line:'--line', accent:'--accent', accentText:'--accent-text', muted:'--muted'};
  for (const [key, token] of Object.entries(tokens)) {
    const value = data.theme?.[key];
    if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)) document.documentElement.style.setProperty(token, value);
  }
  const logo = data.logo;
  if (logo?.src) {
    try {
      const url = new URL(logo.src, location.href);
      if (['http:', 'https:'].includes(url.protocol)) {
        document.querySelectorAll('.brand-logo').forEach(img => {
          img.src = url.href;
          img.alt = logo.alt || data.brand;
        });
      }
    } catch { /* Keep the supplied logo if configuration is invalid. */ }
  }
  const color = data.theme?.ink;
  if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) document.querySelector('meta[name="theme-color"]').content = color;
}


let translations = {};
let language = 'en';
let translationLookup = new Map();
const originalText = new WeakMap();
const originalAttributes = new WeakMap();
function translate(source) {
  const value = String(source ?? '');
  if (language === 'en') return value;
  const trimmed = value.trim();
  const result = translationLookup.get(trimmed);
  return result === undefined ? value : value.replace(trimmed, () => result);
}
function localize(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest('script, style, textarea, pre, [data-language]')) continue;
    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    node.nodeValue = translate(originalText.get(node));
  }
  root.querySelectorAll('[aria-label], [alt], [title], [placeholder]').forEach(el => {
    if (el.closest('[data-language]')) return;
    if (!originalAttributes.has(el)) originalAttributes.set(el, {});
    const saved = originalAttributes.get(el);
    for (const attr of ['aria-label','alt','title','placeholder']) {
      if (!el.hasAttribute(attr)) continue;
      if (!(attr in saved)) saved[attr] = el.getAttribute(attr);
      el.setAttribute(attr, translate(saved[attr]));
    }
  });
}
function updatePageLanguage() {
  document.documentElement.lang = language === 'ta' ? 'ta-LK' : 'en';
  document.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  const route = location.hash.slice(1).split('/')[0] || 'home';
  const titles = {home:'Home',services:'Services',service:'Service',health:'Health check',work:'Our work',about:'About',contact:'Contact',booking:'Booking',policies:'Policies'};
  document.title = translate(titles[route] || 'PAGE NOT FOUND') + ' · A2Z Tec Solutions';
  document.querySelector('meta[name="description"]').content = translate(data.hero.description);
}
function setLanguage(next, updateURL = true) {
  language = next === 'ta' && translations.ta ? 'ta' : 'en';
  translationLookup = new Map(Object.entries(translations[language] || {}).map(([key,value]) => [
    key.replaceAll('{deposit}', String(data.deposit)),
    value.replaceAll('{deposit}', String(data.deposit))
  ]));
  // Translate text in place so form fields, selections and prepared requests survive.
  localize(document.body);
  updatePageLanguage();
  if (updateURL) {
    const url = new URL(location.href);
    url.searchParams.set('lang', language);
    history.replaceState(null, '', url);
  }
}
function render() {
  renderContent();
  A2ZBooking.attach(data, translate);
  localize(document.body);
  updatePageLanguage();
}

function booking(){return intro('Booking','Book a service','Tell us the essentials. We’ll call to confirm.')+`<div class="booking-layout">${A2ZBooking.render(data)}<p class="note">LKR ${esc(data.deposit)} booking deposit · Pay after confirmation.</p><div class="actions">${contacts()}<a href="${safeURL(data.booking?.formUrl)}" class="textlink">Alternative: open Google Forms ↗</a></div></div>`}

function renderContent(){const route=location.hash.slice(1)||'home';let html='';
if(route==='home'){html=`<section class="wrap hero"><div><span class="eyebrow">YOUR NEIGHBOURHOOD TECH PARTNER</span><h1>${esc(data.hero.title)}</h1><p>${esc(data.hero.description)}</p><div class="actions">${link('#booking','Book a service ↗')}${link('#services','Find your service','outline')}</div></div><div class="hero-photo"><img src="${safeURL(data.hero.image)}" alt="Close-up of computer motherboard components" fetchpriority="high"><div class="photo-note"><div><small>FROM THE WORKBENCH TO YOUR WORKDAY</small><strong>We keep you connected.</strong></div><span aria-hidden="true">↗</span></div></div></section><div class="trust"><span>✓ NVQ-qualified technician</span><span>✓ Local workshop</span><span>✓ On-site service by arrangement</span></div><section class="wrap"><div class="sectionhead"><div><span class="eyebrow">WHAT CAN WE HELP WITH?</span><h2>Your tech. Our everyday.</h2></div><a class="textlink" href="#services">Explore services ↗</a></div>${cards()}</section><section class="wrap" style="padding-top:0">${health()}</section>`;}
else if(route==='services'){html=`<section class="wrap">${intro('REPAIR · INSTALLATION · SUPPORT','The right help for your tech.','Choose a service to see how we can help.')}${cards()}<div class="cta"><h2>Need us at your place?</h2><p>Ask about doorstep and on-site support when booking. Availability and travel charges are confirmed before the visit.</p>${link('#booking','Arrange a visit ↗')}</div></section>`}
else if(route.startsWith('service/')){const s=data.services.find(s=>s.id===route.split('/')[1]&&s.active);html=s?`<section class="wrap">${intro(s.tag,s.name,s.description)}<div class="columns"><div class="panel"><h3>Start with the problem.</h3><p>Tell us what is happening, the device type and your location. We’ll contact you to arrange the next step.</p><p>Scope, pricing and warranty terms are confirmed for your specific job.</p>${link('#booking','Request this service ↗')}</div><div class="panel"><h3>Workshop or on-site?</h3><p>Visit our Paranthan workshop by arrangement, or ask whether your job can be handled on-site.</p>${link('#contact','Find A2Z','outline')}</div></div></section>`:notfound();}
else if(route==='health'){html=`<section class="wrap">${intro('PREVENTIVE CARE','A clearer picture of your tech.','For working PCs, laptops and CCTV systems. Understand their condition and what needs attention.')}<div class="columns">${data.healthChecks.map(t=>`<div class="panel"><span class="badge">HEALTH CHECK</span><h3>${esc(t)}</h3><p>${t.startsWith('CCTV')?'Review camera coverage, recording and overall system operation.':'Review storage health, temperatures, system errors and battery condition where supported.'}</p>${link('#booking','Request a health check ↗')}</div>`).join('')}</div><div class="cta"><h2>Findings you can use.</h2><p>Receive an explanation of the checks performed and recommended next steps. Available checks depend on the device.</p><p class="notice">Device already faulty? Choose a repair booking for diagnosis.</p></div></section>`}
else if(route==='booking'){html=`<section class="wrap">${booking()}</section>`}
else if(route==='work'){html=`<section class="wrap">${intro('FROM OUR WORKSHOP','Real work. Real solutions.','Repairs, installations and the details that make a difference.')}<div class="gallery cards">${data.gallery.map(g=>`<article class="card"><img loading="lazy" src="${safeURL(g.image)}" alt="${esc(g.alt||g.title)}"><h3>${esc(g.title)}</h3><p>${esc(g.caption)}</p></article>`).join('')}</div>${data.gallery.length?'':'<div class="empty"><h3>Workshop stories are on the way.</h3><p>Our completed repair and installation photos will appear here.</p></div>'}</section>`}
else if(route==='about'){html=`<section class="wrap">${intro('A2Z TEC SOLUTIONS (PVT) LTD','Technical know-how.\nLocal understanding.','Based in Paranthan, we help homes and small businesses with the technology they rely on.')}<div class="columns"><div class="panel"><h3>Hands-on experience</h3><p>Computer hardware, networking and CCTV support, backed by NVQ Level 4 qualifications in Computer Hardware & Network Technology and ICT.</p></div><div class="panel"><h3>A place to bring your tech</h3><p>${esc(data.address)}. Parking available.</p><p>Talk to us about workshop repairs, installations and on-site support.</p>${link('#contact','Plan your visit ↗')}</div></div></section>`}
else if(route==='contact'){html=`<section class="wrap">${intro('LET’S TALK','Your local tech stop.','Find us in Paranthan, on the A-35 main road.')}<div class="columns"><div class="panel"><h3>Visit the workshop</h3><p>${esc(data.address)}</p><p>Parking available.</p><p>${esc(data.hours)}</p><a class="button outline" target="_blank" rel="noopener" href="${safeURL(data.mapsUrl || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(data.plusCode || data.address)))}">Find our shop on Google Maps ↗</a>${data.plusCode ? `<p class="note">Plus Code: ${esc(data.plusCode)}</p>` : ''}</div><div class="panel"><h3>Get in touch</h3><div class="actions">${contacts()}</div>${!data.phone&&!data.whatsapp&&!data.email?'<p>Contact details will be available here soon.</p>':''}<p>For a repair, installation or health check, open the form from our booking page.</p>${link('#booking','Book a service ↗')}</div></div></section>`}
else if(route==='policies'){html=`<section class="wrap">${intro('BEFORE YOU BOOK','Service information','A few practical things to know.')}<div class="panel"><h3>Appointments & deposits</h3><p>The standard booking deposit is LKR ${esc(data.deposit)}. Appointments and payment instructions must be confirmed with A2Z before you pay. Cancellation and refund terms will be confirmed before taking payment.</p><h3>Diagnosis & health checks</h3><p>Health checks are for working systems. A faulty or non-working device requires a repair diagnosis. Travel charges, repair scope and pricing are confirmed for each job.</p><h3>Warranty</h3><p>Warranty coverage depends on the work performed and parts supplied. Confirm the applicable terms before authorising the job.</p><h3>Your details</h3><p>Booking details are submitted through Google Forms and used by A2Z to contact you and arrange your service. Google processes the form under its own privacy terms.</p></div></section>`}
else html=notfound();main.innerHTML=html;document.querySelectorAll('nav a').forEach(a=>{if(a.hash==='#'+route)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});document.title=(route==='home'?'A2Z Tec Solutions':route.split('/')[0].replace(/^./,c=>c.toUpperCase())+' · A2Z Tec Solutions');
}

function notfound(){return `<section class="wrap">${intro('PAGE NOT FOUND','Let’s get you back.','Choose a service or return to the home page.')}${link('#home','Back to home')}</section>`}

Promise.all([
  fetch('./content.json').then(r => { if (!r.ok) throw Error('Content unavailable'); return r.json(); }),
  fetch('./translations.json').then(r => { if (!r.ok) throw Error('Translations unavailable'); return r.json(); }).catch(() => ({}))
]).then(([content, locales]) => {
  data = content;
  translations = locales;
  applyBrand();
  const requested = new URL(location.href).searchParams.get('lang');
  setLanguage(requested === 'en' || requested === 'ta' ? requested : data.defaultLanguage, false);
  render();
  document.querySelectorAll('[data-language]').forEach(button => {
    if (button.dataset.language === 'ta' && !translations.ta) {
      button.disabled = true;
      document.querySelector('#language-status').textContent = 'தமிழை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கப் பக்கத்தைப் புதுப்பியுங்கள்.';
    }
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });
  window.addEventListener('hashchange', () => {
    render(); window.scrollTo(0,0); main.focus({preventScroll:true});
  });
  window.addEventListener('popstate', () => {
    const selected = new URL(location.href).searchParams.get('lang');
    setLanguage(selected === 'en' || selected === 'ta' ? selected : data.defaultLanguage, false);
  });
}).catch(() => {
  main.innerHTML='<div class="wrap"><h1>இணையத்தளத்தை ஏற்ற முடியவில்லை.</h1><p>மீண்டும் முயற்சிக்கப் பக்கத்தைப் புதுப்பியுங்கள்.</p><p lang="en">Unable to load the site. Please refresh to try again.</p></div>';
});
