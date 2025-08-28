# Atividade 4 — Landing Page (consumindo To‑Do API)

Pasta sugerida: `ProgramacaoParaDispositivosMoveis_II/Atividade4-LandingPage`

## Requisitos atendidos
- Header **fixo**
- **3 colunas** (empilháveis no mobile)
- Imagem **responsiva** (`img-fluid` via Bootstrap)
- Tipografia usando **rem** e **vw**
- Seções **fullscreen (100vh)** (`#hero` e `#cta`)
- **Mobile‑first vs Desktop‑first** com botão de alternância (altera estratégia de media queries)
- Consumo da **API do Exercício 3** (listar/criar/atualizar/excluir)

## Como rodar
Abra `index.html` com uma extensão como *Live Server* ou qualquer servidor estático.
A API deve estar rodando em `http://localhost:3000/api`. Para apontar para outro host, ajuste a constante `API_URL` em `js/app.js` ou faça:

```js
localStorage.setItem('API_URL', 'http://SEU_HOST:PORT/api');
```

## Estrutura
- `index.html` — markup da landing
- `styles.css` — estilos (mobile-first por padrão)
- `js/app.js` — fetch da API e UI (toggle mobile/desktop first)

