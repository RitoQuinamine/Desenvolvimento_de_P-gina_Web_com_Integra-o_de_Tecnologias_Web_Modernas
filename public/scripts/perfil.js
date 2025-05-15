async function carregarUsuarios() {
  try {
    console.log('Fazendo requisição para /usuarios');
    const response = await fetch('http://localhost:3000/usuarios');
    if (!response.ok) throw new Error(`Erro ao carregar usuários: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log('Usuários recebidos:', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erro na requisição de usuários:', error);
    alert('Não foi possível carregar os usuários. Verifique sua conexão e tente novamente.');
    return [];
  }
}

async function salvarUsuarios(usuarios) {
  try {
    console.log('Salvando usuários:', usuarios);
    const response = await fetch('http://localhost:3000/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuarios)
    });
    if (!response.ok) throw new Error(`Erro ao salvar usuários: ${response.status} ${response.statusText}`);
    console.log('Usuários salvos com sucesso');
    return true;
  } catch (error) {
    console.error('Erro na requisição de salvamento:', error);
    alert('Não foi possível salvar os dados. Verifique sua conexão e tente novamente.');
    return false;
  }
}

async function devolverLivro(titulo) {
  try {
    console.log(`Tentando devolver livro: ${titulo}`);
    const response = await fetch('http://localhost:3000/livros');
    if (!response.ok) throw new Error(`Erro ao carregar livros: ${response.statusText}`);
    const livros = await response.json();
    const livroIndex = livros.findIndex(l => l.titulo === titulo);
    if (livroIndex === -1) {
      throw new Error('Livro não encontrado');
    }
    livros[livroIndex].quantidade += 1;
    if (livros[livroIndex].quantidade > 0) {
      delete livros[livroIndex].dataChegada;
    }
    const saveResponse = await fetch('http://localhost:3000/livros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(livros)
    });
    if (!saveResponse.ok) {
      throw new Error(`Erro ao salvar livros: ${saveResponse.statusText}`);
    }
    console.log(`Livro "${titulo}" devolvido com sucesso`);
    return true;
  } catch (error) {
    console.error('Erro ao devolver livro:', error);
    throw error;
  }
}

if (document.getElementById('perfilModal')) {
  const perfilModal = document.getElementById('perfilModal');
  const perfilInfo = document.getElementById('perfilInfo');
  const perfilAcoes = document.getElementById('perfilAcoes');

  perfilModal.addEventListener('show.bs.modal', async () => {
    const usuarioEmail = localStorage.getItem('usuarioEmail');
    if (usuarioEmail) {
      try {
        const usuarios = await carregarUsuarios();
        const usuario = usuarios.find(u => u.email.toLowerCase() === usuarioEmail.toLowerCase());
        if (usuario) {
          perfilInfo.innerHTML = `
            <p><strong>Nome:</strong> ${usuario.nome}</p>
            <p><strong>E-mail:</strong> ${usuario.email}</p>
            <p><strong>Aluguéis:</strong></p>
            <ul id="listaAlugueis">
              ${usuario.alugueis?.length > 0 ? usuario.alugueis.map((livro, index) => `
                <li>${livro} <button class="btn btn-danger btn-sm desalugarBtn" data-index="${index}" data-titulo="${livro}">Devolver</button></li>
              `).join('') : '<li>Nenhum livro alugado.</li>'}
            </ul>
          `;
          perfilAcoes.innerHTML = `<button id="logoutBtn" class="btn btn-neon">Sair</button>`;
        } else {
          perfilInfo.innerHTML = '<p>Usuário não encontrado. Faça login novamente.</p>';
          perfilAcoes.innerHTML = `<a href="login.html" class="btn btn-neon">Login</a>`;
          localStorage.removeItem('usuarioEmail');
        }
      } catch (error) {
        perfilInfo.innerHTML = '<p>Erro ao carregar perfil. Tente novamente.</p>';
        perfilAcoes.innerHTML = `<a href="login.html" class="btn btn-neon">Login</a>`;
        console.error('Erro ao carregar usuário:', error);
      }
    } else {
      perfilInfo.innerHTML = '<p>Faça login para ver seu perfil.</p>';
      perfilAcoes.innerHTML = `<a href="login.html" class="btn btn-neon">Login</a>`;
    }

    // Adicionar evento de logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      localStorage.removeItem('usuarioEmail');
      perfilInfo.innerHTML = '<p>Faça login para ver seu perfil.</p>';
      perfilAcoes.innerHTML = `<a href="login.html" class="btn btn-neon">Login</a>`;
      const modal = bootstrap.Modal.getInstance(perfilModal);
      modal.hide();
    });

    // Adicionar eventos para devolução
    document.querySelectorAll('.desalugarBtn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const index = e.target.getAttribute('data-index');
        const titulo = e.target.getAttribute('data-titulo');
        const usuarioEmail = localStorage.getItem('usuarioEmail');
        let usuarios = await carregarUsuarios();
        const usuarioIndex = usuarios.findIndex(u => u.email.toLowerCase() === usuarioEmail.toLowerCase());
        if (usuarioIndex === -1) {
          alert('Usuário não encontrado. Faça login novamente.');
          perfilInfo.innerHTML = '<p>Usuário não encontrado. Faça login novamente.</p>';
          perfilAcoes.innerHTML = `<a href="login.html" class="btn btn-neon">Login</a>`;
          localStorage.removeItem('usuarioEmail');
          return;
        }
        try {
          usuarios[usuarioIndex].alugueis.splice(index, 1);
          const sucessoUsuarios = await salvarUsuarios(usuarios);
          const sucessoLivros = await devolverLivro(titulo);
          if (sucessoUsuarios && sucessoLivros) {
            alert(`Você devolveu "${titulo}" com sucesso!`);
            perfilInfo.innerHTML = `
              <p><strong>Nome:</strong> ${usuarios[usuarioIndex].nome}</p>
              <p><strong>E-mail:</strong> ${usuarios[usuarioIndex].email}</p>
              <p><strong>Aluguéis:</strong></p>
              <ul id="listaAlugueis">
                ${usuarios[usuarioIndex].alugueis?.length > 0 ? usuarios[usuarioIndex].alugueis.map((livro, idx) => `
                  <li>${livro} <button class="btn btn-danger btn-sm desalugarBtn" data-index="${idx}" data-titulo="${livro}">Devolver</button></li>
                `).join('') : '<li>Nenhum livro alugado.</li>'}
              </ul>
            `;
          } else {
            alert('Erro ao salvar a devolução. Tente novamente.');
          }
        } catch (error) {
          alert(`Erro ao devolver "${titulo}": ${error.message}`);
        }
      });
    });
  });
}