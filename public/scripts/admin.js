if (!localStorage.getItem('adminLogado')) {
  window.location.href = 'index.html';
}

document.getElementById('logoutAdminBtn').addEventListener('click', () => {
  localStorage.removeItem('adminLogado');
  window.location.href = 'index.html';
});

async function carregarDados(endpoint) {
  try {
    const response = await fetch(`/${endpoint}`);
    if (!response.ok) throw new Error(`Erro ao carregar ${endpoint}`);
    return await response.json();
  } catch (error) {
    console.error(`Erro na requisição de ${endpoint}:`, error);
    return [];
  }
}

async function salvarDados(endpoint, dados) {
  try {
    const response = await fetch(`/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) throw new Error(`Erro ao salvar ${endpoint}`);
    if (endpoint === 'livros') {
      localStorage.setItem('livrosAntigos', JSON.stringify(dados));
    } else if (endpoint === 'usuarios') {
      localStorage.setItem('usuariosAntigos', JSON.stringify(dados));
    }
    return true;
  } catch (error) {
    console.error(`Erro na requisição de salvamento (${endpoint}):`, error);
    return false;
  }
}

// Gerenciamento de Livros
async function atualizarLivros() {
  const livros = await carregarDados('livros');
  const livrosTable = document.getElementById('livrosTable');
  livrosTable.innerHTML = livros.map((livro, index) => `
    <tr>
      <td>${livro.titulo}</td>
      <td>${livro.autor}</td>
      <td>${livro.quantidade || 0}</td>
      <td>${livro.quantidade > 0 ? 'Disponível' : 'Indisponível'}</td>
      <td>${livro.dataChegada ? livro.dataChegada : 'N/A'}</td>
      <td>${livro.descricao || 'Nenhuma descrição'}</td>
      <td><img src="${livro.imagem || 'placeholder.jpg'}" alt="${livro.titulo}" style="max-width: 100px;"></td>
      <td>
        <button class="btn btn-primary btn-sm aumentarBtn" data-index="${index}">+1</button>
        <button class="btn btn-warning btn-sm reduzirBtn" data-index="${index}" ${livro.quantidade <= 0 ? 'disabled' : ''}>-1</button>
        <button class="btn btn-success btn-sm disponibilizarBtn" data-index="${index}" ${livro.quantidade > 0 ? 'disabled' : ''}>Disponibilizar</button>
        <button class="btn btn-danger btn-sm indisponibilizarBtn" data-index="${index}" ${livro.quantidade === 0 ? 'disabled' : ''}>Indisponibilizar</button>
        <button class="btn btn-warning btn-sm editarLivroBtn" data-index="${index}">Editar</button>
        <button class="btn btn-danger btn-sm deletarLivroBtn" data-index="${index}">Deletar</button>
        <div class="mt-2 ${livro.quantidade > 0 ? 'd-none' : ''}" id="dataChegadaForm-${index}">
          <input type="date" id="dataChegada-${index}" class="form-control mt-1" value="${livro.dataChegada || ''}">
          <button class="btn btn-neon btn-sm mt-1 salvarDataBtn" data-index="${index}">Salvar Data</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Aumentar quantidade
  document.querySelectorAll('.aumentarBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = e.target.getAttribute('data-index');
      const livros = await carregarDados('livros');
      livros[index].quantidade = (livros[index].quantidade || 0) + 1;
      if (livros[index].quantidade > 0) {
        delete livros[index].dataChegada;
      }
      if (await salvarDados('livros', livros)) {
        alert(`Quantidade de "${livros[index].titulo}" aumentada para ${livros[index].quantidade}!`);
        atualizarLivros();
        atualizarEstatisticas();
      } else {
        alert('Erro ao aumentar a quantidade. Tente novamente.');
      }
    });
  });

  // Reduzir quantidade
  document.querySelectorAll('.reduzirBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = e.target.getAttribute('data-index');
      const livros = await carregarDados('livros');
      if (livros[index].quantidade > 0) {
        livros[index].quantidade -= 1;
        if (livros[index].quantidade === 0) {
          livros[index].dataChegada = livros[index].dataChegada || '';
        }
        if (await salvarDados('livros', livros)) {
          alert(`Quantidade de "${livros[index].titulo}" reduzida para ${livros[index].quantidade}!`);
          atualizarLivros();
          atualizarEstatisticas();
        } else {
          alert('Erro ao reduzir a quantidade. Tente novamente.');
        }
      }
    });
  });

  // Disponibilizar
  document.querySelectorAll('.disponibilizarBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = e.target.getAttribute('data-index');
      const livros = await carregarDados('livros');
      livros[index].quantidade = 1;
      delete livros[index].dataChegada;
      if (await salvarDados('livros', livros)) {
        alert(`"${livros[index].titulo}" disponibilizado com sucesso!`);
        atualizarLivros();
        atualizarEstatisticas();
      } else {
        alert('Erro ao disponibilizar o livro. Tente novamente.');
      }
    });
  });

  // Indisponibilizar
  document.querySelectorAll('.indisponibilizarBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = e.target.getAttribute('data-index');
      const livros = await carregarDados('livros');
      livros[index].quantidade = 0;
      if (await salvarDados('livros', livros)) {
        alert(`"${livros[index].titulo}" indisponibilizado com sucesso!`);
        atualizarLivros();
        atualizarEstatisticas();
      } else {
        alert('Erro ao indisponibilizar o livro. Tente novamente.');
      }
    });
  });

  // Salvar data de chegada
  document.querySelectorAll('.salvarDataBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = e.target.getAttribute('data-index');
      const dataChegada = document.getElementById(`dataChegada-${index}`).value;
      if (!dataChegada) {
        alert('Por favor, selecione uma data de chegada.');
        return;
      }
      const hoje = new Date().toISOString().split('T')[0];
      if (dataChegada < hoje) {
        alert('A data de chegada não pode ser anterior à data atual.');
        return;
      }
      const livros = await carregarDados('livros');
      livros[index].dataChegada = dataChegada;
      if (await salvarDados('livros', livros)) {
        alert(`Data de chegada para "${livros[index].titulo}" salva com sucesso!`);
        atualizarLivros();
        atualizarEstatisticas();
      } else {
        alert('Erro ao salvar a data de chegada. Tente novamente.');
      }
    });
  });

  // Editar livro
  document.querySelectorAll('.editarLivroBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = e.target.getAttribute('data-index');
      const livros = await carregarDados('livros');
      const livroAtual = livros[index];
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (event) => {
        const novaImagem = event.target.files[0];
        const formData = new FormData();
        formData.append('titulo', livroAtual.titulo);
        formData.append('autor', livroAtual.autor);
        formData.append('quantidade', livroAtual.quantidade);
        formData.append('descricao', livroAtual.descricao || '');
        formData.append('imagem', novaImagem);
        formData.append('editar', 'true');

        try {
          console.log('Enviando requisição para editar livro...');
          const response = await fetch('/upload-livro', {
            method: 'POST',
            body: formData
          });
          console.log('Resposta do servidor:', response);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao editar livro: ${errorText}`);
          }
          const novoLivro = await response.json();
          livros[index] = novoLivro;
          if (await salvarDados('livros', livros)) {
            alert('Livro atualizado com sucesso!');
            atualizarLivros();
            atualizarEstatisticas();
          }
        } catch (error) {
          console.error('Erro ao editar:', error);
          alert('Erro ao editar o livro. Tente novamente.');
        }
      };
      input.click();
    });
  });

  // Deletar livro
  document.querySelectorAll('.deletarLivroBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = e.target.getAttribute('data-index');
      const livros = await carregarDados('livros');
      if (confirm(`Deseja deletar "${livros[index].titulo}"?`)) {
        livros.splice(index, 1);
        if (await salvarDados('livros', livros)) {
          alert('Livro deletado com sucesso!');
          atualizarLivros();
          atualizarEstatisticas();
        }
      }
    });
  });
}

document.getElementById('livroForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = document.getElementById('livroTitulo').value.trim();
  const autor = document.getElementById('livroAutor').value.trim();
  const quantidade = parseInt(document.getElementById('livroQuantidade').value);
  const descricao = document.getElementById('livroDescricao').value.trim();
  const imagemInput = document.getElementById('livroImagem');
  const livros = await carregarDados('livros');

  if (!titulo || !autor || isNaN(quantidade) || quantidade < 0) {
    alert('Por favor, preencha todos os campos obrigatórios corretamente (título, autor e quantidade válida).');
    return;
  }

  const formData = new FormData();
  formData.append('titulo', titulo);
  formData.append('autor', autor);
  formData.append('quantidade', quantidade);
  formData.append('descricao', descricao);
  if (imagemInput.files[0]) {
    formData.append('imagem', imagemInput.files[0]);
    console.log('Imagem selecionada:', imagemInput.files[0].name);
  } else {
    console.log('Nenhuma imagem selecionada.');
  }

  try {
    console.log('Enviando requisição para /upload-livro...');
    const response = await fetch('/upload-livro', {
      method: 'POST',
      body: formData
    });
    console.log('Resposta do servidor:', response);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao adicionar livro com imagem: ${errorText}`);
    }
    const novoLivro = await response.json();
    console.log('Novo livro retornado:', novoLivro);
    livros.push(novoLivro);
    if (await salvarDados('livros', livros)) {
      alert('Livro adicionado com sucesso!');
      document.getElementById('livroForm').reset();
      atualizarLivros();
      atualizarEstatisticas();
    }
  } catch (error) {
    console.error('Erro detalhado:', error);
    alert('Erro ao adicionar o livro. Tente novamente.');
  }
});

