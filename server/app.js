const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const url = require('url');
const routes = require('./routes');

const PORTA = process.env.PORT || 3000;
const SERVER_DIR = path.join(__dirname);

function inicializarArquivo(caminho, dadosIniciais) {
  if (!fs.existsSync(caminho)) {
    fs.writeFileSync(caminho, JSON.stringify(dadosIniciais, null, 2));
  }
}

inicializarArquivo(path.join(SERVER_DIR, 'admins.json'), [{ email: "admin@biblioteca.com", senha: "admin123" }]);
inicializarArquivo(path.join(SERVER_DIR, 'usuarios.json'), []);
inicializarArquivo(path.join(SERVER_DIR, 'livros.json'), [
  { titulo: "O Pequeno Príncipe", autor: "Antoine de Saint-Exupéry" },
  { titulo: "Superman: Paz na Terra", autor: "Jeph Loeb" },
  { titulo: "Batman: O Homem que Ri", autor: "Scott Snyder" }
]);

function responderRequisicao(req, res) {
  const parsedUrl = url.parse(req.url, true);
  let filePath = path.join(__dirname, '../public', parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);

  if (parsedUrl.pathname === '/busca') {
    routes.handle(req, res);
    return;
  }

  if (parsedUrl.pathname === '/admins') {
    if (req.method === 'GET') {
      try {
        const dados = fs.readFileSync(path.join(SERVER_DIR, 'admins.json'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(dados);
      } catch (erro) {
        console.error('Erro ao ler admins.json:', erro);
        res.writeHead(500);
        res.end(JSON.stringify({ erro: 'Erro ao ler administradores.' }));
      }
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const novosAdmins = JSON.parse(body);
          fs.writeFileSync(path.join(SERVER_DIR, 'admins.json'), JSON.stringify(novosAdmins, null, 2));
          res.writeHead(200);
          res.end('Administradores salvos com sucesso.');
        } catch (erro) {
          console.error('Erro ao salvar admins.json:', erro);
          res.writeHead(500);
          res.end(JSON.stringify({ erro: 'Erro ao salvar administradores.' }));
        }
      });
      return;
    }
  }

  if (parsedUrl.pathname === '/usuarios') {
    if (req.method === 'GET') {
      try {
        const dados = fs.readFileSync(path.join(SERVER_DIR, 'usuarios.json'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(dados);
      } catch (erro) {
        console.error('Erro ao ler usuarios.json:', erro);
        res.writeHead(500);
        res.end(JSON.stringify({ erro: 'Erro ao ler usuários.' }));
      }
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const novosUsuarios = JSON.parse(body);
          fs.writeFileSync(path.join(SERVER_DIR, 'usuarios.json'), JSON.stringify(novosUsuarios, null, 2));
          res.writeHead(200);
          res.end('Usuários salvos com sucesso.');
        } catch (erro) {
          console.error('Erro ao salvar usuarios.json:', erro);
          res.writeHead(500);
          res.end(JSON.stringify({ erro: 'Erro ao salvar usuários.' }));
        }
      });
      return;
    }
  }

  if (parsedUrl.pathname === '/livros') {
    if (req.method === 'GET') {
      try {
        const dados = fs.readFileSync(path.join(SERVER_DIR, 'livros.json'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(dados);
      } catch (erro) {
        console.error('Erro ao ler livros.json:', erro);
        res.writeHead(500);
        res.end(JSON.stringify({ erro: 'Erro ao ler livros.' }));
      }
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const novosLivros = JSON.parse(body);
          fs.writeFileSync(path.join(SERVER_DIR, 'livros.json'), JSON.stringify(novosLivros, null, 2));
          res.writeHead(200);
          res.end('Livros salvos com sucesso.');
        } catch (erro) {
          console.error('Erro ao salvar livros.json:', erro);
          res.writeHead(500);
          res.end(JSON.stringify({ erro: 'Erro ao salvar livros.' }));
        }
      });
      return;
    }
  }

  const extname = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json'
  };

  if (!extname) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (erro, dados) => {
    if (erro) {
      res.writeHead(404);
      res.end('Arquivo não encontrado.');
    } else {
      res.writeHead(200, { 'Content-Type': contentTypes[extname] || 'text/plain' });
      res.end(dados);
    }
  });
}

const clientes = [];
let administrador = null;
const faq = [
  { pergunta: /horário|funcionamento|abre|fecha/i, resposta: "Funcionamos de segunda a sexta, 9h-18h, e sábado, 10h-14h." },
  { pergunta: /livros|catálogo/i, resposta: "Veja nosso catálogo em catalogo.html!" },
  { pergunta: /emprestar|alugar/i, resposta: "Selecione um livro no catálogo e clique em 'Alugar'!" },
  { pergunta: /eventos|atividades/i, resposta: "Temos clubes de leitura mensais. Confira em breve!" },
  { pergunta: /contato|telefone|email/i, resposta: "E-mail: contato@bibliotecageek.com | Telefone: (11) 1234-5678." }
];
const perguntasPorCliente = new Map();

