// ------------------ FUNCIONALIDADES AVANÇADAS ------------------

// ------------------ SELEÇÃO MÚLTIPLA DE ITENS ------------------
function selecionarItemParaTransporte(origem, itemId) {
    const item = inventario[origem].find(i => i.id === itemId);
    if (!item) return;
    
    // Verificar se já está selecionado
    const index = itensSelecionados.findIndex(i => i.id === itemId && i.origem === origem);
    
    if (index > -1) {
        // Remover da seleção
        itensSelecionados.splice(index, 1);
        document.querySelector(`[data-item-id="${itemId}"]`).classList.remove('selecionado');
    } else {
        // Adicionar à seleção
        itensSelecionados.push({
            ...item,
            origem: origem,
            quantidadeSelecionada: 1
        });
        document.querySelector(`[data-item-id="${itemId}"]`).classList.add('selecionado');
    }
    
    atualizarResumoSelecao();
}

// ------------------ ATUALIZAR QUANTIDADE ------------------
function atualizarQuantidade(itemId, delta) {
    const item = itensSelecionados.find(i => i.id === itemId);
    if (!item) return;
    
    const novaQuantidade = Math.max(1, Math.min(item.quantidade, item.quantidadeSelecionada + delta));
    item.quantidadeSelecionada = novaQuantidade;
    
    // Atualizar input
    const input = document.querySelector(`[data-item-id="${itemId}"] input[type="number"]`);
    if (input) {
        input.value = novaQuantidade;
    }
    
    atualizarResumoSelecao();
}

// ------------------ ATUALIZAR RESUMO DE SELEÇÃO ------------------
function atualizarResumoSelecao() {
    const resumoContainer = document.getElementById('resumoSelecao');
    if (!resumoContainer) return;
    
    if (itensSelecionados.length === 0) {
        resumoContainer.innerHTML = '<p>Nenhum item selecionado</p>';
        return;
    }
    
    let pesoTotal = 0;
    let alturaMaxima = 0;
    let quantidadeTotal = 0;
    
    itensSelecionados.forEach(item => {
        pesoTotal += item.peso * item.quantidadeSelecionada;
        alturaMaxima = Math.max(alturaMaxima, item.altura);
        quantidadeTotal += item.quantidadeSelecionada;
    });
    
    const pesoOk = pesoTotal <= LIMITE_PESO;
    const alturaOk = alturaMaxima <= LIMITE_ALTURA;
    
    let html = `
        <h4>📦 Resumo da Seleção (${itensSelecionados.length} itens)</h4>
        <div class="resumo-item">
            <span>Peso Total:</span>
            <span class="${pesoOk ? 'ok' : 'alerta'}">${pesoTotal} kg / ${LIMITE_PESO} kg</span>
        </div>
        <div class="resumo-item">
            <span>Altura Máxima:</span>
            <span class="${alturaOk ? 'ok' : 'alerta'}">${alturaMaxima.toFixed(1)} m / ${LIMITE_ALTURA} m</span>
        </div>
        <div class="resumo-item">
            <span>Quantidade Total:</span>
            <span>${quantidadeTotal} unidades</span>
        </div>
    `;
    
    if (!pesoOk || !alturaOk) {
        html += `
            <div class="resumo-item alerta">
                <span>⚠️ Limite excedido!</span>
                <span>Reduza a quantidade ou selecione itens menores</span>
            </div>
        `;
    } else {
        html += `
            <div class="resumo-item ok">
                <span>✅ Dentro dos limites</span>
                <span>Pronto para transporte</span>
            </div>
        `;
    }
    
    resumoContainer.innerHTML = html;
}

// ------------------ VALIDAR LIMITES ------------------
function validarLimites() {
    if (itensSelecionados.length === 0) {
        alert('Selecione pelo menos um item para transportar!');
        return false;
    }
    
    let pesoTotal = 0;
    let alturaMaxima = 0;
    
    itensSelecionados.forEach(item => {
        pesoTotal += item.peso * item.quantidadeSelecionada;
        alturaMaxima = Math.max(alturaMaxima, item.altura);
    });
    
    if (pesoTotal > LIMITE_PESO) {
        alert(`❌ Peso excedido! Total: ${pesoTotal} kg (Limite: ${LIMITE_PESO} kg)`);
        return false;
    }
    
    if (alturaMaxima > LIMITE_ALTURA) {
        alert(`❌ Altura excedida! Máxima: ${alturaMaxima.toFixed(1)} m (Limite: ${LIMITE_ALTURA} m)`);
        return false;
    }
    
    return true;
}

