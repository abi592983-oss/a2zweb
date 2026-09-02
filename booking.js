/* Website form. The backend URL is public; no credentials belong in this file. */
const A2ZBooking = (() => {
  const services = {computers:'Computer / laptop repair',cctv:'CCTV repair',printers:'Printer repair',networks:'Networking',installation:'CCTV installation',computer_health:'Computer / laptop health check',cctv_health:'CCTV health check'};
  const escape = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const endpoint = data => /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(data.booking?.endpoint || '') ? data.booking.endpoint : '';
  const input = (name,label,required=false,type='text',extra='') => `<div class="field"><label for="booking-${name}">${label}</label><input id="booking-${name}" name="${name}" type="${type}" ${required?'required':''} ${extra}></div>`;
  const area = (name,label,required=false) => `<div class="field"><label for="booking-${name}">${label}</label><textarea id="booking-${name}" name="${name}" maxlength="2000" ${required?'required':''}></textarea></div>`;
  const select = (name,label,values) => `<div class="field"><label for="booking-${name}">${label}</label><select id="booking-${name}" name="${name}" required>${Object.entries(values).map(([v,t])=>`<option value="${escape(v)}">${escape(t)}</option>`).join('')}</select></div>`;
  function render(data) {
    return `<form id="website-booking" class="panel">
      ${!endpoint(data)?'<p class="notice">Online submission is being connected. Please use the alternative form below for now.</p>':''}
      ${select('service','Service',services)}
      <div class="columns">${input('name','Your name',true,'text','autocomplete="name" maxlength="100"')}${input('phone','Phone number',true,'tel','autocomplete="tel" pattern="(0[0-9]{9}|[+]94[0-9]{9}|94[0-9]{9})" placeholder="0771234567"')}</div>
      ${input('email','Email',true,'email','autocomplete="email" maxlength="254"')}
      ${area('address','Service address',true)}${input('landmark','Nearby landmark',false,'text','maxlength="200"')}
      ${select('contactLanguage','Preferred contact language',{ta:'தமிழ்',en:'English'})}
      <fieldset data-service-group="repair"><legend>Device details</legend>
      ${input('device','Device name / type',true,'text','maxlength="200"')}
      <div class="columns">${input('model','Model (optional)',false,'text','maxlength="100"')}${input('serial','Serial number (optional)',false,'text','maxlength="100"')}</div>
      ${area('details','Problem or installation requirements',true)}${area('tried','What have you already tried?')}
      </fieldset>
      <fieldset data-service-group="installation" hidden disabled><legend>CCTV installation</legend>
      ${input('cameras','Number of cameras required',true,'number','min="1" max="999" step="1"')}
      ${select('premises','Type of premises',{Home:'House','Shop or office':'Shop or office',Other:'Other'})}
      ${area('details','Problem or installation requirements',true)}</fieldset>
      <fieldset data-service-group="health" hidden disabled><legend>Health check</legend>
      ${input('quantity','Number of systems to check',true,'number','min="1" max="999" step="1"')}
      ${input('device','Device type and model',false,'text','maxlength="200"')}${area('details','Anything you would like checked?')}
      <label class="booking-check"><input type="checkbox" name="working" value="yes" required><span>I confirm the device is currently working.</span></label></fieldset>
      ${select('method','Service method',{discuss:'Discuss by phone first',workshop:'Visit the workshop',onsite:'Service at my home or business'})}
      ${input('date','Preferred date (optional)',false,'date')}
      ${select('contactTime','Convenient time to contact you',{'Any time':'Any time',Morning:'Morning',Afternoon:'Afternoon'})}
      ${area('additional','Additional information')}
      <label class="booking-check"><input type="checkbox" name="consent" value="yes" required><span>I agree that A2Z may use these details to handle my request. The appointment and charges must be confirmed before payment.</span></label>
      <div class="booking-trap" aria-hidden="true"><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <button class="button" type="submit" ${endpoint(data)?'':'disabled'}>Submit service request ↗</button>
      <p id="booking-status" role="status" aria-live="polite"></p>
    </form>`;
  }
  function attach(data,translate) {
    const form = document.querySelector('#website-booking');
    if (!form) return;
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('#booking-status');
    let busy=false, sent=false, requestId=null;
    const update=()=>{
      const service=form.elements.service.value;
      const group=service==='installation'?'installation':service.endsWith('_health')?'health':'repair';
      form.querySelectorAll('[data-service-group]').forEach(el=>{el.hidden=el.dataset.serviceGroup!==group;el.disabled=el.hidden;});
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
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if(busy||sent||!form.reportValidity())return;
      const url=endpoint(data);
      if(!url){status.textContent=translate('Online submission is being connected. Please use the alternative form below for now.');return;}
      busy=true;button.disabled=true;form.setAttribute('aria-busy','true');
      requestId ||= crypto.randomUUID();
      const body=new URLSearchParams(new FormData(form));body.set('requestId',requestId);
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
        status.textContent=translate('Your request has been received. A2Z will contact you. Your appointment is not yet confirmed.');
        form.querySelectorAll('input,select,textarea').forEach(el=>el.disabled=true);
      } catch {
        status.textContent=translate('We could not confirm your submission. Your details are still here. Retry the same request, or contact A2Z before submitting elsewhere.');
      } finally {clearTimeout(timeout);busy=false;button.disabled=sent;form.removeAttribute('aria-busy');}
    });
  }
  return {render,attach};
})();
