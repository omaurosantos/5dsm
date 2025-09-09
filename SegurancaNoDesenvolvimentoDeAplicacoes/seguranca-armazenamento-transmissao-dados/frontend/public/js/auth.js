import { el, setMsg } from './utils.js';
import { callEnc, hybridDecryptEcho } from './api.js';

async function handleLogin(){
  setMsg('');
  const username = el('username')?.value.trim();
  const password = el('password')?.value || '';
  try {
    const { data, aesRawB64 } = await callEnc('/auth/login', { username, password });
    const dec = await hybridDecryptEcho(aesRawB64, data);
    if (dec.ok){ location.href = './contacts.html'; } else setMsg('Falha no login');
  } catch(e){ setMsg(e.message); }
}

async function handleRegister(){
  setMsg('');
  const username = el('username')?.value.trim();
  const password = el('password')?.value || '';
  try {
    const { data, aesRawB64 } = await callEnc('/auth/register', { username, password });
    const dec = await hybridDecryptEcho(aesRawB64, data);
    if (dec.ok){ location.href = './contacts.html'; } else setMsg('Falha no registro');
  } catch(e){ 
    console.error('handleRegister erro:', e);
    setMsg(e.message);
  }
}

async function handleLogout(){
  await fetch(`${location.origin}/api/auth/logout`, { method:'POST', credentials:'include' });
  location.href = './index.html';
}

window.addEventListener('DOMContentLoaded', ()=>{
  const btnLogin = el('btnLogin');
  const btnRegister = el('btnRegister');
  const btnLogout = el('btnLogout');

  if (btnLogin) btnLogin.addEventListener('click', handleLogin);
  if (btnRegister) btnRegister.addEventListener('click', handleRegister);
  if (btnLogout) btnLogout.addEventListener('click', handleLogout);
});
