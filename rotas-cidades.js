// ------------------ VARIÁVEIS GLOBAIS ------------------
let rotasCalculadas = [];
let rotaAtiva = null;
let simulacaoAtiva = false;
let intervaloSimulacao = null;
let posicaoAtual = 0;
let velocidadeSimulacao = 80; // km/h

// Dados das cidades
const cidades = {
    'sao-paulo': { nome: 'São Paulo', x: 20, y: 30, estado: 'SP' },
    'rio-janeiro': { nome: 'Rio de Janeiro', x: 25, y: 35, estado: 'RJ' },
    'belo-horizonte': { nome: 'Belo Horizonte', x: 30, y: 25, estado: 'MG' },
    'curitiba': { nome: 'Curitiba', x: 15, y: 20, estado: 'PR' },
    'porto-alegre': { nome: 'Porto Alegre', x: 10, y: 15, estado: 'RS' },
    'brasilia': { nome: 'Brasília', x: 40, y: 20, estado: 'DF' },
    'salvador': { nome: 'Salvador', x: 35, y: 40, estado: 'BA' },
    'fortaleza': { nome: 'Fortaleza', x: 45, y: 45, estado: 'CE' },
    'recife': { nome: 'Recife', x: 40, y: 50, estado: 'PE' },
    'manaus': { nome: 'Manaus', x: 60, y: 30, estado: 'AM' }
};

// Preços de combustível (R$/L)
const precosCombustivel = {
    'diesel': 5.50,
    'gasolina': 6.20,
    'etanol': 4.80
};

// Consumo médio (km/L)
const consumoMedio = {
    'diesel': 8.5,
    'gasolina': 7.2,
    'etanol': 6.8
};

// Emissão de CO₂ (kg/L)
const emissaoCO2 = {
    'diesel': 2.68,
    'gasolina': 2.31,
    'etanol': 1.51
};

// ------------------ INICIALIZAÇÃO ------------------
document.addEventListener('DOMContentLoaded', function() {
    atualizarTempo();
    setInterval(atualizarTempo, 1000);
    
    // Atualizar valor da capacidade
    document.getElementById('capacidadeCaminhao').addEventListener('input', function() {
        document.getElementById('capacidadeValue').textContent = this.value + '%';
    });
    
    // Inicializar gráficos
    inicializarGraficos();
});

// ------------------ FUNÇÕES DE TEMPO ------------------
function atualizarTempo() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR');
    document.getElementById('currentTime').innerText = timeString;
}

// ------------------ CALCULAR ROTAS ------------------
function calcularRotas() {
    const origem = document.getElementById('cidadeOrigem').value;
    const destino = document.getElementById('cidadeDestino').value;
    const capacidade = parseInt(document.getElementById('capacidadeCaminhao').value);
    
    if (origem === destino) {
        alert('Origem e destino não podem ser iguais!');
        return;
    }
    
    // Gerar 3 rotas diferentes
    rotasCalculadas = gerarRotasAlternativas(origem, destino, capacidade);
    
    // Criar mapa
    criarMapaCidades(origem, destino);
    
    // Mostrar comparação
    mostrarComparacaoRotas();
    
    // Calcular economia
    calcularEconomiaAmbiental();
    
    // Atualizar projeções
    mostrarProjecao('10anos');
    
    // Atualizar gráficos com dados reais
    atualizarGraficos();
}

