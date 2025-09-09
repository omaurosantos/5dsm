-- Script de verificação dos requisitos da atividade
-- Banco: seguranca

-- 1) Ver usuários (username deve estar criptografado, password em bcrypt)
SELECT id, username, password
FROM users
ORDER BY id DESC
LIMIT 5;

-- 2) Ver contatos (name e phone devem estar criptografados)
SELECT id, user_id, name, phone
FROM contacts
ORDER BY id DESC
LIMIT 5;

-- 3) Teste de acesso: verificar se existe FK e cascade
-- Este comando mostra constraints da tabela contacts
SELECT conname, confdeltype, confupdtype
FROM pg_constraint
WHERE conrelid = 'contacts'::regclass;

-- 4) Delete cascade (teste manual)
-- a) Crie um usuário e contatos ligados a ele
-- b) DELETE FROM users WHERE id = <id_do_usuario>;
-- c) SELECT * FROM contacts WHERE user_id = <id_do_usuario>;
-- esperado: zero linhas

-- 5) Conferir se as senhas realmente são bcrypt
-- (devem começar com $2a$ ou $2b$ e ter ~60 chars)
SELECT id, password FROM users LIMIT 5;

-- 6) (Opcional) Resetar senha de um usuário específico (ex: id=1)
-- Substitua <HASH_BCRYPT> pelo valor gerado no Node:
-- node -e "console.log(require('bcryptjs').hashSync('novasenha', 12))"
-- UPDATE users SET password = '<HASH_BCRYPT>' WHERE id = 1;
