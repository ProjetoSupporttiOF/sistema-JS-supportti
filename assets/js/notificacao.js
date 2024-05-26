document.addEventListener('DOMContentLoaded', function () {
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl, {
            container: 'body',
            html: true,
            content: function () {
                return document.getElementById('popover-content').innerHTML;
            }
        })
    });

    function verificarNotificacoes() {
        fetch('/verificarNotificacoes')
            .then(response => response.json())
            .then(data => {
                const contador = document.getElementById('contador-notificacoes');
                contador.innerText = data.novasNotificacoes;

                const notificationBox = document.querySelector('.notification-box');
                if (notificationBox) {
                    notificationBox.innerHTML = '';
                    if (data.novasNotificacoes === 0) {
                        notificationBox.textContent = 'Você não possui nenhuma notificação!';
                    } else {
                        data.notificacoes.forEach(notificacao => {
                            const div = document.createElement('div');
                            div.classList.add('notification-box');
                            div.textContent = notificacao.mensagem;
                            notificationBox.appendChild(div);
                        });
                    }
                } else {
                    console.error('Elemento .notification-box não encontrado.');
                }
            })
            .catch(error => {
                console.error('Erro ao verificar notificações:', error);
            });
    }

    function marcarNotificacoesComoLidas() {
        fetch('/marcarNotificacoesComoLidas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        })
            .then(response => response.json())
            .then(data => {
                verificarNotificacoes(); // Atualize as notificações após marcar como lidas
            })
            .catch(error => {
                console.error('Erro ao marcar notificações como lidas:', error);
            });
    }

    setInterval(verificarNotificacoes, 10); // Verificar notificações a cada 10 segundos

    // Adicione um evento para detectar quando o popover é fechado
    document.getElementById('btnNotificacoes').addEventListener('hidden.bs.popover', function () {
        // Quando o popover é fechado, marque as notificações como lidas
        marcarNotificacoesComoLidas();
    });
});
