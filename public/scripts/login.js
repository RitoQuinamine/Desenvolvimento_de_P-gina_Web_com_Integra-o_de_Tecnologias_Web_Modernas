document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim().toLowerCase();
  const senha = document.getElementById('senha').value.trim();
  const mensagemErro = document.getElementById('mensagemErro');
  console.log('Tentando login com:', { email, senha });

  // Limpar mensagem anterior e exibir estado de carregamento
  mensagemErro.style.display = 'none';
  mensagemErro.textContent = '';

  if (!email || !senha) {
    mensagemErro.textContent = 'Por favor, preencha todos os campos.';
    mensagemErro.style.display = 'block';
    console.warn('Campos obrigatórios não preenchidos');
    return;
  }

  try {
    console.log('Enviando requisição para /usuarios');
    const response = await fetch('http://localhost:3000/usuarios', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Resposta de /usuarios:', response);
    if (!response.ok) {
      throw new Error(`Erro ao carregar usuários: ${response.status} ${response.statusText}`);
    }
    const usuarios = await response.json();
    console.log('Usuários carregados:', usuarios);

    if (!Array.isArray(usuarios)) {
      throw new Error('Resposta inválida: não é um array de usuários');
    }

    const usuario = usuarios.find(u => u.email.toLowerCase() === email && u.senha === senha);
    if (usuario) {
      localStorage.setItem('usuarioEmail', email);
      console.log('Login bem-sucedido, email salvo no localStorage:', email);
      mensagemErro.textContent = 'Login realizado com sucesso! Redirecionando...';
      mensagemErro.classList.remove('text-danger');
      mensagemErro.classList.add('text-success');
      mensagemErro.style.display = 'block';
      setTimeout(() => {
        window.location.href = 'catalogo.html';
      }, 1500);
    } else {
      console.log('E-mail ou senha incorretos');
      mensagemErro.textContent = 'E-mail ou senha incorretos.';
      mensagemErro.style.display = 'block';
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    mensagemErro.textContent = `Erro ao fazer login: ${error.message}. Verifique se o servidor está rodando e tente novamente.`;
    mensagemErro.style.display = 'block';
  }
});