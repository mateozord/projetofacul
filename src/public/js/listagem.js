const API_BASE = '/api/clientes';
const tbody = document.getElementById('lista-clientes');
const totalEl = document.getElementById('clientes-total');

function atualizarTotal(total) {
  if (!totalEl) return;
  totalEl.textContent = `${total} cliente${total === 1 ? '' : 's'}`;
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

async function carregarLista() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Falha ao carregar clientes');
    const clientes = await res.json();
    atualizarTotal(clientes.length);
    tbody.innerHTML = '';
    if (clientes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum cliente cadastrado.</td></tr>';
      return;
    }
    clientes.forEach(c => tbody.appendChild(renderLinha(c)));
  } catch (err) {
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
    row.remove();
    const restantes = tbody.querySelectorAll('tr');
    atualizarTotal(restantes.length);
    if (restantes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum cliente cadastrado.</td></tr>';
    }
  } catch (err) {
    alert('Erro: ' + err.message);
  }
}

carregarLista();
