# Documentação da API - ft_transcendence

## 📚 Documentação Interativa

A documentação completa e interativa da API está disponível através do **Swagger UI**.

### Acessar Documentação

Quando o servidor estiver rodando em modo de desenvolvimento:

```bash
npm run dev
```

Acesse: **http://localhost:3333/docs**

### Recursos do Swagger

✅ **Explorar todos os endpoints** - Visualize rotas, parâmetros e respostas
✅ **Testar diretamente** - Execute requisições direto do navegador
✅ **Exemplos reais** - Veja exemplos de requisições e respostas
✅ **Autenticação integrada** - Teste endpoints protegidos com seu token
✅ **Validações documentadas** - Entenda os requisitos de cada campo

### Como Usar

1. **Endpoints Públicos**: Clique em "Try it out" e execute
2. **Endpoints Protegidos**:
   - Primeiro faça login em `/auth/login` ou `/auth/anonymous`
   - Copie o token da resposta
   - Clique no botão **"Authorize"** 🔒 no topo da página
   - Cole o token no formato: `seu_token_aqui` (sem "Bearer")
   - Clique em "Authorize"
   - Agora você pode testar endpoints protegidos

---

## Visão Geral da API

### Autenticação

A API utiliza **JWT (JSON Web Tokens)** para autenticação. Endpoints protegidos requerem o token no header:

```
Authorization: Bearer <token>
```

### Grupos de Endpoints

#### 🔐 **Auth** (`/auth`)
- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Fazer login
- `POST /auth/anonymous` - Criar sessão anônima
- `GET /auth/me` - Obter usuário atual
- `POST /auth/logout` - Encerrar sessão

---

## Sistema de Gangues

### Gangues Disponíveis

O sistema possui duas gangues:
- **batatas** 🥔 - Gangue padrão para usuários anônimos
- **tomates** 🍎 - Disponível apenas para usuários registrados

### Regras
- Usuários **registrados** escolhem sua gangue no momento do registro
- Usuários **anônimos** sempre pertencem à gangue "batatas"
- A gangue não pode ser alterada após o registro
- A gangue é incluída no token JWT

---

## Sistema de Limpeza Automática

### Usuários Anônimos

O sistema executa limpeza automática de usuários anônimos inativos:

- **Tempo de inatividade:** 5 minutos
- **Intervalo de verificação:** 1 minuto
- **Critério:** Usuários anônimos que não fizeram requisições autenticadas nos últimos 5 minutos

**Endpoints que atualizam atividade:**
- `GET /auth/me`
- Qualquer endpoint protegido

---

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Requisição inválida (validação falhou) |
| 401 | Não autorizado (token inválido ou credenciais incorretas) |
| 404 | Recurso não encontrado |

---

## Exemplos Rápidos com cURL

### Registrar Usuário
```bash
curl -X POST http://localhost:3333/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "João Silva",
    "nick": "joao123",
    "email": "joao@example.com",
    "password": "Senha@123",
    "gang": "batatas"
  }'
```

### Login
```bash
curl -X POST http://localhost:3333/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "identifier": "joao123",
    "password": "Senha@123"
  }'
```

### Sessão Anônima
```bash
curl -X POST http://localhost:3333/auth/anonymous \
  -H 'Content-Type: application/json' \
  -d '{"nick": "visitante"}'
```

### Obter Usuário Atual
```bash
curl http://localhost:3333/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Logout
```bash
curl -X POST http://localhost:3333/auth/logout \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto Back:

```env
NODE_ENV=development
JWT_SECRET=sua_chave_secreta_super_segura_aqui
```

**⚠️ Importante:**
- Use uma chave aleatória e segura em produção
- Nunca commite o arquivo `.env` no git
- Em produção, defina `NODE_ENV=production` para desabilitar o Swagger

### Executar o Servidor

**Desenvolvimento (com Swagger):**
```bash
cd Back
npm run dev
```

**Produção (sem Swagger):**
```bash
cd Back
npm run build
npm start
```

---

## Segurança

### Senhas
- ✅ Armazenadas com **bcrypt** (hash + salt)
- ✅ Custo de 10 rounds
- ✅ Validação de senha forte (mínimo 8 caracteres)

### JWT
- ✅ Algoritmo: **HS256**
- ✅ Expiração: 2 horas (apenas anônimos)
- ✅ Payload: `{ id, email, nick, isAnonymous, gang }`
- ✅ Secret configurável via variável de ambiente

### CORS
- ✅ Habilitado para desenvolvimento
- ⚠️ Configure origins específicas em produção

---

## Desenvolvimento

### Swagger Desabilitado em Produção

O Swagger UI é **automaticamente desabilitado** quando `NODE_ENV=production`. Isso:

- ✅ Melhora a segurança (não expõe estrutura da API)
- ✅ Reduz o tamanho do bundle
- ✅ Melhora a performance

### Linter e Formatação

```bash
# Verificar problemas
npm run lint

# Corrigir automaticamente
npm run lint:fix
```

---

## Próximos Passos

- [ ] Persistência em banco de dados (PostgreSQL/MongoDB)
- [ ] Testes automatizados (Jest/Vitest)
- [ ] Rate limiting
- [ ] Refresh tokens
- [ ] Endpoints de estatísticas por gangue
- [ ] WebSocket para eventos em tempo real

---

## Links Úteis

- **Swagger UI (Dev)**: http://localhost:3333/docs
- **API Base URL**: http://localhost:3333
- **Repositório**: https://github.com/seu-usuario/ft_transcendence

---

**💡 Dica:** Para detalhes completos sobre cada endpoint, validações, exemplos e respostas, acesse a [documentação Swagger](http://localhost:3333/docs) com o servidor rodando.
