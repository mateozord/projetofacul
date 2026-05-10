const Cliente = require('../models/Cliente');

function responderErroMongo(err, res) {
  if (err.code !== 11000) return false;
  const campo = err.keyPattern && Object.keys(err.keyPattern)[0];
  if (campo === 'email') {
    res.status(409).json({ erro: 'Este email já está cadastrado.' });
    return true;
  }
  res.status(409).json({ erro: 'Registro duplicado.' });
  return true;
}

const listar = async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ createdAt: -1 });
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ erro: 'ID inválido' });
    }
    res.status(500).json({ erro: err.message });
  }
};

const criar = async (req, res) => {
  try {
    const { nome, email, telefone, endereco } = req.body;
    if (!nome || !email) {
      return res.status(400).json({ erro: 'Nome e email são obrigatórios' });
    }
    const cliente = await Cliente.create({ nome, email, telefone: telefone || '', endereco: endereco || '' });
    res.status(201).json(cliente);
  } catch (err) {
    if (responderErroMongo(err, res)) return;
    res.status(400).json({ erro: err.message });
  }
};

const atualizar = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ erro: 'ID inválido' });
    }
    if (responderErroMongo(err, res)) return;
    res.status(400).json({ erro: err.message });
  }
};

const excluir = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id);
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ erro: 'ID inválido' });
    }
    res.status(500).json({ erro: err.message });
  }
};

const TZ_SP = 'America/Sao_Paulo';
/** Limite de dias no eixo: acima disso o gráfico usa agrupamento mensal (legibilidade). */
const MAX_DIAS_SERIE_DIARIA = 120;

function diaEmSaoPaulo(date) {
  return date.toLocaleDateString('en-CA', { timeZone: TZ_SP });
}

function mesEmSaoPaulo(date) {
  const ymd = date.toLocaleDateString('en-CA', { timeZone: TZ_SP });
  return ymd.slice(0, 7);
}

/** Agrupa cadastros por dia civil em America/Sao_Paulo (sem $dateToString no Mongo — evita erro em versões sem timezone na agregação). */
function contarPorDiaSaoPaulo(docs) {
  const porDia = {};
  for (const doc of docs) {
    if (!doc.createdAt) continue;
    const chave = diaEmSaoPaulo(new Date(doc.createdAt));
    porDia[chave] = (porDia[chave] || 0) + 1;
  }
  return porDia;
}

function contarPorMesSaoPaulo(docs) {
  const porMes = {};
  for (const doc of docs) {
    if (!doc.createdAt) continue;
    const chave = mesEmSaoPaulo(new Date(doc.createdAt));
    porMes[chave] = (porMes[chave] || 0) + 1;
  }
  return porMes;
}

/** Lista todos os meses YYYY-MM entre minYM e maxYM (inclusive). */
function mesesEntreInclusive(minYM, maxYM) {
  const [y1, m1] = minYM.split('-').map(Number);
  const [y2, m2] = maxYM.split('-').map(Number);
  const out = [];
  let y = y1;
  let m = m1;
  while (y < y2 || (y === y2 && m <= m2)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/** Caminha dia a dia de `inicio` até `fim` (objects Date), gerando chaves YYYY-MM-DD em SP. */
function enumerarDias(inicio, fim) {
  const keys = [];
  const cur = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const ult = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
  while (cur <= ult) {
    keys.push(diaEmSaoPaulo(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return keys;
}

const estatisticasResumo = async (req, res) => {
  try {
    const total = await Cliente.countDocuments();
    const agora = new Date();
    const limite7 = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const limite30 = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
    const novosUltimos7Dias = await Cliente.countDocuments({ createdAt: { $gte: limite7 } });
    const novosUltimos30Dias = await Cliente.countDocuments({ createdAt: { $gte: limite30 } });

    const docsDatas = await Cliente.find({}).select('createdAt').lean();
    const porDiaTodos = contarPorDiaSaoPaulo(docsDatas);

    let graficoGranularidade = 'dia';
    let serieCadastros = [];
    let graficoDescricao = '';

    if (total === 0) {
      graficoDescricao = 'Nenhum cadastro ainda.';
    } else {
      let primeiro = null;
      for (const doc of docsDatas) {
        if (!doc.createdAt) continue;
        const d = new Date(doc.createdAt);
        if (!primeiro || d < primeiro) primeiro = d;
      }
      if (!primeiro) primeiro = agora;

      const primeiroDiaStr = diaEmSaoPaulo(primeiro);
      const hojeStr = diaEmSaoPaulo(agora);
      const diasKeys = enumerarDias(primeiro, agora);
      const numDias = diasKeys.length;

      if (numDias <= MAX_DIAS_SERIE_DIARIA) {
        graficoGranularidade = 'dia';
        serieCadastros = diasKeys.map((periodo) => ({
          periodo,
          quantidade: porDiaTodos[periodo] || 0,
        }));
        graficoDescricao =
          numDias === 1
            ? `Cadastros no dia ${primeiroDiaStr} (fuso ${TZ_SP}).`
            : `Todos os cadastros por dia — ${numDias} dia${numDias === 1 ? '' : 's'} de ${primeiroDiaStr} a ${hojeStr} (${TZ_SP}).`;
      } else {
        graficoGranularidade = 'mes';
        const porMes = contarPorMesSaoPaulo(docsDatas);
        const minMes = mesEmSaoPaulo(primeiro);
        const maxMes = mesEmSaoPaulo(agora);
        const meses = mesesEntreInclusive(minMes, maxMes);
        serieCadastros = meses.map((periodo) => ({
          periodo,
          quantidade: porMes[periodo] || 0,
        }));
        graficoDescricao = `Histórico completo por mês (${meses.length} mês${meses.length === 1 ? '' : 'es'}), de ${minMes} a ${maxMes}. Acima de ${MAX_DIAS_SERIE_DIARIA} dias no calendário o gráfico agrupa por mês para melhor leitura.`;
      }
    }

    const cadastrosComTelefone = await Cliente.countDocuments({
      telefone: { $exists: true, $nin: [null, ''] },
    });

    const ultimosCadastros = await Cliente.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .select('nome email createdAt')
      .lean();

    res.json({
      total,
      novosUltimos7Dias,
      novosUltimos30Dias,
      cadastrosComTelefone,
      percentualComTelefone: total === 0 ? 0 : Math.round((cadastrosComTelefone / total) * 100),
      graficoGranularidade,
      graficoDescricao,
      serieCadastros,
      serieCadastrosPorDia:
        graficoGranularidade === 'dia' ? serieCadastros.map(({ periodo, quantidade }) => ({ dia: periodo, quantidade })) : [],
      ultimosCadastros,
    });
  } catch (err) {
    console.error('estatisticasResumo:', err);
    res.status(500).json({ erro: err.message || 'Erro ao montar estatísticas.' });
  }
};

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  excluir,
  estatisticasResumo,
};
