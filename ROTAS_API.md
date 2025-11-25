# 📋 Rotas da API - Sistema Mentora

## 🔐 Autenticação

Todas as rotas (exceto `/api/auth/*`) requerem autenticação via JWT no header:
```
Authorization: Bearer <token>
```

---

## 👤 USUÁRIOS

### POST `/api/users`
**Permissão:** Apenas ADMIN

**Dados obrigatórios:**
```json
{
  "Email": "string (email válido, obrigatório)",
  "PasswordHash": "string (senha, será hasheada automaticamente)",
  "Role": "ADMIN | TEACHER | STUDENT (obrigatório)",
  "name": "string (obrigatório)"
}
```

**Dados condicionais:**

Se `Role === "STUDENT"`:
```json
{
  "alunoData": {
    "Nome": "string (obrigatório)",
    "Email": "string (opcional, usa Email do user se não fornecido)",
    "Semestre": "number (opcional)",
    "IDCurso": "string (UUID, obrigatório)"
  }
}
```

Se `Role === "TEACHER"`:
```json
{
  "disciplinaData": {
    "IDDisciplina": "string (UUID, obrigatório)"
  }
}
```

---

## 🎓 CURSOS

### POST `/api/cursos`
**Permissão:** Apenas ADMIN

**Dados obrigatórios:**
```json
{
  "NomeDoCurso": "string (obrigatório)"
}
```

**Dados opcionais:**
```json
{
  "Descricao": "string (opcional)"
}
```

---

## 📚 DISCIPLINAS

### POST `/api/disciplinas`
**Permissão:** ADMIN ou TEACHER

**Dados obrigatórios:**
```json
{
  "IDCurso": "string (UUID, obrigatório)",
  "NomeDaDisciplina": "string (obrigatório)"
}
```

**Dados opcionais:**
```json
{
  "CodigoDaDisciplina": "string (opcional)",
  "Ativa": "boolean (default: true)",
  "CargaHoraria": "number (opcional)"
}
```

---

## 👨‍🎓 ALUNOS

### POST `/api/alunos`
**Permissão:** Apenas ADMIN

**Dados obrigatórios:**
```json
{
  "Nome": "string (obrigatório)",
  "Email": "string (email válido, obrigatório, único)",
  "IDCurso": "string (UUID, obrigatório)",
  "IDUser": "string (UUID, obrigatório - deve existir na tabela User)"
}
```

**Dados opcionais:**
```json
{
  "Idade": "number (opcional)",
  "Semestre": "number (opcional)"
}
```

**Nota:** O `IDUser` deve referenciar um usuário existente com `Role === "STUDENT"`.

---

## 📝 MATRÍCULAS

### POST `/api/matriculas`
**Permissão:** TEACHER ou ADMIN

**Dados obrigatórios:**
```json
{
  "IDAluno": "string (UUID, obrigatório)",
  "IDDisciplina": "string (UUID, obrigatório)",
  "IDPeriodo": "string (UUID, obrigatório)"
}
```

**Dados opcionais:**
```json
{
  "Status": "ENROLLED | DROPPED | COMPLETED (default: ENROLLED)"
}
```

**Validações:**
- Aluno e disciplina devem pertencer ao mesmo curso
- Disciplina deve estar ativa (`Ativa === true`)
- Período letivo deve estar ativo (`Ativo === true`)
- Não pode haver matrícula duplicada (mesmo aluno + disciplina + período)

### POST `/api/matriculas/bulk`
**Permissão:** TEACHER ou ADMIN

**Dados obrigatórios:**
```json
{
  "matriculas": [
    {
      "IDAluno": "string (UUID)",
      "IDDisciplina": "string (UUID)",
      "IDPeriodo": "string (UUID)",
      "Status": "ENROLLED | DROPPED | COMPLETED (opcional)"
    }
  ]
}
```

---

## 📅 PERÍODOS LETIVOS

### POST `/api/periodos`
**Permissão:** Apenas ADMIN

**Dados obrigatórios:**
```json
{
  "Nome": "string (obrigatório)",
  "DataInicio": "string (ISO 8601 date, obrigatório)",
  "DataFim": "string (ISO 8601 date, obrigatório)"
}
```

**Dados opcionais:**
```json
{
  "Ativo": "boolean (default: true)"
}
```

**Validações:**
- `DataInicio` deve ser anterior a `DataFim`
- Se `Ativo === true`, não pode haver sobreposição com outro período ativo

**Exemplo de datas:**
```json
{
  "DataInicio": "2025-01-15T00:00:00.000Z",
  "DataFim": "2025-06-30T23:59:59.999Z"
}
```

---

## 📊 NOTAS

### POST `/api/notas`
**Permissão:** TEACHER ou ADMIN

**Dados obrigatórios:**
```json
{
  "IDMatricula": "string (UUID, obrigatório)",
  "Valor": "number (0-100, obrigatório)"
}
```

**Dados opcionais:**
```json
{
  "Tipo": "string (ex: 'P1', 'P2', 'Trabalho', 'Prova Final', 'Atividade')",
  "DataAvaliacao": "string (ISO 8601 date, default: agora)",
  "Observacoes": "string"
}
```

**Validações:**
- `Valor` deve estar entre 0 e 100

---