// ------------------ GERAR ROTAS ALTERNATIVAS ------------------
function gerarRotasAlternativas(origem, destino, capacidade) {
    const rotas = [];
    
    // Rota 1: Direta (otimizada)
    const distancia1 = calcularDistancia(origem, destino);
    const rota1 = {
        id: 1,
        nome: 'Rota Otimizada',
        tipo: 'otimizada',
        distancia: distancia1,
        tempo: Math.round(distancia1 / velocidadeSimulacao * 60), // minutos
        combustivel: calcularCombustivel(distancia1, capacidade),
        co2: calcularCO2(distancia1, capacidade),
        custo: calcularCusto(distancia1, capacidade),
        pontos: [origem, destino]
    };
    
    // Rota 2: Com parada intermediária
    const cidadeIntermediaria = encontrarCidadeIntermediaria(origem, destino);
    const distancia2 = calcularDistancia(origem, cidadeIntermediaria) + calcularDistancia(cidadeIntermediaria, destino);
    const rota2 = {
        id: 2,
        nome: 'Rota Alternativa 1',
        tipo: 'alternativa1',
        distancia: distancia2,
        tempo: Math.round(distancia2 / velocidadeSimulacao * 60),
        combustivel: calcularCombustivel(distancia2, capacidade),
        co2: calcularCO2(distancia2, capacidade),
        custo: calcularCusto(distancia2, capacidade),
        pontos: [origem, cidadeIntermediaria, destino]
    };
    
    // Rota 3: Rota mais longa
    const distancia3 = distancia1 * 1.8; // 80% mais longa
    const rota3 = {
        id: 3,
        nome: 'Rota Alternativa 2',
        tipo: 'alternativa2',
        distancia: distancia3,
        tempo: Math.round(distancia3 / velocidadeSimulacao * 60),
        combustivel: calcularCombustivel(distancia3, capacidade),
        co2: calcularCO2(distancia3, capacidade),
        custo: calcularCusto(distancia3, capacidade),
        pontos: [origem, encontrarCidadeIntermediaria(origem, destino), encontrarCidadeIntermediaria(destino, origem), destino]
    };
    
    rotas.push(rota1, rota2, rota3);
    
    // Ordenar por distância (menor primeiro)
    rotas.sort((a, b) => a.distancia - b.distancia);
    
    return rotas;
}

// ------------------ CALCULAR DISTÂNCIA ------------------
function calcularDistancia(cidade1, cidade2) {
    const c1 = cidades[cidade1];
    const c2 = cidades[cidade2];
    
    // Distância euclidiana simplificada (para simulação)
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    
    // Converter para km (aproximadamente)
    return Math.round(distancia * 50 + Math.random() * 100 + 300); // Entre 300-800 km
}

// ------------------ CALCULAR COMBUSTÍVEL ------------------
function calcularCombustivel(distancia, capacidade) {
    const consumo = consumoMedio.diesel;
    const fatorCarga = 1 + (capacidade / 100) * 0.3; // 30% mais consumo com carga cheia
    return Math.round((distancia / consumo) * fatorCarga * 10) / 10;
}

// ------------------ CALCULAR CO₂ ------------------
function calcularCO2(distancia, capacidade) {
    const combustivel = calcularCombustivel(distancia, capacidade);
    return Math.round(combustivel * emissaoCO2.diesel * 10) / 10;
}

// ------------------ CALCULAR CUSTO ------------------
function calcularCusto(distancia, capacidade) {
    const combustivel = calcularCombustivel(distancia, capacidade);
    return Math.round(combustivel * precosCombustivel.diesel * 100) / 100;
}

// ------------------ ENCONTRAR CIDADE INTERMEDIÁRIA ------------------
function encontrarCidadeIntermediaria(origem, destino) {
    const cidadesDisponiveis = Object.keys(cidades).filter(c => c !== origem && c !== destino);
    return cidadesDisponiveis[Math.floor(Math.random() * cidadesDisponiveis.length)];
}

// ------------------ CRIAR MAPA DE CIDADES ------------------
function criarMapaCidades(origem, destino) {
    const mapa = document.getElementById('mapaCidades');
    mapa.innerHTML = '';
    
    // Criar cidades
    Object.entries(cidades).forEach(([id, cidade]) => {
        const cidadeElement = document.createElement('div');
        cidadeElement.className = `cidade ${id === origem ? 'origem' : id === destino ? 'destino' : 'intermediaria'}`;
        cidadeElement.style.left = cidade.x * 2 + '%';
        cidadeElement.style.top = cidade.y * 2 + '%';
        cidadeElement.textContent = cidade.estado;
        cidadeElement.title = cidade.nome;
        mapa.appendChild(cidadeElement);
    });
    
    // Criar linhas das rotas
    criarLinhasRotas();
}

