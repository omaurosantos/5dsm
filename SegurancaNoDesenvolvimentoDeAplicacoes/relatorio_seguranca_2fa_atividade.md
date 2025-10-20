# Relatório de Análise de Segurança do Projeto 2FA-Atividade

## Visão geral da arquitetura
- **Backend**: Express + PostgreSQL + Redis, JWT para sessão, MFA por SMS (Twilio), rate limiting em Redis, criptografia AES-256-GCM.
- **Frontend**: React + Axios; armazena `token` e `user` no `localStorage`.
- **Infra**: Docker Compose com Postgres, Redis, server e front (Nginx). Certificados TLS e `.env` estão versionados.

---

## 1. SQL Injection (SQLi)
**Em conformidade**
- Consultas parametrizadas usando `pg` (`$1, $2, ...`).

**Risco residual**
- Nenhum ponto de SQL dinâmico identificado.

**Ação recomendada**
- Manter uso de queries parametrizadas.

---

## 2. Cross-Site Scripting (XSS)

### Stored XSS
- **OK**: backend retorna JSON e React escapa dados.

### Reflected XSS
- **OK**: sem reflexão de inputs brutos.

### DOM-based XSS
- **OK**: sem `innerHTML`/`eval`.

**Risco residual**
- JWT no `localStorage` pode ser roubado se houver XSS.

**Ações**
- Usar cookies `HttpOnly` e `SameSite`.
- Reforçar CSP no Nginx.

---

## 3. Cross-Site Request Forgery (CSRF)
**OK**
- API usa Bearer Token em headers, não cookies.

**Ações**
- Manter CORS restrito ao domínio do front.
- Se migrar para cookies, implementar tokens CSRF.

---

## 4. Broken Access Control
**Pontos positivos**
- Rotas sensíveis exigem middleware de autenticação.

**Problemas**
1. Logout não invalida tokens.
2. Mensagens específicas permitem enumeração de usuários.

**Ações**
- Checar blacklist no middleware.
- Uniformizar mensagens de erro.

---

## 5. Broken Authentication
**Pontos positivos**
- Senhas com bcrypt e política forte.
- MFA expira e tem rate limit.

**Problemas**
1. MFA de 3 dígitos é fraco.
2. `JWT_SECRET` curto e exposto.
3. Tokens não revogados.
4. Armazenamento em `localStorage`.

**Ações**
- MFA com 6 dígitos ou TOTP/WebAuthn.
- Segredos fortes e fora do repositório.
- Implementar refresh e revogação de JWTs.

---

## 6. Cryptographic Failures

### Em repouso
- Telefone criptografado (AES-256-GCM) ✅
- **Problema:** `DATA_ENCRYPTION_KEY` exposta.

### Em trânsito
- HTTPS + camada opcional AES-GCM ✅
- **Problema:** chaves TLS e transporte versionadas.

**Ações**
- Remover chaves/certificados do repositório.
- Rotacionar segredos.

---

## 7. Security Misconfiguration
**Pontos positivos**
- Nginx seguro, containers bem configurados.

**Problemas**
- `.env` e certificados versionados.
- Senhas fracas no Postgres e Redis.

**Ações**
- Mover segredos para variáveis seguras.
- Senhas fortes e proteção de rede para Redis.

---

## 8. Segurança no Login (MFA e fluxo)
**Riscos**
- SMS vulnerável a SIM swap.
- MFA de 3 dígitos.
- Enumeração de usuários.
- Telefone retornado em claro.

**Ações**
- Migrar para TOTP/WebAuthn.
- Elevar MFA para 6 dígitos.
- Remover `phone` da resposta de login.

---

## 9. Outras observações
- Logout ineficaz → revisar revogação.
- Boas validações de input.
- Evitar logs de PII.

---

## Checklist de correções
1. Implementar checagem da blacklist.
2. Mensagens genéricas de erro.
3. MFA de 6 dígitos / TOTP.
4. Remover segredos e chaves versionadas.
5. Configurar senhas fortes e seguras.
6. Cookies `HttpOnly` para JWT.
7. Reforçar CSP.
8. TLS válido e automatizado.
9. Ocultar PII em respostas.

---

## Conclusão
- SQLi, XSS e CSRF bem tratados.
- Maiores riscos: **segredos expostos**, **JWT sem revogação**, **MFA fraco**, **enumeração de usuário**.
- Corrigindo blacklist, segredos e MFA, a segurança do login melhora substancialmente.
