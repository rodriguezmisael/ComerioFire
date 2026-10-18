'use client';
import dynamic from 'next/dynamic';
export default dynamic(()=>import('./workspace'),{ssr:false,loading:()=><div style={{padding:30}}>Cargando versión móvil…</div>});
