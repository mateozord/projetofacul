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

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  excluir,
};
