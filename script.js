// ------------------ VARIÁVEIS GLOBAIS ------------------
let paleteiras = [];
let rotas = [];
let co2Chart = null;
let timeInterval;
// Limites das paleteiras
const LIMITE_PESO = 1000; // kg
const LIMITE_ALTURA = 2.5; // metros

let inventario = {
    fabrica: [
        { id: 1, nome: "Motor Diesel", quantidade: 15, peso: 800, tipo: "motor", altura: 1.2 },
        { id: 2, nome: "Cabine", quantidade: 8, peso: 1200, tipo: "cabine", altura: 2.8 },
        { id: 3, nome: "Chassi", quantidade: 12, peso: 1500, tipo: "chassi", altura: 0.8 },
        { id: 4, nome: "Rodas", quantidade: 40, peso: 200, tipo: "rodas", altura: 0.6 },
        { id: 5, nome: "Sistema Elétrico", quantidade: 20, peso: 150, tipo: "eletrico", altura: 0.4 }
    ],
    armazem: [
        { id: 6, nome: "Pneus", quantidade: 100, peso: 80, tipo: "pneus", altura: 0.8 },
        { id: 7, nome: "Óleo Motor", quantidade: 50, peso: 20, tipo: "lubrificante", altura: 0.3 },
        { id: 8, nome: "Filtros", quantidade: 200, peso: 5, tipo: "filtros", altura: 0.2 },
        { id: 9, nome: "Parafusos", quantidade: 1000, peso: 1, tipo: "parafusos", altura: 0.1 },
        { id: 10, nome: "Tintas", quantidade: 30, peso: 25, tipo: "tintas", altura: 0.4 }
    ],
    doca: [
        { id: 11, nome: "Caminhões Prontos", quantidade: 5, peso: 8000, tipo: "veiculo", altura: 3.5 },
        { id: 12, nome: "Containers", quantidade: 8, peso: 2000, tipo: "container", altura: 2.6 }
    ],
    estacionamento: [
        { id: 13, nome: "Veículos em Teste", quantidade: 3, peso: 6000, tipo: "veiculo", altura: 3.2 },
        { id: 14, nome: "Protótipos", quantidade: 2, peso: 7000, tipo: "prototipo", altura: 3.0 }
    ],
    escritorio: []
};

let itensSelecionados = [];
let rotasAtivas = [];
let historicoRotas = [];

let cargasEmTransito = [];
let historicoMovimentacoes = [];

// ------------------ INICIALIZAÇÃO ------------------
document.addEventListener('DOMContentLoaded', function() {
    atualizarTempo();
    setInterval(atualizarTempo, 1000);
    criarPaleteiras();
    inicializarGrafico();
    atualizarInventarioVisual();
    adicionarEventosAreas();
    
    // Inicializar KPIs com valores base
    setTimeout(() => {
        const paleteirasOciosas = paleteiras.filter(p => p.status === 'ocioso').length;
        atualizarKPIs(25, 10, paleteirasOciosas, false);
    }, 100);
});

// ------------------ FUNÇÕES DE TEMPO ------------------
function atualizarTempo() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR');
    document.getElementById('currentTime').innerText = timeString;
}

// ------------------ CRIAÇÃO DE PALETEIRAS ------------------
function criarPaleteiras() {
    const container = document.getElementById('paleteiras-container');
    container.innerHTML = '';
    
    for (let i = 1; i <= 12; i++) {
        const paleteira = document.createElement('div');
        paleteira.className = 'paleteira';
        paleteira.id = `paleteira-${i}`;
        paleteira.style.left = Math.random() * 80 + 10 + '%';
        paleteira.style.top = Math.random() * 80 + 10 + '%';
        
        // Adicionar número da paleteira
        paleteira.innerText = i;
        
        // Adicionar tooltip
        paleteira.title = `Paleteira ${i} - Status: Ociosa - Carga: Vazia`;
        
        // Adicionar evento de clique
        paleteira.addEventListener('click', () => mostrarInfoPaleteira(i));
        
        container.appendChild(paleteira);
        
        // Adicionar à lista de paleteiras
        paleteiras.push({
            id: i,
            x: parseFloat(paleteira.style.left),
            y: parseFloat(paleteira.style.top),
            status: 'ocioso',
            carga: null,
            origem: null,
            destino: null,
            rota: null
        });
    }
}

// ------------------ EVENTOS DAS ÁREAS ------------------
function adicionarEventosAreas() {
    const areas = document.querySelectorAll('.area');
    areas.forEach(area => {
        area.addEventListener('click', () => {
            const areaName = area.getAttribute('data-area');
            mostrarInventarioArea(areaName);
        });
    });
}