// ------------------ CRIAR LINHAS DAS ROTAS ------------------
function criarLinhasRotas() {
    const rotasContainer = document.getElementById('rotasLinhas');
    rotasContainer.innerHTML = '';
    
    rotasCalculadas.forEach((rota, index) => {
        if (rota.pontos.length >= 2) {
            for (let i = 0; i < rota.pontos.length - 1; i++) {
                const ponto1 = cidades[rota.pontos[i]];
                const ponto2 = cidades[rota.pontos[i + 1]];
                
                const linha = document.createElement('div');
                linha.className = `rota-linha ${rota.tipo}`;
                
                // Calcular posição e rotação da linha
                const x1 = ponto1.x * 2;
                const y1 = ponto1.y * 2;
                const x2 = ponto2.x * 2;
                const y2 = ponto2.y * 2;
                
                const distancia = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                const angulo = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                
                linha.style.left = x1 + '%';
                linha.style.top = y1 + '%';
                linha.style.width = distancia + '%';
                linha.style.transform = `rotate(${angulo}deg)`;
                linha.style.transformOrigin = '0 50%';
                
                rotasContainer.appendChild(linha);
            }
        }
    });
}

// ------------------ MOSTRAR COMPARAÇÃO DE ROTAS ------------------
function mostrarComparacaoRotas() {
    const grid = document.getElementById('rotasGrid');
    grid.innerHTML = '';
    
    // Encontrar a rota otimizada (menor distância)
    const rotaOtimizada = rotasCalculadas[0];
    
    rotasCalculadas.forEach((rota, index) => {
        const rotaCard = document.createElement('div');
        rotaCard.className = `rota-card ${rota.tipo}`;
        
        // Calcular economia em relação à rota otimizada
        const economiaCombustivel = rota.combustivel - rotaOtimizada.combustivel;
        const economiaCO2 = rota.co2 - rotaOtimizada.co2;
        const economiaCusto = rota.custo - rotaOtimizada.custo;
        const economiaTempo = rota.tempo - rotaOtimizada.tempo;
        
        // Calcular percentual de economia
        const percentualCombustivel = rotaOtimizada.combustivel > 0 ? ((economiaCombustivel / rota.combustivel) * 100) : 0;
        const percentualCO2 = rota.co2 > 0 ? ((economiaCO2 / rota.co2) * 100) : 0;
        const percentualCusto = rota.custo > 0 ? ((economiaCusto / rota.custo) * 100) : 0;
        const percentualTempo = rota.tempo > 0 ? ((economiaTempo / rota.tempo) * 100) : 0;
        
        rotaCard.innerHTML = `
            <div class="rota-header">
                <div class="rota-titulo">${rota.nome}</div>
                <div class="rota-status ${rota.tipo}">${index === 0 ? 'Recomendada' : 'Alternativa'}</div>
            </div>
            <div class="rota-detalhes">
                <div class="rota-item">
                    <span class="rota-label">🛣️ Distância:</span>
                    <span class="rota-valor">${rota.distancia} km</span>
                </div>
                <div class="rota-item">
                    <span class="rota-label">⏱️ Tempo:</span>
                    <span class="rota-valor">${Math.floor(rota.tempo / 60)}h ${rota.tempo % 60}min</span>
                </div>
                <div class="rota-item">
                    <span class="rota-label">⛽ Combustível:</span>
                    <span class="rota-valor">${rota.combustivel} L</span>
                </div>
                <div class="rota-item">
                    <span class="rota-label">🌿 CO₂:</span>
                    <span class="rota-valor">${rota.co2} kg</span>
                </div>
                <div class="rota-item">
                    <span class="rota-label">💰 Custo:</span>
                    <span class="rota-valor custo">R$ ${rota.custo.toFixed(2)}</span>
                </div>
                ${index === 0 ? `
                    <div class="rota-item economia-destaque">
                        <span class="rota-label">🏆 Economia Total:</span>
                        <span class="rota-valor economia">Rota Mais Eficiente</span>
                    </div>
                    <div class="rota-item">
                        <span class="rota-label">🌱 Economia vs Alternativa 1:</span>
                        <span class="rota-valor economia">+${Math.abs(rotasCalculadas[1].combustivel - rota.combustivel).toFixed(1)} L combustível</span>
                    </div>
                    <div class="rota-item">
                        <span class="rota-label">🌿 Economia vs Alternativa 1:</span>
                        <span class="rota-valor economia">+${Math.abs(rotasCalculadas[1].co2 - rota.co2).toFixed(1)} kg CO₂</span>
                    </div>
                    <div class="rota-item">
                        <span class="rota-label">💰 Economia vs Alternativa 1:</span>
                        <span class="rota-valor economia">R$ ${Math.abs(rotasCalculadas[1].custo - rota.custo).toFixed(2)}</span>
                    </div>
                ` : `
                    <div class="rota-item">
                        <span class="rota-label">📈 Consumo Extra:</span>
                        <span class="rota-valor custo">+${Math.abs(economiaCombustivel).toFixed(1)} L (${Math.abs(percentualCombustivel).toFixed(1)}%)</span>
                    </div>
                    <div class="rota-item">
                        <span class="rota-label">🌫️ CO₂ Extra:</span>
                        <span class="rota-valor custo">+${Math.abs(economiaCO2).toFixed(1)} kg (${Math.abs(percentualCO2).toFixed(1)}%)</span>
                    </div>
                    <div class="rota-item">
                        <span class="rota-label">💸 Custo Extra:</span>
                        <span class="rota-valor custo">R$ ${Math.abs(economiaCusto).toFixed(2)} (${Math.abs(percentualCusto).toFixed(1)}%)</span>
                    </div>
                    <div class="rota-item">
                        <span class="rota-label">⏰ Tempo Extra:</span>
                        <span class="rota-valor custo">+${Math.floor(Math.abs(economiaTempo) / 60)}h ${Math.abs(economiaTempo) % 60}min (${Math.abs(percentualTempo).toFixed(1)}%)</span>
                    </div>
                `}
            </div>
        `;
        
        rotaCard.addEventListener('click', () => selecionarRota(rota));
        grid.appendChild(rotaCard);
    });
}

