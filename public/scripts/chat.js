window.addEventListener('load', () => {
  const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
  if (!usuarioLogado) {
    const perfilModal = new bootstrap.Modal(document.getElementById('perfilModal'));
    perfilModal.show();
  } else {
    iniciarChat();
  }
});

function iniciarChat() {
  const ws = new WebSocket('ws://localhost:3000');

  ws.onopen = () => {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    const nome = usuarioLogado ? usuarioLogado.nome : null;
    ws.send(JSON.stringify({ tipo: 'conectar', nome }));
  };

  ws.onmessage = (event) => {
    const mensagem = JSON.parse(event.data);
    const mensagensDiv = document.getElementById('mensagens');

    if (mensagem.tipo === 'resposta') {
      mensagensDiv.innerHTML += `
        <div class="mb-2">
          <strong>${mensagem.usuario}:</strong> ${mensagem.texto}
        </div>
      `;
      mensagensDiv.scrollTop = mensagensDiv.scrollHeight;
    }
  };

  document.getElementById('formChat').addEventListener('submit', (e) => {
    e.preventDefault();
    const mensagemInput = document.getElementById('mensagemInput');
    const texto = mensagemInput.value.trim();

    if (texto) {
      ws.send(JSON.stringify({ tipo: 'mensagem', texto }));
      mensagemInput.value = '';
    }
  });
}