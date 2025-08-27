import { API_BASE, setApiStatus, toggleStylesheet } from "./shared";

const btn = document.getElementById("toggle-css") as HTMLButtonElement;
btn?.addEventListener("click", () => toggleStylesheet(btn));

const status = document.getElementById("api-status") as HTMLElement;
setApiStatus(status);

async function loadCrops() {
  const container = document.getElementById("crops")!;
  container.innerHTML = "Carregando…";
  try {
    const res = await fetch(`${API_BASE}/crops`);
    const data = (await res.json()) as { total: number; items: any[] };
    container.innerHTML = "";
    data.items.forEach((c) => {
      const el = document.createElement("article");
      el.className = "card";
      el.innerHTML = `
<h3>${c.nome}</h3>
<p><strong>Temperatura:</strong> ${c.intervalos.temperatura.min}–${
        c.intervalos.temperatura.max
      } °C</p>
<p><strong>Umidade:</strong> ${c.intervalos.umidade.min}–${
        c.intervalos.umidade.max
      } %</p>
<p><strong>Solos:</strong> ${c.solos.join(", ")}</p>
`;
      container.appendChild(el);
    });
  } catch (err) {
    container.innerHTML = "Falha ao carregar culturas.";
    console.error(err);
  }
}

loadCrops();