// ------------------ SELECIONAR ROTA ------------------
function selecionarRota(rota) {
    rotaAtiva = rota;
    
    // Destacar rota selecionada
    document.querySelectorAll('.rota-card').forEach(card => {
        card.style.borderWidth = '2px';
    });
    
    event.currentTarget.style.borderWidth = '4px';
    
    // Posicionar GPS no início da rota
    const primeiraCidade = cidades[rota.pontos[0]];
    const gpsDot = document.querySelector('.gps-dot');
    gpsDot.style.left = (primeiraCidade.x * 2) + '%';
    gpsDot.style.top = (primeiraCidade.y * 2) + '%';
    
    // Atualizar informações
    document.getElementById('posicaoAtual').textContent = cidades[rota.pontos[0]].nome;
    document.getElementById('distanciaRestante').textContent = rota.distancia + ' km';
    document.getElementById('tempoRestante').textContent = `${Math.floor(rota.tempo / 60)}:${(rota.tempo % 60).toString().padStart(2, '0')}`;
    
    alert(`Rota "${rota.nome}" selecionada!\n\nDistância: ${rota.distancia} km\nTempo: ${Math.floor(rota.tempo / 60)}h ${rota.tempo % 60}min\nCombustível: ${rota.combustivel} L\nCO₂: ${rota.co2} kg`);
    
    // Atualizar gráficos com dados da rota selecionada
    atualizarGraficos();
}

// ------------------ SIMULAÇÃO GPS ------------------
function iniciarSimulacao() {
    if (!rotaAtiva) {
        alert('Selecione uma rota primeiro!');
        return;
    }
    
    if (simulacaoAtiva) return;
    
    simulacaoAtiva = true;
    posicaoAtual = 0;
    
    intervaloSimulacao = setInterval(() => {
        posicaoAtual += 1;
        
        if (posicaoAtual >= 100) {
            finalizarSimulacao();
            return;
        }
        
        // Calcular posição atual na rota
        const posicaoNaRota = posicaoAtual / 100;
        const distanciaPercorrida = rotaAtiva.distancia * posicaoNaRota;
        const distanciaRestante = rotaAtiva.distancia - distanciaPercorrida;
        const tempoRestante = Math.round(distanciaRestante / velocidadeSimulacao * 60);
        
        // Atualizar posição do GPS
        atualizarPosicaoGPS(posicaoNaRota);
        
        // Atualizar informações
        document.getElementById('posicaoAtual').textContent = `${Math.round(posicaoNaRota * 100)}% da viagem`;
        document.getElementById('velocidadeAtual').textContent = velocidadeSimulacao + ' km/h';
        document.getElementById('distanciaRestante').textContent = Math.round(distanciaRestante) + ' km';
        document.getElementById('tempoRestante').textContent = `${Math.floor(tempoRestante / 60)}:${(tempoRestante % 60).toString().padStart(2, '0')}`;
        
    }, 100); // Atualizar a cada 100ms
}

