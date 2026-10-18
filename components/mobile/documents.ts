import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export type Client = { id:string; name:string; contact:string; phone:string; email:string; address:string; town:string };
export type Certificate = { id:string; number:string; client_id:string; client_name:string; client_phone:string; client_email:string; recipient:string; location:string; town:string; valid_from:string; valid_until:string; count:number; status:string; inspected_at:string|null; previous_id:string|null };
export type Invoice = { id:string; number:string; client_id:string; client_name:string; client_phone:string; client_email:string; items:string; total_cents:number; status:string; created_at:string };
export type Line = { description:string; quantity:number; unitPriceCents:number };

const money=(cents:number)=>new Intl.NumberFormat('es-PR',{style:'currency',currency:'USD'}).format(cents/100);

export async function certificatePdf(element:HTMLElement,expectedId:string) {
  if(element.dataset.certificateId!==expectedId || element.dataset.status!=='issued' || element.querySelector('.cert-draft')) {
    throw new Error('Solo se puede compartir el PDF de un certificado emitido. Revise la inspección y el estado.');
  }
  await document.fonts.ready;
  await Promise.all(Array.from(element.querySelectorAll('img')).map(img=>img.decode().catch(()=>{})));
  const canvas=await html2canvas(element,{scale:2,useCORS:true,backgroundColor:'#ffffff',logging:false});
  const pdf=new jsPDF({orientation:'landscape',unit:'in',format:[10,7.5],compress:true});
  pdf.addImage(canvas.toDataURL('image/jpeg',.94),'JPEG',0,0,10,7.5);
  return pdf.output('blob');
}

async function imageData(path:string):Promise<string> {
  const blob=await (await fetch(path)).blob();
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(blob)});
}

export async function invoicePdf(invoice:Invoice, client:Client) {
  const pdf=new jsPDF({unit:'pt',format:'letter',compress:true});
  const green='#007B55', slate='#1E293B';
  pdf.setFillColor(green);pdf.rect(0,0,612,13,'F');
  pdf.addImage(await imageData('/logo-certificate.png'),'PNG',42,32,155,78);
  pdf.setTextColor(slate);pdf.setFont('helvetica','bold');pdf.setFontSize(31);pdf.text('Factura',570,64,{align:'right'});
  pdf.setFontSize(11);pdf.setTextColor('#64748B');pdf.text(invoice.number,570,85,{align:'right'});
  pdf.setDrawColor('#DCE7E3');pdf.line(42,119,570,119);
  pdf.setTextColor(green);pdf.setFont('helvetica','bold');pdf.setFontSize(9);pdf.text('EMITIDO PARA',42,146);
  pdf.setTextColor(slate);pdf.setFontSize(16);pdf.text(client.name,42,169);
  pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.setTextColor('#526277');
  [client.contact,client.address,`${client.town}, Puerto Rico`,client.phone,client.email].filter(Boolean).forEach((s,i)=>pdf.text(s,42,186+i*14));
  pdf.setFont('helvetica','bold');pdf.setTextColor(green);pdf.setFontSize(9);pdf.text('DETALLES',385,146);
  pdf.setTextColor(slate);pdf.setFontSize(10);pdf.text('Fecha',385,167);pdf.text(new Date(invoice.created_at).toLocaleDateString('es-PR'),570,167,{align:'right'});
  pdf.text('Estado',385,185);pdf.text(invoice.status==='paid'?'Pagada':invoice.status==='void'?'Anulada':'Pendiente',570,185,{align:'right'});
  const items=JSON.parse(invoice.items) as Line[];
  let y=284;
  pdf.setFillColor('#EAF5F1');pdf.roundedRect(42,y-21,528,33,5,5,'F');
  pdf.setTextColor(green);pdf.setFont('helvetica','bold');pdf.setFontSize(9);
  pdf.text('DESCRIPCIÓN',52,y);pdf.text('CANT.',371,y,{align:'right'});pdf.text('PRECIO',458,y,{align:'right'});pdf.text('IMPORTE',560,y,{align:'right'});
  y+=30;
  pdf.setTextColor(slate);pdf.setFont('helvetica','normal');pdf.setFontSize(10);
  for(const item of items) {
    const lines=pdf.splitTextToSize(item.description,245) as string[];
    if(y+Math.max(28,lines.length*13)>690){pdf.addPage();y=58}
    pdf.text(lines,52,y);pdf.text(String(item.quantity),371,y,{align:'right'});pdf.text(money(item.unitPriceCents),458,y,{align:'right'});pdf.text(money(item.quantity*item.unitPriceCents),560,y,{align:'right'});
    y+=Math.max(34,lines.length*13+17);pdf.setDrawColor('#EDF1F3');pdf.line(42,y-15,570,y-15);
  }
  if(y>680){pdf.addPage();y=72}
  y+=22;pdf.setFillColor(green);pdf.roundedRect(340,y,230,57,8,8,'F');pdf.setTextColor('#FFFFFF');
  pdf.setFont('helvetica','bold');pdf.setFontSize(11);pdf.text('TOTAL',355,y+34);pdf.setFontSize(19);pdf.text(money(invoice.total_cents),555,y+35,{align:'right'});
  pdf.setTextColor('#64748B');pdf.setFont('helvetica','normal');pdf.setFontSize(9);pdf.text('Gracias por confiar en Comerío Fire Systems Inc.',42,755);
  return pdf.output('blob');
}

export async function shareDocument(blob:Blob,filename:string,channel:'WhatsApp'|'Correo',recipient:string,number:string) {
  const file=new File([blob],filename,{type:'application/pdf'});
  if(navigator.canShare?.({files:[file]}) && navigator.share) {
    await navigator.share({files:[file]});
    return `PDF entregado a la aplicación elegida. Selecciona el destinatario y confirma el envío en ${channel}.`;
  }
  const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),60_000);
  return 'PDF descargado. Este navegador no permite adjuntarlo automáticamente: abre '+channel+' y adjunta el archivo guardado.';
}
