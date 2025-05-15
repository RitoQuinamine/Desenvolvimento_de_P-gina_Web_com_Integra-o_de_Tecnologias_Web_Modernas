async function carregarLivros() {
  try {
    console.log('Fazendo requisição para /livros');
    const response = await fetch('http://localhost:3000/livros');
    console.log('Resposta recebida de /livros:', response);
    if (!response.ok) throw new Error('Erro ao carregar livros');
    const livros = await response.json();
    console.log('Livros recebidos:', livros);
    const listaLivros = document.getElementById('listaLivros');
    const usuarioEmail = localStorage.getItem('usuarioEmail');
    console.log('Usuário logado (email):', usuarioEmail);
    console.log('Exibindo livros para todos os usuários, logados ou não');

    listaLivros.innerHTML = livros.map(livro => `
      <div class="col">
        <div class="card bg-dark text-white h-100">
          <img src="${livro.imagem || '/placeholder.jpg'}" class="card-img-top" alt="${livro.titulo}" style="height: 250px; object-fit: cover;">
          <div class="card-body">
            <h5 class="card-title">${livro.titulo}</h5>
            <p class="card-text"><strong>Autor:</strong> ${livro.autor}</p>
            <p class="card-text"><strong>Quantidade:</strong> ${livro.quantidade}</p>
            <p class="card-text"><strong>Status:</strong> ${livro.quantidade > 0 ? 'Disponível' : 'Alugado'}</p>
            ${livro.dataChegada ? `<p class="card-text"><strong>Data de Chegada:</strong> ${livro.dataChegada}</p>` : ''}
            <p class="card-text">${livro.descricao || 'Sem descrição'}</p>
            ${livro.quantidade > 0 && usuarioEmail ? `
              <button class="btn btn-neon mt-2 alugarBtn" data-titulo="${livro.titulo}">Alugar</button>
            ` : ''}
            ${livro.quantidade > 0 && !usuarioEmail ? `
              <a href="login.html" class="btn btn-warning mt-2">Faça login para alugar este livro</a>
            ` : ''}
            ${livro.quantidade === 0 ? `
              <p class="text-success mt-2">Livro alugado</p>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');

    if (livros.length === 0) {
      listaLivros.innerHTML = '<p class="text-center">Nenhum livro disponível no momento.</p>';
    }

    if (usuarioEmail) {
      document.querySelectorAll('.alugarBtn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const titulo = btn.getAttribute('data-titulo');
          console.log(`Tentando alugar livro: ${titulo} para usuário: ${usuarioEmail}`);
          try {
            const fullUrl = `http://localhost:3000/alugar`;
            console.log(`Enviando requisição POST para: ${fullUrl}`);
            console.log('Corpo da requisição:', { titulo, usuarioEmail });
            const response = await fetch(fullUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({ titulo, usuarioEmail })
            });
            console.log('Resposta do alugar recebida:', response);
            if (!response.ok) {
              const errorText = await response.text();
              console.error('Erro na resposta do servidor:', errorText);
              throw new Error(`Não foi possível alugar o livro. Detalhes: ${errorText}`);
            }
            const result = await response.json();
            console.log('Resultado do aluguel:', result);
            alert(result.message); 
            await carregarLivros(); 
          } catch (error) {
            console.error('Erro ao alugar livro:', error);
            alert(`Erro ao alugar: ${error.message}. Verifique se o servidor está rodando e tente novamente.`);
          }
        });
      });
    } else {
      console.log('Nenhum usuário logado, botões de alugar não serão ativados.');
    }
  } catch (error) {
    console.error('Erro ao carregar o catálogo:', error);
    document.getElementById('listaLivros').innerHTML = '<p class="text-center">Erro ao carregar o catálogo. Tente novamente mais tarde.</p>';
  }
}

window.carregarLivros = carregarLivros;