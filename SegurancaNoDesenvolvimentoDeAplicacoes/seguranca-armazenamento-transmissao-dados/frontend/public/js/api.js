const API = `${location.origin}/api`;

let SERVER_PUBKEY; // CryptoKey
let SERVER_PUBKEY_PEM;

function pemToArrayBuffer(pem) {
  // aceita "BEGIN PUBLIC KEY" (SPKI). Remove linhas/headers/espacos
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '');
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

async function fetchServerPublicKey(){
  if (SERVER_PUBKEY) return SERVER_PUBKEY;
  const res = await fetch(`${API}/public-key`, { credentials:'include' });
  if (!res.ok) throw new Error('Falha ao obter chave pública do servidor');
  SERVER_PUBKEY_PEM = await res.text();

  try {
    const spki = pemToArrayBuffer(SERVER_PUBKEY_PEM);
    SERVER_PUBKEY = await crypto.subtle.importKey(
      'spki',
      spki,
      { name:'RSA-OAEP', hash:'SHA-256' },
      true,
      ['encrypt']
    );
    return SERVER_PUBKEY;
  } catch (e) {
    console.error('Erro importando chave pública (SPKI):', e);
    throw e;
  }
}

// Desencriptação de respostas “echo” do servidor
export async function hybridDecryptEcho(aesRawBase64, payload){
  const raw = Uint8Array.from(atob(aesRawBase64), c=>c.charCodeAt(0)).buffer;
  const iv = Uint8Array.from(atob(payload.iv), c=>c.charCodeAt(0));
  const data = Uint8Array.from(atob(payload.data), c=>c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', raw, 'AES-CBC', false, ['decrypt']);
  const dec = await crypto.subtle.decrypt({ name:'AES-CBC', iv }, key, data);
  return JSON.parse(new TextDecoder().decode(dec));
}

// Chamada: envia corpo cifrado em híbrido e recebe echo cifrado
export async function callEnc(path, body){
  try {
    const pub = await fetchServerPublicKey();

    // Gera AES por requisição
    const aesKey = await crypto.subtle.generateKey({ name:'AES-CBC', length:256 }, true, ['encrypt','decrypt']);
    const aesRaw = await crypto.subtle.exportKey('raw', aesKey);
    const iv = crypto.getRandomValues(new Uint8Array(16));

    const encData = await crypto.subtle.encrypt(
      { name:'AES-CBC', iv },
      await crypto.subtle.importKey('raw', aesRaw, 'AES-CBC', false, ['encrypt','decrypt']),
      new TextEncoder().encode(JSON.stringify(body))
    );

    const encKey = await crypto.subtle.encrypt({ name:'RSA-OAEP' }, pub, aesRaw);

    const payload = {
      key: btoa(String.fromCharCode(...new Uint8Array(encKey))),
      iv: btoa(String.fromCharCode(...iv)),
      data: btoa(String.fromCharCode(...new Uint8Array(encData)))
    };

    const res = await fetch(`${API}${path}`, {
      method:'POST',
      headers: { 'Content-Type':'application/json', 'X-CSRF-Token': getCsrfFromCookie() || '' },
      credentials:'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(()=>({error:'Erro'}));
      throw new Error(err.error || 'Falha na requisição');
    }
    const data = await res.json(); // {iv,data}
    const aesRawB64 = btoa(String.fromCharCode(...new Uint8Array(aesRaw)));
    return { data, aesRawB64 };
  } catch (e) {
    console.error('Erro em callEnc:', e);
    throw e;
  }
}

// CSRF double-submit
export function getCsrfFromCookie(){
  const m = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

export async function fetchServerPublicKeyPublic(){ // helper p/ debug
  return fetchServerPublicKey();
}