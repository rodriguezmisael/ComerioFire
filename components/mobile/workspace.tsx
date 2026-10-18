'use client';
import { useEffect,useMemo,useState } from 'react';
import { IonApp,IonPage,IonHeader,IonToolbar,IonContent,IonFooter,IonButton,IonIcon,IonCard,IonCardContent,IonChip,IonSpinner,IonToast,IonModal,setupIonicReact } from '@ionic/react';
import { peopleOutline,documentTextOutline,receiptOutline,addOutline,duplicateOutline,logoWhatsapp,mailOutline,openOutline,arrowBackOutline } from 'ionicons/icons';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './mobile.css';
import { certificatePdf,invoicePdf,shareDocument,type Client,type Certificate,type Invoice,type Line } from './documents';

setupIonicReact({mode:'ios'});
type Data={clients:Client[];certificates:Certificate[];invoices:Invoice[];me:{role:string;name:string}|null};
type Tab='clientes'|'certificados'|'facturas';
type Form='client'|'certificate'|'invoice'|null;
const initial:Data={clients:[],certificates:[],invoices:[],me:null};
const iso=()=>new Date().toISOString().slice(0,10);
function nextYear(date:string){const d=new Date(date+'T12:00:00Z');d.setUTCFullYear(d.getUTCFullYear()+1);return d.toISOString().slice(0,10)}
const currency=(n:number)=>new Intl.NumberFormat('es-PR',{style:'currency',currency:'USD'}).format(n/100);
const date=(s:string)=>new Date(s+'T12:00:00Z').toLocaleDateString('es-PR',{timeZone:'UTC',day:'numeric',month:'short',year:'numeric'});

