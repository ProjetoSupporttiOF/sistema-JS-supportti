const express = require('express');
const sqlite3 = require('sqlite3');
const path = require('path');

const app = express();
const port = 3000;
const db = new sqlite3.Database('estoque.db');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'adicionar.html'));
});

app.get('/categorias', (req, res) => {
    consultarInformacoesCategoria((err) => {
        if (err) {
            res.status(500).json({ error: 'Erro ao consultar informações de categoria' });
            return;
        }
        res.json(categorias);
    });
});

function consultarInformacoesCategoria(callback) {
    const sql = 'SELECT * FROM categorias';
    db.all(sql, (err, rows) => {
        if (err) {
            console.error('Erro ao consultar informações de categoria:', err.message);
            return callback(err);
        }
        categorias = rows.map(row => row.nome);
        callback(null);
    });
}


// Rota para obter os dados da tabela sqlite_sequence, excluindo tabelas específicas
app.get('/sqlite_sequence', (req, res) => {
    const excludedTables = ['categorias', 'tabelas', 'usuarios', 'sqlite_sequence', 'notificacoes'];
    const query = "SELECT * FROM sqlite_sequence WHERE name NOT IN (" + excludedTables.map(t => "'" + t + "'").join(",") + ")";
    // Consulta os dados da tabela sqlite_sequence, excluindo tabelas específicas
    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows); // Retorna os dados como JSON
    });
})

// Endpoint para buscar os dados das tabelas desejadas
app.get('/dadosItens', (req, res) => {
    // Consultar o banco de dados para obter uma lista de tabelas
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('categorias', 'tabelas', 'usuarios', 'sqlite_sequence', 'notificacoes')", (err, rows) => {
        if (err) {
            console.error('Erro ao buscar tabelas:', err.message);
            return res.status(500).json({ error: 'Erro ao buscar tabelas' });
        }

        // Extrair os nomes das tabelas da resposta do banco de dados
        const tabelasDesejadas = rows.map(row => row.name);

        // Se não houver nenhuma tabela disponível, retornar um erro
        if (tabelasDesejadas.length === 0) {
            console.error('Nenhuma tabela disponível.');
            return res.status(400).json({ error: 'Nenhuma tabela disponível' });
        }

        // Construir a consulta para obter os dados das tabelas desejadas
        const query = `SELECT categoria, codigo_de_barras, marca, modelo FROM ${tabelasDesejadas.join(' UNION SELECT categoria, codigo_de_barras, marca, modelo FROM ')}`;
        
        // Executar a consulta no banco de dados
        db.all(query, (err, rows) => {
            if (err) {
                console.error('Erro ao buscar dados dos itens:', err.message);
                return res.status(500).json({ error: 'Erro ao buscar dados dos itens' });
            }
            res.json(rows);
        });
    });
});



app.get('/campos/:categoria', (req, res) => {
    const categoria = req.params.categoria;
    consultarEstruturaTabela(categoria, (err, campos) => {
        if (err) {
            res.status(500).json({ error: `Erro ao consultar campos da categoria ${categoria}` });
            return;
        }
        res.json(campos);
    });
});

// Função para inserir uma nova notificação no banco de dados
function inserirNotificacao(mensagem) {
    const sql = `INSERT INTO notificacoes (mensagem, lida) VALUES (?, 0)`;
    db.run(sql, [mensagem], function(err) {
        if (err) {
            console.error('Erro ao inserir notificação:', err.message);
        } else {
            console.log('Notificação inserida com sucesso.');
        }
    });
}

app.post('/adicionarItem', (req, res) => {
    const categoria = req.body.categoria;
    const dados = req.body;

    console.log('Dados recebidos:', dados);

    if (!categoria) {
        console.error('Categoria não selecionada.');
        return res.status(400).json({ error: 'Categoria não selecionada' });
    }

    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [categoria], (err, row) => {
        if (err) {
            console.error('Erro ao verificar se a tabela existe:', err.message);
            return res.status(500).json({ error: 'Erro ao adicionar item' });
        }
        if (!row) {
            console.error('Tabela não encontrada:', categoria);
            return res.status(400).json({ error: 'Tabela não encontrada' });
        }

        const placeholders = Object.keys(dados).map(() => '?').join(', ');
        const campos = Object.keys(dados).join(', ');
        const valores = Object.values(dados);
        const sql = `INSERT INTO "${categoria}" (${campos}) VALUES (${placeholders})`;

        console.log('Consulta SQL:', sql);

        db.run(sql, valores, function(err) {
            if (err) {
                console.error('Erro ao inserir item:', err.message);
                return res.status(500).json({ error: 'Erro ao adicionar item' });
            }
            // Após adicionar o item com sucesso, inserir uma notificação
            inserirNotificacao(`Novo item adicionado à categoria ${categoria}`);

            res.json({ id: this.lastID });
        });
    });
});



function consultarInformacoesCategoria(callback) {
    const sql = 'SELECT * FROM categorias';
    db.all(sql, (err, rows) => {
        if (err) {
            console.error('Erro ao consultar informações de categoria:', err.message);
            return callback(err);
        }
        categorias = rows.map(row => row.nome);
        callback(null);
    });
}

function consultarEstruturaTabela(categoria, callback) {
    const sql = `PRAGMA table_info(${categoria})`;
    db.all(sql, (err, rows) => {
        if (err) {
            console.error(`Erro ao consultar estrutura da tabela ${categoria}:`, err.message);
            return callback(err);
        }
        const campos = rows.map(row => row.name);
        callback(null, campos);
    });
}

