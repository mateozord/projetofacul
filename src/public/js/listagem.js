const API_BASE = '/api/clientes';
const tbody = document.getElementById('lista-clientes');
const totalEl = document.getElementById('clientes-total');

let clientes = [];
/** Lista atualmente exibida na tabela (filtro + ordenação), usada na exportação CSV. */
let listaVisivel = [];
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

function formatCadastro(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function renderLinha(cliente) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="primary-info">${escapeHtml(cliente.nome)}</td>
    <td class="secondary-info">${escapeHtml(cliente.email)}</td>
    <td class="muted-info">${escapeHtml(cliente.telefone || '-')}</td>
    <td class="muted-info">${escapeHtml(cliente.endereco || '-')}</td>
    <td class="col-cadastro muted-info">${escapeHtml(formatCadastro(cliente.createdAt))}</td>
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

function escapeCsvCell(val) {
  const s = String(val ?? '');
  if (/[;"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportarCsv() {
  if (!listaVisivel.length) {
    alert('Não há linhas para exportar na visualização atual (ajuste a busca ou cadastre clientes).');
    return;
  }
  const header = ['Nome', 'Email', 'Telefone', 'Endereço', 'Cadastrado em'];
  const linhas = [header.join(';')];
  for (const c of listaVisivel) {
    linhas.push(
      [
        escapeCsvCell(c.nome),
        escapeCsvCell(c.email),
        escapeCsvCell(c.telefone || ''),
        escapeCsvCell(c.endereco || ''),
        escapeCsvCell(formatCadastro(c.createdAt)),
      ].join(';')
    );
  }
  const bom = '\ufeff';
  const blob = new Blob([bom + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  a.href = url;
  a.download = `clientes_${hoje}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function atualizarTabela(arr, totalCadastrado) {
  listaVisivel = arr;
  tbody.innerHTML = '';
  if (arr.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhum cliente encontrado.</td></tr>';
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
    if (campo === 'createdAt') {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dir * (ta - tb);
    }
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
    listaVisivel = [];
    atualizarTotal(0);
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Erro ao carregar: ' + escapeHtml(err.message) + '</td></tr>';
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

document.getElementById('btn-exportar-csv')?.addEventListener('click', exportarCsv);

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