function pausarSimulacao() {
    if (intervaloSimulacao) {
        clearInterval(intervaloSimulacao);
        simulacaoAtiva = false;
    }
}

function resetarSimulacao() {
    pausarSimulacao();
    posicaoAtual = 0;
    
    if (rotaAtiva) {
        const primeiraCidade = cidades[rotaAtiva.pontos[0]];
        const gpsDot = document.querySelector('.gps-dot');
        gpsDot.style.left = (primeiraCidade.x * 2) + '%';
        gpsDot.style.top = (primeiraCidade.y * 2) + '%';
        
        document.getElementById('posicaoAtual').textContent = primeiraCidade.nome;
        document.getElementById('velocidadeAtual').textContent = '0 km/h';
        document.getElementById('distanciaRestante').textContent = rotaAtiva.distancia + ' km';
        document.getElementById('tempoRestante').textContent = `${Math.floor(rotaAtiva.tempo / 60)}:${(rotaAtiva.tempo % 60).toString().padStart(2, '0')}`;
    }
}

function finalizarSimulacao() {
    pausarSimulacao();
    alert('🎉 Viagem concluída!\n\nRota otimizada finalizada com sucesso!');
}

// ------------------ ATUALIZAR POSIÇÃO GPS ------------------
function atualizarPosicaoGPS(progresso) {
    if (!rotaAtiva || rotaAtiva.pontos.length < 2) return;
    
    const gpsDot = document.querySelector('.gps-dot');
    
    if (rotaAtiva.pontos.length === 2) {
        // Rota direta
        const ponto1 = cidades[rotaAtiva.pontos[0]];
        const ponto2 = cidades[rotaAtiva.pontos[1]];
        
        const x = ponto1.x + (ponto2.x - ponto1.x) * progresso;
        const y = ponto1.y + (ponto2.y - ponto1.y) * progresso;
        
        gpsDot.style.left = (x * 2) + '%';
        gpsDot.style.top = (y * 2) + '%';
    } else {
        // Rota com pontos intermediários
        const segmentos = rotaAtiva.pontos.length - 1;
        const segmentoAtual = Math.floor(progresso * segmentos);
        const progressoSegmento = (progresso * segmentos) % 1;
        
        if (segmentoAtual < segmentos) {
            const ponto1 = cidades[rotaAtiva.pontos[segmentoAtual]];
            const ponto2 = cidades[rotaAtiva.pontos[segmentoAtual + 1]];
            
            const x = ponto1.x + (ponto2.x - ponto1.x) * progressoSegmento;
            const y = ponto1.y + (ponto2.y - ponto1.y) * progressoSegmento;
            
            gpsDot.style.left = (x * 2) + '%';
            gpsDot.style.top = (y * 2) + '%';
        }
    }
}

