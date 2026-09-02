/** Add this as BookingBackend.gs in the SAME Apps Script project used to create the form.
 * Run verifyWebsiteBackend once. Deploy as Web app: Execute as Me; access Anyone.
 * Put the deployment /exec URL in content.json -> booking.endpoint.
 * Never put an OAuth token or other credential in the website.
 */
const A2Z_PUBLIC_FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSdP5et7Bd3WbQ178uMQX68hXDbsWwVEE_zAaCPb3TJFDZh3ZA/viewform';
const A2Z_SERVICES = {
  computers: 'Computer / laptop repair', cctv: 'CCTV repair', printers: 'Printer repair',
  networks: 'Networking', installation: 'CCTV installation',
  computer_health: 'Computer / laptop health check', cctv_health: 'CCTV health check'
};
function a2zForm_() {
  const id = PropertiesService.getScriptProperties().getProperty('A2Z_FORM_ID');
  if (!id) throw new Error('Run this in the original form-creation project; A2Z_FORM_ID is missing.');
  const form = FormApp.openById(id);
  if (form.getPublishedUrl().split('?')[0] !== A2Z_PUBLIC_FORM) throw new Error('Configured form does not match the A2Z booking form.');
  if (!form.isAcceptingResponses()) throw new Error('The booking form is not accepting responses.');
  return form;
}
function verifyWebsiteBackend() {
  const form = a2zForm_();
  console.log('Connected to: ' + form.getTitle());
  console.log('Form: ' + form.getEditUrl());
  console.log('Deploy > New deployment > Web app. Execute as Me. Who has access: Anyone.');
  console.log('Copy the Web app URL ending /exec. No test response was submitted.');
}
function doGet() { return a2zJson_({ok:true, service:'A2Z booking backend', version:1}); }
function a2zJson_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function a2zValidate_(raw) {
  const p = {};
  for (const [k,v] of Object.entries(raw || {})) {
    if (typeof v !== 'string' || v.length > 3000) throw new Error('Invalid field.');
    p[k] = v.trim();
  }
  if (p.website) throw new Error('Invalid request.');
  if (!/^[a-f0-9-]{36}$/i.test(p.requestId || '')) throw new Error('Invalid request ID.');
  if (!A2Z_SERVICES[p.service]) throw new Error('Select a service.');
  for (const key of ['name','phone','email','address','method','contactTime']) if (!p[key]) throw new Error('Complete the required fields.');
  if (!/^(0\d{9}|\+?94\d{9})$/.test(p.phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) throw new Error('Check your phone number and email.');
  if (!['ta','en'].includes(p.contactLanguage)) throw new Error('Select a contact language.');
  if (!['workshop','onsite','discuss'].includes(p.method) || !['Morning','Afternoon','Any time'].includes(p.contactTime)) throw new Error('Select visit arrangements.');
  if (p.consent !== 'yes') throw new Error('Please accept the acknowledgement.');
  const health = p.service.endsWith('_health');
  if (p.service === 'installation') {
    if (!/^[1-9]\d{0,2}$/.test(p.cameras || '') || !['Home','Shop or office','Other'].includes(p.premises) || !p.details || p.method !== 'onsite') throw new Error('Complete the CCTV installation details.');
  } else if (health) {
    if (!/^[1-9]\d{0,2}$/.test(p.quantity || '') || p.working !== 'yes') throw new Error('Confirm the working systems to check.');
  } else if (!p.device || !p.details) throw new Error('Enter the device and fault details.');
  if (p.date) {
    const dt = new Date(p.date + 'T12:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date) || isNaN(dt.getTime()) || dt.toISOString().slice(0,10) !== p.date) throw new Error('Invalid date.');
  }
  return p;
}
function a2zResponse_(form, p) {
  const items = form.getItems();
  const find = title => {
    const found = items.filter(i => i.getTitle().endsWith(' / ' + title));
    if (found.length !== 1) throw new Error('Form question missing or duplicated: ' + title);
    return found[0];
  };
  let response = form.createResponse();
  const text = (title,value) => {
    if (!value) return;
    const item = find(title);
    const typed = item.getType() === FormApp.ItemType.PARAGRAPH_TEXT ? item.asParagraphTextItem() : item.asTextItem();
    response.withItemResponse(typed.createResponse(value));
  };
  const choice = (title, english, checkbox) => {
    const item = checkbox ? find(title).asCheckboxItem() : find(title).asMultipleChoiceItem();
    const match = item.getChoices().map(c=>c.getValue()).find(v=>v === english || v.endsWith(' / '+english));
    if (!match) throw new Error('Form choice missing: ' + title);
    response.withItemResponse(item.createResponse(checkbox ? [match] : match));
  };
  text('Your name',p.name); text('Phone number',p.phone); text('Email address',p.email);
  text('Full service address',p.address); text('Nearby landmark',p.landmark);
  choice('Preferred contact language',p.contactLanguage === 'ta' ? 'Tamil' : 'English');
  choice('Required service',A2Z_SERVICES[p.service]);
  if (p.service === 'installation') {
    text('Number of cameras required',p.cameras); choice('Type of premises',p.premises); text('Installation requirements',p.details);
  } else if (p.service.endsWith('_health')) {
    text('Number of computers or CCTV systems to check',p.quantity); text('Device type and model',p.device);
    text('Anything you would like checked?',p.details); choice('Device operation','I confirm the device is currently working',true);
  } else {
    text('Device name or type',p.device); text('Model number',p.model); text('Serial number',p.serial);
    text('Describe the fault or help required',p.details); text('What have you already tried?',p.tried);
  }
  choice('Service method',{workshop:'I will visit the Paranthan workshop',onsite:'Service at my home or business',discuss:'Discuss by phone first'}[p.method]);
  choice('Convenient time to contact you',p.contactTime);
  if (p.date) { const [y,m,d] = p.date.split('-').map(Number); response.withItemResponse(find('Preferred date').asDateItem().createResponse(new Date(y,m-1,d,12))); }
  text('Additional information',(p.additional || '') + '\nWebsite request: ' + p.requestId);
  choice('Acknowledgement','I have read and agree to the above',true);
  return response;
}
function doPost(e) {
  let lock;
  try {
    if (!e || !e.postData || e.postData.length > 24000) return a2zJson_({ok:false,error:'Invalid request.'});
    const p = a2zValidate_(e.parameter);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) return a2zJson_({ok:false,error:'Please retry shortly.'});
    const form = a2zForm_();
    const props = PropertiesService.getScriptProperties();
    const key = 'WEB_' + p.requestId;
    const previous = props.getProperty(key);
    if (previous) {
      const record = JSON.parse(previous);
      if (record.id) return a2zJson_({ok:true,requestId:p.requestId});
      // If a prior save succeeded but its acknowledgement failed, recover it without resubmitting.
      const marker = 'Website request: ' + p.requestId;
      const saved = form.getResponses(new Date(record.at - 1000)).find(r => r.getItemResponses().some(i => String(i.getResponse()).includes(marker)));
      if (saved) { props.setProperty(key,JSON.stringify({at:record.at,id:saved.getId()})); return a2zJson_({ok:true,requestId:p.requestId}); }
      return a2zJson_({ok:false,error:'Previous submission could not be confirmed. Please contact A2Z before sending another request.'});
    }
    // Keep a bounded seven-day deduplication ledger. No customer details are stored in it.
    const now = Date.now();
    const all = props.getProperties();
    let count = 0;
    for (const k of Object.keys(all).filter(k=>k.startsWith('WEB_'))) {
      if (now - JSON.parse(all[k]).at > 7*86400000) props.deleteProperty(k); else count++;
    }
    if (count >= 1000) return a2zJson_({ok:false,error:'Online booking is temporarily unavailable.'});
    const response = a2zResponse_(form,p); // Validate all mappings before reserving the request ID.
    props.setProperty(key,JSON.stringify({at:now}));
    const saved = response.submit();
    props.setProperty(key,JSON.stringify({at:now,id:saved.getId()}));
    return a2zJson_({ok:true,requestId:p.requestId});
  } catch (error) {
    // No customer data or Google exception details are exposed to public callers.
    return a2zJson_({ok:false,error:'Unable to confirm this request. Please check your details or contact A2Z.'});
  } finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
