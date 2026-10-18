import { getChatGPTUser } from '@/app/chatgpt-auth';
import { all, run, id } from './data';
export type AppUser={id:string;email:string;name:string;role:'ADMIN'|'TECH';active:number};
const ownerEmail='rodriguez.misael@gmail.com';
export async function currentAppUser():Promise<AppUser|null>{
 const visitor=await getChatGPTUser(); if(!visitor)return null;
 const email=visitor.email.toLowerCase();
 if(email===ownerEmail){
  await run('INSERT OR IGNORE INTO app_users (id,email,name,role,active,created_at) VALUES (?,?,?,?,?,?)',id(),email,visitor.fullName||'Misael Rodríguez Rodríguez','ADMIN',1,new Date().toISOString());
 }
 const user=(await all<AppUser>('SELECT id,email,name,role,active FROM app_users WHERE lower(email)=?',email))[0];
 return user?.active ? user : null;
}
