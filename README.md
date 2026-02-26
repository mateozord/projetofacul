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

3. Acesse no navegador: **http://localhost:3000**

- **Listagem:** `http://localhost:3000` ou `http://localhost:3000/index.html`
- **Novo cliente:** `http://localhost:3000/form.html`
- **Editar:** abra um cliente pela listagem e clique em "Editar", ou acesse `http://localhost:3000/form.html?id=<ID_DO_CLIENTE>`

## API REST

| Método | Rota                | Descrição                 |
|--------|----------------------|----------------------------|
| GET    | `/api/clientes`      | Lista todos os clientes   |
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