// Gerenciamento de Usuários
async function atualizarUsuarios() {
  const usuarios = await carregarDados('usuarios');
  const usuariosTable = document.getElementById('usuariosTable');
  usuariosTable.innerHTML = usuarios.map((usuario, index) => `
    <tr>
      <td>${usuario.nome}</td>
      <td>${usuario.email}</td>
      <td>${usuario.alugueis?.join(', ') || 'Nenhum'}</td>
      <td>
        <button class="btn btn-warning btn-sm editarUsuarioBtn" data-index="${index}">Editar</button>
        <button class="btn btn-danger btn-sm deletarUsuarioBtn" data-index="${index}">Deletar</button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.editarUsuarioBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = e.target.getAttribute('data-index');
      const novosDados = prompt('Novo nome e e-mail (separados por vírgula):', `${usuarios[index].nome}, ${usuarios[index].email}`);
      if (novosDados) {
        const [nome, email] = novosDados.split(',').map(item => item.trim());
        usuarios[index].nome = nome;
        usuarios[index].email = email;
        if (await salvarDados('usuarios', usuarios)) {
          alert('Usuário atualizado com sucesso!');
          atualizarUsuarios();
          atualizarEstatisticas();
        }
      }
    });
  });

  document.querySelectorAll('.deletarUsuarioBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = e.target.getAttribute('data-index');
      if (confirm(`Deseja deletar "${usuarios[index].nome}"?`)) {
        usuarios.splice(index, 1);
        if (await salvarDados('usuarios', usuarios)) {
          alert('Usuário deletado com sucesso!');
          atualizarUsuarios();
          atualizarEstatisticas();
        }
      }
    });
  });
}

document.getElementById('usuarioForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('usuarioNome').value.trim();
  const email = document.getElementById('usuarioEmail').value.trim();
  const senha = document.getElementById('usuarioSenha').value.trim();
  const usuarios = await carregarDados('usuarios');

  if (usuarios.find(u => u.email === email)) {
    alert('E-mail já cadastrado.');
    return;
  }

  usuarios.push({ nome, email, senha, alugueis: [], dataCadastro: new Date().toISOString().split('T')[0] });
  if (await salvarDados('usuarios', usuarios)) {
    alert('Usuário adicionado com sucesso!');
    document.getElementById('usuarioForm').reset();
    atualizarUsuarios();
    atualizarEstatisticas();
  }
});

// Gerenciamento de Administradores
async function atualizarAdmins() {
  const admins = await carregarDados('admins');
  const adminsTable = document.getElementById('adminsTable');
  adminsTable.innerHTML = admins.map((admin, index) => `
    <tr>
      <td>${admin.nome}</td>
      <td>${admin.email}</td>
      <td>
        <button class="btn btn-warning btn-sm editarAdminBtn" data-index="${index}">Editar</button>
        <button class="btn btn-danger btn-sm deletarAdminBtn" data-index="${index}">Deletar</button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.editarAdminBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = e.target.getAttribute('data-index');
      const admins = await carregarDados('admins');
      const novosDados = prompt('Novo nome, e-mail e senha (separados por vírgula):', `${admins[index].nome}, ${admins[index].email}, ${admins[index].senha}`);
      if (novosDados) {
        const [nome, email, senha] = novosDados.split(',').map(item => item.trim());
        if (!nome || !email || !senha) {
          alert('Por favor, preencha todos os campos (nome, e-mail e senha).');
          return;
        }
        if (admins.find((a, i) => a.email === email && i !== parseInt(index))) {
          alert('E-mail já cadastrado por outro administrador.');
          return;
        }
        admins[index].nome = nome;
        admins[index].email = email;
        admins[index].senha = senha;
        if (await salvarDados('admins', admins)) {
          alert('Administrador atualizado com sucesso!');
          atualizarAdmins();
        }
      }
    });
  });

  document.querySelectorAll('.deletarAdminBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = e.target.getAttribute('data-index');
      const admins = await carregarDados('admins');
      if (confirm(`Deseja deletar "${admins[index].nome}"?`)) {
        admins.splice(index, 1);
        if (await salvarDados('admins', admins)) {
          alert('Administrador deletado com sucesso!');
          atualizarAdmins();
        }
      }
    });
  });
}