// ------------------ INICIAR TRANSPORTE MÚLTIPLO ------------------
function iniciarTransporteMultiplo(destino) {
    if (!validarLimites()) return;
    
    // Verificar se há paleteiras disponíveis
    const paleteirasDisponiveis = paleteiras.filter(p => p.status === 'ocioso');
    if (paleteirasDisponiveis.length === 0) {
        alert('Nenhuma paleteira disponível no momento!');
        return;
    }
    
    // Verificar se podemos otimizar (combinar cargas)
    const pesoTotal = itensSelecionados.reduce((total, item) => total + (item.peso * item.quantidadeSelecionada), 0);
    const alturaMaxima = Math.max(...itensSelecionados.map(item => item.altura));
    
    if (pesoTotal <= LIMITE_PESO * 0.8 && alturaMaxima <= LIMITE_ALTURA * 0.8) {
        const otimizar = confirm(`💡 Otimização disponível!\n\nPeso atual: ${pesoTotal} kg (${Math.round(pesoTotal/LIMITE_PESO*100)}% da capacidade)\nAltura: ${alturaMaxima.toFixed(1)} m\n\nDeseja combinar todos os itens em uma única paleteira?`);
        
        if (otimizar) {
            // Usar uma única paleteira
            const paleteira = paleteirasDisponiveis[0];
            executarTransporteMultiplo(paleteira, destino);
        } else {
            // Usar múltiplas paleteiras
            executarTransporteMultiplo(null, destino);
        }
    } else {
        // Usar múltiplas paleteiras
        executarTransporteMultiplo(null, destino);
    }
}

// ------------------ EXECUTAR TRANSPORTE MÚLTIPLO ------------------
function executarTransporteMultiplo(paleteiraEspecifica, destino) {
    const origem = itensSelecionados[0].origem;
    
    if (paleteiraEspecifica) {
        // Transporte otimizado - uma paleteira
        const paleteira = paleteiraEspecifica;
        
        // Remover itens do inventário
        itensSelecionados.forEach(item => {
            const index = inventario[origem].findIndex(i => i.id === item.id);
            if (index > -1) {
                inventario[origem][index].quantidade -= item.quantidadeSelecionada;
                if (inventario[origem][index].quantidade <= 0) {
                    inventario[origem].splice(index, 1);
                }
            }
        });
        
        // Atualizar paleteira
        paleteira.status = 'em_transporte';
        paleteira.carga = itensSelecionados;
        paleteira.origem = origem;
        paleteira.destino = destino;
        
        // Criar rota
        const rotaId = Date.now();
        const rota = {
            id: rotaId,
            paleteiraId: paleteira.id,
            origem: origem,
            destino: destino,
            itens: [...itensSelecionados],
            inicio: new Date(),
            status: 'em_andamento'
        };
        
        rotasAtivas.push(rota);
        criarRotaVisual(rotaId, origem, destino, paleteira.id);
        moverPaleteiraParaDestino(paleteira.id, origem, destino);
        
        atualizarTabelaRotas();
        atualizarRelatorio(`🚛 Paleteira ${paleteira.id} iniciou transporte otimizado de ${itensSelecionados.length} itens para ${destino}`);
        
    } else {
        // Transporte com múltiplas paleteiras
        const paleteirasNecessarias = Math.ceil(itensSelecionados.length / 2);
        const paleteirasDisponiveis = paleteiras.filter(p => p.status === 'ocioso').slice(0, paleteirasNecessarias);
        
        if (paleteirasDisponiveis.length < paleteirasNecessarias) {
            alert(`Precisamos de ${paleteirasNecessarias} paleteiras, mas só temos ${paleteirasDisponiveis.length} disponíveis!`);
            return;
        }
        
        // Distribuir itens entre paleteiras
        for (let i = 0; i < paleteirasDisponiveis.length; i++) {
            const paleteira = paleteirasDisponiveis[i];
            const itensPaleteira = itensSelecionados.slice(i * 2, (i + 1) * 2);
            
            // Remover itens do inventário
            itensPaleteira.forEach(item => {
                const index = inventario[origem].findIndex(inv => inv.id === item.id);
                if (index > -1) {
                    inventario[origem][index].quantidade -= item.quantidadeSelecionada;
                    if (inventario[origem][index].quantidade <= 0) {
                        inventario[origem].splice(index, 1);
                    }
                }
            });
            
            // Atualizar paleteira
            paleteira.status = 'em_transporte';
            paleteira.carga = itensPaleteira;
            paleteira.origem = origem;
            paleteira.destino = destino;
            
            // Criar rota
            const rotaId = Date.now() + i;
            const rota = {
                id: rotaId,
                paleteiraId: paleteira.id,
                origem: origem,
                destino: destino,
                itens: [...itensPaleteira],
                inicio: new Date(),
                status: 'em_andamento'
            };
            
            rotasAtivas.push(rota);
            criarRotaVisual(rotaId, origem, destino, paleteira.id);
            moverPaleteiraParaDestino(paleteira.id, origem, destino);
        }
        
        atualizarTabelaRotas();
        atualizarRelatorio(`🚛 ${paleteirasDisponiveis.length} paleteiras iniciaram transporte de ${itensSelecionados.length} itens para ${destino}`);
    }
    
    // Limpar seleção
    itensSelecionados = [];
    fecharModal();
    atualizarInventarioVisual();
}

