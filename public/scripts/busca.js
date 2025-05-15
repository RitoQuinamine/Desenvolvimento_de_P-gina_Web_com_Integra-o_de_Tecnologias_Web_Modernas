document.getElementById('buscaBtn').addEventListener('click', async () => {
  const termo = document.getElementById('buscaInput').value.trim();
  const resultados = document.getElementById('resultados');

  if (!termo) {
    resultados.innerHTML = '<p class="text-danger">Digite um termo para buscar.</p>';
    return;
  }

  try {
    const response = await fetch(`/busca?termo=${encodeURIComponent(termo)}`);
    if (!response.ok) throw new Error('Erro ao buscar livros');
    const livros = await response.json();

    if (livros.length === 0) {
      resultados.innerHTML = '<p class="text-warning">Nenhum livro encontrado.</p>';
      return;
    }

    resultados.innerHTML = livros.map(livro => `
      <div class="mb-2">
        <strong>${livro.titulo}</strong> - ${livro.autor}
      </div>
    `).join('');
  } catch (error) {
    console.error('Erro na busca:', error);
    resultados.innerHTML = '<p class="text-danger">Erro ao buscar livros. Tente novamente.</p>';
  }
});