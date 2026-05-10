const API_STATS_PATH = '/api/dashboard/resumo';

function formatCadastro(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function labelDiaCurto(isoDia) {
  const [y, m, d] = isoDia.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function labelMesCurto(anoMes) {
  const [y, m] = anoMes.split('-').map(Number);
  const dt = new Date(y, m - 1, 1);
  return dt.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

let chartInstance = null;

function renderChart(payload) {
  const canvas = document.getElementById('chart-cadastros');
  if (!canvas || typeof Chart === 'undefined') return;

  const granularidade = payload.graficoGranularidade || 'dia';
  const serie = payload.serieCadastros || [];

  if (!serie.length) {
    if (chartInstance) chartInstance.destroy();
    chartInstance = null;
    return;
  }

  const labels =
    granularidade === 'mes'
      ? serie.map((x) => labelMesCurto(x.periodo))
      : serie.map((x) => labelDiaCurto(x.periodo));
  const values = serie.map((x) => x.quantidade);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: granularidade === 'mes' ? 'Cadastros no mês' : 'Cadastros no dia',
          data: values,
          backgroundColor: 'rgba(37, 99, 235, 0.72)',
          borderRadius: 6,
          maxBarThickness: granularidade === 'mes' ? 48 : 36,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => {
              const i = items[0]?.dataIndex;
              return serie[i] ? serie[i].periodo : '';
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
        x: {
          ticks: {
            maxRotation: granularidade === 'mes' ? 60 : 45,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: granularidade === 'mes' ? 24 : 45,
          },
        },
      },
    },
  });
}

function preencherUltimos(rows) {
  const tbody = document.getElementById('dash-ultimos');
  if (!tbody) return;
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Nenhum cadastro ainda.</td></tr>';
    return;
  }
  tbody.innerHTML = rows
    .map(
      (c) => `
    <tr>
      <td class="primary-info">${escapeHtml(c.nome)}</td>
      <td class="secondary-info">${escapeHtml(c.email)}</td>
      <td class="col-cadastro muted-info">${escapeHtml(formatCadastro(c.createdAt))}</td>
    </tr>`
    )
    .join('');
}

async function carregar() {
  const erroEl = document.getElementById('dash-erro');
  const statsEl = document.getElementById('dash-stats');
  try {
    const primary =
      typeof window.apiUrl === 'function' ? window.apiUrl(API_STATS_PATH) : API_STATS_PATH;
    let res = await fetch(primary);
    let data = await res.json().catch(() => ({}));

    if (!res.ok && res.status === 404) {
      const legacy =
        typeof window.apiUrl === 'function'
          ? window.apiUrl('/api/clientes/estatisticas/resumo')
          : '/api/clientes/estatisticas/resumo';
      res = await fetch(legacy);
      data = await res.json().catch(() => ({}));
    }

    if (!res.ok) {
      let msg = data.erro || res.statusText || 'Não foi possível carregar o painel.';
      if (res.status === 404) {
        msg =
          'API do painel não encontrada (404). Use o site pelo Node em http://localhost:3000/dashboard , com MongoDB ligado e rode npm run dev (ou npm start).';
      }
      throw new Error(msg);
    }

    document.getElementById('stat-total').textContent = String(data.total ?? 0);
    document.getElementById('stat-7').textContent = String(data.novosUltimos7Dias ?? 0);
    document.getElementById('stat-30').textContent = String(data.novosUltimos30Dias ?? 0);

    const pct = data.percentualComTelefone ?? 0;
    const comTel = data.cadastrosComTelefone ?? 0;
    document.getElementById('stat-tel').textContent = `${pct}%`;
    const sub = document.getElementById('stat-tel-sub');
    if (sub) sub.textContent = `${comTel} cliente${comTel === 1 ? '' : 's'}`;

    const tituloChart = document.getElementById('dash-chart-title');
    const descChart = document.getElementById('dash-chart-desc');
    if (tituloChart) {
      tituloChart.textContent =
        data.graficoGranularidade === 'mes'
          ? 'Cadastros por mês (histórico completo)'
          : 'Cadastros por dia (histórico completo)';
    }
    if (descChart) {
      descChart.textContent =
        data.graficoDescricao ||
        'Distribuição de todos os cadastros no tempo (fuso America/São_Paulo).';
    }

    renderChart(data);
    preencherUltimos(data.ultimosCadastros || []);

    if (erroEl) erroEl.style.display = 'none';
    if (statsEl) statsEl.style.display = '';
  } catch (e) {
    if (statsEl) statsEl.style.display = 'none';
    if (erroEl) {
      erroEl.textContent = e.message || 'Erro ao carregar.';
      erroEl.style.display = 'block';
    }
    const tbody = document.getElementById('dash-ultimos');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="3" class="empty-state">${escapeHtml(e.message)}</td></tr>`;
    }
  }
}

carregar();
