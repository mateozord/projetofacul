const Cliente = require('../models/Cliente');

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
