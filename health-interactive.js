(() => {
  const root = document.querySelector('main');
  if (!root) return;

  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const isTamil = () => document.documentElement.lang.toLowerCase().startsWith('ta');
  const copy = {
    en: {
      eyebrow: 'HEALTH CHECK', title: 'Let’s check your tech.', intro: 'Answer a few simple questions. We’ll guide you to the right health check without changing the information collected when you book.',
      step: 'Step', choose: 'What would you like to check?', computer: 'Computer / laptop', computerSub: 'Storage, cooling, battery and system health', cctv: 'CCTV system', cctvSub: 'Cameras, recording, coverage and system operation',
      working: 'Is the system currently working?', yes: 'Yes, it is working', yesSub: 'Great — it can be assessed as a health check.', no: 'No / not working', noSub: 'This needs a repair diagnosis instead.',
      check: 'What do you want us to look at?', all: 'Full health check', storage: 'Storage & performance', cooling: 'Temperature & cooling', errors: 'Errors & reliability', battery: 'Battery condition', camera: 'Camera coverage & recording', next: 'Recommended next steps',
      selected: 'Your check', ready: 'You’re ready to book.', summary: 'We’ll keep the existing booking form and its required information exactly as it is. This guide only helps you choose the service.', book: 'Continue to booking', back: 'Back', start: 'Start over', repair: 'Book a repair appointment', repairNote: 'Because the system is not currently working, a repair appointment is the appropriate next step.',
      progress: 'Progress', workingOnly: 'Health checks are for working systems.',
      detailsComputer: 'Storage health, temperatures & cooling, battery condition where supported, system errors and practical next steps.', detailsCctv: 'Camera coverage, recording and overall CCTV system operation, with practical next steps.'
    },
    ta: {
      eyebrow: 'சுகாதாரச் சோதனை', title: 'உங்கள் தொழில்நுட்பத்தைச் சோதிப்போம்.', intro: 'சில எளிய கேள்விகளுக்கு பதிலளிக்கவும். முன்பதிவில் சேகரிக்கப்படும் தகவல்களை மாற்றாமல், சரியான சுகாதாரச் சோதனைக்கு வழிகாட்டுகிறோம்.',
      step: 'படி', choose: 'எதைச் சோதிக்க விரும்புகிறீர்கள்?', computer: 'கணினி / மடிக்கணினி', computerSub: 'சேமிப்பு, குளிரூட்டல், பேட்டரி மற்றும் கணினி நிலை', cctv: 'CCTV அமைப்பு', cctvSub: 'கேமராக்கள், பதிவு, கவரேஜ் மற்றும் அமைப்பு செயல்பாடு',
      working: 'அமைப்பு தற்போது இயங்குகிறதா?', yes: 'ஆம், இயங்குகிறது', yesSub: 'சிறப்பு — சுகாதாரச் சோதனை செய்யலாம்.', no: 'இல்லை / இயங்கவில்லை', noSub: 'இதற்கு பழுது கண்டறியும் சேவை தேவை.',
      check: 'எதைப் பார்க்க வேண்டும்?', all: 'முழுமையான சுகாதாரச் சோதனை', storage: 'சேமிப்பு & செயல்திறன்', cooling: 'வெப்பநிலை & குளிரூட்டல்', errors: 'பிழைகள் & நம்பகத்தன்மை', battery: 'பேட்டரி நிலை', camera: 'கேமரா கவரேஜ் & பதிவு', next: 'பரிந்துரைக்கப்படும் அடுத்த படிகள்',
      selected: 'உங்கள் சோதனை', ready: 'முன்பதிவுக்கு தயாராக உள்ளது.', summary: 'ஏற்கனவே உள்ள முன்பதிவு படிவமும் அதில் கேட்கப்படும் தகவல்களும் மாற்றப்படாது. இந்த வழிகாட்டி சரியான சேவையைத் தேர்வு செய்ய மட்டுமே உதவும்.', book: 'முன்பதிவுக்குத் தொடரவும்', back: 'பின்', start: 'மீண்டும் தொடங்கு', repair: 'பழுது பார்க்கும் முன்பதிவு', repairNote: 'அமைப்பு தற்போது இயங்காததால், பழுது கண்டறியும் முன்பதிவு சரியான அடுத்த படியாகும்.',
      progress: 'முன்னேற்றம்', workingOnly: 'சுகாதாரச் சோதனை இயங்கும் அமைப்புகளுக்கானது.',
      detailsComputer: 'சேமிப்பு நிலை, வெப்பநிலை & குளிரூட்டல், ஆதரவு உள்ள இடங்களில் பேட்டரி நிலை, கணினி பிழைகள் மற்றும் நடைமுறை அடுத்த படிகள்.', detailsCctv: 'கேமரா கவரேஜ், பதிவு மற்றும் CCTV அமைப்பின் மொத்த செயல்பாடு, நடைமுறை அடுத்த படிகளுடன்.'
    }
  };

  let state = { service: '', working: null, checks: [] };
  let lastRoute = '';

  const t = key => (isTamil() ? copy.ta : copy.en)[key];
  const button = (action, title, sub, selected = false) => `<button type="button" class="health-choice${selected ? ' is-selected' : ''}" data-health-action="${esc(action)}"><span class="health-choice-icon" aria-hidden="true">${action === 'computer' ? 'PC' : action === 'cctv' ? 'TV' : action === 'yes' ? '✓' : action === 'no' ? '!' : '＋'}</span><span><strong>${esc(title)}</strong><small>${esc(sub)}</small></span><span class="health-chevron" aria-hidden="true">→</span></button>`;

  function render() {
    const route = location.hash.slice(1) || 'home';
    if (route !== 'health') return;
    lastRoute = route;
    root.innerHTML = `<section class="wrap health-wizard" aria-labelledby="health-title">
      <div class="health-wizard-head"><div><span class="eyebrow">${esc(t('eyebrow'))}</span><h1 id="health-title">${esc(t('title'))}</h1><p>${esc(t('intro'))}</p></div><div class="health-progress" aria-label="${esc(t('progress'))}"><span class="health-progress-label">${esc(t('step'))} ${state.service ? (state.working === null ? '2' : '3') : '1'} / 3</span><span class="health-progress-track"><i style="width:${state.service ? (state.working === null ? '50%' : '100%') : '25%'}"></i></span></div></div>
      ${stepContent()}
    </section>`;
    root.querySelectorAll('[data-health-action]').forEach(btn => btn.addEventListener('click', () => act(btn.dataset.healthAction)));
  }

  function stepContent() {
    if (!state.service) return `<div class="health-step health-enter"><div class="health-step-title"><span>01</span><div><p class="eyebrow">${esc(t('step'))} 1</p><h2>${esc(t('choose'))}</h2></div></div><div class="health-choice-grid">${button('computer',t('computer'),t('computerSub'))}${button('cctv',t('cctv'),t('cctvSub'))}</div></div>`;
    if (state.working === null) return `<div class="health-step health-enter"><div class="health-step-title"><span>02</span><div><p class="eyebrow">${esc(t('step'))} 2</p><h2>${esc(t('working'))}</h2></div></div><div class="health-choice-grid">${button('yes',t('yes'),t('yesSub'))}${button('no',t('no'),t('noSub'))}</div><div class="health-mini"><strong>${esc(state.service === 'computer' ? t('computer') : t('cctv'))}</strong><span>${esc(state.service === 'computer' ? t('detailsComputer') : t('detailsCctv'))}</span></div></div>`;
    if (state.working === false) return `<div class="health-step health-enter health-repair"><div class="health-result-icon">!</div><p class="eyebrow">${esc(t('workingOnly'))}</p><h2>${esc(t('no'))}</h2><p>${esc(t('repairNote'))}</p><div class="actions">${link('#booking',t('repair'))}<button type="button" class="button outline" data-health-action="reset">${esc(t('start'))}</button></div></div>`;
    const items = state.service === 'computer' ? [['all',t('all')],['storage',t('storage')],['cooling',t('cooling')],['battery',t('battery')],['errors',t('errors')],['next',t('next')]] : [['all',t('all')],['camera',t('camera')],['errors',t('errors')],['next',t('next')]];
    return `<div class="health-step health-enter"><div class="health-step-title"><span>03</span><div><p class="eyebrow">${esc(t('step'))} 3</p><h2>${esc(t('check'))}</h2></div></div><div class="health-tile-grid">${items.map(([key,label])=>`<button type="button" class="health-tile${state.checks.includes(key) ? ' is-selected' : ''}" data-health-action="check:${esc(key)}"><span class="health-tile-mark">${state.checks.includes(key) ? '✓' : '+'}</span><span>${esc(label)}</span></button>`).join('')}</div><div class="health-summary"><div><span class="eyebrow">${esc(t('selected'))}</span><h3>${esc(state.service === 'computer' ? t('computer') : t('cctv'))}</h3><p>${esc(state.service === 'computer' ? t('detailsComputer') : t('detailsCctv'))}</p></div><div class="health-summary-actions"><button type="button" class="button outline" data-health-action="back">${esc(t('back'))}</button><a class="button" href="#health-booking/${state.service === 'computer' ? 'computer_health' : 'cctv_health'}">${esc(t('book'))} ↗</a></div></div></div>`;
  }

  function link(href, text) { return `<a class="button" href="${esc(href)}">${esc(text)} ↗</a>`; }
  function act(action) {
    if (action === 'reset') state = {service:'',working:null,checks:[]};
    else if (action === 'back') state = {service:state.service,working:null,checks:[]};
    else if (action === 'computer' || action === 'cctv') state = {service:action,working:null,checks:[]};
    else if (action === 'yes') state.working = true;
    else if (action === 'no') state.working = false;
    else if (action.startsWith('check:')) {
      const key = action.slice(6);
      state.checks = state.checks.includes(key) ? state.checks.filter(v => v !== key) : [...state.checks, key];
    }
    render();
  }

  const observer = new MutationObserver(() => {
    const route = location.hash.slice(1) || 'home';
    if (route === 'health' && lastRoute === 'health') render();
  });
  observer.observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  window.addEventListener('hashchange', () => setTimeout(render, 0));
  render();
})();
