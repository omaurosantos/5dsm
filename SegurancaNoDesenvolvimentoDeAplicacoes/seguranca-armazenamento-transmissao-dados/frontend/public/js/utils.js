export function el(id) {
  return document.getElementById(id);
}
// XSS-safe: use textContent sempre; nunca inserir HTML vindo do usuário
export function setMsg(txt) {
  const m = el("msg");
  if (m) {
    m.textContent = txt || "";
  }
}

export function toBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
export function fromBase64(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}
