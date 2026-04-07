const API_BASE = '/api/clientes';
const tbody = document.getElementById('lista-clientes');
const totalEl = document.getElementById('clientes-total');

let clientes = [];
let sortCampo = 'nome';
let sortDir = 1;

function atualizarTotal(exibindo, totalCadastrado) {
  if (!totalEl) return;
  if (totalCadastrado !== undefined && totalCadastrado !== exibindo) {
    totalEl.textContent = `${exibindo} de ${totalCadastrado} cliente${totalCadastrado === 1 ? '' : 's'}`;
  } else {
    totalEl.textContent = `${exibindo} cliente${exibindo === 1 ? '' : 's'}`;
  }
}

function renderLinha(cliente) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="primary-info">${escapeHtml(cliente.nome)}</td>
    <td class="secondary-info">${escapeHtml(cliente.email)}</td>
    <td class="muted-info">${escapeHtml(cliente.telefone || '-')}</td>
    <td class="muted-info">${escapeHtml(cliente.endereco || '-')}</td>
    <td class="actions-cell">
      <a href="form.html?id=${encodeURIComponent(cliente._id)}" class="btn btn-secondary btn-sm">Editar</a>
      <button type="button" class="btn btn-danger btn-sm" data-id="${cliente._id}">Excluir</button>
    </td>
  `;
  tr.querySelector('button[data-id]').addEventListener('click', () => excluir(cliente._id, tr));
  return tr;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function atualizarTabela(arr, totalCadastrado) {
  tbody.innerHTML = '';
  if (arr.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum cliente encontrado.</td></tr>';
  } else {
    arr.forEach(c => tbody.appendChild(renderLinha(c)));
  }
  atualizarTotal(arr.length, totalCadastrado);
}

function filtrarPorBusca(lista, texto) {
  const t = (texto || '').trim().toLowerCase();
  if (!t) return lista;
  return lista.filter(c => {
    const nome = (c.nome || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    return nome.includes(t) || email.includes(t);
  });
}

function ordenar(lista, campo, dir) {
  return [...lista].sort((a, b) => {
    let va = a[campo];
    let vb = b[campo];
    if (va == null || va === '') va = '';
    if (vb == null || vb === '') vb = '';
    const cmp = String(va).localeCompare(String(vb), 'pt-BR', { sensitivity: 'base' });
    return dir * cmp;
  });
}

function aplicarFiltroEOrdenacao() {
  const buscaInput = document.getElementById('busca');
  const textoBusca = buscaInput ? buscaInput.value : '';
  const filtrados = filtrarPorBusca(clientes, textoBusca);
  const ordenados = ordenar(filtrados, sortCampo, sortDir);
  atualizarTabela(ordenados, clientes.length);
  atualizarIndicadorOrdenacao();
}

function atualizarIndicadorOrdenacao() {
  document.querySelectorAll('th[data-sort]').forEach(th => {
    const campo = th.getAttribute('data-sort');
    th.classList.remove('sort-asc', 'sort-desc');
    if (campo === sortCampo) {
      th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc');
    }
  });
}

async function carregarLista() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Falha ao carregar clientes');
    clientes = await res.json();
    aplicarFiltroEOrdenacao();
  } catch (err) {
    clientes = [];
    atualizarTotal(0);
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Erro ao carregar: ' + escapeHtml(err.message) + '</td></tr>';
  }
}

async function excluir(id, row) {
  if (!confirm('Deseja realmente excluir este cliente?')) return;
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.erro || 'Falha ao excluir');
    }
    clientes = clientes.filter(c => c._id !== id);
    aplicarFiltroEOrdenacao();
  } catch (err) {
    alert('Erro: ' + err.message);
  }
}

document.getElementById('busca')?.addEventListener('input', aplicarFiltroEOrdenacao);

document.querySelectorAll('th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const campo = th.getAttribute('data-sort');
    if (campo === sortCampo) {
      sortDir *= -1;
    } else {
      sortCampo = campo;
      sortDir = 1;
    }
    aplicarFiltroEOrdenacao();
  });
});

carregarLista();
