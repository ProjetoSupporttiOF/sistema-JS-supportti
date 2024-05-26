const express = require('express');
const sqlite3 = require('sqlite3');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();
const port = 3000;
const db = new sqlite3.Database('estoque.db');

// Configuração do Multer para definir onde os arquivos serão salvos e qual o nome do campo do formulário contendo a imagem
const upload = multer({ dest: 'uploads/' });

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'adicionar.html'));
});

app.get('/categorias', (req, res) => {
    consultarInformacoesCategoria((err) => {
        if (err) {
            res.status(500).json({
                error: 'Erro ao consultar informações de categoria'
            });
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
            res.status(500).json({
                error: err.message
            });
            return;
        }
        res.json(rows); // Retorna os dados como JSON
    });
})


app.get('/campos/:categoria', (req, res) => {
    const categoria = req.params.categoria;
    consultarEstruturaTabela(categoria, (err, campos) => {
        if (err) {
            res.status(500).json({
                error: `Erro ao consultar campos da categoria ${categoria}`
            });
            return;
        }
        res.json(campos);
    });
});

// Função para inserir uma nova notificação no banco de dados
function inserirNotificacao(mensagem) {
    const sql = `INSERT INTO notificacoes (mensagem, lida) VALUES (?, 0)`;
    db.run(sql, [mensagem], function (err) {
        if (err) {
            console.error('Erro ao inserir notificação:', err.message);
        } else {
            console.log('Notificação inserida com sucesso.');
        }
    });
}

// Rota para adicionar um item
app.post('/adicionarItem', upload.single('imagem'), (req, res) => {
    const categoria = req.body.categoria;
    const dados = req.body;

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

        const imagemPath = req.file ? req.file.path : null; // Verifica se há um arquivo enviado

        // Se houver um arquivo de imagem enviado, ler o arquivo
        if (imagemPath) {
            fs.readFile(imagemPath, (err, imagemData) => {
                if (err) {
                    console.error('Erro ao ler a imagem:', err);
                    return res.status(500).json({ error: 'Erro ao ler a imagem' });
                }
                // Adicionar a imagem aos dados
                dados.imagem = imagemData;

                // Continuar com a inserção no banco de dados
                inserirItemNoBanco(categoria, dados, res);
            });
        } else {
            // Se não houver imagem enviada, apenas continuar com a inserção no banco de dados
            inserirItemNoBanco(categoria, dados, res);
        }
    });
});

// Função para inserir um item no banco de dados
function inserirItemNoBanco(categoria, dados, res) {
    const placeholders = Object.keys(dados).map(() => '?').join(', ');
    const campos = Object.keys(dados).join(', ');
    const valores = Object.values(dados);
    const sql = `INSERT INTO "${categoria}" (${campos}) VALUES (${placeholders})`;

    console.log('Consulta SQL:', sql);

    db.run(sql, valores, function (err) {
        if (err) {
            console.error('Erro ao inserir item:', err.message);
            return res.status(500).json({ error: 'Erro ao adicionar item' });
        }
        // Após adicionar o item com sucesso, inserir uma notificação
        inserirNotificacao(`Novo item adicionado à categoria ${categoria}`);

        res.json({ id: this.lastID });
    });
}

// Função para inserir uma nova notificação no banco de dados
function inserirNotificacao(mensagem) {
    const sql = `INSERT INTO notificacoes (mensagem, lida) VALUES (?, 0)`;
    db.run(sql, [mensagem], function (err) {
        if (err) {
            console.error('Erro ao inserir notificação:', err.message);
        } else {
            console.log('Notificação inserida com sucesso.');
        }
    });
}

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
            return res.status(500).json({
                error: 'Erro ao buscar informações das tabelas'
            });
        }

        // Filtrar apenas os nomes das tabelas e excluir as tabelas específicas
        const tabelasExcluidas = ['categorias', 'tabelas', 'usuarios', 'sqlite_sequence', 'notificacoes', 'limites_cores'];
        const tabelas = rows.map(row => row.name).filter(name => !tabelasExcluidas.includes(name));

        // Executar consultas para cada tabela separadamente
        const consultasSQL = tabelas.map(tabela => {
            return new Promise((resolve, reject) => {
                db.all(`SELECT * FROM ${tabela}`, (err, resultado) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Verificar se a tabela tem uma coluna de imagem (BLOB)
                        const possuiImagem = resultado.some(row => Object.keys(row).some(key => row[key] instanceof Buffer));

                        if (possuiImagem) {
                            // Se a tabela contém imagens, converter as imagens em base64 para exibição
                            resultado.forEach(row => {
                                for (const [key, value] of Object.entries(row)) {
                                    if (value instanceof Buffer) {
                                        // Converter a imagem BLOB em uma string base64
                                        row[key] = value.toString('base64');
                                    }
                                }
                            });
                        }

                        resolve({
                            tabela,
                            dados: resultado
                        });
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
                res.status(500).json({
                    error: 'Erro ao buscar dados das tabelas'
                });
            });
    });
});