document.getElementById('adminForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('adminNome').value.trim();
  const email = document.getElementById('adminEmail').value.trim();
  const senha = document.getElementById('adminSenha').value.trim();
  const admins = await carregarDados('admins');

  if (!nome || !email || !senha) {
    alert('Por favor, preencha todos os campos (nome, e-mail e senha).');
    return;
  }

  if (admins.find(a => a.email === email)) {
    alert('E-mail já cadastrado.');
    return;
  }

  admins.push({ nome, email, senha });
  if (await salvarDados('admins', admins)) {
    alert('Administrador adicionado com sucesso!');
    document.getElementById('adminForm').reset();
    atualizarAdmins();
  }
});

// Chat com Clientes
const ws = new WebSocket('ws://localhost:3000');
let clienteSelecionado = null;

ws.onopen = () => {
  console.log('Conectado como administrador.');
  ws.send(JSON.stringify({ tipo: 'register', role: 'admin' }));
};

ws.onmessage = (event) => {
  const mensagem = JSON.parse(event.data);
  const clientesLista = document.getElementById('clientesLista');
  const mensagensAdmin = document.getElementById('mensagensAdmin');

  if (mensagem.tipo === 'clientList') {
    clientesLista.innerHTML = mensagem.clients.map(client => `
      <li class="list-group-item bg-dark text-white clienteItem" data-id="${client.id}">
        ${client.nome}
      </li>
    `).join('');
    document.querySelectorAll('.clienteItem').forEach(item => {
      item.addEventListener('click', () => {
        clienteSelecionado = item.getAttribute('data-id');
        mensagensAdmin.innerHTML = '';
        document.querySelectorAll('.clienteItem').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  } else if (mensagem.tipo === 'conectar') {
    clientesLista.innerHTML += `
      <li class="list-group-item bg-dark text-white clienteItem" data-id="${mensagem.id}">
        ${mensagem.nome}
      </li>
    `;
    document.querySelector(`.clienteItem[data-id="${mensagem.id}"]`).addEventListener('click', () => {
      clienteSelecionado = mensagem.id;
      mensagensAdmin.innerHTML = '';
      document.querySelectorAll('.clienteItem').forEach(i => i.classList.remove('active'));
      document.querySelector(`.clienteItem[data-id="${mensagem.id}"]`).classList.add('active');
    });
  } else if (mensagem.tipo === 'desconectar') {
    const item = document.querySelector(`.clienteItem[data-id="${mensagem.id}"]`);
    if (item) item.remove();
    if (clienteSelecionado === mensagem.id) {
      clienteSelecionado = null;
      mensagensAdmin.innerHTML = '';
    }
  } else if (mensagem.tipo === 'mensagem' && mensagem.clienteId === clienteSelecionado) {
    mensagensAdmin.innerHTML += `
      <div class="mb-2">
        <strong>${mensagem.nome}:</strong> ${mensagem.texto}
        <small class="text-muted d-block">${mensagem.timestamp}</small>
      </div>
    `;
    mensagensAdmin.scrollTop = mensagensAdmin.scrollHeight;
  } else if (mensagem.tipo === 'resposta' && mensagem.usuario === 'Você') {
    mensagensAdmin.innerHTML += `
      <div class="mb-2 text-end">
        <strong>${mensagem.usuario}:</strong> ${mensagem.texto}
        <small class="text-muted d-block">${mensagem.timestamp}</small>
      </div>
    `;
    mensagensAdmin.scrollTop = mensagensAdmin.scrollHeight;
  }
};

document.getElementById('formChatAdmin').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!clienteSelecionado) {
    alert('Selecione um cliente para conversar.');
    return;
  }

  const mensagemInput = document.getElementById('mensagemAdminInput');
  const texto = mensagemInput.value.trim();
  if (texto && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ tipo: 'adminMensagem', clienteId: clienteSelecionado, texto }));
    mensagemInput.value = '';
  } else if (!texto) {
    alert('Digite uma mensagem.');
  } else {
    alert('Não conectado ao servidor. Tente novamente.');
  }
});

