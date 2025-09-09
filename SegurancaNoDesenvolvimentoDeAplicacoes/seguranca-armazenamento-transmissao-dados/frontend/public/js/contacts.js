import { el, setMsg } from "./utils.js";
import { callEnc, hybridDecryptEcho } from "./api.js";

async function refresh() {
  try {
    const { data, aesRawB64 } = await callEnc("/contacts/list", {});
    const dec = await hybridDecryptEcho(aesRawB64, data);
    render(dec.items || []);
  } catch (e) {
    setMsg(e.message);
  }
}

function render(items) {
  const list = el("list");
  list.innerHTML = "";
  for (const it of items) {
    const row = document.createElement("div");
    row.className = "item";
    const left = document.createElement("div");
    const name = document.createElement("div");
    name.textContent = it.name;
    const phone = document.createElement("div");
    phone.textContent = it.phone;
    phone.className = "badge";
    left.append(name, phone);

    const actions = document.createElement("div");
    const btnE = document.createElement("button");
    btnE.textContent = "Editar";
    const btnD = document.createElement("button");
    btnD.textContent = "Excluir";
    btnD.className = "secondary";
    btnE.onclick = async () => {
      const nn = prompt("Novo nome:", it.name);
      if (nn == null) return;
      const np = prompt("Novo fone:", it.phone);
      if (np == null) return;
      try {
        const { data, aesRawB64 } = await callEnc("/contacts/update", {
          id: it.id,
          name: nn,
          phone: np,
        });
        await hybridDecryptEcho(aesRawB64, data);
        refresh();
      } catch (e) {
        setMsg(e.message);
      }
    };
    btnD.onclick = async () => {
      if (!confirm("Excluir contato?")) return;
      try {
        const { data, aesRawB64 } = await callEnc("/contacts/delete", {
          id: it.id,
        });
        await hybridDecryptEcho(aesRawB64, data);
        refresh();
      } catch (e) {
        setMsg(e.message);
      }
    };
    actions.append(btnE, btnD);

    row.append(left, actions);
    list.append(row);
  }
}

async function add() {
  const name = el("name").value.trim();
  const phone = el("phone").value.trim();
  if (!name || !phone) {
    setMsg("Preencha nome e telefone");
    return;
  }
  try {
    const { data, aesRawB64 } = await callEnc("/contacts/create", {
      name,
      phone,
    });
    await hybridDecryptEcho(aesRawB64, data);
    el("name").value = "";
    el("phone").value = "";
    refresh();
  } catch (e) {
    setMsg(e.message);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const b = el("btnAdd");
  if (b) b.addEventListener("click", add);
  refresh();
});