## 🔐 AUTENTICAÇÃO (Rotas Públicas)

### POST `/api/auth/register`
**Permissão:** Pública

**Dados obrigatórios:**
```json
{
  "Email": "string (email válido, obrigatório)",
  "password": "string (mínimo 8 caracteres, obrigatório)",
  "name": "string (obrigatório)"
}
```

**Dados opcionais:**
```json
{
  "Role": "ADMIN | TEACHER | STUDENT (default: STUDENT)"
}
```

### POST `/api/auth/login`
**Permissão:** Pública

**Dados obrigatórios:**
```json
{
  "Email": "string (email válido, obrigatório)",
  "password": "string (obrigatório)"
}
```

---

## 📈 PREDIÇÕES

### POST `/api/predictions`
**Permissão:** TEACHER ou ADMIN

**Dados obrigatórios:**
```json
{
  "IDMatricula": "string (UUID, obrigatório)",
  "TipoPredicao": "DESEMPENHO | EVASAO (obrigatório)",
  "Probabilidade": "number (0-1, obrigatório)",
  "Classificacao": "string (obrigatório)"
}
```

**Dados opcionais:**
```json
{
  "Explicacao": "string",
  "DadosEntrada": "object (JSON)"
}
```

### POST `/api/predictions/generate`
**Permissão:** TEACHER ou ADMIN

**Dados obrigatórios:**
```json
{
  "IDMatricula": "string (UUID, obrigatório)",
  "TipoPredicao": "DESEMPENHO | EVASAO (obrigatório)",
  "dados": {
    // Dados específicos para o modelo ML
    // Ver documentação dos modelos para campos específicos
  }
}
```

### POST `/api/predictions/student/generate`
**Permissão:** Apenas STUDENT

**Dados obrigatórios:**
```json
{
  "IDMatricula": "string (UUID, obrigatório)",
  "dados": {
    // Dados específicos para o modelo ML
  }
}
```

---

## 📋 HÁBITOS DO ALUNO

### POST `/api/aluno-habitos`
**Permissão:** Apenas STUDENT (próprio aluno)

**Dados opcionais (todos os campos são opcionais, mas pelo menos um deve ser fornecido):**

**Campos básicos:**
```json
{
  "horasEstudo": "number (0-84)",
  "sono": "number (0-12)",
  "motivacao": "number (0-10)",
  "frequencia": "number (0-100)"
}
```

**Campos para predição de EVASÃO:**
```json
{
  "raisedhands": "number",
  "VisITedResources": "number",
  "AnnouncementsView": "number",
  "Discussion": "number",
  "ParentAnsweringSurvey": "Yes | No",
  "ParentschoolSatisfaction": "Good | Bad",
  "StudentAbsenceDays": "Under-7 | Above-7"
}
```

**Campos para predição de DESEMPENHO:**
```json
{
  "Previous_Scores": "number",
  "Distance_from_Home": "Near | Far",
  "Gender": "Male | Female",
  "Parental_Education_Level": "None | High School | Some College | Bachelor's | Master's",
  "Parental_Involvement": "Low | Medium | High",
  "School_Type": "Public | Private",
  "Peer_Influence": "Positive | Negative | Neutral",
  "Extracurricular_Activities": "Yes | No",
  "Learning_Disabilities": "Yes | No",
  "Internet_Access": "Yes | No",
  "Access_to_Resources": "Poor | Average | Good",
  "Teacher_Quality": "Poor | Average | Good",
  "Family_Income": "Low | Medium | High",
  "Motivation_Level": "Low | Medium | High",
  "Tutoring_Sessions": "Yes | No",
  "Physical_Activity": "Low | Medium | High"
}
```

---

## 🔗 RELACIONAMENTOS IMPORTANTES

### Ordem de Criação Recomendada:

1. **Curso** → Criar primeiro
2. **Período Letivo** → Criar segundo
3. **Disciplina** → Precisa de Curso
4. **User** → Criar usuário base
5. **Aluno** → Precisa de User e Curso (se Role === STUDENT)
6. **Matrícula** → Precisa de Aluno, Disciplina e Período Letivo
7. **Nota** → Precisa de Matrícula
8. **Predição** → Precisa de Matrícula

### Validações de Relacionamento:

- **Aluno** deve pertencer ao mesmo **Curso** da **Disciplina** na matrícula
- **Disciplina** deve estar **Ativa** para criar matrícula
- **Período Letivo** deve estar **Ativo** para criar matrícula
- **User** com `Role === "STUDENT"` deve ter um registro **Aluno** correspondente
- **User** com `Role === "TEACHER"` pode ter múltiplas associações **ProfessorDisciplina**

---

## 📝 NOTAS IMPORTANTES

1. Todos os IDs são UUIDs gerados automaticamente pelo banco
2. Datas devem estar no formato ISO 8601 (ex: `"2025-01-15T00:00:00.000Z"`)
3. A senha no endpoint `/api/users` deve ser enviada como `PasswordHash`, mas será hasheada automaticamente pelo middleware
4. No endpoint `/api/auth/register`, a senha deve ser enviada como `password` (será hasheada automaticamente)
5. Campos opcionais podem ser omitidos do JSON ou enviados como `null`
6. Valores booleanos devem ser `true` ou `false` (não strings)

