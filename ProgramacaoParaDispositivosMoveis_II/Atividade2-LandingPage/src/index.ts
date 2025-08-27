import { setApiStatus, toggleStylesheet } from "./shared";

const btn = document.getElementById("toggle-css") as HTMLButtonElement;
btn?.addEventListener("click", () => toggleStylesheet(btn));

const status = document.getElementById("api-status") as HTMLElement;
setApiStatus(status);
