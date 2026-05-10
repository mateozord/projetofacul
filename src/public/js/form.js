const API_BASE =
  typeof window.apiUrl === 'function' ? window.apiUrl('/api/clientes') : '/api/clientes';

const form = document.getElementById('form-cliente');
const title = document.getElementById('form-title');
const subtitle = document.getElementById('form-subtitle');
const erroMsg = document.getElementById('erro-msg');

const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const isEdicao = !!id;

if (isEdicao) {
  title.textContent = 'Editar cliente';
  if (subtitle) {
    subtitle.textContent = 'Revise os dados para manter a identificação do cliente sempre atualizada.';
  }
}

async function carregarCliente() {
  if (!id) return;
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Cliente não encontrado');
    const cliente = await res.json();
    document.getElementById('nome').value = cliente.nome || '';
    document.getElementById('email').value = cliente.email || '';
    document.getElementById('telefone').value = aplicarMascaraTelefone(cliente.telefone || '');
    document.getElementById('endereco').value = cliente.endereco || '';
  } catch (err) {
    erroMsg.textContent = err.message;
    erroMsg.style.display = 'block';
  }
}

function mostrarErro(msg) {
  erroMsg.textContent = msg;
  erroMsg.style.display = 'block';
}

function esconderErro() {
  erroMsg.style.display = 'none';
}

function aplicarMascaraTelefone(valorBruto) {
  const d = valorBruto.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const telInput = document.getElementById('telefone');
if (telInput) {
  telInput.addEventListener('input', () => {
    telInput.value = aplicarMascaraTelefone(telInput.value);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  esconderErro();
  const payload = {
    nome: document.getElementById('nome').value.trim(),
    email: document.getElementById('email').value.trim(),
    telefone: document.getElementById('telefone').value.trim(),
    endereco: document.getElementById('endereco').value.trim(),
  };
  if (!payload.nome || !payload.email) {
    mostrarErro('Nome e email são obrigatórios.');
    return;
  }
  try {
    const url = isEdicao ? `${API_BASE}/${id}` : API_BASE;
    const method = isEdicao ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      mostrarErro(data.erro || 'Erro ao salvar.');
      return;
    }
    window.location.href = 'index.html';
  } catch (err) {
    mostrarErro('Erro de conexão: ' + err.message);
  }
});

carregarCliente();
