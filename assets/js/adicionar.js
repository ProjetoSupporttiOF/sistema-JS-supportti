

document.addEventListener("DOMContentLoaded", function () {
    const dropdown = document.getElementById('categoriasDropdown');
    const selectedCategory = document.getElementById('selectedCategory');
    const tabelaCategoria = document.getElementById('tabelaCategoria');
    const formCategoria = document.getElementById('formCategoria');
    const camposCategoria = document.getElementById('camposCategoria');

    // Função para ocultar o campo categoria assim que a página for carregada
    function ocultarCampoCategoria() {
        const categoriaInput = document.getElementById('categoria');
        if (!categoriaInput) {
            console.error('Input "categoria" não encontrado.');
        } else {
            categoriaInput.style.display = 'none';
        }
    }

    // Ocultar o campo categoria assim que a página for carregada
    ocultarCampoCategoria();

    // Função para atualizar o texto da categoria selecionada
    function atualizarCategoriaSelecionada(categoria) {
        selectedCategory.textContent = categoria;
        mostrarTabelaCategoria(false); // Oculta a tabela de categoria

        // Definir a categoria no campo oculto do formulário
        const categoriaInput = document.getElementById('categoria');
        if (categoriaInput) {
            categoriaInput.value = categoria;
        } else {
            console.error('Input "categoria" não encontrado.');
        }

        // Faz uma solicitação AJAX para obter os campos da categoria
        fetch(`/campos/${categoria}`)
            .then(response => response.json())
            .then(data => preencherCampos(data))
            .catch(error => console.error('Erro ao obter campos da categoria:', error));
    }

    // Função para preencher os campos do formulário com base nos campos da tabela
    function preencherCampos(campos) {
        camposCategoria.innerHTML = '';
        campos.forEach(campo => {
            // Se o campo não for 'id', ele será incluído no formulário
            if (campo !== 'id') {
                const formGroup = document.createElement('div');
                formGroup.classList.add('form-group');
                formGroup.dataset.nome = campo;

                const label = document.createElement('label');
                label.classList.add('form-label');
                label.textContent = campo + ':';

                const input = document.createElement('input');
                input.setAttribute('type', 'text');
                input.classList.add('form-control');
                input.setAttribute('name', campo);

                formGroup.appendChild(label);
                formGroup.appendChild(input);

                camposCategoria.appendChild(formGroup);
            }
        });
        mostrarTabelaCategoria(true);
    }

    // Função para mostrar ou ocultar a tabela de categoria
    function mostrarTabelaCategoria(mostrar) {
        tabelaCategoria.style.display = mostrar ? 'block' : 'none';
    }

    // Use fetch para fazer uma solicitação AJAX para /categorias no seu servidor
    fetch('/categorias')
        .then(response => response.json()) // Converte a resposta para JSON
        .then(data => {
            // Preenche o dropdown com as categorias obtidas do servidor
            data.forEach(categoria => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.classList.add('dropdown-item'); // Adiciona a classe do Bootstrap
                link.textContent = categoria;
                link.href = '#'; // Adicione o link href desejado aqui

                // Adiciona um ouvinte de evento de clique para cada item do menu suspenso
                link.addEventListener('click', function () {
                    atualizarCategoriaSelecionada(categoria);
                });

                listItem.appendChild(link);
                dropdown.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Erro ao obter categorias:', error);
        });

    // Ouvinte de evento para o botão fora do formulário
    const adicionarItemBtn = document.querySelector('.adicionarItemBtn');
    adicionarItemBtn.addEventListener('click', function (event) {
        event.preventDefault(); // Previne o comportamento padrão do botão

        // Obtém o valor da categoria selecionada
        const categoriaSelecionada = document.getElementById('categoria').value;

        // Verifica se a categoria foi selecionada
        if (!categoriaSelecionada) {
            console.error('Categoria não selecionada.');
            return;
        }

        // Cria um objeto para armazenar os dados do formulário
        const formData = {};

        // Preenche o objeto com os dados do formulário
        const inputs = formCategoria.querySelectorAll('input');
        inputs.forEach(input => {
            formData[input.name] = input.value;
        });

        // Limpar os campos do formulário, exceto o campo de categoria
        inputs.forEach(input => {
            if (input.name !== 'categoria') {
                input.value = '';
            }
        });

        // Adiciona o valor da categoria ao objeto
        formData['categoria'] = categoriaSelecionada;

        // Envia os dados do formulário para o servidor
        fetch('/adicionarItem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                console.log('ID do item adicionado:', data.id);

                // Exibir mensagem de sucesso na div com ID "success_message"
                const successMessageDiv = document.getElementById('success_message');
                successMessageDiv.textContent = 'Item adicionado com sucesso!';
                successMessageDiv.style.display = 'block';

                // Remover a mensagem após 3 segundos
                setTimeout(() => {
                    successMessageDiv.style.display = 'none';
                }, 3000);
            })
            .catch(error => console.error('Erro ao adicionar item:', error));
    });

});