ws.onclose = () => {
  const mensagensAdmin = document.getElementById('mensagensAdmin');
  mensagensAdmin.innerHTML += `
    <div class="mb-2 text-muted">
      <strong>Sistema:</strong> Desconectado do servidor.
      <small class="text-muted d-block">${new Date().toLocaleString('pt-BR')}</small>
    </div>
  `;
  mensagensAdmin.scrollTop = mensagensAdmin.scrollHeight;
};

// Estatísticas
async function atualizarEstatisticas() {
  const usuarios = await carregarDados('usuarios');
  const livros = await carregarDados('livros');

  const totalUsuarios = usuarios.length;
  const novosCadastros = usuarios.filter(u => new Date(u.dataCadastro || Date.now()) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
  const totalLivros = livros.length;
  const livrosAlugados = usuarios.reduce((acc, u) => acc + (u.alugueis?.length || 0), 0);
  const generosProcurados = ['Ficção Científica', 'Fantasia', 'Quadrinhos'];
  const autoresBuscados = ['Antoine de Saint-Exupéry', 'Jeph Loeb', 'Scott Snyder'];

  document.getElementById('estatisticasGerais').innerHTML = `
    <tr><td>Total de Usuários Cadastrados:</td><td>${totalUsuarios}</td></tr>
    <tr><td>Novos Cadastros no Período:</td><td>${novosCadastros}</td></tr>
    <tr><td>Total de Livros no Acervo:</td><td>${totalLivros}</td></tr>
    <tr><td>Livros Alugados no Período:</td><td>${livrosAlugados}</td></tr>
    <tr><td>Gêneros Mais Procurados:</td><td>${generosProcurados.join(', ')}</td></tr>
    <tr><td>Autores Mais Buscados:</td><td>${autoresBuscados.join(', ')}</td></tr>
  `;

  const livrosAntigos = JSON.parse(localStorage.getItem('livrosAntigos')) || [];
  const usuariosAntigos = JSON.parse(localStorage.getItem('usuariosAntigos')) || [];

  const livrosAdicionados = livros.length - (livrosAntigos.length || 0);
  const livrosRemovidos = (livrosAntigos.length || 0) - livros.length;
  const usuariosAdicionados = usuarios.length - (usuariosAntigos.length || 0);
  const usuariosRemovidos = (usuariosAntigos.length || 0) - usuarios.length;

  document.getElementById('estatisticasGestao').innerHTML = `
    <tr><td>Livros Adicionados no Período:</td><td>${livrosAdicionados > 0 ? livrosAdicionados : 0}</td></tr>
    <tr><td>Livros Removidos no Período:</td><td>${livrosRemovidos > 0 ? livrosRemovidos : 0}</td></tr>
    <tr><td>Usuários Adicionados no Período:</td><td>${usuariosAdicionados > 0 ? usuariosAdicionados : 0}</td></tr>
    <tr><td>Usuários Removidos no Período:</td><td>${usuariosRemovidos > 0 ? usuariosRemovidos : 0}</td></tr>
  `;

  const ctx = document.getElementById('graficoEstatisticas').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Usuários', 'Novos Cadastros', 'Livros', 'Alugados', 'Livros Adic.', 'Livros Rem.', 'Usuários Adic.', 'Usuários Rem.'],
      datasets: [{
        label: 'Estatísticas',
        data: [totalUsuarios, novosCadastros, totalLivros, livrosAlugados, livrosAdicionados, livrosRemovidos, usuariosAdicionados, usuariosRemovidos],
        backgroundColor: 'rgba(0, 255, 0, 0.5)'
      }]
    },
    options: {
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { labels: { color: 'white' } } },
      scales: { y: { ticks: { color: 'white' } }, x: { ticks: { color: 'white' } } }
    }
  });
}

// Inicializar tabelas e estatísticas
atualizarLivros();
atualizarUsuarios();
atualizarAdmins();
atualizarEstatisticas();

// Inicializar o estado anterior no localStorage na primeira execução
async function inicializarEstadoAnterior() {
  const livros = await carregarDados('livros');
  const usuarios = await carregarDados('usuarios');
  if (!localStorage.getItem('livrosAntigos')) {
    localStorage.setItem('livrosAntigos', JSON.stringify(livros));
  }
  if (!localStorage.getItem('usuariosAntigos')) {
    localStorage.setItem('usuariosAntigos', JSON.stringify(usuarios));
  }
}
inicializarEstadoAnterior();