// ------------------ CALCULAR ECONOMIA AMBIENTAL ------------------
function calcularEconomiaAmbiental() {
    if (rotasCalculadas.length === 0) return;
    
    const rotaOtimizada = rotasCalculadas[0];
    const rotaAlternativa1 = rotasCalculadas[1];
    const rotaAlternativa2 = rotasCalculadas[2];
    
    // Economia vs Alternativa 1
    const economiaCombustivel1 = rotaAlternativa1.combustivel - rotaOtimizada.combustivel;
    const reducaoCO2_1 = rotaAlternativa1.co2 - rotaOtimizada.co2;
    const economiaTempo1 = rotaAlternativa1.tempo - rotaOtimizada.tempo;
    const economiaTotal1 = rotaAlternativa1.custo - rotaOtimizada.custo;
    
    // Economia vs Alternativa 2 (mais cara)
    const economiaCombustivel2 = rotaAlternativa2.combustivel - rotaOtimizada.combustivel;
    const reducaoCO2_2 = rotaAlternativa2.co2 - rotaOtimizada.co2;
    const economiaTempo2 = rotaAlternativa2.tempo - rotaOtimizada.tempo;
    const economiaTotal2 = rotaAlternativa2.custo - rotaOtimizada.custo;
    
    // Mostrar economia média
    const economiaCombustivelMedia = (economiaCombustivel1 + economiaCombustivel2) / 2;
    const reducaoCO2Media = (reducaoCO2_1 + reducaoCO2_2) / 2;
    const economiaTempoMedia = (economiaTempo1 + economiaTempo2) / 2;
    const economiaTotalMedia = (economiaTotal1 + economiaTotal2) / 2;
    
    document.getElementById('economiaCombustivel').textContent = `R$ ${(economiaCombustivelMedia * precosCombustivel.diesel).toFixed(2)}`;
    document.getElementById('reducaoCO2').textContent = `${reducaoCO2Media.toFixed(1)} kg`;
    document.getElementById('economiaTempo').textContent = `${Math.floor(economiaTempoMedia / 60)}h ${Math.round(economiaTempoMedia % 60)}min`;
    document.getElementById('economiaTotal').textContent = `R$ ${economiaTotalMedia.toFixed(2)}`;
    
    // Adicionar tooltip com detalhes
    const tooltipCombustivel = `vs Alternativa 1: R$ ${(economiaCombustivel1 * precosCombustivel.diesel).toFixed(2)}\nvs Alternativa 2: R$ ${(economiaCombustivel2 * precosCombustivel.diesel).toFixed(2)}`;
    const tooltipCO2 = `vs Alternativa 1: ${reducaoCO2_1.toFixed(1)} kg\nvs Alternativa 2: ${reducaoCO2_2.toFixed(1)} kg`;
    const tooltipTempo = `vs Alternativa 1: ${Math.floor(economiaTempo1 / 60)}h ${economiaTempo1 % 60}min\nvs Alternativa 2: ${Math.floor(economiaTempo2 / 60)}h ${economiaTempo2 % 60}min`;
    const tooltipTotal = `vs Alternativa 1: R$ ${economiaTotal1.toFixed(2)}\nvs Alternativa 2: R$ ${economiaTotal2.toFixed(2)}`;
    
    document.getElementById('economiaCombustivel').title = tooltipCombustivel;
    document.getElementById('reducaoCO2').title = tooltipCO2;
    document.getElementById('economiaTempo').title = tooltipTempo;
    document.getElementById('economiaTotal').title = tooltipTotal;
}

// ------------------ MOSTRAR PROJEÇÕES ------------------
function mostrarProjecao(periodo) {
    // Atualizar botões ativos
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('ativo'));
    event.target.classList.add('ativo');
    
    if (rotasCalculadas.length === 0) {
        document.getElementById('projecoesContent').innerHTML = '<p>Calcule uma rota primeiro para ver as projeções.</p>';
        return;
    }
    
    const rotaOtimizada = rotasCalculadas[0];
    const rotaMaisCara = rotasCalculadas[rotasCalculadas.length - 1];
    
    let anos = 10;
    switch(periodo) {
        case '50anos': anos = 50; break;
        case '100anos': anos = 100; break;
    }
    
    // Viagens por ano (assumindo 2 viagens por mês)
    const viagensPorAno = 24;
    const totalViagens = anos * viagensPorAno;
    
    const economiaCombustivel = (rotaMaisCara.combustivel - rotaOtimizada.combustivel) * totalViagens;
    const reducaoCO2 = (rotaMaisCara.co2 - rotaOtimizada.co2) * totalViagens;
    const economiaTempo = (rotaMaisCara.tempo - rotaOtimizada.tempo) * totalViagens;
    const economiaTotal = (rotaMaisCara.custo - rotaOtimizada.custo) * totalViagens;
    
    const html = `
        <div class="projecao-item">
            <span class="projecao-label">⛽ Economia Total de Combustível</span>
            <span class="projecao-valor">${economiaCombustivel.toFixed(0)} L</span>
        </div>
        <div class="projecao-item">
            <span class="projecao-label">🌿 Redução Total de CO₂</span>
            <span class="projecao-valor">${reducaoCO2.toFixed(0)} kg</span>
        </div>
        <div class="projecao-item">
            <span class="projecao-label">⏰ Economia Total de Tempo</span>
            <span class="projecao-valor">${Math.floor(economiaTempo / 60)}h ${Math.round(economiaTempo % 60)}min</span>
        </div>
        <div class="projecao-item">
            <span class="projecao-label">💰 Economia Total Financeira</span>
            <span class="projecao-valor">R$ ${economiaTotal.toFixed(2)}</span>
        </div>
        <div class="projecao-item">
            <span class="projecao-label">🚛 Total de Viagens Otimizadas</span>
            <span class="projecao-valor">${totalViagens.toLocaleString()}</span>
        </div>
        <div class="projecao-item">
            <span class="projecao-label">🌍 Equivalente em Árvores Plantadas</span>
            <span class="projecao-valor">${Math.round(reducaoCO2 / 22)} árvores</span>
        </div>
    `;
    
    document.getElementById('projecoesContent').innerHTML = html;
}