// Endpoint para buscar os dados das tabelas desejadas
// app.get('/dadosItens', (req, res) => {
//     // Consultar o banco de dados para obter uma lista de tabelas
//     db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", (err, rows) => {
//         if (err) {
//             console.error('Erro ao buscar tabelas:', err.message);
//             return res.status(500).json({ error: 'Erro ao buscar tabelas' });
//         }

//         // Extrair os nomes das tabelas da resposta do banco de dados
//         const tabelas = rows.map(row => row.name);

//         // Se não houver nenhuma tabela disponível, retornar um erro
//         if (tabelas.length === 0) {
//             console.error('Nenhuma tabela disponível.');
//             return res.status(400).json({ error: 'Nenhuma tabela disponível' });
//         }

//         // Construir a consulta para obter os dados de todas as tabelas
//         const query = tabelas.map(tabela => `SELECT categoria, codigo_de_barras, marca, modelo FROM ${tabela}`).join(' UNION ');

//         // Executar a consulta no banco de dados
//         db.all(query, (err, rows) => {
//             if (err) {
//                 console.error('Erro ao buscar dados dos itens:', err.message);
//                 return res.status(500).json({ error: 'Erro ao buscar dados dos itens' });
//             }
//             res.json(rows);
//         });
//     });
// });



app.get('/dadosRegistros', (req, res) => {
    const sql = `
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('categorias', 'tabelas', 'usuarios', 'sqlite_sequence', 'notificacoes','limites_cores')
    `;

    db.all(sql, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar informações das tabelas:', err.message);
            return res.status(500).json({
                error: 'Erro ao buscar informações das tabelas'
            });
        }

        const tabelas = rows.map(row => row.name);
        const consultaRegistros = tabelas.map(tabela => {
            return new Promise((resolve, reject) => {
                db.get(`SELECT COUNT(*) AS total FROM ${tabela}`, (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            tabela,
                            total: row.total
                        });
                    }
                });
            });
        });

        Promise.all(consultaRegistros)
            .then(resultados => {
                res.json(resultados);
            })
            .catch(error => {
                console.error('Erro ao buscar o número de registros das tabelas:', error.message);
                res.status(500).json({
                    error: 'Erro ao buscar o número de registros das tabelas'
                });
            });
    });
});

app.post('/salvarLimitesCores', (req, res) => {
    const {
        totalLimit,
        yellowLimit,
        greenLimit
    } = req.body;

    // Query para inserir ou atualizar os limites de cores na tabela limites_cores
    const query = `
        INSERT OR REPLACE INTO limites_cores (id, vermelho, amarelo, verde)
        VALUES (1, ?, ?, ?)
    `;

    db.run(query, [totalLimit, yellowLimit, greenLimit], function (err) {
        if (err) {
            console.error('Erro ao salvar os limites de cores:', err);
            res.status(500).send('Erro ao salvar os limites de cores.');
        } else {
            console.log('Limites de cores salvos com sucesso.');
            res.status(200).send('Limites de cores salvos com sucesso.');
        }
    });
});


app.get('/obterLimitesCores', (req, res) => {
    const query = `
        SELECT * FROM limites_cores WHERE id = 1
    `;
    db.get(query, (err, row) => {
        if (err) {
            console.error('Erro ao obter os limites de cores:', err.message);
            res.status(500).json({
                error: 'Erro ao obter os limites de cores'
            });
        } else {
            res.json(row);
        }
    });
});


app.delete('/excluirItem/:tabela/:id', (req, res) => {
    const tabela = req.params.tabela;
    const id = req.params.id;

    const sqlDelete = `DELETE FROM ${tabela} WHERE id =?`;
    const sqlCount = `SELECT COUNT(*) AS count FROM ${tabela}`;
    const sqlUpdateSequence = `UPDATE sqlite_sequence SET seq =? WHERE name =?`;

    db.serialize(() => {
        db.run(sqlDelete, [id], function (err) {
            if (err) {
                console.error('Erro ao excluir item:', err.message);
                return res.status(500).json({
                    error: 'Erro ao excluir item'
                });
            }
            console.log(`Item excluído da tabela ${tabela} com ID ${id}`);

            // Consultar o número atual de itens na tabela
            db.get(sqlCount, [], (err, row) => {
                if (err) {
                    console.error('Erro ao contar itens:', err.message);
                    return res.status(500).json({
                        error: 'Erro ao contar itens'
                    });
                }

                const count = row.count || 0; // Se não houver itens, definimos count como 0

                // Atualizar manualmente o valor na tabela sqlite_sequence
                db.run(sqlUpdateSequence, [count, tabela], function (err) {
                    if (err) {
                        console.error('Erro ao atualizar a sequência:', err.message);
                        return res.status(500).json({
                            error: 'Erro ao atualizar a sequência'
                        });
                    }
                    console.log(`Sequência atualizada para tabela ${tabela}`);
                    res.json({
                        success: true,
                        message: 'Item excluído com sucesso'
                    });
                });
            });
        });
    });
});



