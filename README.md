# Folki Backend

API backend do Folki construída com NestJS, PostgreSQL e Docker.

## Pré-requisitos

- Docker
- Docker Compose
- Make
- VS Code (recomendado)

## Setup Inicial

1. Clone o repositório

2. Configure as variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

   **⚠️ IMPORTANTE:**
   - O arquivo `.env` é ignorado pelo git e contém suas credenciais reais
   - NUNCA commite credenciais reais no repositório
   - Use `.env.example` apenas como template

3. Suba os serviços:

   ```bash
   make up
   ```

4. Após subir, adicione dados seed no banco de dados:

   ```bash
   make db-seed
   ```

Pronto! O backend está rodando em:

- Backend: `http://localhost:3000`
- API: `http://localhost:3000/api`
- PostgreSQL: `localhost:5432`
- Swagger: `http://localhost:3000/docs`

## Comandos

```bash
make up          # Inicia os serviços (já cria as tabelas automaticamente)
make down        # Para os serviços
make test        # Roda os testes
make test-cov    # Roda os testes com cobertura e abre o relatório
make clean       # Remove tudo incluindo volumes do banco
make lint        # Formata código
```

## Antes de fazer um PR! Importante!

- Utilize o make lint para lintar o código. Ele não é aceito no CI caso o código não siga os padrões de projeto.

- Rode o comando de test-cov para validar se a sua cobertura de testes é ok. Devemos ter no mínimo 80% de cobertura e todos os testes devem passar.

## Mudanças no Schema do Banco

Quando você editar o `prisma/schema.prisma`, rode:

```bash
make db-migrate
```

Vai pedir um nome para a migration (ex: "add_new_field"). Isso aplica as mudanças no banco.

## Adição de nova library

Quando você instalar uma nova lib, rode o rebuild.

```bash
make rebuild
```

## Configuração do VS Code

O projeto já vem com as configurações de format on save em `.vscode/settings.json`.

Instale as extensões recomendadas (o VS Code vai sugerir automaticamente):

- Prettier - Code formatter
- ESLint

Pronto! Os arquivos serão formatados automaticamente ao salvar.

## Hot Reload

Qualquer alteração no código reflete automaticamente no container.

## Documentação da API

Acesse `http://localhost:3000/docs` para ver a documentação Swagger.

## Arquitetura do Projeto

O projeto segue a arquitetura modular do NestJS com separação clara de responsabilidades:

```
src/
├── app.module.ts                 # Módulo raiz da aplicação
├── main.ts                       # Bootstrap da aplicação
├── users/                        # Módulo
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── services/                 # Serviços de domínio
│   │   ├── authenticate-user.service.ts
│   │   ├── find-user-by-id.service.ts
│   │   ├── access-ufscar-sigaa.service.ts
│   │   └── scrap-jupiter.service.ts
│   ├── repositories/             # Camada de acesso a dados
│   │   ├── user.repository.ts
│   │   └── user-subject.repository.ts
│   ├── dto/                      # Data Transfer Objects
│   ├── entities/                 # Entidades de domínio
|   └── exceptions/               # Exceptions customizadas (não existe em users, mas veja universities para um exemplo)
│   └── tests/                    # Testes unitários
| ...
```

### Camadas da Arquitetura

1. **Controllers**: Recebem as requisições HTTP e delegam para os serviços
2. **Services**: Contêm a lógica de negócio e orquestração (pasta `services/`)
3. **Repositories**: Abstração da camada de dados com Prisma (pasta `repositories/`)
4. **DTOs**: Validação e transformação de dados de entrada/saída (pasta `dto/`)
5. **Entities**: Representação do domínio da aplicação (pasta `entities/`)
6. **Exceptions**: Tratamento de erros específicos do domínio (pasta `exceptions/`)
7. **Tests**: Testes unitários separados (pasta `tests/`)

### Padrões Utilizados

- **Dependency Injection**: Todos os serviços e repositórios são injetáveis
- **Repository Pattern**: Abstração do acesso a dados
- **Service Layer**: Lógica de negócio separada dos controllers
- **DTO Pattern**: Validação e transformação de dados com class-validator
- **Exception Filters**: Tratamento global de erros
- **Guards**: Autenticação JWT
- **Interceptors**: Logging e transformação de respostas

### Boas Práticas

- Sempre crie testes para repositories e services
- Use DTOs para validação de entrada com class-validator
- Adicione documentação Swagger com `@Api*` decorators
- Mantenha os services focados em lógica de negócio
- Use repositories para abstrair acesso a dados
- Crie exceções customizadas em `exceptions/` quando necessário
- Organize os testes na pasta `tests/` separada
- Siga a estrutura de pastas existente: `services/`, `repositories/`, `dto/`, `entities/`, `exceptions/`, `tests/`
- Use logging estruturado com contexto para facilitar debugging
- Sempre rode `make lint` antes de fazer PR
- Mantenha cobertura de testes acima de 80%
