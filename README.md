# Folki Backend

API backend do Folki construída com NestJS, PostgreSQL e Docker.

## Pré-requisitos

- Docker
- Docker Compose
- Make
- VS Code (extremamente recomendado)

## Setup Inicial

1. Clone o repositório

2. O projeto já vem com `.env.dev` configurado para desenvolvimento com valores padrão

3. Se precisar de variáveis customizadas, crie seu próprio `.env`:
   ```bash
   cp .env.example .env
   ```

## Como Rodar

```bash
make up
```

Isso vai subir:

- Backend em `http://localhost:3000`
- PostgreSQL em `localhost:5432`
- Swagger em `http://localhost:3000/api`

## Comandos

```bash
make up        # Inicia os serviços
make down      # Para os serviços
make rebuild   # Rebuilda o backend (após adicionar dependências)
make test      # Roda os testes
make clean     # Remove tudo incluindo volumes do banco
```

## Configuração do VS Code

### Format on Save

O projeto já vem com as configurações de format on save em `.vscode/settings.json`.

1. Instale as extensões recomendadas (o VS Code vai sugerir automaticamente quando abrir o projeto):
   - Prettier - Code formatter
   - ESLint

2. Pronto! Os arquivos serão formatados automaticamente ao salvar.

Se não funcionar, reinicie o VS Code.

### Formatar manualmente

```bash
npm run format
```

## Hot Reload

Qualquer alteração no código reflete automaticamente no container.

## Documentação da API

Acesse `http://localhost:3000/api` para ver a documentação Swagger.

## Após adicionar dependências no package.json

```bash
make rebuild
```

Isso rebuilda o backend mantendo os dados do banco.