// ------------------ INICIALIZAR GRÁFICOS ------------------
function inicializarGraficos() {
    // Gráfico de economia de combustível
    const ctxCombustivel = document.getElementById('graficoCombustivel').getContext('2d');
    new Chart(ctxCombustivel, {
        type: 'line',
        data: {
            labels: ['Ano 1', 'Ano 5', 'Ano 10', 'Ano 20', 'Ano 50', 'Ano 100'],
            datasets: [{
                label: 'Economia de Combustível (L)',
                data: [0, 0, 0, 0, 0, 0],
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: '🌱 Economia Acumulada de Combustível - Calcule uma rota para ver os dados'
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Litros Economizados'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Anos'
                    }
                }
            }
        }
    });
    
    // Gráfico de redução de CO₂
    const ctxCO2 = document.getElementById('graficoCO2').getContext('2d');
    new Chart(ctxCO2, {
        type: 'bar',
        data: {
            labels: ['Ano 1', 'Ano 5', 'Ano 10', 'Ano 20', 'Ano 50', 'Ano 100'],
            datasets: [{
                label: 'Redução de CO₂ (kg)',
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: '🌿 Redução Acumulada de CO₂ - Calcule uma rota para ver os dados'
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'kg de CO₂ Reduzidos'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Anos'
                    }
                }
            }
        }
    });
    
    // Gráfico de economia financeira
    const ctxFinanceiro = document.getElementById('graficoFinanceiro');
    if (ctxFinanceiro) {
        new Chart(ctxFinanceiro, {
            type: 'line',
            data: {
                labels: ['Ano 1', 'Ano 5', 'Ano 10', 'Ano 20', 'Ano 50', 'Ano 100'],
                datasets: [{
                    label: 'Economia Financeira (R$)',
                    data: [0, 0, 0, 0, 0, 0],
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: {
                        display: true,
                        text: '💰 Economia Financeira Acumulada - Calcule uma rota para ver os dados'
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Reais Economizados'
                        },
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Anos'
                        }
                    }
                }
            }
        });
    }
}

