const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const properties={A2Z_FORM_ID:'existing-form',A2Z_ERP_SYNC_SECRET:'test-sync-secret',A2Z_HEALTH_ARCHIVE_FOLDER_ID:'health-folder'},saved=[],driveFiles=[];
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
function item(title,type){return {getTitle:()=> 'தமிழ் / '+title,getType:()=>type,asTextItem(){assert.equal(type,'TEXT');return this},asParagraphTextItem(){assert.equal(type,'PARAGRAPH_TEXT');return this},asDateItem(){assert.equal(type,'DATE');return this},asMultipleChoiceItem(){assert.equal(type,'MULTIPLE_CHOICE');return this},asCheckboxItem(){assert.equal(type,'CHECKBOX');return this},getChoices:()=>choices[title].map(c=>({getValue:()=> 'தமிழ் / '+c})),createResponse(value){if(type==='DATE')assert.equal(Object.prototype.toString.call(value),'[object Date]');return {title,value,getResponse:()=>value,getItem:()=>({getTitle:()=> 'தமிழ் / '+title})}}};}
const items=[...textTitles.map(t=>item(t,'TEXT')),...paragraphs.map(t=>item(t,'PARAGRAPH_TEXT')),...Object.keys(choices).map(t=>item(t,['Device operation','Acknowledgement'].includes(t)?'CHECKBOX':'MULTIPLE_CHOICE')),item('Preferred date','DATE')];
let accepting=true;
const form={getItems:()=>items,isAcceptingResponses:()=>accepting,getPublishedUrl:()=> 'https://docs.google.com/forms/d/e/1FAIpQLSdP5et7Bd3WbQ178uMQX68hXDbsWwVEE_zAaCPb3TJFDZh3ZA/viewform',getResponses:()=>saved,createResponse(){const answers=[];return {withItemResponse(i){answers.push(i);return this},submit(){const id=String(saved.length),timestamp=new Date(`2026-10-${String(saved.length+1).padStart(2,'0')}T09:00:00Z`);const r={getId:()=>id,getTimestamp:()=>timestamp,getItemResponses:()=>answers};saved.push(r);return r}}}};
const folder={createFile:blob=>{const id=`file-${driveFiles.length+1}`,created=new Date('2026-10-10T10:00:00Z');const file={blob,getId:()=>id,getUrl:()=>`https://drive.google.com/file/d/${id}`,getDateCreated:()=>created};driveFiles.push(file);return file}};
const context={console,Date,FormApp:{openById:id=>{assert.equal(id,'existing-form');return form},ItemType:{PARAGRAPH_TEXT:'PARAGRAPH_TEXT'}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties[k],getProperties:()=>({...properties}),setProperty:(k,v)=>properties[k]=v,deleteProperty:k=>delete properties[k]})},LockService:{getScriptLock:()=>({tryLock:()=>true,hasLock:()=>true,releaseLock(){}})},ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})},Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_algorithm,value)=>[...crypto.createHash('sha256').update(value).digest()],formatDate:value=>value.toISOString(),newBlob:(contents,type,name)=>({contents,type,name})},DriveApp:{getFolderById:id=>{assert.equal(id,'health-folder');return folder},getFileById:id=>driveFiles.find(file=>file.getId()===id)}};
vm.createContext(context);vm.runInContext(fs.readFileSync('backend/BookingBackend.gs','utf8'),context);
let seq=0;const base=()=>({requestId:`00000000-0000-4000-8000-${String(++seq).padStart(12,'0')}`,name:'TEST',phone:'0000000000',email:'test@example.com',address:'TEST ONLY',contactLanguage:'ta',service:'computers',device:'Laptop',model:'TEST-MODEL',serial:`TEST-SERIAL-${seq}`,details:'Connection test',method:'discuss',contactTime:'Any time',consent:'yes',date:'2026-10-05'});
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
for(const change of [{phone:'abc'},{consent:''},{email:'bad'},{service:'unknown'},{date:'2026-02-31'},{website:'bot'},{serial:''},{service:'installation',cameras:'0'},{service:'computer_health',quantity:'1',working:''}])assert.equal(post({...base(),...change}).ok,false);
accepting=false;assert.equal(post(base()).ok,false);assert.equal(saved.length,before);
accepting=true;
const integrationPost=payload=>context.doPost({postData:{type:'application/json',contents:JSON.stringify(payload),length:JSON.stringify(payload).length}});
const pull=integrationPost({action:'erp_pull',token:'test-sync-secret',limit:100});
assert.equal(pull.ok,true,pull.error);assert.equal(pull.rows.length,7);assert(pull.rows.every(row=>row.external_reference&&row.customer_name));assert(pull.rows.filter(row=>row.service_category!=='installation').every(row=>row.serial_number));
assert(pull.rows.filter(row=>row.service_category==='health_check').every(row=>row.device_brand==='Laptop'&&row.device_model==='TEST-MODEL'));
const firstReference=pull.rows[0].external_reference;
assert.equal(integrationPost({action:'erp_ack',token:'wrong',external_references:[firstReference]}).ok,false);
assert.equal(integrationPost({action:'erp_ack',token:'test-sync-secret',external_references:[firstReference]}).acknowledged,1);
assert.equal(integrationPost({action:'erp_pull',token:'test-sync-secret'}).rows.length,6);
const diagnostic={diagnostic_version:'1.0',cpu:{usage_percent:20}};
const hash=crypto.createHash('sha256').update(JSON.stringify(diagnostic)).digest('hex');
const archive={action:'archive_health_report',token:'test-sync-secret',report_id:'RPT-TEST-1',customer_id:'CUST-TEST-1',serial_number:'TEST-SERIAL-1',diagnostic_sha256:hash,diagnostic};
const stored=integrationPost(archive);assert.equal(stored.ok,true);assert.equal(driveFiles.length,1);
assert.equal(integrationPost(archive).duplicate,true);assert.equal(driveFiles.length,1);
console.log('PASS: website submissions, required serials, ERP pull/ack authentication, idempotency, and Drive archive deduplication.');