// ------------------ MOSTRAR INVENTÁRIO DA ÁREA ------------------
function mostrarInventarioArea(areaName) {
    const areaNames = {
        'fabrica': 'Fábrica',
        'armazem': 'Armazém',
        'doca': 'Doca de Carregamento',
        'estacionamento': 'Estacionamento',
        'escritorio': 'Escritório'
    };
    
    const areaDisplayName = areaNames[areaName];
    const itens = inventario[areaName];
    
    let html = `
        <div class="inventario-modal">
            <div class="inventario-header">
                <h3>📦 Inventário - ${areaDisplayName}</h3>
                <button onclick="fecharModal()" class="btn-fechar">✕</button>
            </div>
            <div class="inventario-content">
                <div id="resumoSelecao"></div>
    `;
    
    if (itens.length === 0) {
        html += '<p class="sem-itens">Nenhum item neste local</p>';
    } else {
        html += `
            <div class="inventario-stats">
                <div class="stat">
                    <span class="stat-number">${itens.length}</span>
                    <span class="stat-label">Tipos de Item</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${calcularPesoTotal(itens)}</span>
                    <span class="stat-label">kg Total</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${calcularQuantidadeTotal(itens)}</span>
                    <span class="stat-label">Unidades</span>
                </div>
            </div>
            <div class="itens-lista">
        `;
        
        itens.forEach(item => {
            html += `
                <div class="item-card" data-item-id="${item.id}" onclick="selecionarItemParaTransporte('${areaName}', ${item.id})">
                    <div class="checkbox-item"></div>
                    <div class="item-icon">📦</div>
                    <div class="item-info">
                        <h4>${item.nome}</h4>
                        <p>Quantidade: ${item.quantidade} unidades</p>
                        <p>Peso: ${item.peso} kg cada | Altura: ${item.altura} m</p>
                        <p>Tipo: ${item.tipo}</p>
                        <div class="quantidade-input">
                            <button onclick="event.stopPropagation(); atualizarQuantidade(${item.id}, -1)">-</button>
                            <input type="number" value="1" min="1" max="${item.quantidade}" onclick="event.stopPropagation()" onchange="atualizarQuantidadeSelecionada(${item.id}, this.value)">
                            <button onclick="event.stopPropagation(); atualizarQuantidade(${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <div class="item-action">
                        <button class="btn-transportar">🚛 Selecionar</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Adicionar botão para transportar seleção
        if (itens.length > 0) {
            html += `
                <div style="margin-top: 2rem; text-align: center;">
                    <button onclick="mostrarDestinos()" class="btn-primary" style="padding: 1rem 2rem; font-size: 1.1rem;">
                        🚛 Transportar Itens Selecionados
                    </button>
                </div>
            `;
        }
    }
    
    html += `
            </div>
        </div>
    `;
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = html;
    document.body.appendChild(modal);
    
    // Adicionar evento para fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModal();
        }
    });
}

function mostrarDestinos() {
    if (itensSelecionados.length === 0) {
        alert('Selecione pelo menos um item para transportar!');
        return;
    }
    
    const destinos = ['fabrica', 'armazem', 'doca', 'estacionamento', 'escritorio'];
    const origem = itensSelecionados[0].origem;
    const destinosDisponiveis = destinos.filter(d => d !== origem);
    
    let html = `
        <div class="destino-modal">
            <div class="destino-header">
                <h3>🎯 Selecionar Destino</h3>
                <button onclick="fecharModal()" class="btn-fechar">✕</button>
            </div>
            <div class="destino-content">
                <div class="item-selecionado">
                    <h4>${itensSelecionados.length} itens selecionados</h4>
                    <p>Origem: ${origem}</p>
                </div>
                <div class="destinos-lista">
    `;
    
    destinosDisponiveis.forEach(destino => {
        const destinoNames = {
            'fabrica': '🏭 Fábrica',
            'armazem': '📦 Armazém',
            'doca': '🚛 Doca de Carregamento',
            'estacionamento': '🅿️ Estacionamento',
            'escritorio': '🏢 Escritório'
        };
        
        html += `
            <div class="destino-card" onclick="iniciarTransporteMultiplo('${destino}')">
                <div class="destino-icon">${destinoNames[destino].split(' ')[0]}</div>
                <div class="destino-info">
                    <h4>${destinoNames[destino].split(' ').slice(1).join(' ')}</h4>
                    <p>${inventario[destino].length} itens no local</p>
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    // Substituir modal atual
    const modal = document.querySelector('.modal-overlay');
    modal.innerHTML = html;
}

function atualizarQuantidadeSelecionada(itemId, quantidade) {
    const item = itensSelecionados.find(i => i.id === itemId);
    if (item) {
        item.quantidadeSelecionada = parseInt(quantidade);
        atualizarResumoSelecao();
    }
}

// ------------------ SELECIONAR ITEM PARA TRANSPORTE ------------------
function selecionarItemParaTransporte(origem, itemId) {
    const item = inventario[origem].find(i => i.id === itemId);
    if (!item) return;
    
    // Mostrar modal de seleção de destino
    const destinos = ['fabrica', 'armazem', 'doca', 'estacionamento', 'escritorio'].filter(d => d !== origem);
    
    let html = `
        <div class="destino-modal">
            <div class="destino-header">
                <h3>🎯 Selecionar Destino</h3>
                <button onclick="fecharModal()" class="btn-fechar">✕</button>
            </div>
            <div class="destino-content">
                <div class="item-selecionado">
                    <h4>${item.nome}</h4>
                    <p>Quantidade: ${item.quantidade} | Peso: ${item.peso} kg</p>
                </div>
                <div class="destinos-lista">
    `;
    
    destinos.forEach(destino => {
        const destinoNames = {
            'fabrica': '🏭 Fábrica',
            'armazem': '📦 Armazém',
            'doca': '🚛 Doca de Carregamento',
            'estacionamento': '🅿️ Estacionamento',
            'escritorio': '🏢 Escritório'
        };
        
        html += `
            <div class="destino-card" onclick="iniciarTransporte('${origem}', '${destino}', ${itemId})">
                <div class="destino-icon">${destinoNames[destino].split(' ')[0]}</div>
                <div class="destino-info">
                    <h4>${destinoNames[destino].split(' ').slice(1).join(' ')}</h4>
                    <p>${inventario[destino].length} itens no local</p>
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    // Substituir modal atual
    const modal = document.querySelector('.modal-overlay');
    modal.innerHTML = html;
}

// ------------------ INICIAR TRANSPORTE ------------------
function iniciarTransporte(origem, destino, itemId) {
    const item = inventario[origem].find(i => i.id === itemId);
    if (!item) return;
    
    // Encontrar paleteira disponível
    const paleteiraDisponivel = paleteiras.find(p => p.status === 'ocioso');
    if (!paleteiraDisponivel) {
        alert('Nenhuma paleteira disponível no momento!');
        fecharModal();
        return;
    }
    
    // Remover item do local de origem
    const index = inventario[origem].findIndex(i => i.id === itemId);
    if (index > -1) {
        inventario[origem].splice(index, 1);
    }
    
    // Atualizar paleteira
    paleteiraDisponivel.status = 'em_transporte';
    paleteiraDisponivel.carga = item;
    paleteiraDisponivel.origem = origem;
    paleteiraDisponivel.destino = destino;
    
    // Adicionar à lista de cargas em trânsito
    cargasEmTransito.push({
        paleteiraId: paleteiraDisponivel.id,
        item: item,
        origem: origem,
        destino: destino,
        inicio: new Date()
    });
    
    // Atualizar visual da paleteira
    const paleteiraElement = document.getElementById(`paleteira-${paleteiraDisponivel.id}`);
    paleteiraElement.className = 'paleteira em-transporte';
    paleteiraElement.title = `Paleteira ${paleteiraDisponivel.id} - Transportando: ${item.nome}`;
    
    // Criar rota visual
    criarRotaTransporte(paleteiraDisponivel.id, origem, destino);
    
    // Iniciar movimento
    moverPaleteiraParaDestino(paleteiraDisponivel.id, origem, destino);
    
    // Atualizar inventário visual
    atualizarInventarioVisual();
    
    // Fechar modal
    fecharModal();
    
    // Adicionar ao relatório
    atualizarRelatorio(`🚛 Paleteira ${paleteiraDisponivel.id} iniciou transporte de ${item.nome} de ${origem} para ${destino}`);
}

// ------------------ MOVER PALETEIRA PARA DESTINO ------------------
function moverPaleteiraParaDestino(paleteiraId, origem, destino) {
    const posicoes = {
        'fabrica': { x: 15, y: 15 },
        'armazem': { x: 65, y: 15 },
        'doca': { x: 15, y: 65 },
        'estacionamento': { x: 65, y: 65 },
        'escritorio': { x: 40, y: 40 }
    };
    
    const paleteira = document.getElementById(`paleteira-${paleteiraId}`);
    const destinoPos = posicoes[destino];
    
    // Animar movimento
    paleteira.style.transition = 'all 4s ease-in-out';
    paleteira.style.left = destinoPos.x + '%';
    paleteira.style.top = destinoPos.y + '%';
    
    // Após chegada, fazer check-in
    setTimeout(() => {
        fazerCheckin(paleteiraId, destino);
    }, 4000);
}

// ------------------ FAZER CHECK-IN ------------------
function fazerCheckin(paleteiraId, destino) {
    const paleteira = paleteiras.find(p => p.id === paleteiraId);
    const cargaEmTransito = cargasEmTransito.find(c => c.paleteiraId === paleteiraId);
    
    if (!paleteira || !cargaEmTransito) return;
    
    // Adicionar item ao destino
    inventario[destino].push(cargaEmTransito.item);
    
    // Limpar paleteira
    paleteira.status = 'ocioso';
    paleteira.carga = null;
    paleteira.origem = null;
    paleteira.destino = null;
    
    // Remover da lista de cargas em trânsito
    const index = cargasEmTransito.findIndex(c => c.paleteiraId === paleteiraId);
    if (index > -1) {
        cargasEmTransito.splice(index, 1);
    }
    
    // Atualizar visual da paleteira
    const paleteiraElement = document.getElementById(`paleteira-${paleteiraId}`);
    paleteiraElement.className = 'paleteira';
    paleteiraElement.title = `Paleteira ${paleteiraId} - Status: Ociosa - Carga: Vazia`;
    
    // Remover rota visual
    const rotaElement = document.getElementById(`rota-${paleteiraId}`);
    if (rotaElement) {
        rotaElement.remove();
    }
    
    // Atualizar inventário visual
    atualizarInventarioVisual();
    
    // Adicionar ao histórico
    const rotaCompleta = {
        id: Date.now(),
        paleteiraId: paleteiraId,
        origem: cargaEmTransito.origem,
        destino: destino,
        itens: [cargaEmTransito.item],
        inicio: cargaEmTransito.inicio,
        fim: new Date(),
        otimizada: false
    };
    
    historicoRotas.push(rotaCompleta);
    historicoMovimentacoes.push({
        item: cargaEmTransito.item,
        origem: cargaEmTransito.origem,
        destino: destino,
        paleteiraId: paleteiraId,
        timestamp: new Date()
    });
    
    // Adicionar ao relatório
    atualizarRelatorio(`✅ Paleteira ${paleteiraId} fez check-in de ${cargaEmTransito.item.nome} em ${destino}`);
    
    // Atualizar KPIs
    atualizarKPIs(200 + Math.random() * 50, 50 + Math.random() * 20, Math.max(0, 2 - Math.random() * 2));
}

// ------------------ CRIAR ROTA DE TRANSPORTE ------------------
function criarRotaTransporte(paleteiraId, origem, destino) {
    const container = document.getElementById('rotas-container');
    const rota = document.createElement('div');
    rota.className = 'rota rota-transporte';
    rota.id = `rota-${paleteiraId}`;
    
    const posicoes = {
        'fabrica': { x: 15, y: 15 },
        'armazem': { x: 65, y: 15 },
        'doca': { x: 15, y: 65 },
        'estacionamento': { x: 65, y: 65 },
        'escritorio': { x: 40, y: 40 }
    };
    
    const origemPos = posicoes[origem];
    const destinoPos = posicoes[destino];
    
    rota.style.left = origemPos.x + '%';
    rota.style.top = origemPos.y + '%';
    rota.style.width = Math.abs(destinoPos.x - origemPos.x) + '%';
    rota.style.transform = `rotate(${Math.atan2(destinoPos.y - origemPos.y, destinoPos.x - origemPos.x) * 180 / Math.PI}deg)`;
    
    container.appendChild(rota);
}

// ------------------ ATUALIZAR INVENTÁRIO VISUAL ------------------
function atualizarInventarioVisual() {
    const areas = document.querySelectorAll('.area');
    areas.forEach(area => {
        const areaName = area.getAttribute('data-area');
        const itens = inventario[areaName];
        const quantidadeTotal = calcularQuantidadeTotal(itens);
        const pesoTotal = calcularPesoTotal(itens);
        
        // Adicionar indicadores visuais
        let indicador = area.querySelector('.indicador-inventario');
        if (!indicador) {
            indicador = document.createElement('div');
            indicador.className = 'indicador-inventario';
            area.appendChild(indicador);
        }
        
        indicador.innerHTML = `
            <div class="indicador-item">📦 ${itens.length} tipos</div>
            <div class="indicador-item">⚖️ ${pesoTotal}kg</div>
            <div class="indicador-item">🔢 ${quantidadeTotal} un</div>
        `;
    });
}

// ------------------ FUNÇÕES AUXILIARES ------------------
function calcularPesoTotal(itens) {
    return itens.reduce((total, item) => total + (item.peso * item.quantidade), 0);
}

function calcularQuantidadeTotal(itens) {
    return itens.reduce((total, item) => total + item.quantidade, 0);
}

function fecharModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// ------------------ MOSTRAR INFO PALETEIRA ------------------
function mostrarInfoPaleteira(id) {
    const paleteira = paleteiras.find(p => p.id === id);
    if (!paleteira) return;
    
    let info = `
        Paleteira ${id}
        Status: ${paleteira.status}
        Posição: (${paleteira.x.toFixed(1)}%, ${paleteira.y.toFixed(1)}%)
    `;
    
    if (paleteira.carga) {
        info += `
        Carga: ${paleteira.carga.nome}
        Origem: ${paleteira.origem}
        Destino: ${paleteira.destino}
        `;
    } else {
        info += 'Carga: Vazia';
    }
    
    alert(info);
}

// ------------------ ROTAS (FUNÇÕES ORIGINAIS MODIFICADAS) ------------------
function gerarRota() {
    // Limpar rotas existentes
    limparRotas();
    
    // Gerar múltiplas rotas de paleteiras
    const numRotas = Math.floor(Math.random() * 4) + 3; // 3-6 rotas
    const paleteirasDisponiveis = paleteiras.filter(p => p.status === 'ocioso');
    
    if (paleteirasDisponiveis.length === 0) {
        mostrarAlerta('⚠️ Todas as paleteiras estão ocupadas!', 'warning');
        return;
    }
    
    let rotasGeradas = 0;
    const maxRotas = Math.min(numRotas, paleteirasDisponiveis.length);
    
    for (let i = 0; i < maxRotas; i++) {
        setTimeout(() => {
            gerarRotaAutomatica();
        }, i * 800); // Espaçar as rotas por 800ms
    }
    
    // Mostrar feedback das rotas no mapa
    setTimeout(() => {
        const paleteirasEmMovimento = paleteiras.filter(p => p.status === 'ativo' || p.status === 'em_transporte').length;
        mostrarAlerta(`🗺️ ${maxRotas} rotas geradas! ${paleteirasEmMovimento} paleteiras em movimento no mapa`, 'info');
        
        // Calcular economia de CO₂ estimada
        const co2Economizado = maxRotas * 15; // 15kg CO₂ por rota otimizada
        mostrarAlerta(`🌱 Economia estimada: ${co2Economizado} kg de CO₂`, 'success');
    }, maxRotas * 800);
}

function gerarRotaAutomatica() {
    const paleteirasDisponiveis = paleteiras.filter(p => p.status === 'ocioso');
    if (paleteirasDisponiveis.length === 0) return;
    
    const paleteira = paleteirasDisponiveis[0];
    const paleteiraId = paleteira.id;
    
    // Selecionar origem e destino baseado no inventário
    const areasComItens = Object.keys(inventario).filter(area => inventario[area].length > 0);
    const origem = areasComItens[Math.floor(Math.random() * areasComItens.length)];
    
    const areas = ['fabrica', 'armazem', 'doca', 'estacionamento', 'escritorio'];
    let destino = areas[Math.floor(Math.random() * areas.length)];
    while (destino === origem) {
        destino = areas[Math.floor(Math.random() * areas.length)];
    }
    
    // Selecionar item se disponível
    let item = null;
    let quantidade = 1;
    let pesoTotal = 0;
    
    if (inventario[origem].length > 0) {
        item = inventario[origem][Math.floor(Math.random() * inventario[origem].length)];
        quantidade = Math.min(Math.floor(Math.random() * 3) + 1, item.quantidade);
        pesoTotal = item.peso * quantidade;
        
        // Remover item do inventário
        item.quantidade -= quantidade;
        if (item.quantidade <= 0) {
            const index = inventario[origem].indexOf(item);
            inventario[origem].splice(index, 1);
        }
    }
    
    // Atualizar status da paleteira
    paleteira.status = 'ativo';
    paleteira.carga = item ? {
        item: item,
        quantidade: quantidade,
        pesoTotal: pesoTotal
    } : null;
    paleteira.origem = origem;
    paleteira.destino = destino;
    
    // Criar rota visual no mapa
    criarRotaVisual(paleteiraId, origem, destino);
    
    // Mover paleteira visualmente
    moverPaleteira(paleteiraId, origem, destino);
    
    // Atualizar inventário visual
    atualizarInventarioVisual();
    
    // Atualizar relatório
    const carga = item ? `${item.nome} (${quantidade}x)` : 'Vazia';
    atualizarRelatorio(`🚀 Rota gerada: Paleteira ${paleteiraId} de ${origem} → ${destino} (${carga})`);
}

// Função auxiliar para criar rotas visuais
function criarRotaVisual(paleteiraId, origem, destino) {
    const container = document.getElementById('rotas-container');
    const rota = document.createElement('div');
    rota.className = 'rota';
    rota.id = `rota-${paleteiraId}`;
    
    const posicoes = {
        'fabrica': { x: 15, y: 15 },
        'armazem': { x: 65, y: 15 },
        'doca': { x: 15, y: 65 },
        'estacionamento': { x: 65, y: 65 },
        'escritorio': { x: 40, y: 40 }
    };
    
    const origemPos = posicoes[origem];
    const destinoPos = posicoes[destino];
    
    // Calcular posição e rotação da linha
    const distancia = Math.sqrt(Math.pow(destinoPos.x - origemPos.x, 2) + Math.pow(destinoPos.y - origemPos.y, 2));
    const angulo = Math.atan2(destinoPos.y - origemPos.y, destinoPos.x - origemPos.x) * 180 / Math.PI;
    
    rota.style.left = origemPos.x + '%';
    rota.style.top = origemPos.y + '%';
    rota.style.width = distancia + '%';
    rota.style.height = '3px';
    rota.style.background = 'linear-gradient(90deg, #3498db, #2980b9)';
    rota.style.transform = `rotate(${angulo}deg)`;
    rota.style.transformOrigin = '0 50%';
    rota.style.borderRadius = '2px';
    rota.style.animation = 'rotaPulse 2s infinite';
    
    container.appendChild(rota);
}

// Função auxiliar para mover paleteiras
function moverPaleteira(paleteiraId, origem, destino) {
    const posicoes = {
        'fabrica': { x: 15, y: 15 },
        'armazem': { x: 65, y: 15 },
        'doca': { x: 15, y: 65 },
        'estacionamento': { x: 65, y: 65 },
        'escritorio': { x: 40, y: 40 }
    };
    
    const paleteira = document.getElementById(`paleteira-${paleteiraId}`);
    const destinoPos = posicoes[destino];
    
    // Atualizar status visual
    paleteira.classList.remove('ocioso');
    paleteira.classList.add('ativo');
    
    // Animar movimento
    paleteira.style.transition = 'all 3s ease-in-out';
    paleteira.style.left = destinoPos.x + '%';
    paleteira.style.top = destinoPos.y + '%';
    
    // Após chegada, voltar ao status ocioso
    setTimeout(() => {
        const paleteiraObj = paleteiras.find(p => p.id === paleteiraId);
        if (paleteiraObj) {
            paleteiraObj.status = 'ocioso';
            paleteiraObj.carga = null;
            paleteiraObj.origem = null;
            paleteiraObj.destino = null;
        }
        
        paleteira.classList.remove('ativo');
        paleteira.classList.add('ocioso');
        
        // Remover rota visual
        const rota = document.getElementById(`rota-${paleteiraId}`);
        if (rota) {
            rota.remove();
        }
        
        atualizarRelatorio(`✅ Paleteira ${paleteiraId} completou a rota`);
    }, 3000);
}

function otimizarRota() {
    // Mostrar modal de otimização com opções de carregamento
    mostrarModalOtimizacao();
}

function mostrarModalOtimizacao() {
    // Calcular dados de otimização
    const paleteirasOciosas = paleteiras.filter(p => p.status === 'ocioso').length;
    const paleteirasAtivas = paleteiras.filter(p => p.status === 'ativo' || p.status === 'em_transporte').length;
    const totalPaleteiras = paleteiras.length;
    
    // Calcular potencial de economia
    const co2Atual = 50 + (paleteirasAtivas * 25);
    const co2Otimizado = Math.max(25, co2Atual * 0.6); // 40% de redução
    const economiaC02 = co2Atual - co2Otimizado;
    
    // Analisar inventário para sugerir otimizações
    const areasComItens = Object.keys(inventario).filter(area => inventario[area].length > 0);
    const sugestoes = gerarSugestoesOtimizacao(areasComItens);
    
    let html = `
        <div class="otimizacao-modal">
            <div class="otimizacao-header">
                <h3>⚡ Otimizações Disponíveis</h3>
                <button onclick="fecharModal()" class="btn-fechar">✕</button>
            </div>
            <div class="otimizacao-content">
                <div class="economia-preview">
                    <h4>🌱 Economia Potencial de CO₂</h4>
                    <div class="economia-grid-preview">
                        <div class="economia-item">
                            <span class="label">CO₂ Atual:</span>
                            <span class="valor atual">${co2Atual} kg</span>
                        </div>
                        <div class="economia-item">
                            <span class="label">CO₂ Otimizado:</span>
                            <span class="valor otimizado">${co2Otimizado} kg</span>
                        </div>
                        <div class="economia-item destaque">
                            <span class="label">Economia:</span>
                            <span class="valor economia">-${economiaC02} kg</span>
                        </div>
                    </div>
                </div>
                
                <div class="opcoes-carregamento">
                    <h4>📦 Opções de Carregamento Otimizado</h4>
                    <div class="opcoes-grid">
    `;
    
    sugestoes.forEach((sugestao, index) => {
        html += `
            <div class="opcao-card" onclick="aplicarOtimizacao(${index})">
                <div class="opcao-header">
                    <h5>${sugestao.titulo}</h5>
                    <div class="economia-tag">-${sugestao.economiaC02}kg CO₂</div>
                </div>
                <div class="opcao-detalhes">
                    <p>${sugestao.descricao}</p>
                    <div class="opcao-beneficios">
                        <span class="beneficio">⚡ ${sugestao.eficiencia}% mais eficiente</span>
                        <span class="beneficio">🚛 ${sugestao.paleteiras} paleteiras</span>
                        <span class="beneficio">📦 ${sugestao.itens} itens</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
                    </div>
                </div>
                
                <div class="otimizacao-actions">
                    <button onclick="aplicarOtimizacaoCompleta()" class="btn-primary">
                        🚀 Aplicar Todas as Otimizações
                    </button>
                    <button onclick="fecharModal()" class="btn-secondary">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = html;
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModal();
        }
    });
}

function gerarSugestoesOtimizacao(areasComItens) {
    const sugestoes = [];
    
    if (areasComItens.length >= 2) {
        sugestoes.push({
            titulo: "Consolidação de Cargas",
            descricao: "Combinar cargas pequenas em uma única paleteira para reduzir viagens",
            economiaC02: 25,
            eficiencia: 35,
            paleteiras: 2,
            itens: 8,
            tipo: 'consolidacao'
        });
    }
    
    if (paleteiras.filter(p => p.status === 'ocioso').length >= 3) {
        sugestoes.push({
            titulo: "Rota Sequencial Otimizada",
            descricao: "Criar rota que visite múltiplos locais em sequência otimizada",
            economiaC02: 18,
            eficiencia: 28,
            paleteiras: 1,
            itens: 12,
            tipo: 'sequencial'
        });
    }
    
    const inventarioTotal = Object.values(inventario).reduce((total, area) => total + area.length, 0);
    if (inventarioTotal >= 10) {
        sugestoes.push({
            titulo: "Distribuição Balanceada",
            descricao: "Distribuir itens de forma balanceada entre todas as áreas",
            economiaC02: 30,
            eficiencia: 42,
            paleteiras: 4,
            itens: 15,
            tipo: 'balanceada'
        });
    }
    
    return sugestoes;
}

function aplicarOtimizacao(indice) {
    const sugestoes = gerarSugestoesOtimizacao(Object.keys(inventario).filter(area => inventario[area].length > 0));
    const sugestao = sugestoes[indice];
    
    if (!sugestao) return;
    
    // Fechar modal
    fecharModal();
    
    // Aplicar otimização específica
    switch(sugestao.tipo) {
        case 'consolidacao':
            aplicarConsolidacao();
            break;
        case 'sequencial':
            aplicarRotaSequencial();
            break;
        case 'balanceada':
            aplicarDistribuicaoBalanceada();
            break;
    }
    
    // Mostrar resultado
    setTimeout(() => {
        mostrarAlerta(`⚡ ${sugestao.titulo} aplicada!`, 'success');
        mostrarAlerta(`🌱 Economia: ${sugestao.economiaC02} kg de CO₂`, 'success');
        
        // Atualizar KPIs com economia
        const co2Atual = parseInt(document.getElementById('co2').textContent);
        const novoCO2 = Math.max(25, co2Atual - sugestao.economiaC02);
        atualizarRelatorio(`⚡ Otimização aplicada: ${sugestao.titulo} - Economia de ${sugestao.economiaC02} kg CO₂`);
    }, 1000);
}

function aplicarOtimizacaoCompleta() {
    fecharModal();
    
    // Aplicar múltiplas otimizações
    let economiaTotal = 0;
    const sugestoes = gerarSugestoesOtimizacao(Object.keys(inventario).filter(area => inventario[area].length > 0));
    
    sugestoes.forEach((sugestao, index) => {
        setTimeout(() => {
            aplicarOtimizacao(index);
            economiaTotal += sugestao.economiaC02;
        }, index * 1500);
    });
    
    // Mostrar resultado final
    setTimeout(() => {
        mostrarAlerta(`🎉 Otimização completa aplicada!`, 'success');
        mostrarAlerta(`🌱 Economia total: ${economiaTotal} kg de CO₂`, 'success');
        atualizarRelatorio(`🚀 Otimização completa: ${sugestoes.length} melhorias aplicadas - Economia total de ${economiaTotal} kg CO₂`);
    }, sugestoes.length * 1500);
}

function aplicarConsolidacao() {
    // Encontrar paleteiras que podem ser consolidadas
    const paleteirasOciosas = paleteiras.filter(p => p.status === 'ocioso');
    if (paleteirasOciosas.length >= 2) {
        // Ativar 2 paleteiras para demonstrar consolidação
        paleteirasOciosas[0].status = 'ativo';
        paleteirasOciosas[1].status = 'ativo';
        
        setTimeout(() => {
            paleteirasOciosas[0].status = 'ocioso';
            paleteirasOciosas[1].status = 'ocioso';
        }, 3000);
    }
}

function aplicarRotaSequencial() {
    // Criar rota que visite múltiplos pontos
    const paleteirasOciosas = paleteiras.filter(p => p.status === 'ocioso');
    if (paleteirasOciosas.length >= 1) {
        const paleteira = paleteirasOciosas[0];
        paleteira.status = 'ativo';
        
        // Simular visitação de múltiplos pontos
        const pontos = ['fabrica', 'armazem', 'doca'];
        pontos.forEach((ponto, index) => {
            setTimeout(() => {
                moverPaleteira(paleteira.id, index > 0 ? pontos[index-1] : 'estacionamento', ponto);
            }, index * 1000);
        });
    }
}

function aplicarDistribuicaoBalanceada() {
    // Ativar múltiplas paleteiras para distribuição
    const paleteirasOciosas = paleteiras.filter(p => p.status === 'ocioso');
    const numPaleteiras = Math.min(4, paleteirasOciosas.length);
    
    for (let i = 0; i < numPaleteiras; i++) {
        setTimeout(() => {
            if (paleteirasOciosas[i]) {
                paleteirasOciosas[i].status = 'ativo';
                setTimeout(() => {
                    paleteirasOciosas[i].status = 'ocioso';
                }, 2000);
            }
        }, i * 500);
    }
}

function simularSensores() {
    const paletes = document.getElementById("statusPaletes");
    paletes.innerHTML = "";
    
    for (let i = 1; i <= 12; i++) {
        const paleteira = paleteiras.find(p => p.id === i);
        const status = paleteira ? paleteira.status : 'ocioso';
        
        const card = document.createElement("div");
        card.className = `palete-card ${status}`;
        
        let icon, text, info;
        
        switch(status) {
            case 'em_transporte':
                icon = "🚛";
                text = "Em Transporte";
                info = paleteira.carga ? paleteira.carga.nome : "Carga";
                break;
            case 'ocioso':
                icon = "⏸️";
                text = "Ociosa";
                info = "Disponível";
                break;
            default:
                icon = "❓";
                text = "Desconhecido";
                info = "Status não definido";
        }
        
        card.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${icon}</div>
            <div>Paleteira ${i}</div>
            <div style="font-size: 0.8rem; opacity: 0.8;">${text}</div>
            <div style="font-size: 0.7rem; opacity: 0.6;">${info}</div>
        `;
        
        card.addEventListener('click', () => mostrarInfoPaleteira(i));
        paletes.appendChild(card);
    }
    
    atualizarRelatorio("📡 Sensores atualizados. Status das paleteiras sincronizado.");
}

function resetar() {
    document.getElementById("tabelaRotas").innerHTML = "";
    document.getElementById("statusPaletes").innerHTML = "";
    limparRotas();
    
    // Resetar paleteiras
    paleteiras.forEach(paleteira => {
        paleteira.status = 'ocioso';
        paleteira.carga = null;
        paleteira.origem = null;
        paleteira.destino = null;
        
        const elemento = document.getElementById(`paleteira-${paleteira.id}`);
        if (elemento) {
            elemento.className = 'paleteira';
            elemento.style.left = Math.random() * 80 + 10 + '%';
            elemento.style.top = Math.random() * 80 + 10 + '%';
            elemento.title = `Paleteira ${paleteira.id} - Status: Ociosa - Carga: Vazia`;
        }
    });
    
    // Limpar cargas em trânsito
    cargasEmTransito = [];
    
    // Resetar inventário para estado inicial
    inventario = {
        fabrica: [
            { id: 1, nome: "Motor Diesel", quantidade: 15, peso: 800, tipo: "motor" },
            { id: 2, nome: "Cabine", quantidade: 8, peso: 1200, tipo: "cabine" },
            { id: 3, nome: "Chassi", quantidade: 12, peso: 1500, tipo: "chassi" },
            { id: 4, nome: "Rodas", quantidade: 40, peso: 200, tipo: "rodas" },
            { id: 5, nome: "Sistema Elétrico", quantidade: 20, peso: 150, tipo: "eletrico" }
        ],
        armazem: [
            { id: 6, nome: "Pneus", quantidade: 100, peso: 80, tipo: "pneus" },
            { id: 7, nome: "Óleo Motor", quantidade: 50, peso: 20, tipo: "lubrificante" },
            { id: 8, nome: "Filtros", quantidade: 200, peso: 5, tipo: "filtros" },
            { id: 9, nome: "Parafusos", quantidade: 1000, peso: 1, tipo: "parafusos" },
            { id: 10, nome: "Tintas", quantidade: 30, peso: 25, tipo: "tintas" }
        ],
        doca: [
            { id: 11, nome: "Caminhões Prontos", quantidade: 5, peso: 8000, tipo: "veiculo" },
            { id: 12, nome: "Containers", quantidade: 8, peso: 2000, tipo: "container" }
        ],
        estacionamento: [
            { id: 13, nome: "Veículos em Teste", quantidade: 3, peso: 6000, tipo: "veiculo" },
            { id: 14, nome: "Protótipos", quantidade: 2, peso: 7000, tipo: "prototipo" }
        ],
        escritorio: []
    };
    
    atualizarInventarioVisual();
    // Inicializar KPIs com valores base
    const paleteirasOciosas = paleteiras.filter(p => p.status === 'ocioso').length;
    atualizarKPIs(25, 10, paleteirasOciosas, false);
    atualizarRelatorio("🔄 Sistema resetado. Inventário restaurado ao estado inicial.");
    atualizarGrafico(25);
}

// ------------------ KPIs ------------------
function atualizarKPIs(co2Economizado, km, ociosas, reset=false) {
    // Atualizar valores dos KPIs focados na ECONOMIA
    document.getElementById("co2").innerText = "+" + co2Economizado;
    document.getElementById("km").innerText = km;
    document.getElementById("ociosas").innerText = ociosas;
    
    // Calcular eficiência ambiental baseada na economia de CO₂
    const totalPaleteiras = paleteiras.length;
    const paleteirasAtivas = paleteiras.filter(p => p.status === 'ativo' || p.status === 'em_transporte').length;
    const eficienciaAmbiental = totalPaleteiras > 0 ? Math.round((paleteirasAtivas / totalPaleteiras) * 100) : 0;
    
    document.getElementById("eficiencia").innerText = reset ? "0%" : `${eficienciaAmbiental}%`;
    
    // Atualizar gráfico com economia
    atualizarGraficoEconomia(co2Economizado);
    
    // Adicionar indicadores visuais de economia
    atualizarIndicadoresEconomia(co2Economizado);
}

// ------------------ ATUALIZAR INDICADORES DE ECONOMIA ------------------
function atualizarIndicadoresEconomia(co2Economizado) {
    const paleteirasAtivas = paleteiras.filter(p => p.status === 'ativo').length;
    const paleteirasEmTransporte = paleteiras.filter(p => p.status === 'em_transporte').length;
    const paleteirasOciosas = paleteiras.filter(p => p.status === 'ocioso').length;
    const paleteirasComProblema = paleteiras.filter(p => p.status === 'problema').length;
    
    // Atualizar indicadores visuais com foco na economia
    const indicadores = document.querySelectorAll('.kpi-card');
    indicadores.forEach(card => {
        const valor = card.querySelector('.kpi-valor');
        if (valor) {
            const texto = valor.textContent;
            if (texto.includes('kg')) {
                // Indicador de ECONOMIA de CO₂ - quanto mais economizamos, melhor
                if (co2Economizado >= 100) card.style.borderLeft = '4px solid #27ae60'; // Verde - excelente economia
                else if (co2Economizado >= 50) card.style.borderLeft = '4px solid #2ecc71'; // Verde claro - boa economia
                else if (co2Economizado >= 20) card.style.borderLeft = '4px solid #f39c12'; // Amarelo - economia moderada
                else card.style.borderLeft = '4px solid #95a5a6'; // Cinza - pouca economia
            } else if (texto.includes('km')) {
                // Indicador de km otimizados
                card.style.borderLeft = paleteirasAtivas > 0 ? '4px solid #3498db' : '4px solid #95a5a6';
            } else if (texto.includes('%')) {
                // Indicador de eficiência ambiental
                const eficiencia = parseInt(texto);
                if (eficiencia >= 80) card.style.borderLeft = '4px solid #27ae60'; // Verde - alta eficiência
                else if (eficiencia >= 60) card.style.borderLeft = '4px solid #f39c12'; // Amarelo - média eficiência
                else card.style.borderLeft = '4px solid #e74c3c'; // Vermelho - baixa eficiência
            } else {
                // Indicador de paleteiras ociosas - menos ociosas = mais sustentável
                card.style.borderLeft = paleteirasOciosas === 0 ? '4px solid #27ae60' : // Verde - todas ativas
                                       paleteirasOciosas <= 3 ? '4px solid #f39c12' : // Amarelo - poucas ociosas
                                       '4px solid #e74c3c'; // Vermelho - muitas ociosas
            }
        }
    });
}

// ------------------ RELATÓRIO ------------------
function atualizarRelatorio(texto) {
    const relatorio = document.getElementById("relatorioTexto");
    const card = document.createElement("div");
    card.className = "relatorio-card";
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR');
    
    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${texto}</span>
            <small style="color: #888;">${timeString}</small>
        </div>
    `;
    
    relatorio.appendChild(card);
    
    // Limitar número de relatórios
    if (relatorio.children.length > 5) {
        relatorio.removeChild(relatorio.firstChild);
    }
}

// ------------------ GRÁFICO DE ECONOMIA DE CO2 ------------------
function inicializarGrafico() {
    const ctx = document.getElementById('co2Chart').getContext('2d');
    co2Chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['CO₂ Economizado', 'Potencial Restante'],
            datasets: [{
                data: [0, 300],
                backgroundColor: ['#27ae60', '#ecf0f1'],
                borderWidth: 1
            }]
        },
        options: {
            plugins: { 
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: '🌱 Economia de CO₂ vs Potencial'
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function atualizarGraficoEconomia(co2Economizado) {
    if (co2Chart) {
        const potencialMaximo = 300;
        const restante = Math.max(0, potencialMaximo - co2Economizado);
        co2Chart.data.labels = ['CO₂ Economizado', 'Potencial Restante'];
        co2Chart.data.datasets[0].data = [co2Economizado, restante];
        co2Chart.data.datasets[0].backgroundColor = [
            co2Economizado >= 200 ? '#27ae60' : co2Economizado >= 100 ? '#2ecc71' : '#f39c12',
            '#ecf0f1'
        ];
        co2Chart.update();
    }
}

// Manter compatibilidade com chamadas antigas
function atualizarGrafico(co2) {
    atualizarGraficoEconomia(co2);
}

function limparRotas() {
    const container = document.getElementById('rotas-container');
    container.innerHTML = '';
}

// ------------------ ANIMAÇÕES ADICIONAIS ------------------
function adicionarEfeitoPulse() {
    const paleteiras = document.querySelectorAll('.paleteira');
    paleteiras.forEach(paleteira => {
        paleteira.style.animation = 'pulse 2s infinite';
    });
}

// Inicializar efeitos
setTimeout(adicionarEfeitoPulse, 1000);

// ------------------ ATUALIZAÇÃO AUTOMÁTICA DE KPIs ------------------
function iniciarAtualizacaoAutomatica() {
    setInterval(() => {
        // Calcular KPIs em tempo real
        const paleteirasAtivas = paleteiras.filter(p => p.status === 'ativo').length;
        const paleteirasOciosas = paleteiras.filter(p => p.status === 'ocioso').length;
        const paleteirasEmTransporte = paleteiras.filter(p => p.status === 'em_transporte').length;
        
        // Calcular ECONOMIA de CO₂ baseado na otimização
        const co2SemOtimizacao = 300; // CO₂ que seria gasto sem otimização
        const co2Economizado = (paleteirasAtivas * 30) + (paleteirasEmTransporte * 45); // CO₂ economizado
        const co2Evitado = Math.min(co2SemOtimizacao, co2Economizado); // CO₂ que evitamos emitir
        
        // Calcular km baseado na atividade
        const kmBase = 10; // km base
        const kmAtivo = paleteirasAtivas * 15; // km por paleteira ativa
        const kmTransporte = paleteirasEmTransporte * 25; // km por paleteira em transporte
        const kmTotal = kmBase + kmAtivo + kmTransporte;
        
        // Calcular eficiência
        const eficiencia = paleteiras.length > 0 ? 
            Math.round(((paleteirasAtivas + paleteirasEmTransporte) / paleteiras.length) * 100) : 0;
        
        // Atualizar KPIs com foco na economia
        atualizarKPIs(
            Math.round(co2Evitado), 
            Math.round(kmTotal), 
            paleteirasOciosas,
            false
        );
        
        // Atualizar status das paleteiras no mapa
        atualizarStatusPaleteiras();
        
    }, 3000); // Atualizar a cada 3 segundos
}

// ------------------ ATUALIZAR STATUS DAS PALETEIRAS ------------------
function atualizarStatusPaleteiras() {
    paleteiras.forEach(paleteira => {
        const elemento = document.getElementById(`paleteira-${paleteira.id}`);
        if (elemento) {
            // Remover classes antigas
            elemento.classList.remove('ativo', 'ocioso', 'problema', 'em-transporte');
            
            // Adicionar classe baseada no status
            elemento.classList.add(paleteira.status === 'ativo' ? 'ativo' : 
                                 paleteira.status === 'em_transporte' ? 'em-transporte' : 
                                 paleteira.status === 'problema' ? 'problema' : 'ocioso');
            
            // Atualizar tooltip
            let tooltip = `Paleteira ${paleteira.id} - Status: `;
            if (paleteira.status === 'ativo') tooltip += 'Ativa';
            else if (paleteira.status === 'em_transporte') tooltip += 'Em Transporte';
            else if (paleteira.status === 'problema') tooltip += 'Problema';
            else tooltip += 'Ociosa';
            
            if (paleteira.carga) {
                tooltip += ` - Carga: ${paleteira.carga.nome}`;
            } else {
                tooltip += ' - Carga: Vazia';
            }
            
            elemento.title = tooltip;
        }
    });
}

// Iniciar atualização automática
iniciarAtualizacaoAutomatica();

// ------------------ SISTEMA DE ALERTAS EM TEMPO REAL ------------------
let ultimoStatus = {
    paleteirasAtivas: 0,
    paleteirasEmTransporte: 0,
    paleteirasOciosas: 0,
    co2: 0
};

function verificarAlertas() {
    const paleteirasAtivas = paleteiras.filter(p => p.status === 'ativo').length;
    const paleteirasEmTransporte = paleteiras.filter(p => p.status === 'em_transporte').length;
    const paleteirasOciosas = paleteiras.filter(p => p.status === 'ocioso').length;
    const paleteirasComProblema = paleteiras.filter(p => p.status === 'problema').length;
    
    // Calcular economia de CO₂ atual
    const co2Economizado = (paleteirasAtivas * 30) + (paleteirasEmTransporte * 45);
    
    // Verificar mudanças significativas focadas na ECONOMIA
    if (paleteirasEmTransporte > ultimoStatus.paleteirasEmTransporte) {
        const novaEconomia = (paleteirasEmTransporte - ultimoStatus.paleteirasEmTransporte) * 45;
        mostrarAlerta(`🌱 +${novaEconomia}kg de CO₂ economizado! ${paleteirasEmTransporte - ultimoStatus.paleteirasEmTransporte} paleteira(s) otimizada(s)!`, 'success');
    }
    
    if (paleteirasComProblema > 0) {
        mostrarAlerta(`⚠️ ${paleteirasComProblema} paleteira(s) com problema - impacto na economia ambiental!`, 'warning');
    }
    
    if (paleteirasOciosas === 0 && ultimoStatus.paleteirasOciosas > 0) {
        mostrarAlerta(`🎉 Eficiência máxima! Economia total: +${co2Economizado}kg CO₂!`, 'success');
    }
    
    if (co2Economizado >= 150 && ultimoStatus.co2 < 150) {
        mostrarAlerta(`🌍 Meta ambiental alcançada! +${co2Economizado}kg de CO₂ economizado!`, 'success');
    }
    
    // Atualizar status anterior
    ultimoStatus = {
        paleteirasAtivas,
        paleteirasEmTransporte,
        paleteirasOciosas,
        co2: co2Economizado
    };
}

// ------------------ MOSTRAR ALERTA ------------------
function mostrarAlerta(mensagem, tipo = 'info') {
    // Criar elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alerta-tempo-real alerta-${tipo}`;
    alerta.innerHTML = `
        <div class="alerta-conteudo">
            <span class="alerta-mensagem">${mensagem}</span>
            <button class="alerta-fechar" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Adicionar ao container de alertas
    let container = document.getElementById('alertas-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'alertas-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    
    container.appendChild(alerta);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (alerta.parentElement) {
            alerta.remove();
        }
    }, 5000);
}

// Verificar alertas a cada 5 segundos
setInterval(verificarAlertas, 5000);
  