function lidarComMensagem(ws, mensagem) {
  const msg = JSON.parse(mensagem);

  if (msg.tipo === 'conectar') {
    ws.id = Date.now().toString();
    ws.nome = msg.nome || `Visitante ${ws.id.slice(0, 8)}`;
    if (ws !== administrador) {
      clientes.push(ws);
      ws.send(JSON.stringify({ tipo: 'resposta', usuario: 'Bot Geek', texto: 'Bem-vindo à Biblioteca Geek!' }));
      if (administrador && administrador.readyState === WebSocket.OPEN) {
        administrador.send(JSON.stringify({ tipo: 'conectar', id: ws.id, nome: ws.nome }));
      }
    }
    return;
  }

  if (msg.tipo === 'mensagem') {
    const texto = msg.texto;
    const nome = msg.nome || ws.nome;

    if (ws === administrador) {
      return;
    }

    const contador = perguntasPorCliente.get(ws.id)?.contador || 0;
    if (contador >= 5) {
      if (administrador && administrador.readyState === WebSocket.OPEN) {
        administrador.send(JSON.stringify({
          tipo: 'mensagem',
          nome: nome,
          texto: texto,
          clienteId: ws.id
        }));
        ws.send(JSON.stringify({
          tipo: 'resposta',
          usuario: 'Você',
          texto: texto
        }));
      } else {
        ws.send(JSON.stringify({
          tipo: 'resposta',
          usuario: 'Sistema',
          texto: 'Nenhum administrador disponível.'
        }));
      }
      perguntasPorCliente.set(ws.id, { contador: contador + 1, nome: nome });
      return;
    }

    let resposta = 'Desculpe, não entendi. Pergunte sobre horários, livros, aluguel, eventos ou contatos!';
    for (const item of faq) {
      if (item.pergunta.test(texto)) {
        resposta = item.resposta;
        break;
      }
    }

    ws.send(JSON.stringify({
      tipo: 'resposta',
      usuario: 'Bot Geek',
      texto: resposta
    }));
    perguntasPorCliente.set(ws.id, { contador: contador + 1, nome: nome });
    return;
  }

  if (msg.tipo === 'adminMensagem') {
    const clienteId = msg.clienteId;
    const texto = msg.texto;
    const clienteWs = clientes.find(c => c.id === clienteId);
    if (clienteWs && clienteWs.readyState === WebSocket.OPEN) {
      clienteWs.send(JSON.stringify({
        tipo: 'resposta',
        usuario: 'Administrador',
        texto: texto
      }));
    }
    if (administrador && administrador.readyState === WebSocket.OPEN) {
      administrador.send(JSON.stringify({
        tipo: 'resposta',
        usuario: 'Você',
        texto: texto
      }));
    }
  }
}

function aoDesconectar(ws) {
  const index = clientes.indexOf(ws);
  if (index !== -1) {
    clientes.splice(index, 1);
    perguntasPorCliente.delete(ws.id);
    if (administrador && administrador.readyState === WebSocket.OPEN) {
      administrador.send(JSON.stringify({
        tipo: 'desconectar',
        id: ws.id
      }));
    }
  }
  if (ws === administrador) {
    administrador = null;
  }
}

function aoConectar(ws, req) {
  ws.id = Date.now().toString();

  if (req.url === '/admin') {
    if (administrador) {
      ws.send(JSON.stringify({
        tipo: 'resposta',
        usuario: 'Sistema',
        texto: 'Já existe um administrador conectado.'
      }));
      ws.close();
      return;
    }
    administrador = ws;
    ws.send(JSON.stringify({
      tipo: 'resposta',
      usuario: 'Sistema',
      texto: 'Conectado como administrador.'
    }));
    clientes.forEach(cliente => {
      if (cliente.readyState === WebSocket.OPEN) {
        administrador.send(JSON.stringify({
          tipo: 'conectar',
          id: cliente.id,
          nome: cliente.nome
        }));
      }
    });
  }

  ws.on('message', (mensagem) => lidarComMensagem(ws, mensagem));
  ws.on('close', () => aoDesconectar(ws));
}

const servidor = http.createServer(responderRequisicao);
const wss = new WebSocket.Server({ server: servidor });

wss.on('connection', aoConectar);

servidor.listen(PORTA, () => {
  console.log(`Servidor rodando na porta ${PORTA}`);
});