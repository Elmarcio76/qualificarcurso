# Documentação — Qualificar Curso

## 1. Visão Geral

Plataforma de cursos online com compra via Stripe, área do aluno, avaliações, emissão de certificados e painel administrativo. Stack: React + Vite + TypeScript + Tailwind CSS + Supabase (Cloud) + Stripe.

---

## 2. Arquitetura

### 2.1 Frontend
- **Framework:** React 18 com TypeScript
- **Build:** Vite
- **Estilização:** Tailwind CSS + shadcn/ui
- **Roteamento:** React Router DOM v6
- **Estado global:** Context API (Auth, Cart)
- **PDF:** jsPDF (geração de certificados)

### 2.2 Backend (Supabase Cloud)
- **Banco de dados:** PostgreSQL com Row Level Security (RLS)
- **Autenticação:** Supabase Auth (email/senha)
- **Edge Functions:** Deno (checkout, pagamento, cupons, provas, certificados)
- **Segurança:** Service Role Key restrita às Edge Functions; frontend usa apenas Anon Key

---

## 3. Banco de Dados

### 3.1 Tabelas

| Tabela | Descrição |
|---|---|
| `profiles` | Dados do usuário (nome, CPF, telefone) |
| `user_roles` | Papéis (admin/user) |
| `courses` | Catálogo de cursos (título, descrição, preço, carga horária, imagem, Stripe Price ID) |
| `course_videos` | Vídeos do YouTube vinculados a um curso (com ordem) |
| `course_files` | Arquivos de apoio vinculados a um curso |
| `enrollments` | Matrículas (user_id + course_id + data da prova disponível) |
| `payments` | Pagamentos registrados (valor, status, session Stripe) |
| `checkout_attempts` | Tentativas de checkout para recuperação de carrinho |
| `coupons` | Cupons de desconto (código, percentual, validade, limite de uso) |
| `exam_questions` | Questões das provas (5 opções por questão, gabarito) |
| `exam_results` | Resultados das provas (nota, respostas, data) |
| `certificates` | Certificados emitidos (número único, curso, aluno) |

### 3.2 View

| View | Descrição |
|---|---|
| `exam_questions_public` | Versão pública das questões (sem coluna `opcao_correta`) |

### 3.3 Funções SQL

| Função | Descrição |
|---|---|
| `generate_certificate_number()` | Gera número único de certificado |
| `has_role(_role, _user_id)` | Verifica se o usuário possui determinado papel |

### 3.4 Políticas de Segurança (RLS)

- **Cursos e certificados:** leitura pública
- **Perfis, matrículas, pagamentos, resultados:** leitura restrita ao próprio usuário ou admin
- **Questões de prova:** leitura apenas para alunos matriculados com prova liberada, ou admin
- **Cupons:** gerenciamento exclusivo do admin
- **Matrículas (INSERT):** apenas via service role (Edge Functions) após confirmação de pagamento
- **Checkout attempts:** leitura exclusiva do admin

---

## 4. Autenticação

### 4.1 Cadastro
- Campos: nome, e-mail, CPF (com máscara), telefone (com máscara), senha, confirmação de senha
- Validação via Zod (e-mail válido, CPF 14 chars, telefone 15 chars, senha mínima 6 chars, senhas iguais)
- Após cadastro: cria registro em `profiles` via metadata do Supabase Auth
- Redirecionamento automático para `/student` se já autenticado

### 4.2 Login
- Campos: e-mail, senha
- Feedback de erro via toast
- Toggle de visibilidade da senha

### 4.3 Controle de Acesso
- `AuthProvider` global via Context API
- Verifica papel admin em `user_roles`
- Carrega perfil de `profiles`
- Páginas protegidas redirecionam para `/auth` se não autenticado

---

## 5. Catálogo de Cursos

### 5.1 Página Inicial (`/`)
- Lista todos os cursos ativos (`courses.active = true`)
- Exibe: imagem, título, descrição curta, carga horária, modalidade (online), preço
- Botão "Ver curso" → navega para `/course/:id`
- Botão "Adicionar ao carrinho" (apenas logado e curso pago) → dialog de confirmação + toast
- Link para verificação de certificado (`/verify-certificate`)

