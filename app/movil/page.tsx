import { getChatGPTUser, chatGPTSignInPath } from '@/app/chatgpt-auth';
import { currentAppUser } from '@/lib/authorization';
import MobileShell from '@/components/mobile/shell';
export const dynamic='force-dynamic';
export const metadata={title:'Comerío Fire · Móvil',manifest:'/movil/manifest.webmanifest',appleWebApp:{capable:true,title:'Comerío Fire',statusBarStyle:'default' as const}};
export default async function MobilePage(){
  const visitor=await getChatGPTUser();
  if(!visitor) return <main style={{padding:24}}><h1>Comerío Fire · móvil</h1><a href={chatGPTSignInPath('/movil')} target="_top">Iniciar sesión</a></main>;
  if(!await currentAppUser()) return <main style={{padding:24}}><h1>Acceso pendiente</h1><p>Un administrador debe añadir tu correo a Usuarios y darte acceso al Site.</p></main>;
  return <MobileShell/>;
}