app.put('/editarItem/:tabela/:id', (req, res) => {
    const tabela = req.params.tabela;
    const id = req.params.id;
    const dados = req.body;

    const sqlUpdate = `UPDATE ${tabela} SET ${Object.keys(dados).map(campo => `${campo} = ?`).join(', ')} WHERE id = ?`;

    const valores = [...Object.values(dados), id];

    db.run(sqlUpdate, valores, function (err) {
        if (err) {
            console.error('Erro ao atualizar o item:', err.message);
            return res.status(500).json({
                error: 'Erro ao atualizar o item'
            });
        }
        console.log(`Item atualizado na tabela ${tabela} com ID ${id}`);
        res.json({
            success: true
        });
    });
});





// Endpoint para verificar se há novas notificações
app.get('/verificarNotificacoes', (req, res) => {
    // Consulte o banco de dados para obter o número de novas notificações
    // e as próprias notificações não lidas
    db.get('SELECT COUNT(*) AS total FROM notificacoes WHERE lida = 0', (err, row) => {
        if (err) {
            console.error('Erro ao verificar notificações:', err.message);
            return res.status(500).json({
                error: 'Erro ao verificar notificações'
            });
        }

        const novasNotificacoes = row.total;

        // Consulte o banco de dados para obter as notificações não lidas
        db.all('SELECT * FROM notificacoes WHERE lida = 0', (err, rows) => {
            if (err) {
                console.error('Erro ao obter notificações:', err.message);
                return res.status(500).json({
                    error: 'Erro ao obter notificações'
                });
            }

            const notificacoes = rows;

            // Retorne o número de novas notificações e as notificações não lidas
            res.json({
                novasNotificacoes,
                notificacoes
            });
        });
    });
});


app.post('/marcarNotificacoesComoLidas', (req, res) => {
    // Atualize o banco de dados para marcar as notificações como lidas
    db.run('UPDATE notificacoes SET lida = 1 WHERE lida = 0', (err) => {
        if (err) {
            console.error('Erro ao marcar notificações como lidas:', err.message);
            return res.status(500).json({
                error: 'Erro ao marcar notificações como lidas'
            });
        }

        // Envie uma resposta de sucesso
        res.json({
            success: true
        });
    });
});







app.get('/pesquisarItens', (req, res) => {
    const nome = req.query.nome; // Obter o parâmetro 'nome' da consulta
    const codigoBarras = req.query.codigoBarras; // Obter o parâmetro 'codigoBarras' da consulta

    // Consultar o banco de dados para obter uma lista de todas as tabelas, excluindo algumas
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('categorias', 'tabelas', 'usuarios', 'sqlite_sequence', 'notificacoes','limites_cores', 'cabos' )", (err, rows) => {
        if (err) {
            console.error('Erro ao buscar tabelas:', err.message);
            return res.status(500).json({
                error: 'Erro ao buscar tabelas'
            });
        }

        // Extrair os nomes das tabelas da resposta do banco de dados
        const tabelas = rows.map(row => row.name);

        // Se não houver nenhuma tabela disponível, retornar um erro
        if (tabelas.length === 0) {
            console.error('Nenhuma tabela disponível.');
            return res.status(400).json({
                error: 'Nenhuma tabela disponível'
            });
        }

        // Construir a consulta SQL para buscar itens em todas as tabelas
        let query = '';

        // Construir a cláusula WHERE para aplicar o filtro de nome e/ou código de barras
        let whereClause = '';
        if (nome && codigoBarras) {
            whereClause = `WHERE nome LIKE '%${nome}%' OR codigo_de_barras LIKE '%${codigoBarras}%'`;
        } else if (nome) {
            whereClause = `WHERE nome LIKE '%${nome}%'`;
        } else if (codigoBarras) {
            whereClause = `WHERE codigo_de_barras LIKE '%${codigoBarras}%'`;
        }

        // Construir a consulta SQL dinamicamente para cada tabela, exceto as especificadas
        const queries = tabelas.map(tabela => `SELECT nome, codigo_de_barras, marca, modelo FROM ${tabela} ${whereClause}`);

        // Unir as consultas de todas as tabelas usando UNION ALL
        query = queries.join(' UNION ALL ');

        // Executar a consulta no banco de dados
        db.all(query, (err, rows) => {
            if (err) {
                console.error('Erro ao buscar itens:', err.message);
                return res.status(500).json({
                    error: 'Erro ao buscar itens'
                });
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