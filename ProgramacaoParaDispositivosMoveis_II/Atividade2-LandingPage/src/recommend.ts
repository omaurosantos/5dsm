import { API_BASE, setApiStatus, toggleStylesheet } from "./shared";

const btn = document.getElementById("toggle-css") as HTMLButtonElement;
btn?.addEventListener("click", () => toggleStylesheet(btn));

const status = document.getElementById("api-status") as HTMLElement;
setApiStatus(status);

const form = document.getElementById("rec-form") as HTMLFormElement;
const result = document.getElementById("result") as HTMLDivElement;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const payload = {
    temperatura: Number(fd.get("temperatura")),
    umidade: Number(fd.get("umidade")),
    tipoSolo: String(fd.get("tipoSolo")),
  };
  result.textContent = "Buscando recomendação…";
  try {
    const res = await fetch(`${API_BASE}/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      culturaRecomendada: string | null;
      score: number;
      explicacao: string;
    };
    if (data.culturaRecomendada) {
      result.innerHTML = `
<div class="card">
<h3>Recomendação: ${data.culturaRecomendada} (score ${data.score})</h3>
<p>${data.explicacao}</p>
</div>
`;
    } else {
      result.textContent =
        "Nenhuma cultura compatível com o tipo de solo informado.";
    }
  } catch (err) {
    result.textContent = "Erro ao obter recomendação.";
    console.error(err);
  }
});
