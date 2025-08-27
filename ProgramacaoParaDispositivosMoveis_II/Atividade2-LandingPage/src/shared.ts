export const API_BASE = "http://localhost:3000/v1";

export function toggleStylesheet(button: HTMLButtonElement){
  const mobile  = document.getElementById('theme-mobile')  as HTMLLinkElement
  const desktop = document.getElementById('theme-desktop') as HTMLLinkElement

  const desktopActive = !desktop.disabled
  if (desktopActive) {
    // Ir para mobile-first
    desktop.disabled = true
    mobile.disabled = false
    button.textContent = 'Mobile-first'
  } else {
    // Ir para desktop-first
    mobile.disabled = true
    desktop.disabled = false
    button.textContent = 'Desktop-first'
  }
}

export async function setApiStatus(el: HTMLElement) {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error("bad status");
    const data = await res.json();
    el.textContent = `API OK · uptime ${Math.round(data.uptime)}s`;
    el.classList.remove("bad");
  } catch {
    el.textContent = "API offline";
    el.classList.add("bad");
  }
}
