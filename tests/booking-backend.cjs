const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const properties={A2Z_FORM_ID:'existing-form'},saved=[];
const textTitles=['Your name','Phone number','Email address','Nearby landmark','Device name or type','Model number','Serial number','Number of cameras required','Number of computers or CCTV systems to check','Device type and model'];
const paragraphs=['Full service address','Describe the fault or help required','What have you already tried?','Installation requirements','Anything you would like checked?','Additional information'];
const choices={
'Preferred contact language':['Tamil','English'],
'Required service':['Computer / laptop repair','CCTV repair','Printer repair','Networking','CCTV installation','Computer / laptop health check','CCTV health check'],
'Type of premises':['Home','Shop or office','Other'],
'Service method':['I will visit the Paranthan workshop','Service at my home or business','Discuss by phone first'],
'Convenient time to contact you':['Morning','Afternoon','Any time'],
'Device operation':['I confirm the device is currently working'],
'Acknowledgement':['I have read and agree to the above']};
function item(title,type){return {getTitle:()=> 'தமிழ் / '+title,getType:()=>type,asTextItem(){assert.equal(type,'TEXT');return this},asParagraphTextItem(){assert.equal(type,'PARAGRAPH_TEXT');return this},asDateItem(){assert.equal(type,'DATE');return this},asMultipleChoiceItem(){assert.equal(type,'MULTIPLE_CHOICE');return this},asCheckboxItem(){assert.equal(type,'CHECKBOX');return this},getChoices:()=>choices[title].map(c=>({getValue:()=> 'தமிழ் / '+c})),createResponse(value){if(type==='DATE')assert.equal(Object.prototype.toString.call(value),'[object Date]');return {title,value,getResponse:()=>value}}};}
const items=[...textTitles.map(t=>item(t,'TEXT')),...paragraphs.map(t=>item(t,'PARAGRAPH_TEXT')),...Object.keys(choices).map(t=>item(t,['Device operation','Acknowledgement'].includes(t)?'CHECKBOX':'MULTIPLE_CHOICE')),item('Preferred date','DATE')];
let accepting=true;
const form={getItems:()=>items,isAcceptingResponses:()=>accepting,getPublishedUrl:()=> 'https://docs.google.com/forms/d/e/1FAIpQLSdP5et7Bd3WbQ178uMQX68hXDbsWwVEE_zAaCPb3TJFDZh3ZA/viewform',getResponses:()=>saved,createResponse(){const answers=[];return {withItemResponse(i){answers.push(i);return this},submit(){const r={getId:()=>String(saved.length),getItemResponses:()=>answers};saved.push(r);return r}}}};
const context={console,Date,FormApp:{openById:id=>{assert.equal(id,'existing-form');return form},ItemType:{PARAGRAPH_TEXT:'PARAGRAPH_TEXT'}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties[k],getProperties:()=>({...properties}),setProperty:(k,v)=>properties[k]=v,deleteProperty:k=>delete properties[k]})},LockService:{getScriptLock:()=>({tryLock:()=>true,hasLock:()=>true,releaseLock(){}})},ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})}};
vm.createContext(context);vm.runInContext(fs.readFileSync('backend/BookingBackend.gs','utf8'),context);
let seq=0;const base=()=>({requestId:`00000000-0000-4000-8000-${String(++seq).padStart(12,'0')}`,name:'TEST',phone:'0000000000',email:'test@example.com',address:'TEST ONLY',contactLanguage:'ta',service:'computers',device:'Laptop',details:'Connection test',method:'discuss',contactTime:'Any time',consent:'yes',date:'2026-10-05'});
const post=p=>context.doPost({parameter:p,postData:{length:JSON.stringify(p).length}});
for(const service of ['computers','cctv','printers','networks','installation','computer_health','cctv_health']){
 const p={...base(),service,cameras:'4',premises:'Home',quantity:'2',working:'yes'};if(service==='installation')p.method='onsite';
 assert.equal(post(p).ok,true);const count=saved.length;assert.equal(post(p).ok,true);assert.equal(saved.length,count,'retry duplicated a response');
 const answers=saved.at(-1).getItemResponses();assert(answers.some(a=>a.title==='Additional information'&&a.value.includes(p.requestId)));
 assert.equal(answers.some(a=>a.title==='Installation requirements'),service==='installation');
 assert.equal(answers.some(a=>a.title==='Device operation'),service.endsWith('_health'));
 assert.equal(answers.some(a=>a.title==='Describe the fault or help required'),!service.endsWith('_health')&&service!=='installation');
 // Simulate failure to record acknowledgement after a successful Google save.
 properties['WEB_'+p.requestId]=JSON.stringify({at:Date.now()});assert.equal(post(p).ok,true);assert.equal(saved.length,count);
}
const before=saved.length;
for(const change of [{phone:'abc'},{consent:''},{email:'bad'},{service:'unknown'},{date:'2026-02-31'},{website:'bot'},{service:'installation',cameras:'0'},{service:'computer_health',quantity:'1',working:''}])assert.equal(post({...base(),...change}).ok,false);
accepting=false;assert.equal(post(base()).ok,false);assert.equal(saved.length,before);
console.log('PASS: seven services, conditional mappings, date type, acknowledgement recovery, duplicate prevention, invalid input and closed-form rejection.');
