/* Website form. The backend URL is public; no credentials belong in this file. */
const A2ZBooking = (() => {
  const services = {computers:'Computer / laptop repair',cctv:'CCTV repair',printers:'Printer repair',networks:'Networking',installation:'CCTV installation',computer_health:'Computer / laptop health check',cctv_health:'CCTV health check'};
  const escape = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const endpoint = data => /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(data.booking?.endpoint || '') ? data.booking.endpoint : '';
  const input = (name,label,required=false,type='text',extra='') => `<div class="field"><label for="booking-${name}">${label}</label><input id="booking-${name}" name="${name}" type="${type}" ${required?'required':''} ${extra}></div>`;
  const area = (name,label,required=false) => `<div class="field"><label for="booking-${name}">${label}</label><textarea id="booking-${name}" name="${name}" maxlength="2000" ${required?'required':''}></textarea></div>`;
  const select = (name,label,values) => `<div class="field"><label for="booking-${name}">${label}</label><select id="booking-${name}" name="${name}" required>${Object.entries(values).map(([v,t])=>`<option value="${escape(v)}">${escape(t)}</option>`).join('')}</select></div>`;
  let contactTimer;
  const contactMessage = (now = new Date()) => {
    const day = new Intl.DateTimeFormat('en-US', {timeZone:'Asia/Colombo', weekday:'short'}).format(now);
    return day === 'Sat' || day === 'Sun'
      ? 'We will contact you on the next working day.'
      : 'We will contact you soon.';
  };
  function render(data, fixedService = '') {
    const isHealth = ['computer_health','cctv_health'].includes(fixedService);
    const appointmentServices = Object.fromEntries(Object.entries(services).filter(([key])=>!key.endsWith('_health')));
    return `<form id="website-booking" class="panel" ${isHealth ? `data-fixed-service="${fixedService}"` : ''}>
      ${!endpoint(data)?'<p class="notice">Online submission is being connected. Please use the alternative form below for now.</p>':''}
      ${isHealth ? `<input type="hidden" name="service" value="${fixedService}"><p class="badge">${services[fixedService]}</p>` : select('service','Service',appointmentServices)}
      <div class="columns">${input('name','Your name',true,'text','autocomplete="name" maxlength="100"')}${input('phone','Phone number',true,'tel','autocomplete="tel" pattern="(0[0-9]{9}|[+]94[0-9]{9}|94[0-9]{9})" placeholder="0771234567"')}</div>
      ${input('email','Email',true,'email','autocomplete="email" maxlength="254"')}
      ${input('address','Service address',true,'text','autocomplete="street-address" maxlength="2000"')}
      <fieldset data-service-group="repair" ${isHealth?'hidden disabled':''}><legend>Device details</legend>
      ${input('device','Device / brand',true,'text','maxlength="200" list="booking-devices" placeholder="Choose or type your own"')}
      ${area('details','What is the problem?',true)}
      <details class="booking-extra"><summary>Model and serial number (optional)</summary><div class="columns">${input('model','Model (optional)',false,'text','maxlength="100" list="booking-models" placeholder="Choose or type your own"')}${input('serial','Serial number (optional)',false,'text','maxlength="100"')}</div></details>
      </fieldset>
      <fieldset data-service-group="installation" hidden disabled><legend>CCTV installation</legend>
      ${input('cameras','Number of cameras required',true,'number','min="1" max="999" step="1"')}
      ${select('premises','Type of premises',{Home:'House','Shop or office':'Shop or office',Other:'Other'})}
      ${area('details','What do you need?',true)}</fieldset>
      <fieldset data-service-group="health" ${isHealth?'':'hidden disabled'}><legend>Health check</legend>
      ${input('quantity','Number of systems to check',true,'number','min="1" max="999" step="1" value="1"')}
      <details class="booking-extra"><summary>More details (optional)</summary>${input('device','Device / brand',false,'text','maxlength="200" list="booking-devices" placeholder="Choose or type your own"')}</details>
      <label class="booking-check"><input type="checkbox" name="working" value="yes" required><span>I confirm the device is currently working.</span></label></fieldset>
      ${select('method','Service method',{discuss:'Discuss by phone first',workshop:'Visit the workshop',onsite:'Service at my home or business'})}
      <details class="booking-extra"><summary>More details (optional)</summary>
      ${input('landmark','Nearby landmark',false,'text','maxlength="200"')}
      ${select('contactLanguage','Preferred contact language',{ta:'தமிழ்',en:'English'})}
      ${input('date','Preferred date (optional)',false,'date')}
      ${select('contactTime','Convenient time to contact you',{'Any time':'Any time',Morning:'Morning',Afternoon:'Afternoon'})}
      ${area('additional','Additional information')}</details>
      <datalist id="booking-devices"></datalist><datalist id="booking-models"></datalist>
      <label class="booking-check"><input type="checkbox" name="consent" value="yes" required><span>A2Z may contact me about this request. Payment is due only after confirmation.</span></label>
      <div class="booking-trap" aria-hidden="true"><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <p id="booking-contact-expectation" class="notice" aria-live="polite">${contactMessage()}</p>\n      <button class="button" type="submit" ${endpoint(data)?'':'disabled'}>Submit service request ↗</button>
      <p id="booking-status" role="status" aria-live="polite"></p>
    </form>`;
  }

  // A visible, keyboard-accessible picker rather than browser-dependent datalist UI.
  function attachPicker(input, source, translate) {
    const box = document.createElement('div');
    box.className = 'booking-picker';
    input.before(box);box.append(input);
    input.removeAttribute('list');
    input.setAttribute('role','combobox');
    input.setAttribute('aria-autocomplete','list');
    input.setAttribute('autocomplete','off');
    const list = document.createElement('div');
    list.id = input.id + '-choices';list.className = 'booking-choices';
    list.setAttribute('role','listbox');list.hidden = true;
    const toggle = document.createElement('button');
    toggle.type = 'button';toggle.className = 'booking-picker-toggle';
    toggle.textContent = '▾';toggle.setAttribute('aria-label','Show suggestions');
    toggle.setAttribute('aria-controls',list.id);
    input.setAttribute('aria-controls',list.id);
    box.append(toggle,list);
    let values=[], active=-1;
    const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');toggle.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;};
    const highlight=()=>{
      [...list.children].forEach((option,i)=>option.setAttribute('aria-selected',String(i===active)));
      if(active>=0){input.setAttribute('aria-activedescendant',list.children[active].id);list.children[active].scrollIntoView({block:'nearest'});}
      else input.removeAttribute('aria-activedescendant');
    };
    const choose=index=>{
      if(input.disabled || !values[index])return;
      input.value=values[index];close();input.focus();
      input.dispatchEvent(new Event('change',{bubbles:true}));
    };
    const open=(showAll=false)=>{
      if(input.disabled || input.closest('fieldset[disabled]'))return;
      const query=showAll?'':input.value.trim().toLocaleLowerCase();
      values=[...source.options].map(option=>option.value).filter(value=>value.toLocaleLowerCase().includes(query));
      list.replaceChildren();active=-1;
      values.forEach((value,index)=>{
        const option=document.createElement('div');
        option.id=list.id+'-'+index;option.setAttribute('role','option');option.setAttribute('aria-selected','false');
        option.textContent=value;
        option.addEventListener('pointerdown',event=>event.preventDefault());
        option.addEventListener('click',()=>choose(index));
        list.append(option);
      });
      if(!values.length){
        const message=document.createElement('p');message.className='booking-picker-empty';
        message.textContent=translate('No match — you can use your own entry.');list.append(message);
      }
      list.hidden=false;input.setAttribute('aria-expanded','true');toggle.setAttribute('aria-expanded','true');
    };
    toggle.addEventListener('click',()=>{if(list.hidden){input.focus();open(true);}else close();});
    input.addEventListener('input',()=>open());
    input.addEventListener('click',()=>open(!input.value));
    input.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();close();}
      else if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();if(list.hidden)open(true);
        if(values.length){active=(active+(event.key==='ArrowDown'?1:-1)+values.length)%values.length;highlight();}
      }else if(event.key==='Enter'&&!list.hidden){
        event.preventDefault();if(active>=0)choose(active);else close();
      }else if(event.key==='Tab')close();
    });
    box.addEventListener('focusout',event=>{if(!box.contains(event.relatedTarget))close();});
    input.form.elements.service.addEventListener('change',close);
    close();
  }

  function attach(data,translate) {
    clearInterval(contactTimer);
    const form = document.querySelector('#website-booking');
    if (!form) return;
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('#booking-status');
    let busy=false, sent=false, requestId=null;
    const expectation = form.querySelector('#booking-contact-expectation');
    const refreshExpectation = () => {
      if (!form.isConnected) { clearInterval(contactTimer); return; }
      if (!sent) expectation.textContent = translate(contactMessage());
    };
    contactTimer = setInterval(refreshExpectation, 1000);
    const update=()=>{
      const service=form.dataset.fixedService || form.elements.service.value;
      const group=service==='installation'?'installation':service.endsWith('_health')?'health':'repair';
      form.querySelectorAll('[data-service-group]').forEach(el=>{el.hidden=el.dataset.serviceGroup!==group;el.disabled=el.hidden;});
      const catalog = data.booking?.deviceSuggestions || {};
      const key = service === 'computer_health' ? 'computers' : service === 'cctv_health' ? 'cctv' : service;
      const options = catalog[key] || {};
      form.querySelector('#booking-devices').innerHTML = (options.devices || []).map(value=>`<option value="${escape(value)}"></option>`).join('');
      form.querySelector('#booking-models').innerHTML = (options.models || []).map(value=>`<option value="${escape(value)}"></option>`).join('');
      const method=form.elements.method;
      [...method.options].forEach(o=>o.disabled=group==='installation'&&o.value!=='onsite');
      if(group==='installation') method.value='onsite';
    };
    // Unique IDs keep labels correct despite fields shared across conditional sections.
    form.querySelectorAll('[data-service-group]').forEach(group=>group.querySelectorAll('input,textarea').forEach(el=>{
      const label=group.querySelector(`label[for="${el.id}"]`);
      if(el.id){el.id+='-'+group.dataset.serviceGroup;if(label)label.htmlFor=el.id;}
    }));
    form.elements.service.addEventListener('change',update);update();
    form.querySelectorAll('input[list]').forEach(input=>{
      const source=form.querySelector('#'+input.getAttribute('list'));
      if(source)attachPicker(input,source,translate);
    });
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if(busy||sent||!form.reportValidity())return;
      const url=endpoint(data);
      if(!url){status.textContent=translate('Online submission is being connected. Please use the alternative form below for now.');return;}
      refreshExpectation();
      const submittedAt = new Date();
      busy=true;button.disabled=true;form.setAttribute('aria-busy','true');
      requestId ||= crypto.randomUUID();
      const body=new URLSearchParams(new FormData(form));body.set('requestId',requestId);
      if(form.dataset.fixedService)body.set('service',form.dataset.fixedService);
      status.textContent=translate('Sending your request…');
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),45000);
      try {
        // A simple URL-encoded POST avoids a CORS preflight. Never use no-cors:
        // an opaque response cannot prove Google saved the booking.
        const response=await fetch(url,{method:'POST',body,redirect:'follow',credentials:'omit',signal:controller.signal});
        if(!response.ok)throw Error('Submission failed');
        const result=await response.json();
        if(result.ok!==true||result.requestId!==requestId)throw Error('Unconfirmed response');
        sent=true;
        expectation.textContent=translate(contactMessage(submittedAt));
        clearInterval(contactTimer);
        status.textContent=translate('Your request has been received.')+' '+translate(contactMessage(submittedAt))+' '+translate('Your appointment is not yet confirmed.');
        form.querySelectorAll('input,select,textarea,.booking-picker-toggle').forEach(el=>el.disabled=true);
      } catch {
        status.textContent=translate('We could not confirm your submission. Your details are still here. Retry the same request, or contact A2Z before submitting elsewhere.');
      } finally {clearTimeout(timeout);busy=false;button.disabled=sent;form.removeAttribute('aria-busy');}
    });
  }
  return {render,attach};
})();
