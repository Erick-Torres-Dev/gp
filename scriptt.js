
function gerarRota() {
    const tabela = document.getElementById("tabelaRotas");
    tabela.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      tabela.innerHTML += `<tr><td>${i}</td><td>Fábrica</td><td>Cliente ${i}</td><td>Pendente</td></tr>`;
    }
    atualizarKPIs(200, 50, 2);
    document.getElementById("relatorioTexto").innerText = "Rotas geradas com base no cenário atual.";
  }
  
  function otimizarRota() {
    atualizarKPIs(150, 40, 0);
    document.getElementById("relatorioTexto").innerText = "Rotas otimizadas: Menor emissão e maior eficiência.";
  }
  
  function simularSensores() {
    const ul = document.getElementById("statusPaletes");
    ul.innerHTML = "";
    for (let i = 1; i <= 3; i++) {
      const status = Math.random() > 0.5 ? "OK" : "Problema";
      ul.innerHTML += `<li>Palete ${i}: ${status}</li>`;
    }
    document.getElementById("relatorioTexto").innerText = "Sensores simulados com sucesso.";
  }
  
  function resetar() {
    document.getElementById("tabelaRotas").innerHTML = "";
    document.getElementById("statusPaletes").innerHTML = "";
    atualizarKPIs(0, 0, 0, true);
    document.getElementById("relatorioTexto").innerText = "Nenhum relatório gerado.";
  }
  
  function atualizarKPIs(co2, km, ociosas, reset=false) {
    document.getElementById("co2").innerText = co2;
    document.getElementById("km").innerText = km;
    document.getElementById("ociosas").innerText = ociosas;
    document.getElementById("eficiencia").innerText = reset ? "0%" : `${100 - ociosas*10}%`;
  }
 