document.addEventListener("DOMContentLoaded", function () {
    const dadosDiv = document.querySelector('.dados');
    let currentItemToDeleteId; // Variável para armazenar o ID do item a ser excluído
    let confirmationModal; // Variável para armazenar a instância do modal

    function exibirDadosPorTabela(dadosPorTabela) {
        console.log('Dados recebidos:', dadosPorTabela);

        if (dadosPorTabela && typeof dadosPorTabela === 'object') {
            Object.keys(dadosPorTabela).forEach(tabela => {
                const dadosDaTabela = dadosPorTabela[tabela];

                if (Array.isArray(dadosDaTabela) && dadosDaTabela.length > 0) {
                    const tabelaDiv = document.createElement('div');
                    tabelaDiv.classList.add('table-responsive', 'tabela-altura-fixada'); // Adicionada a classe para altura fixa

                    const heading = document.createElement('h2');
                    heading.textContent = tabela;
                    tabelaDiv.appendChild(heading);

                    const table = document.createElement('table');
                    table.classList.add('table', 'table-bordered', 'table-striped'); // Adicionada a classe para linhas alternadas

                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');
                    Object.keys(dadosDaTabela[0]).forEach(key => {
                        if (key !== 'id') {
                            const th = document.createElement('th');
                            th.textContent = key;
                            th.classList.add('text-muted'); // Cor fraca para o texto do cabeçalho
                            headerRow.appendChild(th);
                        }
                    });
                    // Adicionando a coluna "alterações" no cabeçalho da tabela
                    const thAlteracoes = document.createElement('th');
                    thAlteracoes.textContent = "Alterações";
                    thAlteracoes.classList.add('text-muted');
                    headerRow.appendChild(thAlteracoes);

                    thead.appendChild(headerRow);
                    table.appendChild(thead);

                    const tbody = document.createElement('tbody');

                    const itemsPerPage = 5;
                    let currentPage = 1;
                    const numPages = Math.ceil(dadosDaTabela.length / itemsPerPage);

                    function showPage(page) {
                        tbody.innerHTML = '';
                        const start = (page - 1) * itemsPerPage;
                        const end = start + itemsPerPage;
                        const pageItems = dadosDaTabela.slice(start, end);
                        pageItems.forEach(item => {
                            const row = document.createElement('tr');
                            Object.keys(item).forEach(key => {
                                if (key !== 'id') {
                                    const td = document.createElement('td');
                                    td.textContent = (item[key] !== null && item[key] !== undefined) ? item[key] : '';
                                    td.classList.add('text-muted'); // Cor fraca para o texto da célula
                                    row.appendChild(td);
                                }
                            });
                            // Adicionando a célula para "alterações" em cada linha da tabela
                            const tdAlteracoes = document.createElement('td');

                            // Adicionando botões de editar e excluir
                            const btnEditar = document.createElement('button');
                            btnEditar.classList.add('btn', 'btn-primary', 'me-1');
                            btnEditar.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                            <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                        </svg>
                    `;
                            btnEditar.addEventListener('click', function () {
                                // Lógica para editar o item aqui
                            });
                            tdAlteracoes.appendChild(btnEditar);

                            const btnExcluir = document.createElement('button');
                            btnExcluir.classList.add('btn', 'btn-danger');
                            btnExcluir.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
                        </svg>
                    `;
                            btnExcluir.addEventListener('click', function () {
                                currentItemToDeleteId = item.id; // Atualiza o ID do item a ser excluído
                                const modal = document.createElement('div');
                                modal.classList.add('modal', 'fade');
                                modal.setAttribute('id', 'confirmationModal');
                                modal.setAttribute('data-bs-backdrop', 'static');
                                modal.setAttribute('data-bs-keyboard', 'false');
                                modal.setAttribute('tabindex', '-1');
                                modal.setAttribute('aria-labelledby', 'confirmationModalLabel');
                                modal.setAttribute('aria-hidden', 'true');

                                const modalDialog = document.createElement('div');
                                modalDialog.classList.add('modal-dialog', 'modal-dialog-centered');

                                const modalContent = document.createElement('div');
                                modalContent.classList.add('modal-content');

                                const modalHeader = document.createElement('div');
                                modalHeader.classList.add('modal-header');

                                const modalTitle = document.createElement('h1');
                                modalTitle.classList.add('modal-title', 'fs-5');
                                modalTitle.setAttribute('id', 'confirmationModalLabel');
                                modalTitle.textContent = 'Confirmação de Exclusão';

                                const modalCloseButton = document.createElement('button');
                                modalCloseButton.setAttribute('type', 'button');
                                modalCloseButton.classList.add('btn-close');
                                modalCloseButton.setAttribute('data-bs-dismiss', 'modal');
                                modalCloseButton.setAttribute('aria-label', 'Close');

                                modalHeader.appendChild(modalTitle);
                                modalHeader.appendChild(modalCloseButton);

                                const modalBody = document.createElement('div');
                                modalBody.classList.add('modal-body');
                                modalBody.textContent = 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.';

                                const modalFooter = document.createElement('div');
                                modalFooter.classList.add('modal-footer');

                                const closeButton = document.createElement('button');
                                closeButton.setAttribute('type', 'button');
                                closeButton.classList.add('btn', 'btn-secondary');
                                closeButton.setAttribute('data-bs-dismiss', 'modal');
                                closeButton.textContent = 'Cancelar';

                                const confirmButton = document.createElement('button');
                                confirmButton.setAttribute('type', 'button');
                                confirmButton.classList.add('btn', 'btn-danger');
                                confirmButton.textContent = 'Excluir';
                                confirmButton.addEventListener('click', function () {
                                    const itemId = currentItemToDeleteId; // Usa o ID do item atualmente selecionado
                                    const url = `/excluirItem/${tabela}/${itemId}`; // Substitua isso pelo URL correto da sua API

                                    fetch(url, {
                                        method: 'DELETE',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                    })
                                        .then(response => {
                                            if (response.ok) {
                                                // Remova a linha da tabela correspondente ao item excluído
                                                row.remove();
                                                console.log('Item excluído com sucesso!');
                                            } else {
                                                console.error('Erro ao excluir o item:', response.status);
                                            }
                                        })
                                        .catch(error => console.error('Erro ao excluir o item:', error))
                                        .finally(() => {
                                            // Fecha o modal após excluir o item
                                            confirmationModal.hide();
                                        });
                                });

                                modalFooter.appendChild(closeButton);
                                modalFooter.appendChild(confirmButton);

                                modalContent.appendChild(modalHeader);
                                modalContent.appendChild(modalBody);
                                modalContent.appendChild(modalFooter);

                                modalDialog.appendChild(modalContent);

                                modal.appendChild(modalDialog);

                                document.body.appendChild(modal);

                                confirmationModal = new bootstrap.Modal(modal, {});
                                confirmationModal.show();
                            });
                            tdAlteracoes.appendChild(btnExcluir);

                            row.appendChild(tdAlteracoes);
                            tbody.appendChild(row);
                        });
                    }

                    function createPaginationControls() {
                        const paginationDiv = document.createElement('div');
                        paginationDiv.classList.add('btn-toolbar', 'justify-content-start'); // Alterada a classe para 'justify-content-start'
                        paginationDiv.setAttribute('role', 'toolbar');
                        paginationDiv.setAttribute('aria-label', 'Toolbar with button groups');

                        const btnGroupDiv = document.createElement('div');
                        btnGroupDiv.classList.add('btn-group', 'me-2');
                        btnGroupDiv.setAttribute('role', 'group');
                        btnGroupDiv.setAttribute('aria-label', 'First group');

                        for (let i = 1; i <= numPages; i++) {
                            const pageButton = document.createElement('button');
                            pageButton.setAttribute('type', 'button');
                            pageButton.classList.add('btn', 'btn-primary');
                            pageButton.textContent = i;
                            pageButton.addEventListener('click', function () {
                                currentPage = i;
                                showPage(currentPage);
                            });
                            btnGroupDiv.appendChild(pageButton);
                        }

                        paginationDiv.appendChild(btnGroupDiv);
                        tabelaDiv.appendChild(paginationDiv);
                    }

                    showPage(currentPage);
                    table.appendChild(tbody);
                    tabelaDiv.appendChild(table);
                    dadosDiv.appendChild(tabelaDiv);

                    // Adicionando os controles de paginação abaixo da tabela
                    createPaginationControls();
                } else {
                    console.error('A tabela', tabela, 'não possui dados.');
                }
            });
        } else {
            console.error('Dados inválidos recebidos:', dadosPorTabela);
        }
    }

    fetch('/dadosTabela')
        .then(response => response.json())
        .then(data => {
            console.log('Dados recebidos:', data);
            exibirDadosPorTabela(data);
        })
        .catch(error => console.error('Erro ao obter dados das tabelas:', error));

    // Adicionando um evento de "hidden" no modal para limpar o ID do item a ser excluído
    document.getElementById('confirmationModal').addEventListener('hidden.bs.modal', function () {
        currentItemToDeleteId = null;
    });
});






