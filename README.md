# Sistema de cadastro e edição de clientes

Sistema CRUD de clientes com backend Node.js/Express, frontend em HTML/CSS/JS e persistência em MongoDB.

## Pré-requisitos

- **Node.js** (v18 ou superior)
- **MongoDB** rodando localmente ou URI de um cluster (ex.: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### MongoDB local

- **Windows:** [Download MongoDB Community](https://www.mongodb.com/try/download/community) e instale; o serviço costuma rodar em `mongodb://localhost:27017`.
- **Docker:** `docker run -d -p 27017:27017 --name mongodb mongo:latest`

## Instalação

1. Clone ou acesse a pasta do projeto e instale as dependências:

```bash
npm install
```

2. Configure o ambiente. Copie o arquivo de exemplo e edite se precisar:

```bash
copy .env.example .env
```

3. No `.env`, ajuste a URI do MongoDB (exemplo para local):

```
MONGODB_URI=mongodb://localhost:27017/projetofacul
PORT=3000
```

Para MongoDB Atlas, use a URI de conexão fornecida pelo cluster (ex.: `mongodb+srv://usuario:senha@cluster.xxxxx.mongodb.net/projetofacul`).

## Executando

1. Certifique-se de que o MongoDB está rodando.
2. Inicie o servidor:

```bash
npm start
```

Após atualizar o código, **pare e suba o servidor de novo** (`Ctrl+C` e `npm start` ou `npm run dev`). O painel usa **`GET /api/dashboard/resumo`** (também há **`GET /api/clientes/estatisticas/resumo`** como alternativa). Abra sempre pelo Node (**http://localhost:3000/dashboard**) — se abrir o HTML por outra ferramenta em outra porta, o `js/api-base.js` redireciona as chamadas para a porta **3000**.

3. Acesse no navegador: **http://localhost:3000**

- **Listagem:** `http://localhost:3000` ou `http://localhost:3000/index.html` (inclui **exportação CSV** da visualização atual — busca e ordenação)
- **Painel (dashboard):** `http://localhost:3000/dashboard` ou `http://localhost:3000/dashboard.html` — estatísticas, **gráfico de cadastros por dia** (14 dias) e últimos registros
- **Novo cliente:** `http://localhost:3000/form.html`
- **Editar:** abra um cliente pela listagem e clique em "Editar", ou acesse `http://localhost:3000/form.html?id=<ID_DO_CLIENTE>`

## API REST

| Método | Rota                | Descrição                 |
|--------|----------------------|----------------------------|
| GET    | `/api/clientes`      | Lista todos os clientes   |
| GET    | `/api/dashboard/resumo` | **Painel:** totais, série diária (14 dias), últimos cadastros |
| GET    | `/api/clientes/estatisticas/resumo` | Igual ao resumo do painel (rota alternativa) |
| GET    | `/api/clientes/:id`  | Retorna um cliente por ID |
| POST   | `/api/clientes`      | Cria cliente (body JSON)   |
| PUT    | `/api/clientes/:id`  | Atualiza cliente           |
| DELETE | `/api/clientes/:id`  | Remove cliente             |

Exemplo de body para POST/PUT:

```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "(11) 99999-9999",
  "endereco": "Rua Exemplo, 123"
}
```

`nome` e `email` são obrigatórios; `telefone` e `endereco` são opcionais.

**Regras de negócio**

- **Email único:** não é permitido cadastrar dois clientes com o mesmo email. Em caso de duplicidade, a API responde com status **409** e mensagem clara.
- **Cadastrado em:** cada documento armazena `createdAt` (MongoDB/Mongoose). Na listagem, a coluna **Cadastrado em** exibe data e hora em formato brasileiro e permite ordenação.

No formulário, o campo **telefone** aceita máscara no padrão brasileiro `(DD) NNNNN-NNNN` ou `(DD) NNNN-NNNN`.

**Painel e exportação**

- O **Painel** consome estatísticas no servidor (`GET /api/dashboard/resumo`) e exibe um **gráfico de barras** (Chart.js) apenas nos **dias ou meses em que houve cadastro** (sem barras “vazias” no meio da linha do tempo). Enquanto o intervalo no calendário (primeiro → último cadastro) tiver até 120 dias, o eixo é **diário**; acima disso, **mensal** (fuso America/São_Paulo). Há também cartões com totais e indicador de telefone preenchido.
- Na listagem, **Exportar CSV** gera um arquivo separado por `;` (UTF-8 com BOM) com exatamente os registros visíveis após busca e ordenação.

## Board do projeto

**Link público do board (para entrega ao professor):**

- **Link do board:** https://github.com/users/mateozord/projects/3

O board está no GitHub Projects (aba **Projects** do repositório), com colunas Todo | In Progress | Done e os cards das entregas do CRUD. Está público para o professor acessar.
