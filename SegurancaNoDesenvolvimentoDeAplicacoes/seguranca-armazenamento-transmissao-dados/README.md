# Segurança no Armazenamento e Transmissão de Dados

Projeto desenvolvido para a disciplina **Segurança no Desenvolvimento de Aplicações**.  
Objetivo: implementar uma aplicação cliente-servidor segura para cadastro de usuários e gerenciamento de contatos.

## 🚀 Tecnologias
- **Backend:** Node.js + TypeScript + Express
- **Banco:** PostgreSQL
- **Frontend:** HTML, CSS e JavaScript puro (sem frameworks)
- **Criptografia:**
  - AES-256-CBC para dados em repouso
  - Bcrypt para senhas
  - Criptografia híbrida AES + RSA-OAEP para tráfego app ↔ servidor
  - HTTPS (certificado autoassinado em ambiente local)

## 📂 Estrutura
```
seguranca-armazenamento-transmissao-dados/
├─ backend/          # API Node/TS + HTTPS
│  ├─ src/           # código do servidor
│  ├─ certs/         # localhost.key + localhost.crt
│  ├─ .env           # configuração local
│  └─ package.json
├─ frontend/
│  └─ public/        # index.html, register.html, contacts.html + css/js
└─ README.md
```

## ⚙️ Configuração

### 1. Banco de Dados (Postgres)
Crie um banco chamado `seguranca` e rode as tabelas:

```sql
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password VARCHAR(100) NOT NULL
);

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL
);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);
```

### 2. Certificado HTTPS (autoassinado)
Na pasta `backend/certs/`:

```bash
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout localhost.key -out localhost.crt \
  -subj "/CN=localhost" -days 365
```

### 3. Arquivo `.env` (em `backend/`)
```env
# Postgres
PGHOST=localhost
PGPORT=5432
PGDATABASE=seguranca
PGUSER=postgres
PGPASSWORD=postgres

# App
PORT=8443
JWT_SECRET=coloque_um_valor_base64_grande_aqui
DATA_ENC_KEY_HEX=coloque_64_chars_hex_aqui
CSRF_COOKIE_NAME=csrfToken
ORIGIN=https://localhost:8443

# HTTPS
SSL_KEY_PATH=./certs/localhost.key
SSL_CERT_PATH=./certs/localhost.crt
```

- Gere `JWT_SECRET`:
  ```bash
  openssl rand -base64 48
  ```
- Gere `DATA_ENC_KEY_HEX` (32 bytes hex):
  ```bash
  openssl rand -hex 32
  ```

## ▶️ Como rodar

### Backend
```bash
cd backend
npm install
npm run dev
```
Servidor em: **https://localhost:8443**

### Frontend
Não precisa de servidor separado — o backend já serve os arquivos estáticos.  
Acesse no navegador:
```
https://localhost:8443/index.html
```

Aceite o certificado autoassinado na primeira vez.

---

## ✅ Requisitos de Segurança atendidos

- [x] **SQL Injection** prevenido com prepared statements  
- [x] **XSS** prevenido (sanitização + `textContent`)  
- [x] **CSRF** protegido (double submit cookie + SameSite=strict)  
- [x] **Broken Access Control** (checagem `user_id` antes de alterar/excluir contatos)  
- [x] **Broken Authentication** prevenido (JWT + bcrypt em senhas)  
- [x] **Criptografia em repouso:**  
  - `users.username` → AES-256-CBC  
  - `users.password` → bcrypt  
  - `contacts.name`, `contacts.phone` → AES-256-CBC  
- [x] **Criptografia em trânsito:**  
  - HTTPS com certificado autoassinado  
  - Criptografia híbrida (AES-256-CBC + RSA-OAEP)

---

## 📸 Demonstração sugerida (apresentação)

1. Mostrar login/registro funcionando.  
2. Mostrar dados no banco (`SELECT`) com username/nome/telefone **cifrados** e senha em **bcrypt**.  
3. Demonstrar tentativa de XSS (`<script>`) → não executa.  
4. Mostrar request sem CSRF → retorna **403**.  
5. Mostrar update de contato de outro usuário → retorna **403**.  
6. Mostrar HTTPS e payloads cifrados (`key`, `iv`, `data`) nas requests.

---

## 👤 Autor
Trabalho individual para a disciplina **Segurança no Desenvolvimento de Aplicações**  
Professor: Arley  
Entrega: 08/09/2025