// ------------------ ATUALIZAR TABELA DE ROTAS ------------------
function atualizarTabelaRotas() {
    const tabela = document.getElementById("tabelaRotas");
    tabela.innerHTML = "";
    
    rotasAtivas.forEach(rota => {
        const paleteira = paleteiras.find(p => p.id === rota.paleteiraId);
        const pesoTotal = rota.itens.reduce((total, item) => total + (item.peso * item.quantidadeSelecionada), 0);
        const alturaMaxima = Math.max(...rota.itens.map(item => item.altura));
        
        tabela.innerHTML += `
            <tr>
                <td>${rota.id}</td>
                <td>Paleteira ${rota.paleteiraId}</td>
                <td>${rota.origem}</td>
                <td>${rota.destino}</td>
                <td>${rota.itens.length} itens</td>
                <td>${pesoTotal}kg / ${alturaMaxima.toFixed(1)}m</td>
                <td style="color:orange;">🔄 Em Movimento</td>
                <td><div class="progress-bar"><div class="progress" style="width: 0%"></div></div></td>
            </tr>
        `;
    });
}

// ------------------ HISTÓRICO DE ROTAS ------------------
function mostrarHistorico(periodo) {
    // Atualizar botões ativos
    document.querySelectorAll('.btn-historico').forEach(btn => btn.classList.remove('ativo'));
    event.target.classList.add('ativo');
    
    const agora = new Date();
    let rotasFiltradas = [];
    
    switch(periodo) {
        case 'dia':
            rotasFiltradas = historicoRotas.filter(rota => {
                const dataRota = new Date(rota.fim);
                return dataRota.toDateString() === agora.toDateString();
            });
            break;
        case 'semana':
            const umaSemanaAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
            rotasFiltradas = historicoRotas.filter(rota => new Date(rota.fim) >= umaSemanaAtras);
            break;
        case 'mes':
            const umMesAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
            rotasFiltradas = historicoRotas.filter(rota => new Date(rota.fim) >= umMesAtras);
            break;
        case 'todos':
            rotasFiltradas = [...historicoRotas];
            break;
    }
    
    // Atualizar estatísticas
    const totalRotas = rotasFiltradas.length;
    const totalPeso = rotasFiltradas.reduce((total, rota) => {
        return total + rota.itens.reduce((sum, item) => sum + (item.peso * item.quantidadeSelecionada), 0);
    }, 0);
    const eficienciaMedia = rotasFiltradas.length > 0 ? 
        Math.round(rotasFiltradas.filter(r => r.otimizada).length / rotasFiltradas.length * 100) : 0;
    
    document.getElementById('totalRotas').innerText = totalRotas;
    document.getElementById('totalPeso').innerText = totalPeso;
    document.getElementById('eficienciaMedia').innerText = eficienciaMedia + '%';
    
    // Atualizar lista
    const lista = document.getElementById('historicoLista');
    lista.innerHTML = "";
    
    if (rotasFiltradas.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Nenhuma rota encontrada para este período</p>';
        return;
    }
    
    rotasFiltradas.forEach(rota => {
        const pesoTotal = rota.itens.reduce((total, item) => total + (item.peso * item.quantidadeSelecionada), 0);
        const alturaMaxima = Math.max(...rota.itens.map(item => item.altura));
        const duracao = Math.round((new Date(rota.fim) - new Date(rota.inicio)) / 1000);
        
        lista.innerHTML += `
            <div class="historico-item">
                <div class="historico-info">
                    <h4>🚛 Paleteira ${rota.paleteiraId} - ${rota.itens.length} itens</h4>
                    <p>${rota.origem} → ${rota.destino}</p>
                    <p>${pesoTotal} kg | ${alturaMaxima.toFixed(1)} m | ${duracao}s</p>
                </div>
                <div class="historico-meta">
                    <div>${rota.otimizada ? '⚡ Otimizada' : '📦 Normal'}</div>
                    <div>${new Date(rota.fim).toLocaleDateString()}</div>
                </div>
            </div>
        `;
    });
}

