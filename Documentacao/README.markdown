# Biblioteca Geek

Bem-vindo ao **Biblioteca Geek**, uma aplicação web para gerenciamento de livros, aluguel e interação entre usuários e administradores. Este projeto foi desenvolvido como uma solução para leitores e administradores de bibliotecas, com foco em gêneros como ficção científica, fantasia e quadrinhos.

## Descrição
A Biblioteca Geek é uma aplicação web que permite:
- **Usuários**: Fazer login ou cadastro, consultar um catálogo de livros, alugar livros disponíveis e interagir com um bot ou administradores via chat.
- **Administradores**: Gerenciar o acervo de livros (adicionar, editar, deletar, ajustar quantidades), gerenciar usuários e administradores, visualizar estatísticas e responder a mensagens de usuários via chat.

O projeto é dividido em front-end e back-end, com comunicação via API REST (Fetch) e WebSocket para o chat em tempo real.

## Como Funciona
### Para Usuários
1. **Login/Cadastro**: Acesse `index.html` ou `catalogo.html`, faça login ou cadastre-se. O e-mail do usuário é salvo no `localStorage` como `usuarioEmail`.
2. **Catálogo e Aluguel**:
   - Em `catalogo.html`, visualize a lista de livros.
   - Após login, o botão "Alugar" aparece para livros disponíveis (`quantidade > 0`).
   - Clique em "Alugar" para alugar um livro; o servidor atualiza a quantidade e o status muda para "Alugado".
3. **Chat**:
   - Acesse `chat.html` para interagir com o bot (5 mensagens automáticas) e depois ser conectado a um administrador via WebSocket.
   - Requer login para iniciar o chat.

### Para Administradores
1. **Login**: Acesse `admin.html`, faça login com credenciais de administrador (salvas em `admins.json`).
2. **Gerenciamento**:
   - **Livros**: Adicione, edite, delete livros, ajuste quantidades e defina datas de chegada.
   - **Usuários e Administradores**: Liste, edite e delete usuários e administradores.
   - **Estatísticas**: Visualize dados sobre livros, aluguéis e usuários, com gráficos.
3. **Chat**: Responda a mensagens de usuários em tempo real.

### Back-end
- O servidor (`server.js`) gerencia:
  - Endpoints REST: `/livros`, `/alugar`, `/usuarios`, `/admins`, `/busca`.
  - Armazenamento em arquivos JSON (`livros.json`, `usuarios.json`, `admins.json`).
  - WebSocket para chat, com um bot que responde até 5 mensagens antes de conectar ao administrador.
  - Upload de imagens para livros (salvas em `/public/uploads`).

## Tecnologias Utilizadas
- **Front-end**:
  - HTML5, CSS3 (Bootstrap 5.3 para estilização)
  - JavaScript (ES6+)
  - Fetch API para requisições
  - WebSocket para chat
  - LocalStorage para estado de login
  - Chart.js para gráficos (em `admin.html`)
- **Back-end**:
  - Node.js, Express
  - WebSocket (`ws`)
  - Multer para upload de imagens
- **Dependências**:
  ```
  "express": "^4.17.1",
  "ws": "^8.5.0",
  "multer": "^1.4.5"
  ```

## Pré-requisitos
- Node.js (versão 18 ou superior) e npm
- Navegador moderno (Chrome, Firefox, etc.)
- Arquivos JSON (`livros.json`, `usuarios.json`, `admins.json`) criados na raiz do projeto (podem ser vazios inicialmente)

## Instalação
1. Clone o repositório ou copie os arquivos para um diretório local:
   ```
   git clone <url-do-repositorio>
   cd biblioteca-geek
   ```
2. Instale as dependências do back-end:
   ```
   npm install express ws multer
   ```
3. Verifique a estrutura do projeto:
   ```
   /
   ├── server.js
   ├── livros.json
   ├── usuarios.json
   ├── admins.json
   ├── /public
   │   ├── index.html
   │   ├── catalogo.html
   │   ├── admin.html
   │   ├── chat.html
   │   ├── /scripts
   │   │   ├── busca.js
   │   │   ├── catalogo.js
   │   │   ├── chat.js
   │   │   ├── admin.js
   │   ├── /estilo.css
   │   └── /uploads
   ```

