const url = require('url');
const fs = require('fs');
const path = require('path');

const handle = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.pathname === '/busca' && req.method === 'GET') {
    const termo = parsedUrl.query.termo.toLowerCase();
    const livrosPath = path.join(__dirname, 'livros.json');

    try {
      const dados = fs.readFileSync(livrosPath);
      const livros = JSON.parse(dados);
      const resultados = livros.filter(livro =>
        livro.titulo.toLowerCase().includes(termo) || livro.autor.toLowerCase().includes(termo)
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resultados));
    } catch (erro) {
      console.error('Erro ao processar busca:', erro);
      res.writeHead(500);
      res.end(JSON.stringify({ erro: 'Erro ao processar busca.' }));
    }
  } else {
    res.writeHead(404);
    res.end('Rota não encontrada.');
  }
};

module.exports = { handle };