// ------------------ ROTAS OTIMIZADAS ------------------
function gerarRotaOtimizada() {
    // Rota padrão: Estacionamento → Armazém → Doca → Fábrica
    const rotaPadrao = ['estacionamento', 'armazem', 'doca', 'fabrica'];
    
    // Verificar itens disponíveis em cada local
    const itensDisponiveis = [];
    rotaPadrao.forEach(local => {
        inventario[local].forEach(item => {
            itensDisponiveis.push({
                ...item,
                origem: local
            });
        });
    });
    
    if (itensDisponiveis.length === 0) {
        alert('Nenhum item disponível para transporte!');
        return;
    }
    
    // Selecionar itens para a rota
    const itensSelecionados = [];
    let pesoAtual = 0;
    let alturaMaxima = 0;
    
    itensDisponiveis.forEach(item => {
        if (pesoAtual + item.peso <= LIMITE_PESO && item.altura <= LIMITE_ALTURA) {
            itensSelecionados.push({
                ...item,
                quantidadeSelecionada: 1
            });
            pesoAtual += item.peso;
            alturaMaxima = Math.max(alturaMaxima, item.altura);
        }
    });
    
    if (itensSelecionados.length === 0) {
        alert('Nenhum item cabe nos limites da paleteira!');
        return;
    }
    
    // Executar rota otimizada
    itensSelecionados.forEach((item, index) => {
        setTimeout(() => {
            const paleteira = paleteiras.find(p => p.status === 'ocioso');
            if (paleteira) {
                // Remover item do inventário
                const indexOrigem = inventario[item.origem].findIndex(i => i.id === item.id);
                if (indexOrigem > -1) {
                    inventario[item.origem][indexOrigem].quantidade -= item.quantidadeSelecionada;
                    if (inventario[item.origem][indexOrigem].quantidade <= 0) {
                        inventario[item.origem].splice(indexOrigem, 1);
                    }
                }
                
                // Próximo destino na rota
                const origemIndex = rotaPadrao.indexOf(item.origem);
                const proximoDestino = rotaPadrao[origemIndex + 1] || 'fabrica';
                
                // Atualizar paleteira
                paleteira.status = 'em_transporte';
                paleteira.carga = [item];
                paleteira.origem = item.origem;
                paleteira.destino = proximoDestino;
                
                // Criar rota
                const rotaId = Date.now() + index;
                const rota = {
                    id: rotaId,
                    paleteiraId: paleteira.id,
                    origem: item.origem,
                    destino: proximoDestino,
                    itens: [item],
                    inicio: new Date(),
                    status: 'em_andamento',
                    otimizada: true
                };
                
                rotasAtivas.push(rota);
                criarRotaVisual(rotaId, item.origem, proximoDestino, paleteira.id);
                moverPaleteiraParaDestino(paleteira.id, item.origem, proximoDestino);
            }
        }, index * 2000); // 2 segundos entre cada transporte
    });
    
    atualizarTabelaRotas();
    atualizarRelatorio(`⚡ Rota otimizada iniciada: ${itensSelecionados.length} transportes programados`);
}