### 5.2 Página do Curso (`/course/:id`)
- Detalhes: título, descrição completa, carga horária
- **Se NÃO matriculado:** preço + botão "Comprar" (adiciona ao carrinho ou redireciona para login)
- **Se matriculado:**
  - Lista de vídeos do YouTube (ordenados por `order_index`)
  - Links para arquivos de apoio
  - Indicador de disponibilidade da prova
  - Botão "Fazer Prova" (habilitado após 20 dias da matrícula)

---

## 6. Carrinho e Pagamento

### 6.1 Carrinho (`/cart`)
- Lista de itens com remoção individual
- Campo de cupom de desconto (validação via Edge Function `validate-coupon`)
- Exibição do desconto aplicado
- Botão "Finalizar Compra" → Edge Function `create-checkout` → redireciona para Stripe Checkout
- Acesso restrito a usuários autenticados

### 6.2 Fluxo de Pagamento
1. Frontend chama `create-checkout` com itens e cupom opcional
2. Edge Function cria sessão Stripe com line items e desconto
3. Usuário paga no Stripe Checkout
4. Stripe redireciona para `/payment-success?session_id=...`
5. Frontend chama `verify-payment` para validar e registrar
6. Edge Function verifica sessão paga, cria `enrollments` e `payments`
7. Proteção contra duplicatas via `stripe_session_id`

### 6.3 Cupons de Desconto
- Código alfanumérico (case-insensitive, armazenado em maiúsculas)
- Desconto percentual
- Validade opcional (`expires_at`)
- Limite de usos opcional (`max_uses`)
- Contador de usos (`times_used`) incrementado na validação

### 6.4 Checkout Attempts
- Registra tentativas de checkout para recuperação de carrinho
- Captura: nome, e-mail, telefone, cursos, valor total
- Status: pending → completed
- Visível apenas para admin

---

## 7. Área do Aluno (`/student`)

### 7.1 Aba "Meus Cursos"
- Lista de cursos matriculados com status:
  - **Prova não disponível:** exibe data de liberação
  - **Prova disponível:** botão "Fazer Prova"
  - **Aprovado (nota ≥ 7):** badge "Concluído" + botão "Ver Certificado"
- Navegação para página do curso

### 7.2 Aba "Relação de Cursos"
- Catálogo completo de cursos ativos
- Cursos já matriculados: badge "Já Matriculado" (botão desativado)
- Cursos não matriculados: botão "Adicionar ao Carrinho"

---

## 8. Avaliações (`/exam/:courseId`)

### 8.1 Regras de Negócio
- **Questões:** 10 por prova, 5 opções cada (A-E)
- **Nota mínima para aprovação:** 7 (70%)
- **Máximo de tentativas:** 3
- **Disponibilidade:** 20 dias após matrícula (`exam_available_after`)
- **Questões sem gabarito no frontend:** view `exam_questions_public` omite `opcao_correta`

### 8.2 Fluxo
1. Carrega questões de `exam_questions_public`
2. Verifica tentativas anteriores em `exam_results`
3. Se já aprovado → mostra resultado + link para certificado
4. Se 3 tentativas esgotadas → bloqueia
5. Aluno responde todas as 10 questões
6. Submissão via Edge Function `submit-exam` (correção server-side)
7. Edge Function calcula nota, insere em `exam_results`
8. Se aprovado: gera certificado automaticamente (`certificates` + `generate_certificate_number()`)
9. Exibe resultado com nota e feedback

### 8.3 Segurança
- Gabarito (`opcao_correta`) nunca exposto ao frontend
- Correção feita exclusivamente no servidor (Edge Function)
- Validação de matrícula e elegibilidade no servidor

---

## 9. Certificados

### 9.1 Geração (`/certificate/:courseId`)
- Disponível apenas para alunos aprovados (nota ≥ 7)
- PDF de 2 páginas (A4 paisagem) com imagens de fundo

### 9.2 Frente do Certificado
- Margem esquerda: 5cm
- Texto justificado
- Conteúdo:
  - "CERTIFICADO DE CONCLUSÃO"
  - Nome do aluno (negrito)
  - CPF
  - Título do curso
  - Carga horária: 120 horas
  - Período de realização (data matrícula → data da prova)
  - Aproveitamento (%) e nota final