export default function MobileWorkspace(){
 const [data,setData]=useState<Data>(initial),[tab,setTab]=useState<Tab>('clientes'),[form,setForm]=useState<Form>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [client,setClient]=useState(''),[from,setFrom]=useState(iso()),[until,setUntil]=useState(nextYear(iso())),[location,setLocation]=useState(''),[count,setCount]=useState(''),[inspected,setInspected]=useState(false);
 const [lines,setLines]=useState([{description:'',quantity:1,price:''}]);
 const [selectedCert,setSelectedCert]=useState<Certificate|null>(null);
 const [whatsappCert,setWhatsappCert]=useState<Certificate|null>(null),[whatsappPhone,setWhatsappPhone]=useState(''),[whatsappPdf,setWhatsappPdf]=useState<Blob|null>(null),[preparingWhatsapp,setPreparingWhatsapp]=useState(false);
 const digits=whatsappPhone.replace(/\D/g,'');
 const targetPhone=digits.length===10?'1'+digits:digits;
 const validTarget=/^[1-9]\d{10,14}$/.test(targetPhone);
 const pdfCanShare=!!whatsappPdf && !!navigator.share && !!navigator.canShare?.({files:[new File([whatsappPdf],`${whatsappCert?.number||'certificado'}.pdf`,{type:'application/pdf'})]});
 useEffect(()=>{if(!whatsappCert)return;let cancelled=false;setPreparingWhatsapp(true);setWhatsappPdf(null);
   const timer=window.setTimeout(async()=>{try{if(whatsappCert.status!=='issued')throw Error('Este certificado sigue en borrador. Emítalo tras confirmar la inspección.');const node=document.getElementById('mobile-certificate');if(!node)throw Error('No se pudo preparar el certificado');const pdf=await certificatePdf(node,whatsappCert.id);if(!cancelled)setWhatsappPdf(pdf)}catch(e){if(!cancelled)setError(e instanceof Error?e.message:'No se pudo preparar el PDF')}finally{if(!cancelled)setPreparingWhatsapp(false)}},50);
   return()=>{cancelled=true;window.clearTimeout(timer)};
 },[whatsappCert]);
 async function refresh(){try{const r=await fetch('/api/data',{cache:'no-store'});const j=await r.json() as Data & {error?:string};if(!r.ok)throw Error(j.error||'No se pudieron cargar los datos');setData(j);setError('')}catch(e){setError(e instanceof Error?e.message:'Error de conexión')}finally{setLoading(false)}}
 useEffect(()=>{void refresh()},[]);
 useEffect(()=>{if(data.clients.length&&!client)setClient(data.clients[0].id)},[data.clients,client]);
 async function save(payload:Record<string,unknown>){setBusy(true);setError('');try{const r=await fetch('/api/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const j=await r.json() as {error?:string;id?:string};if(!r.ok)throw Error(j.error||'No se pudo guardar');await refresh();setForm(null);setNotice('Guardado correctamente');return j}catch(e){setError(e instanceof Error?e.message:'No se pudo guardar');return null}finally{setBusy(false)}}
 function begin(type:Form){setForm(type);setError('');setLines([{description:'',quantity:1,price:''}]);setFrom(iso());setUntil(nextYear(iso()));setLocation('');setCount('');setInspected(false);if(type==='certificate'){const available=data.clients.find(c=>!data.certificates.some(cert=>cert.client_id===c.id));if(available)setClient(available.id)}}
 function submitClient(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));void save({action:'client',...f})}
 function submitCertificate(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(data.certificates.some(c=>c.client_id===client)){setError('Este cliente ya tiene un certificado. Abra el existente para compartir una copia.');return}void save({action:'certificate',clientId:client,validFrom:from,validUntil:until,location,count,inspected})}
 function submitInvoice(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const items=lines.map(l=>({description:l.description.trim(),quantity:Number(l.quantity),unitPriceCents:Math.round(Number(l.price)*100)}));void save({action:'invoiceCreate',clientId:client,items})}
 const recipient=useMemo(()=>data.clients.find(c=>c.id===client),[data.clients,client]);
 const existingCertificate=data.certificates.find(c=>c.client_id===client);
 async function share(kind:'certificate'|'invoice',item:Certificate|Invoice,channel:'WhatsApp'|'Correo'){
   setBusy(true);setError('');
   try {
     let blob:Blob;
     if(kind==='certificate'){const cert=item as Certificate;if(cert.status!=='issued')throw Error('Solo puede compartir certificados emitidos');const node=document.getElementById('mobile-certificate');if(!node)throw Error('Abra el certificado antes de compartirlo');blob=await certificatePdf(node,cert.id)}
     else {const invoice=item as Invoice;const owner=data.clients.find(c=>c.id===invoice.client_id);if(!owner)throw Error('Cliente no encontrado');blob=await invoicePdf(invoice,owner)}
     const message=await shareDocument(blob,`${item.number}.pdf`,channel,item.client_name,item.number);
     setNotice(message);
     if(message.startsWith('PDF descargado')){
       if(channel==='WhatsApp'){const digits=(item.client_phone||'').replace(/\D/g,'');const phone=digits.length===10?'1'+digits:digits;if(phone)window.open(`https://wa.me/${phone}?text=${encodeURIComponent('Hola. Le comparto el documento '+item.number+' de Comerío Fire Systems Inc. Adjunto el PDF.')}`,'_blank','noopener,noreferrer')}
       else if(item.client_email)window.location.href=`mailto:${encodeURIComponent(item.client_email)}?subject=${encodeURIComponent('Comerío Fire · '+item.number)}&body=${encodeURIComponent('Hola. Le comparto el documento '+item.number+'. Adjunto el PDF.')}`;
     }
   }catch(e){if((e as Error).name!=='AbortError')setError(e instanceof Error?e.message:'No se pudo preparar el PDF')}finally{setBusy(false)}
 }
 function shareCert(c:Certificate,ch:'WhatsApp'|'Correo'){setSelectedCert(c);requestAnimationFrame(()=>{void share('certificate',c,ch)})}
 function openCertificateWhatsApp(c:Certificate){setSelectedCert(c);setWhatsappPhone(c.client_phone||'');setWhatsappCert(c)}
 async function shareCertificateFile(){if(!whatsappCert||!whatsappPdf||!pdfCanShare)return;
   try{await navigator.share({files:[new File([whatsappPdf],`${whatsappCert.number}.pdf`,{type:'application/pdf'})]});setWhatsappCert(null);setNotice('El PDF se entregó a la aplicación elegida. Confirma el destinatario y pulsa Enviar en WhatsApp.')}catch(e){if((e as Error).name!=='AbortError')setError(e instanceof Error?e.message:'No se pudo compartir el PDF')}
 }
 function openTargetChat(){if(!whatsappCert||!whatsappPdf||!validTarget)return;
   const link=document.createElement('a');const url=URL.createObjectURL(whatsappPdf);link.href=url;link.download=`${whatsappCert.number}.pdf`;document.body.appendChild(link);link.click();link.parentNode?.removeChild(link);setTimeout(()=>URL.revokeObjectURL(url),60_000);
   const message=`Hola. Le comparto el certificado ${whatsappCert.number} de Comerío Fire Systems Inc. Adjunto el PDF.`;
   const opened=window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`,'_blank');
   if(opened)opened.opener=null;else window.location.href=`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
   setWhatsappCert(null);setNotice('Se descargó el PDF y se abrió el chat. En esta ruta debes adjuntar el archivo manualmente.');
 }
 const title=form==='client'?'Nuevo cliente':form==='certificate'?'Nuevo certificado':form==='invoice'?'Nueva factura':tab==='clientes'?'Clientes':tab==='certificados'?'Certificados':'Facturas';
 return <IonApp><IonPage className="fire-mobile">
  <IonHeader className="ion-no-border"><IonToolbar><div className="mobile-header"><button aria-label={form?'Volver':'Versión completa'} onClick={()=>form?setForm(null):window.location.assign('/')} className="back"><IonIcon icon={arrowBackOutline}/></button><div><small>COMERÍO FIRE SYSTEMS INC.</small><strong>{title}</strong></div><img src="/logo-original.png" alt=""/></div></IonToolbar></IonHeader>
  <IonContent>
   <div className="mobile-body">
    {error&&<div className="mobile-error" role="alert">{error}</div>}
    {loading?<div className="mobile-loading"><IonSpinner name="crescent"/> Cargando datos…</div>:form==='client'?<form onSubmit={submitClient} className="mobile-form">
      <p className="mobile-lead">Registra los datos una sola vez. El municipio y nombre se usarán en el certificado.</p>
      <label>Nombre comercial *<input name="name" required autoFocus/></label><label>Persona de contacto<input name="contact"/></label><label>Teléfono / WhatsApp<input name="phone" type="tel" inputMode="tel" placeholder="787 000 0000"/></label><label>Correo electrónico<input name="email" type="email" inputMode="email"/></label><label>Dirección física<input name="address"/></label><label>Municipio *<input name="town" required/></label>
      <IonButton expand="block" type="submit" disabled={busy}>Guardar cliente</IonButton>
    </form>:form==='certificate'?<form onSubmit={submitCertificate} className="mobile-form">
      <p className="mobile-lead">El nombre y el municipio salen de la ficha del cliente.</p>
      <label>Cliente *<select value={client} onChange={e=>setClient(e.target.value)} required>{data.clients.map(c=><option key={c.id} value={c.id}>{c.name}{data.certificates.some(cert=>cert.client_id===c.id)?" · ya tiene certificado":""}</option>)}</select></label>
      {existingCertificate&&<div className="mobile-error" role="alert">Este cliente ya tiene un certificado ({existingCertificate.number}). Ábrelo en la lista para compartir una copia.</div>}
      {recipient&&<div className="client-preview">Localizado en <strong>{recipient.town}, P.R.</strong></div>}
      <label>Ubicación / bloque (opcional)<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Ej. Bloque 3 y 4"/></label>
      <div className="date-grid"><label>Desde<input type="date" value={from} onChange={e=>{setFrom(e.target.value);setUntil(nextYear(e.target.value))}} required/></label><label>Hasta<input type="date" value={until} onChange={e=>setUntil(e.target.value)} required/></label></div>
      <label>Total de extintores (opcional)<input type="number" min="0" value={count} onChange={e=>setCount(e.target.value)}/></label>
      <label className="check"><input type="checkbox" checked={inspected} onChange={e=>setInspected(e.target.checked)}/> Confirmo que realicé y documenté la inspección.</label>
      <IonButton expand="block" type="submit" disabled={busy||!data.clients.length||!!existingCertificate}>Guardar borrador</IonButton>
    </form>:form==='invoice'?<form onSubmit={submitInvoice} className="mobile-form">
      <label>Cliente *<select value={client} onChange={e=>setClient(e.target.value)} required>{data.clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {lines.map((line,i)=><div className="line-editor" key={i}><div className="line-head"><strong>Partida {i+1}</strong>{lines.length>1&&<button type="button" onClick={()=>setLines(v=>v.filter((_,n)=>n!==i))}>Eliminar</button>}</div><label>Descripción<input required value={line.description} onChange={e=>setLines(v=>v.map((x,n)=>n===i?{...x,description:e.target.value}:x))} placeholder="Inspección, recarga o producto"/></label><div className="date-grid"><label>Cantidad<input type="number" min="1" required value={line.quantity} onChange={e=>setLines(v=>v.map((x,n)=>n===i?{...x,quantity:Number(e.target.value)}:x))}/></label><label>Precio unitario<input type="number" min="0" step="0.01" required value={line.price} onChange={e=>setLines(v=>v.map((x,n)=>n===i?{...x,price:e.target.value}:x))}/></label></div></div>)}
      <IonButton fill="outline" expand="block" type="button" onClick={()=>setLines(v=>[...v,{description:'',quantity:1,price:''}])}><IonIcon slot="start" icon={addOutline}/> Añadir partida</IonButton>
      <div className="invoice-total"><span>Total</span><strong>{currency(lines.reduce((sum,l)=>sum+(Number(l.quantity)||0)*Math.round((Number(l.price)||0)*100),0))}</strong></div>
      <IonButton expand="block" type="submit" disabled={busy||!data.clients.length}>Crear factura</IonButton>
      <small className="form-note">Sin IVU. Podrás editarla desde la vista completa con acceso de administrador.</small>
    </form>:<>
      <div className="mobile-intro"><div><span>OPERACIONES DE CAMPO</span><p>{tab==='clientes'?'Registra y consulta clientes':tab==='certificados'?'Consulta y comparte certificados':'Factura servicios y productos'}</p></div><IonButton disabled={tab==='certificados'&&!data.clients.some(c=>!data.certificates.some(cert=>cert.client_id===c.id))} onClick={()=>begin(tab==='clientes'?'client':tab==='certificados'?'certificate':'invoice')}><IonIcon slot="start" icon={addOutline}/> Nuevo</IonButton></div>
      {tab==='clientes'&&(data.clients.length?<div className="card-list">{data.clients.map(c=><IonCard key={c.id}><IonCardContent><div className="card-top"><strong>{c.name}</strong><IonChip color="success">{c.town}</IonChip></div><p>{c.contact||'Sin contacto'}{c.phone&&' · '+c.phone}</p><div className="card-actions"><IonButton fill="clear" size="small" onClick={()=>{setTab('certificados');if(data.certificates.some(cert=>cert.client_id===c.id)){setForm(null);setNotice('Este cliente ya tiene un certificado. Abra el existente en la lista.')}else{begin('certificate');setClient(c.id)}}}>Certificado</IonButton><IonButton fill="clear" size="small" onClick={()=>{setClient(c.id);setTab('facturas');begin('invoice')}}>Factura</IonButton></div></IonCardContent></IonCard>)}</div>:<Empty text="Aún no hay clientes. Registra el primero para crear documentos."/>)}
      {tab==='certificados'&&(data.certificates.length?<div className="card-list">{data.certificates.map(c=><IonCard key={c.id}><IonCardContent><div className="card-top"><div><strong>{c.client_name}</strong><p className="number">{c.number}</p></div><IonChip color={c.status==='issued'?'success':'warning'}>{c.status==='issued'?'Emitido':'Borrador · sin validez'}</IonChip></div><p>{c.location?c.location+' · ':''}{c.town} · Hasta {date(c.valid_until)}</p><div className="card-actions"><IonButton fill="clear" size="small" href={`/documento/certificate/${c.id}`} target="_blank"><IonIcon slot="start" icon={openOutline}/> {c.status==='issued'?'Ver certificado':'Ver borrador'}</IonButton>{c.status==='issued'&&<IonButton fill="clear" size="small" disabled={busy} onClick={()=>openCertificateWhatsApp(c)}><IonIcon slot="start" icon={duplicateOutline}/> Compartir copia</IonButton>}</div>{c.status==='draft'&&!c.inspected_at&&<IonButton fill="outline" size="small" disabled={busy} onClick={()=>{if(confirm('¿Se realizó y documentó la inspección?'))void save({action:'inspectionConfirm',id:c.id,inspected:true})}}>Confirmar inspección</IonButton>}{c.status==='draft'&&c.inspected_at&&data.me?.role==='ADMIN'&&<IonButton fill="outline" size="small" onClick={()=>void save({action:'issue',id:c.id})}>Emitir tras inspección</IonButton>}
       {c.status==='issued'&&<div className="share-actions"><IonButton size="small" color="success" disabled={busy} onClick={()=>openCertificateWhatsApp(c)}><IonIcon slot="start" icon={logoWhatsapp}/> WhatsApp</IonButton><IonButton size="small" color="primary" disabled={busy} onClick={()=>shareCert(c,'Correo')}><IonIcon slot="start" icon={mailOutline}/> Email</IonButton></div>}
      </IonCardContent></IonCard>)}</div>:<Empty text="No hay certificados todavía."/>)}
      {tab==='facturas'&&(data.invoices.length?<div className="card-list">{data.invoices.map(i=><IonCard key={i.id}><IonCardContent><div className="card-top"><div><strong>{i.client_name}</strong><p className="number">{i.number}</p></div><b>{currency(i.total_cents)}</b></div><p>{i.status==='paid'?'Pagada':i.status==='void'?'Anulada':'Pendiente'}</p><div className="card-actions"><IonButton fill="clear" size="small" href={`/documento/invoice/${i.id}`} target="_blank"><IonIcon slot="start" icon={openOutline}/> Ver</IonButton></div><div className="share-actions"><IonButton size="small" color="success" disabled={busy} onClick={()=>void share('invoice',i,'WhatsApp')}><IonIcon slot="start" icon={logoWhatsapp}/> WhatsApp</IonButton><IonButton size="small" color="primary" disabled={busy} onClick={()=>void share('invoice',i,'Correo')}><IonIcon slot="start" icon={mailOutline}/> Email</IonButton></div></IonCardContent></IonCard>)}</div>:<Empty text="Aún no hay facturas. Crea una desde el teléfono."/>)}
    </>}
    {busy&&<div className="busy-overlay"><IonSpinner name="crescent"/> Preparando…</div>}
   </div>
  </IonContent>
  {!form&&<IonFooter className="ion-no-border"><nav className="mobile-nav" aria-label="Secciones"><Nav tab="clientes" active={tab} set={setTab} icon={peopleOutline} label="Clientes"/><Nav tab="certificados" active={tab} set={setTab} icon={documentTextOutline} label="Certificados"/><Nav tab="facturas" active={tab} set={setTab} icon={receiptOutline} label="Facturas"/></nav></IonFooter>}
  <IonToast isOpen={!!notice} onDidDismiss={()=>setNotice('')} message={notice} duration={5000} position="top"/>
  <IonModal isOpen={!!whatsappCert} onDidDismiss={()=>setWhatsappCert(null)} breakpoints={[0,0.75,1]} initialBreakpoint={0.75}>
   <div className="whatsapp-modal">
    <span className="modal-kicker">CERTIFICADO · {whatsappCert?.number}</span><h2>Enviar por WhatsApp</h2>
    <p>Usa el número del cliente o escribe otro. Esto no cambia su ficha.</p>
    <label htmlFor="whatsapp-target">Número de destino</label>
    <input id="whatsapp-target" type="tel" inputMode="tel" autoComplete="tel" value={whatsappPhone} onChange={e=>setWhatsappPhone(e.target.value)} placeholder="787 000 0000"/>
    {whatsappCert?.client_phone&&<button className="saved-number" onClick={()=>setWhatsappPhone(whatsappCert.client_phone)}>Usar número registrado: {whatsappCert.client_phone}</button>}
    {validTarget&&<button className="saved-number" onClick={()=>{void navigator.clipboard?.writeText('+'+targetPhone).then(()=>setNotice('Número copiado para buscarlo en WhatsApp'))}}>Copiar +{targetPhone}</button>}
    {!validTarget&&whatsappPhone&&<small className="invalid-phone">Escribe un número válido con código de país o un número de 10 dígitos de Puerto Rico/EE. UU.</small>}
    <p className="send-note">Para adjuntar el PDF, toca Compartir PDF, elige WhatsApp y selecciona este número allí. La web no puede elegir el chat por ti.</p>
    <IonButton expand="block" color="success" disabled={preparingWhatsapp||!whatsappPdf||!pdfCanShare} onClick={()=>void shareCertificateFile()}>{preparingWhatsapp?'Preparando PDF…':'Compartir PDF adjunto'}</IonButton>
    {!pdfCanShare&&whatsappPdf&&<small>Este navegador no admite compartir archivos. Puedes descargar el PDF y adjuntarlo manualmente.</small>}
    <IonButton expand="block" fill="outline" disabled={!validTarget||preparingWhatsapp||!whatsappPdf} onClick={openTargetChat}>Abrir chat al número y adjuntar manualmente</IonButton>
    <IonButton expand="block" fill="clear" onClick={()=>setWhatsappCert(null)}>Cancelar</IonButton>
   </div>
  </IonModal>
  <div className="pdf-capture" aria-hidden="true">{selectedCert&&<CertificatePreview c={selectedCert}/>}</div>
 </IonPage></IonApp>
}
function Nav({tab,active,set,icon,label}:{tab:Tab;active:Tab;set:(v:Tab)=>void;icon:string;label:string}){return <button onClick={()=>set(tab)} className={active===tab?'active':''} aria-current={active===tab?'page':undefined}><IonIcon icon={icon}/><span>{label}</span></button>}
function Empty({text}:{text:string}){return <div className="mobile-empty"><p>{text}</p></div>}
function CertificatePreview({c}:{c:Certificate}){const month=(s:string)=>new Date(s+'T12:00:00Z').toLocaleDateString('es-PR',{timeZone:'UTC',month:'long',year:'numeric'});return <article id="mobile-certificate" data-certificate-id={c.id} data-status={c.status} className="mobile-certificate"><img className="cert-logo" src="/logo-certificate.png" alt=""/><img className="cert-title" src="/certificate-title.png" alt="Certificado de Cumplimiento"/><p className="cert-granted">Otorgado a:</p><h2>{c.recipient}</h2>{c.location&&<p className="cert-location">{c.location}</p>}<p className="cert-town">Localizado en {c.town}</p><p className="cert-intro">Por el cumplimiento de los siguientes códigos NFPA y reglamento vigente del Cuerpo de<br/> Bomberos de Puerto Rico:</p><div className="cert-codes"><p>•NFPA-10-2018</p><p>•Normas para extintores portátiles contra incendio</p><p>•Reglamento para autorizar y mantener extintores portátiles de incendio y sistemas<br/> automáticos de extinción pre-diseñado.</p></div><p className="cert-valid">Este certificado tiene vigencia desde: <b>{month(c.valid_from)} hasta {month(c.valid_until)}</b></p><div className="cert-bottom">{c.count>0&&<strong>Total Extintores: {c.count}</strong>}<div className="cert-issuer"><img src="/signature-original.png" alt=""/><span>Misael Rodríguez Rodríguez<br/>Vice-Presidente<br/>Licencia 063-02</span></div></div>{c.status!=='issued'&&<span className="cert-draft">BORRADOR · SIN VALIDEZ</span>}</article>}
