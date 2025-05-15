const express = require('express');
const { createServer } = require('http');
const { Server } = require('ws');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const server = createServer(app); // Criar servidor HTTP
const wss = new Server({ server }); // Integrar WebSocket ao servidor HTTP
const port = 3000;

// Configurar o armazenamento de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, '../public')));

// Middleware para parsear JSON
app.use(express.json());

// Função para sanitizar strings (prevenir XSS)
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  }[char]));
};

// Funções para ler e escrever arquivos JSON
const readJsonFile = (filePath) => {
  const adjustedPath = path.join(__dirname, filePath);
  console.log(`Tentando ler arquivo: ${adjustedPath}`);
  if (!fs.existsSync(adjustedPath)) {
    console.log(`Arquivo ${adjustedPath} não existe, criando com valor inicial []`);
    fs.writeFileSync(adjustedPath, JSON.stringify([]));
  }
  try {
    const data = JSON.parse(fs.readFileSync(adjustedPath));
    console.log(`Dados lidos de ${filePath}:`, data);
    return data;
  } catch (error) {
    console.error(`Erro ao ler ${filePath}:`, error.message);
    return [];
  }
};

const writeJsonFile = (filePath, data) => {
  const adjustedPath = path.join(__dirname, filePath);
  console.log(`Escrevendo dados em ${adjustedPath}:`, data);
  try {
    fs.writeFileSync(adjustedPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Erro ao escrever em ${filePath}:`, error.message);
    return false;
  }
};

// Rotas para Livros
app.get('/livros', (req, res) => {
  console.log('Recebida requisição GET /livros');
  const livros = readJsonFile('livros.json');
  res.json(livros);
});

app.post('/livros', (req, res) => {
  console.log('Recebida requisição POST /livros:', req.body);
  const livros = req.body;
  const sucesso = writeJsonFile('livros.json', livros);
  if (sucesso) {
    res.status(200).send('Livros salvos com sucesso');
  } else {
    res.status(500).send('Erro ao salvar livros');
  }
});

// Rota para upload ou edição de livro com imagem
app.post('/upload-livro', upload.single('imagem'), (req, res) => {
  console.log('Requisição recebida em /upload-livro');
  console.log('Dados do formulário:', req.body);
  console.log('Arquivo recebido:', req.file);
  const { titulo, autor, quantidade, descricao, editar } = req.body;
  const livros = readJsonFile('livros.json');
  let index = -1;

  if (editar === 'true') {
    index = livros.findIndex(l => l.titulo === titulo && l.autor === autor);
    console.log('Editando livro no índice:', index);
    if (index === -1) {
      console.log('Livro não encontrado para edição');
      return res.status(404).json({ error: 'Livro não encontrado para edição' });
    }
  }

  if (!titulo || !autor || !quantidade) {
    console.log('Campos obrigatórios ausentes');
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }

  const imagem = req.file ? `/uploads/${req.file.filename}` : req.body.imagem || null;
  console.log('Caminho da imagem:', imagem);
  const novoLivro = { 
    titulo: sanitizeString(titulo), 
    autor: sanitizeString(autor), 
    quantidade: parseInt(quantidade), 
    descricao: sanitizeString(descricao || ''), 
    imagem, 
    dataChegada: null 
  };

  if (editar === 'true' && index !== -1) {
    if (req.file && livros[index].imagem) {
      const oldImagePath = path.join(__dirname, '../public', livros[index].imagem);
      console.log('Removendo imagem antiga:', oldImagePath);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    livros[index] = novoLivro;
  } else {
    livros.push(novoLivro);
  }

  console.log('Salvando livros no arquivo livros.json');
  const sucesso = writeJsonFile('livros.json', livros);
  if (sucesso) {
    res.json(novoLivro);
  } else {
    res.status(500).json({ error: 'Erro ao salvar o livro' });
  }
});

// Rota para alugar um livro
app.post('/alugar', (req, res) => {
  console.log('Recebida requisição POST /alugar. Corpo da requisição:', req.body);
  const { titulo, usuarioEmail } = req.body;
  if (!titulo || !usuarioEmail) {
    console.log('Faltam dados na requisição:', { titulo, usuarioEmail });
    return res.status(400).json({ error: 'Título e e-mail do usuário são obrigatórios' });
  }

  const livros = readJsonFile('livros.json');
  const usuarios = readJsonFile('usuarios.json');

  const livroIndex = livros.findIndex(l => l.titulo === titulo);
  console.log('Índice do livro encontrado:', livroIndex);
  if (livroIndex === -1) {
    console.log('Livro não encontrado:', titulo);
    return res.status(404).json({ error: 'Livro não encontrado' });
  }

  if (livros[livroIndex].quantidade <= 0) {
    console.log('Livro indisponível:', titulo);
    return res.status(400).json({ error: 'Livro indisponível para aluguel' });
  }

  const usuarioIndex = usuarios.findIndex(u => u.email === usuarioEmail);
  console.log('Índice do usuário encontrado:', usuarioIndex);
  if (usuarioIndex === -1) {
    console.log('Usuário não encontrado:', usuarioEmail);
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Reduzir quantidade do livro
  livros[livroIndex].quantidade -= 1;
  if (livros[livroIndex].quantidade === 0) {
    livros[livroIndex].dataChegada = new Date().toISOString().split('T')[0];
  }

  // Adicionar aluguel ao usuário
  if (!usuarios[usuarioIndex].alugueis) {
    usuarios[usuarioIndex].alugueis = [];
  }
  usuarios[usuarioIndex].alugueis.push(titulo);

  const livrosSalvos = writeJsonFile('livros.json', livros);
  const usuariosSalvos = writeJsonFile('usuarios.json', usuarios);
  if (livrosSalvos && usuariosSalvos) {
    console.log('Aluguel concluído com sucesso:', { titulo, usuarioEmail });
    res.json({ message: 'Livro alugado com sucesso', livro: livros[livroIndex] });
  } else {
    res.status(500).json({ error: 'Erro ao salvar dados do aluguel' });
  }
});

// Rotas para Usuários
app.get('/usuarios', (req, res) => {
  console.log('Recebida requisição GET /usuarios');
  const usuarios = readJsonFile('usuarios.json');
  res.json(usuarios);
});

app.post('/usuarios', (req, res) => {
  console.log('Recebida requisição POST /usuarios:', req.body);
  const usuarios = req.body;
  const sucesso = writeJsonFile('usuarios.json', usuarios);
  if (sucesso) {
    res.status(200).send('Usuários salvos com sucesso');
  } else {
    res.status(500).send('Erro ao salvar usuários');
  }
});

// Rotas para Administradores
app.get('/admins', (req, res) => {
  console.log('Recebida requisição GET /admins');
  const admins = readJsonFile('admins.json');
  res.json(admins);
});

app.post('/admins', (req, res) => {
  console.log('Recebida requisição POST /admins:', req.body);
  const admins = req.body;
  const sucesso = writeJsonFile('admins.json', admins);
  if (sucesso) {
    res.status(200).send('Administradores salvos com sucesso');
  } else {
    res.status(500).send('Erro ao salvar administradores');
  }
});

// Rota para busca de livros
app.get('/busca', (req, res) => {
  console.log('Recebida requisição GET /busca:', req.query);
  const termo = req.query.termo?.toLowerCase() || '';
  const livros = readJsonFile('livros.json');
  const resultados = livros.filter(livro => livro.titulo.toLowerCase().includes(termo));
  res.json(resultados);
});

// Configuração do WebSocket para o chat
const clients = new Map();
const messageCounts = new Map(); // Contador de mensagens por cliente

const botResponses = [
  "Olá! Bem-vindo à Biblioteca Geek. Como posso ajudar com seus livros favoritos?",
  "Quer explorar nosso catálogo de ficção científica ou fantasia?",
  "Diga-me, qual é o seu gênero literário preferido?",
  "Posso sugerir alguns quadrinhos incríveis! Qual super-herói você gosta?",
  "Essa é sua última pergunta para o Bot Geek. A próxima mensagem irá para o administrador!"
];

wss.on('connection', (ws, req) => {
  const clientId = Date.now().toString();
  ws.id = clientId;

  ws.on('message', (data) => {
    let mensagem;
    try {
      mensagem = JSON.parse(data);
    } catch (error) {
      console.error('Mensagem inválida:', error);
      return;
    }

    // Sanitizar dados da mensagem
    if (mensagem.texto) mensagem.texto = sanitizeString(mensagem.texto);
    if (mensagem.nome) mensagem.nome = sanitizeString(mensagem.nome);

    if (mensagem.tipo === 'register' && mensagem.role === 'admin') {
      ws.isAdmin = true;
      ws.nome = 'Administrador';
      console.log('Administrador conectado com ID:', ws.id);
      // Enviar lista inicial de clientes
      const clientList = Array.from(clients.entries()).map(([id, client]) => ({
        id,
        nome: client.nome
      }));
      ws.send(JSON.stringify({
        tipo: 'clientList',
        clients: clientList
      }));
    } else if (mensagem.tipo === 'conectar' && !ws.isAdmin) {
      const clientNome = mensagem.nome || 'Anônimo';
      ws.nome = clientNome;
      clients.set(ws.id, { ws, nome: clientNome });
      messageCounts.set(ws.id, 0); // Inicializar contador de mensagens
      console.log(`Cliente ${clientNome} conectou-se com ID ${ws.id}`);
      wss.clients.forEach(client => {
        if (client.isAdmin) {
          client.send(JSON.stringify({
            tipo: 'conectar',
            id: ws.id,
            nome: clientNome
          }));
        }
      });
      // Enviar primeira resposta do Bot Geek
      ws.send(JSON.stringify({
        tipo: 'resposta',
        usuario: 'Bot Geek',
        texto: botResponses[0]
      }));
      messageCounts.set(ws.id, 1);
    } else if (mensagem.tipo === 'mensagem' && !ws.isAdmin) {
      const count = messageCounts.get(ws.id) + 1;
      messageCounts.set(ws.id, count);

      // Lógica do Bot Geek (responde até 5 mensagens)
      if (count <= 5) {
        ws.send(JSON.stringify({
          tipo: 'resposta',
          usuario: 'Bot Geek',
          texto: botResponses[count - 1]
        }));
      }

      // Após 5 mensagens, conectar ao administrador
      if (count > 5) {
        // Enviar feedback ao usuário
        ws.send(JSON.stringify({
          tipo: 'resposta',
          usuario: 'Sistema',
          texto: 'Você esgotou suas perguntas com o Bot Geek. Conectando você ao administrador...'
        }));

        // Verificar se há administradores conectados
        let adminFound = false;
        wss.clients.forEach(client => {
          if (client.isAdmin) {
            adminFound = true;
            console.log(`Enviando mensagem do cliente ${ws.id} (${ws.nome}) para administrador ${client.id}`);
            client.send(JSON.stringify({
              tipo: 'mensagem',
              clienteId: ws.id,
              nome: ws.nome,
              texto: mensagem.texto,
              timestamp: new Date().toLocaleString('pt-BR')
            }));
          }
        });

        // Se não houver administradores conectados, informar o usuário
        if (!adminFound) {
          console.log('Nenhum administrador conectado para receber a mensagem do cliente', ws.id);
          ws.send(JSON.stringify({
            tipo: 'resposta',
            usuario: 'Sistema',
            texto: 'Nenhum administrador está disponível no momento. Tente novamente mais tarde.'
          }));
        }
      }
    } else if (mensagem.tipo === 'adminMensagem' && ws.isAdmin) {
      const client = clients.get(mensagem.clienteId);
      if (client) {
        client.ws.send(JSON.stringify({
          tipo: 'resposta',
          usuario: 'Administrador',
          texto: mensagem.texto
        }));
        ws.send(JSON.stringify({
          tipo: 'resposta',
          usuario: 'Você',
          texto: mensagem.texto,
          timestamp: new Date().toLocaleString('pt-BR')
        }));
      } else {
        console.log(`Cliente ${mensagem.clienteId} não encontrado para adminMensagem`);
      }
    }
  });

  ws.on('close', () => {
    if (!ws.isAdmin) {
      clients.delete(ws.id);
      messageCounts.delete(ws.id);
      wss.clients.forEach(client => {
        if (client.isAdmin) {
          client.send(JSON.stringify({
            tipo: 'desconectar',
            id: ws.id
          }));
        }
      });
      console.log(`Cliente ${ws.nome || 'desconhecido'} desconectado`);
    } else {
      console.log('Administrador desconectado');
    }
  });

  ws.on('error', (error) => {
    console.error('Erro no WebSocket:', error);
  });
});

server.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});