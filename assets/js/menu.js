// Função para carregar o conteúdo da página
function loadContent(page) {
    fetch('/assets/pages/' + page + '.html')
     .then(response => response.text())
     .then(html => {
            // Define o conteúdo HTML retornado pela chamada fetch no elemento principal
            document.getElementById('main-content').innerHTML = html;

            // Executa os scripts presentes no conteúdo HTML
            executeScriptsInHTML(html);

            // Atualiza o menu de navegação
            updateNavigationMenu(page);

            // Armazena a página atual no armazenamento local
            localStorage.setItem('currentPage', page);

            // Chama a função para inicializar o dropdown após carregar o conteúdo da página
            inicializarDropdown();
        })
     .catch(error => console.warn('Algo deu errado.', error));
}

function executeScriptsInHTML(html) {
    // Extrai todos os scripts do conteúdo HTML
    const scripts = document.querySelectorAll('#main-content script');
    scripts.forEach(script => {
        const scriptContent = script.innerHTML.trim();
        if (scriptContent!== '') {
            // Cria um novo elemento script
            const newScript = document.createElement('script');
            // Envolve o conteúdo do script em uma IIFE
            newScript.text = `(function() { ${scriptContent} })();`;
            // Adiciona o novo script ao final do body para ser executado
            document.body.appendChild(newScript);
        }
    });
}


// Função para atualizar o menu de navegação
function updateNavigationMenu(page) {
    // Remove a classe 'active' de todas as opções do menu
    document.querySelectorAll('.navegator').forEach(item => {
        item.classList.remove('active');
    });
    // Adiciona a classe 'active' apenas à opção correspondente à página atual
    document.querySelector('.navegator-' + page).classList.add('active');
}

// Event listeners para navegação
document.querySelector('.navegator-adicionar').addEventListener('click', () => loadContent('adicionar'));
document.querySelector('.navegator-pesquisar').addEventListener('click', () => loadContent('pesquisar'));
document.querySelector('.navegator-baixa').addEventListener('click', () => loadContent('baixa'));
document.querySelector('.navegator-estoque').addEventListener('click', () => loadContent('estoque'));
document.querySelector('.navegator-home').addEventListener('click', () => loadContent('home'));

// Função para inicializar o dropdown
function inicializarDropdown() {
    // Inicializa o dropdown
    $(document).ready(function() {
        $('.dropdown-toggle').dropdown();
    });
}

// Verifica se há um estado de menu no armazenamento local e aplica-o
var isMenuExpanded = localStorage.getItem('isMenuExpanded');
var sidebar = document.getElementById('sidebar');
var mainContent = document.getElementById('main-content');
if (isMenuExpanded === 'true') {
    sidebar.classList.add('expanded');
    mainContent.classList.add('expanded');
}

// Verifica se há uma página carregada no armazenamento local e carrega-a
var currentPage = localStorage.getItem('currentPage');
if (currentPage) {
    loadContent(currentPage);
}

// Adiciona o evento de clique ao botão do menu
document.querySelector('.buttonmenu').addEventListener('click', function() {
    // Alterna o estado do menu
    sidebar.classList.toggle('expanded');
    mainContent.classList.toggle('expanded');
    
    // Armazena o estado do menu no armazenamento local
    var isMenuExpanded = sidebar.classList.contains('expanded');
    localStorage.setItem('isMenuExpanded', isMenuExpanded);
});

// Event listener para evitar a rolagem padrão
window.addEventListener('scroll', function(event) {
    event.preventDefault();
}, { passive: false });
