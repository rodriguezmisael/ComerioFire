import type { Metadata } from 'next'; import './globals.css'; import { ServiceWorker } from '@/components/service-worker';
export const metadata: Metadata = { title: 'Comerío Fire Systems', description: 'Gestión de clientes, extintores y certificados', icons: { icon: '/favicon.svg' } };
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="es"><body><ServiceWorker/>{children}</body></html>; }