app.get('/dadosTabela', (req, res) => {
    const sql = `
        SELECT * FROM sqlite_master WHERE type='table'
    `;

    db.all(sql, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar informações das tabelas:', err.message);
            return res.status(500).json({ error: 'Erro ao buscar informações das tabelas' });
        }
        
        // Filtrar apenas os nomes das tabelas e excluir as tabelas específicas
        const tabelasExcluidas = ['categorias', 'tabelas', 'usuarios', 'sqlite_sequence', 'notificacoes'];
        const tabelas = rows.map(row => row.name).filter(name => !tabelasExcluidas.includes(name));

        // Executar consultas para cada tabela separadamente
        const consultasSQL = tabelas.map(tabela => {
            return new Promise((resolve, reject) => {
                db.all(`SELECT * FROM ${tabela}`, (err, resultado) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ tabela, dados: resultado });
                    }
                });
            });
        });

        // Agregar os resultados por tabela
        Promise.all(consultasSQL)
            .then(resultados => {
                const dadosPorTabela = {};
                resultados.forEach(({ tabela, dados }) => {
                    dadosPorTabela[tabela] = dados;
                });
                res.json(dadosPorTabela);
            })
            .catch(error => {
                console.error('Erro ao buscar dados das tabelas:', error.message);
                res.status(500).json({ error: 'Erro ao buscar dados das tabelas' });
            });
    });
});


app.delete('/excluirItem/:tabela/:id', (req, res) => {
    const tabela = req.params.tabela;
    const id = req.params.id;

    const sql = `DELETE FROM ${tabela} WHERE id = ?`;

    db.run(sql, [id], function(err) {
        if (err) {
            console.error('Erro ao excluir item:', err.message);
            return res.status(500).json({ error: 'Erro ao excluir item' });
        }
        console.log(`Item excluído da tabela ${tabela} com ID ${id}`);
        res.json({ success: true });
    });
});


// Endpoint para verificar se há novas notificações
app.get('/verificarNotificacoes', (req, res) => {
    // Consulte o banco de dados para obter o número de novas notificações
    // e as próprias notificações não lidas
    db.get('SELECT COUNT(*) AS total FROM notificacoes WHERE lida = 0', (err, row) => {
        if (err) {
            console.error('Erro ao verificar notificações:', err.message);
            return res.status(500).json({ error: 'Erro ao verificar notificações' });
        }

        const novasNotificacoes = row.total;

        // Consulte o banco de dados para obter as notificações não lidas
        db.all('SELECT * FROM notificacoes WHERE lida = 0', (err, rows) => {
            if (err) {
                console.error('Erro ao obter notificações:', err.message);
                return res.status(500).json({ error: 'Erro ao obter notificações' });
            }

            const notificacoes = rows;

            // Retorne o número de novas notificações e as notificações não lidas
            res.json({ novasNotificacoes, notificacoes });
        });
    });
});


app.post('/marcarNotificacoesComoLidas', (req, res) => {
    // Atualize o banco de dados para marcar as notificações como lidas
    db.run('UPDATE notificacoes SET lida = 1 WHERE lida = 0', (err) => {
        if (err) {
            console.error('Erro ao marcar notificações como lidas:', err.message);
            return res.status(500).json({ error: 'Erro ao marcar notificações como lidas' });
        }

        // Envie uma resposta de sucesso
        res.json({ success: true });
    });
});







app.get('/pesquisarItens', (req, res) => {
    const categoria = req.query.categoria; // Obter o parâmetro 'categoria' da consulta
    const codigoBarras = req.query.codigoBarras; // Obter o parâmetro 'codigoBarras' da consulta

    // Consultar o banco de dados para obter uma lista de todas as tabelas, excluindo algumas
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('categorias', 'tabelas', 'usuarios', 'sqlite_sequence', 'notificacoes')", (err, rows) => {
        if (err) {
            console.error('Erro ao buscar tabelas:', err.message);
            return res.status(500).json({ error: 'Erro ao buscar tabelas' });
        }

        // Extrair os nomes das tabelas da resposta do banco de dados
        const tabelas = rows.map(row => row.name);

        // Se não houver nenhuma tabela disponível, retornar um erro
        if (tabelas.length === 0) {
            console.error('Nenhuma tabela disponível.');
            return res.status(400).json({ error: 'Nenhuma tabela disponível' });
        }

        // Construir a consulta SQL para buscar itens em todas as tabelas
        let query = '';

        // Construir a cláusula WHERE para aplicar o filtro de categoria e/ou código de barras
        let whereClause = '';
        if (categoria && codigoBarras) {
            whereClause = `WHERE categoria LIKE '%${categoria}%' OR codigo_de_barras LIKE '%${codigoBarras}%'`;
        } else if (categoria) {
            whereClause = `WHERE categoria LIKE '%${categoria}%'`;
        } else if (codigoBarras) {
            whereClause = `WHERE codigo_de_barras LIKE '%${codigoBarras}%'`;
        }

        // Construir a consulta SQL dinamicamente para cada tabela, exceto as especificadas
        const queries = tabelas.map(tabela => `SELECT categoria, codigo_de_barras, marca, modelo FROM ${tabela} ${whereClause}`);

        // Unir as consultas de todas as tabelas usando UNION ALL
        query = queries.join(' UNION ALL ');

        // Executar a consulta no banco de dados
        db.all(query, (err, rows) => {
            if (err) {
                console.error('Erro ao buscar itens:', err.message);
                return res.status(500).json({ error: 'Erro ao buscar itens' });
            }
            res.json(rows);
        });
    });
});







consultarInformacoesCategoria((err) => {
    if (err) {
        console.error('Erro ao consultar informações de categoria:', err.message);
        return;
    }
    app.listen(port, () => {
        console.log(`Servidor está ouvindo em http://localhost:${port}`);
    });
});
