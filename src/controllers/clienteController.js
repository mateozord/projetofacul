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

function diaEmSaoPaulo(date) {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

const estatisticasResumo = async (req, res) => {
  try {
    const total = await Cliente.countDocuments();
    const agora = new Date();
    const limite7 = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const limite30 = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
    const novosUltimos7Dias = await Cliente.countDocuments({ createdAt: { $gte: limite7 } });
    const novosUltimos30Dias = await Cliente.countDocuments({ createdAt: { $gte: limite30 } });

    const inicio14 = new Date(agora);
    inicio14.setDate(inicio14.getDate() - 13);
    inicio14.setHours(0, 0, 0, 0);

    const agg = await Cliente.aggregate([
      { $match: { createdAt: { $gte: inicio14 } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'America/Sao_Paulo' },
          },
          quantidade: { $sum: 1 },
        },
      },
    ]);
    const porDia = Object.fromEntries(agg.map((x) => [x._id, x.quantidade]));

    const serieCadastrosPorDia = [];
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(agora);
      d.setDate(d.getDate() - i);
      const chave = diaEmSaoPaulo(d);
      serieCadastrosPorDia.push({
        dia: chave,
        quantidade: porDia[chave] || 0,
      });
    }

    const cadastrosComTelefone = await Cliente.countDocuments({
      telefone: { $exists: true, $nin: [null, ''] },
    });

    const ultimosCadastros = await Cliente.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('nome email createdAt')
      .lean();

    res.json({
      total,
      novosUltimos7Dias,
      novosUltimos30Dias,
      cadastrosComTelefone,
      percentualComTelefone: total === 0 ? 0 : Math.round((cadastrosComTelefone / total) * 100),
      serieCadastrosPorDia,
      ultimosCadastros,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
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
