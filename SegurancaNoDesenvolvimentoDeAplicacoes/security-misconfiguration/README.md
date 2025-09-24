# Security Misconfiguration

## Objetivos
I. Security Misconfiguration  
II. Exemplos de Misconfiguration  
III. Demonstração Prática em Node.js + Express + Docker  
IV. Boas Práticas de Mitigação  


---

## 🚀 Clonando o Repositório

```bash
git clone https://github.com/arleysouza/security-misconfiguration.git app
cd app
```

---

## ▶️ Subindo a Aplicação com Docker Compose

```bash
docker compose -f docker-compose.yml up --build -d
```

Esse comando:
- Constrói a imagem do servidor (`server-app`) com Node.js e Express  
- Sobe os containers de **PostgreSQL** e **Redis**  
- Cria a rede isolada `minha-network`  
- Inicia a aplicação na porta **3001**  

Acesse em: [http://localhost:3001](http://localhost:3001)

---

## ⏹️ Parando os Containers

Para parar e remover os containers:

```bash
docker compose -f docker-compose.yml down
```

Se quiser **remover volumes** também (dados persistidos):

```bash
docker compose down -v
```

---

## 🛠️ Tecnologias Utilizadas

- **Node.js + Express + TypeScript**  
  Backend principal da aplicação, responsável pelas rotas e lógica de negócio.  
  - Express: framework web minimalista.  
  - TypeScript: tipagem estática para maior robustez.  

- **PostgreSQL**  
  Banco de dados relacional utilizado para persistência de informações.  

- **Redis**  
  Utilizado como cache em memória e para filas.  

- **Docker**  
  Ferramenta de containerização que permite rodar todos os serviços de forma isolada.  

- **Docker Compose**  
  Orquestrador que define e gerencia os serviços (Postgres, Redis, App Server).  

- **Docker Bench Security**  
  Ferramenta oficial da Docker Inc. que executa auditorias de segurança nos containers, avaliando configurações e boas práticas.  

---

## 🔐 Exercício – Hardening da Aplicação

1. Suba a aplicação com Docker Compose.  
2. Rode o Docker Bench Security:  

```bash
docker run -it --net host --pid host --userns host \
  --cap-add audit_control \
  -v /var/lib:/var/lib:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  docker/docker-bench-security
```

3. Analise o relatório gerado.  
4. Corrija ao menos **duas falhas** (ex.: usuário root, falta de healthcheck, portas expostas).  
5. Reexecute a ferramenta e observe o **score melhorado**.  




