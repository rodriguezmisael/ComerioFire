'use client';
import { useState } from 'react';
export function WhatsAppButton({phone,kind,id,number}:{phone?:string|null;kind:'certificate'|'quote'|'invoice';id:string;number:string}) {
 const [alternate,setAlternate]=useState(''),[showAlternate,setShowAlternate]=useState(false);
 const digits=(showAlternate?alternate:phone||'').replace(/\D/g,''); const normalized=digits.length===10?`1${digits}`:digits;
 const valid=normalized.length>=11&&normalized.length<=15;
 function open(){if(!valid)return;const label=kind==='certificate'?'certificado':kind==='invoice'?'factura':'cotización'; const url=`${window.location.origin}/documento/${kind}/${id}`; const message=`Hola. Le compartimos ${label} ${number} de Comerío Fire Systems Inc.: ${url}`; window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer')}
 return <div className="flex flex-col items-start gap-1"><button type="button" disabled={!valid} title={valid?'Abre WhatsApp con un mensaje de prueba. El enlace requiere acceso al Site.':'Añada un teléfono válido.'} onClick={open} className="text-[#008767] font-semibold disabled:text-slate-400 disabled:cursor-not-allowed">Probar WhatsApp</button>{kind==='certificate'&&<>{showAlternate?<label className="text-xs text-slate-600">Otro número (sin cambiar el cliente)<input className="field mt-1 max-w-52" type="tel" inputMode="tel" value={alternate} onChange={e=>setAlternate(e.target.value)} placeholder="787 000 0000"/></label>:null}<button type="button" className="text-xs text-[#0288d1] underline" onClick={()=>setShowAlternate(v=>!v)}>{showAlternate?'Usar número registrado':'Probar con otro número'}</button></>}</div>
}