- ID do certificado em vermelho no canto inferior esquerdo

### 9.3 Verso do Certificado
- Início a 5cm do topo
- Conteúdo:
  - Metodologia (tutoria, avaliações assíncronas)
  - Conteúdo programático (dinâmico, baseado na descrição do curso)
  - Base legal: Decreto Federal nº 2.208/97
  - Rodapé vermelho em negrito-itálico para verificação de autenticidade

### 9.4 Verificação Pública (`/verify-certificate`)
- Qualquer pessoa pode verificar um certificado pelo número
- Edge Function `verify-certificate` retorna:
  - Nome do aluno
  - CPF mascarado
  - Título e carga horária do curso
  - Data de matrícula
  - Data e nota da prova
- Exibe card de "Certificado Válido" ou "Certificado não encontrado"

---

## 10. Painel Administrativo (`/admin`)

### 10.1 Acesso
- Restrito a usuários com papel `admin` em `user_roles`
- Redirecionamento automático para `/` se não admin

### 10.2 Gestão de Cursos
- Criar curso (título, descrição, descrição curta, preço, carga horária, imagem, Stripe Price ID)
- Listar e excluir cursos

### 10.3 Conteúdo do Curso
- Selecionar curso
- Adicionar vídeos (título + URL YouTube + ordem)
- Adicionar arquivos de apoio (título + URL)
- Adicionar questões de prova (enunciado, 5 opções, opção correta, número da questão)

### 10.4 Gestão de Cupons
- Criar cupom (código, desconto %, validade, limite de usos)
- Listar e excluir cupons

### 10.5 Matrículas e Pagamentos
- Tabela consolidada: data, nome, CPF, curso, valor, status
- Dados cruzados de `payments` + `profiles` + `courses`

### 10.6 Checkouts Abandonados
- Listagem de tentativas de checkout pendentes
- Dados de contato (nome, e-mail, telefone) para ação comercial

---

## 11. Edge Functions

| Função | Método | Descrição |
|---|---|---|
| `create-checkout` | POST | Cria sessão Stripe Checkout com itens e cupom opcional |
| `verify-payment` | POST | Valida pagamento Stripe e cria matrículas/pagamentos |
| `validate-coupon` | POST | Valida cupom de desconto e incrementa uso |
| `submit-exam` | POST | Corrige prova, salva resultado, gera certificado se aprovado |
| `verify-certificate` | POST | Verifica autenticidade do certificado por número |

Todas as Edge Functions:
- Validam autenticação via Bearer token
- Suportam CORS
- Respondem em JSON
- Tratam erros com status HTTP apropriados

---

## 12. Rotas da Aplicação

| Rota | Componente | Acesso |
|---|---|---|
| `/` | Index | Público |
| `/auth` | Auth | Público |
| `/course/:id` | CoursePage | Público (conteúdo restrito se matriculado) |
| `/cart` | Cart | Autenticado |
| `/payment-success` | PaymentSuccess | Autenticado |
| `/student` | Student | Autenticado |
| `/exam/:courseId` | Exam | Autenticado + Matriculado |
| `/certificate/:courseId` | Certificate | Autenticado + Aprovado |
| `/admin` | Admin | Admin |
| `/verify-certificate` | VerifyCertificate | Público |

---

## 13. Integrações Externas

### 13.1 Stripe
- Checkout Session para pagamentos
- Suporte a múltiplos itens por sessão
- Desconto via cupom aplicado no preço unitário
- Metadata com `user_id` e `course_ids` para verificação

### 13.2 YouTube
- Vídeos embarcados como links na página do curso

---

## 14. Segurança

- **RLS em todas as tabelas** com políticas granulares
- **Matrículas protegidas:** inserção apenas via Edge Functions (service role) após confirmação de pagamento
- **Gabarito protegido:** `opcao_correta` nunca exposto ao frontend
- **Correção server-side:** notas calculadas exclusivamente no servidor
- **Tokens validados:** todas as Edge Functions verificam autenticação
- **Duplicatas prevenidas:** constraints de unicidade em matrículas e pagamentos
- **CPF mascarado:** na verificação pública de certificados