## Como Executar
1. Inicie o servidor back-end:
   ```
   node server.js
   ```
   O servidor estará rodando em `http://localhost:3000`.
2. Acesse as páginas no navegador:
   - Página inicial (busca): `http://localhost:3000/index.html`
   - Catálogo (aluguel): `http://localhost:3000/catalogo.html`
   - Administração: `http://localhost:3000/admin.html`
   - Chat: `http://localhost:3000/chat.html`

## Estrutura do Projeto
### Raiz
- `server.js`: Servidor back-end (Express + WebSocket).
- `livros.json`: Armazena dados dos livros.
- `usuarios.json`: Armazena dados dos usuários.
- `admins.json`: Armazena dados dos administradores.

### Front-end (`/public`)
- `index.html`: Página inicial com busca de livros e modal de login/cadastro.
- `catalogo.html`: Catálogo de livros com opção de aluguel.
- `admin.html`: Interface de administração.
- `chat.html`: Interface de chat para usuários.
- `/scripts`:
  - `busca.js`: Lógica de busca e exibição inicial de livros.
  - `catalogo.js`: Lógica do catálogo e aluguel.
  - `admin.js`: Lógica da administração.
  - `chat.js`: Lógica do chat com WebSocket.
- `/estilo.css`: Estilos personalizados.
- `/uploads`: Armazenamento de imagens dos livros.

## Políticas
### Licença
Este projeto está licenciado sob a **Licença MIT**. Você pode usar, modificar e distribuir o código, desde que inclua a licença original e os avisos de direitos autorais. Consulte o arquivo `LICENSE` (se presente) para detalhes completos.

### Políticas de Uso
- **Uso Pessoal e Educacional**: A aplicação pode ser usada para fins pessoais ou educacionais sem restrições.
- **Uso Comercial**: Para uso comercial, entre em contato com o autor (adicione seu contato aqui) para autorização.
- **Dados Sensíveis**: Não armazene dados sensíveis reais (ex.: e-mails verdadeiros, senhas) nos arquivos JSON em produção, pois não há criptografia implementada.

### Contribuições
Contribuições são bem-vindas! Siga estas etapas:
1. Faça um fork do repositório.
2. Crie uma branch para sua alteração:
   ```
   git checkout -b feature/nova-funcionalidade
   ```
3. Commit suas mudanças:
   ```
   git commit -m "Descrição da mudança"
   ```
4. Envie para o repositório remoto:
   ```
   git push origin feature/nova-funcionalidade
   ```
5. Abra um pull request com uma descrição clara das mudanças.

**Diretrizes para Contribuições**:
- Mantenha o código limpo e documentado.
- Adicione testes para novas funcionalidades, se possível.
- Respeite as convenções de código existentes (ex.: uso de `async/await`, logs para depuração).

### Política de Segurança
- **Relatórios de Bugs**: Envie bugs via issues no repositório (se aplicável) ou entre em contato diretamente.
- **Segurança**: O projeto inclui sanitização básica de entradas no back-end para prevenir XSS. Para uso em produção, adicione autenticação mais robusta e criptografia de dados sensíveis.

## Depuração e Solução de Problemas
- **Logs**: Ative logs no console do navegador (F12) e no terminal do servidor para depuração.
- **Problemas Comuns**:
  - **Botão "Alugar" não aparece**: Verifique se `usuarioEmail` está no `localStorage` após login.
  - **Chat não conecta**: Confirme que o WebSocket (`ws://localhost:3000`) está ativo e o servidor está rodando.
  - **Erros de CORS**: Certifique-se de que o front-end e back-end estão no mesmo domínio (`localhost:3000`).

## Contato
Para dúvidas, sugestões ou relatórios de bugs, entre em contato via [seu e-mail ou link] (substitua conforme necessário).

## Status
Última atualização: 14 de maio de 2025, 23:32 CAT. Projeto em desenvolvimento ativo, com melhorias planejadas (ex.: testes automatizados, autenticação mais segura).