// ------------------ ATUALIZAR GRÁFICOS ------------------
function atualizarGraficos() {
    if (rotasCalculadas.length === 0) return;
    
    const rotaOtimizada = rotasCalculadas[0];
    const rotaAlternativa1 = rotasCalculadas[1];
    const rotaAlternativa2 = rotasCalculadas[2];
    
    // Calcular economia média por viagem
    const economiaCombustivel1 = rotaAlternativa1.combustivel - rotaOtimizada.combustivel;
    const economiaCombustivel2 = rotaAlternativa2.combustivel - rotaOtimizada.combustivel;
    const economiaCombustivelMedia = (economiaCombustivel1 + economiaCombustivel2) / 2;
    
    const economiaCO2_1 = rotaAlternativa1.co2 - rotaOtimizada.co2;
    const economiaCO2_2 = rotaAlternativa2.co2 - rotaOtimizada.co2;
    const economiaCO2Media = (economiaCO2_1 + economiaCO2_2) / 2;
    
    // Viagens por ano (2 viagens por mês)
    const viagensPorAno = 24;
    
    const anos = [1, 5, 10, 20, 50, 100];
    const economiaAcumulada = anos.map(ano => economiaCombustivelMedia * viagensPorAno * ano);
    const co2Acumulado = anos.map(ano => economiaCO2Media * viagensPorAno * ano);
    
    // Calcular economia financeira
    const economiaFinanceira = anos.map(ano => economiaCombustivelMedia * precosCombustivel.diesel * viagensPorAno * ano);
    
    // Atualizar gráfico de combustível
    const graficoCombustivel = Chart.getChart('graficoCombustivel');
    if (graficoCombustivel) {
        graficoCombustivel.data.datasets[0].data = economiaAcumulada;
        graficoCombustivel.data.datasets[0].label = `Economia de Combustível (${economiaCombustivelMedia.toFixed(1)}L/viagem)`;
        graficoCombustivel.options.plugins.title = {
            display: true,
            text: `🌱 Economia Acumulada de Combustível - ${viagensPorAno} viagens/ano`
        };
        graficoCombustivel.update();
    }
    
    // Atualizar gráfico de CO₂
    const graficoCO2 = Chart.getChart('graficoCO2');
    if (graficoCO2) {
        graficoCO2.data.datasets[0].data = co2Acumulado;
        graficoCO2.data.datasets[0].label = `Redução de CO₂ (${economiaCO2Media.toFixed(1)}kg/viagem)`;
        graficoCO2.options.plugins.title = {
            display: true,
            text: `🌿 Redução Acumulada de CO₂ - ${viagensPorAno} viagens/ano`
        };
        graficoCO2.update();
    }
    
    // Adicionar gráfico de economia financeira se não existir
    const graficoFinanceiro = Chart.getChart('graficoFinanceiro');
    if (!graficoFinanceiro) {
        const ctxFinanceiro = document.getElementById('graficoFinanceiro');
        if (ctxFinanceiro) {
            new Chart(ctxFinanceiro, {
                type: 'line',
                data: {
                    labels: ['Ano 1', 'Ano 5', 'Ano 10', 'Ano 20', 'Ano 50', 'Ano 100'],
                    datasets: [{
                        label: `Economia Financeira (R$ ${(economiaCombustivelMedia * precosCombustivel.diesel).toFixed(2)}/viagem)`,
                        data: economiaFinanceira,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        title: {
                            display: true,
                            text: `💰 Economia Financeira Acumulada - ${viagensPorAno} viagens/ano`
                        }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + value.toLocaleString('pt-BR');
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Mostrar resumo da economia calculada
    mostrarResumoEconomia(economiaCombustivelMedia, economiaCO2Media, economiaFinanceira[0]);
}

// ------------------ MOSTRAR RESUMO DA ECONOMIA ------------------
function mostrarResumoEconomia(economiaCombustivel, economiaCO2, economiaFinanceira) {
    // Criar ou atualizar elemento de resumo
    let resumoElement = document.getElementById('resumoEconomia');
    if (!resumoElement) {
        resumoElement = document.createElement('div');
        resumoElement.id = 'resumoEconomia';
        resumoElement.className = 'resumo-economia';
        document.querySelector('.graficos-economia').insertBefore(resumoElement, document.querySelector('.graficos-grid'));
    }
    
    const economiaAnual = economiaFinanceira;
    const economiaMensal = economiaAnual / 12;
    
    resumoElement.innerHTML = `
        <div class="resumo-header">
            <h3>📊 Resumo da Economia Calculada</h3>
            <p>Baseado na rota otimizada vs rotas alternativas</p>
        </div>
        <div class="resumo-grid">
            <div class="resumo-item">
                <div class="resumo-icon">⛽</div>
                <div class="resumo-info">
                    <div class="resumo-valor">${economiaCombustivel.toFixed(1)} L</div>
                    <div class="resumo-label">Economia por viagem</div>
                </div>
            </div>
            <div class="resumo-item">
                <div class="resumo-icon">🌿</div>
                <div class="resumo-info">
                    <div class="resumo-valor">${economiaCO2.toFixed(1)} kg</div>
                    <div class="resumo-label">CO₂ economizado por viagem</div>
                </div>
            </div>
            <div class="resumo-item">
                <div class="resumo-icon">💰</div>
                <div class="resumo-info">
                    <div class="resumo-valor">R$ ${(economiaCombustivel * precosCombustivel.diesel).toFixed(2)}</div>
                    <div class="resumo-label">Economia por viagem</div>
                </div>
            </div>
            <div class="resumo-item">
                <div class="resumo-icon">📈</div>
                <div class="resumo-info">
                    <div class="resumo-valor">R$ ${economiaAnual.toFixed(2)}</div>
                    <div class="resumo-label">Economia anual (24 viagens)</div>
                </div>
            </div>
        </div>
    `;
}