// ------------------ VERIFICAR CONFLITOS DE ROTA ------------------
function verificarConflitosRota() {
    const destinos = rotasAtivas.map(rota => rota.destino);
    const conflitos = {};
    
    destinos.forEach(destino => {
        if (!conflitos[destino]) {
            conflitos[destino] = 0;
        }
        conflitos[destino]++;
    });
    
    const destinosConflitantes = Object.entries(conflitos)
        .filter(([destino, count]) => count > 1)
        .map(([destino, count]) => ({ destino, count }));
    
    if (destinosConflitantes.length > 0) {
        let mensagem = '⚠️ Conflitos de rota detectados:\n\n';
        destinosConflitantes.forEach(conflito => {
            mensagem += `• ${conflito.destino}: ${conflito.count} paleteiras chegando\n`;
        });
        mensagem += '\nConsidere otimizar as rotas para evitar congestionamento.';
        
        alert(mensagem);
        return true;
    }
    
    return false;
}

// ------------------ SUGERIR OTIMIZAÇÕES ------------------
function sugerirOtimizacoes() {
    const rotasMesmoDestino = {};
    
    rotasAtivas.forEach(rota => {
        if (!rotasMesmoDestino[rota.destino]) {
            rotasMesmoDestino[rota.destino] = [];
        }
        rotasMesmoDestino[rota.destino].push(rota);
    });
    
    const sugestoes = [];
    
    Object.entries(rotasMesmoDestino).forEach(([destino, rotas]) => {
        if (rotas.length > 1) {
            const pesoTotal = rotas.reduce((total, rota) => {
                return total + rota.itens.reduce((sum, item) => sum + (item.peso * item.quantidadeSelecionada), 0);
            }, 0);
            
            if (pesoTotal <= LIMITE_PESO) {
                sugestoes.push({
                    destino: destino,
                    rotas: rotas,
                    pesoTotal: pesoTotal,
                    economia: rotas.length - 1
                });
            }
        }
    });
    
    if (sugestoes.length > 0) {
        let mensagem = '💡 Sugestões de otimização:\n\n';
        sugestoes.forEach(sugestao => {
            mensagem += `• ${sugestao.destino}: ${sugestao.rotas.length} rotas (${sugestao.pesoTotal}kg)\n`;
            mensagem += `  Economia: ${sugestao.economia} paleteira(s)\n\n`;
        });
        mensagem += 'Deseja aplicar essas otimizações?';
        
        if (confirm(mensagem)) {
            aplicarOtimizacoes(sugestoes);
        }
    } else {
        alert('✅ Nenhuma otimização disponível no momento!');
    }
}

// ------------------ APLICAR OTIMIZAÇÕES ------------------
function aplicarOtimizacoes(sugestoes) {
    sugestoes.forEach(sugestao => {
        // Manter primeira rota, cancelar as outras
        const rotaPrincipal = sugestao.rotas[0];
        const rotasCanceladas = sugestao.rotas.slice(1);
        
        // Combinar itens na rota principal
        rotasCanceladas.forEach(rota => {
            rotaPrincipal.itens.push(...rota.itens);
        });
        
        // Cancelar rotas extras
        rotasCanceladas.forEach(rota => {
            const index = rotasAtivas.findIndex(r => r.id === rota.id);
            if (index > -1) {
                rotasAtivas.splice(index, 1);
            }
            
            // Liberar paleteira
            const paleteira = paleteiras.find(p => p.id === rota.paleteiraId);
            if (paleteira) {
                paleteira.status = 'ocioso';
                paleteira.carga = null;
                paleteira.origem = null;
                paleteira.destino = null;
                
                const elemento = document.getElementById(`paleteira-${paleteira.id}`);
                if (elemento) {
                    elemento.className = 'paleteira';
                    elemento.title = `Paleteira ${paleteira.id} - Status: Ociosa - Carga: Vazia`;
                }
            }
            
            // Remover rota visual
            const rotaVisual = document.getElementById(`rota-${rota.id}`);
            if (rotaVisual) {
                rotaVisual.remove();
            }
        });
    });
    
    atualizarTabelaRotas();
    atualizarRelatorio(`⚡ Otimizações aplicadas: ${sugestoes.length} combinações realizadas`);
}



