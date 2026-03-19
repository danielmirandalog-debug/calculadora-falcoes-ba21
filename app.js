// Inicialização Global
window.onload = function() {
    gerarEstruturaParcelas();
    buscarCDI();
}

// Gera inputs de 2x a 21x automaticamente
function gerarEstruturaParcelas() {
    let mpWrap = document.getElementById("mpParcelas");
    let outWrap = document.getElementById("outrasParcelas");
    let hMP = ""; let hOut = "";

    for (let i = 2; i <= 21; i++) {
        hMP += `<label>${i}x (%)</label> <input id="mp${i}" type="number" step="0.01" class="input-mp">`;
        hOut += `<label>${i}x (%)</label> <input id="out${i}_manual" type="number" step="0.01" class="input-out">`;
    }
    mpWrap.innerHTML = hMP;
    outWrap.innerHTML = hOut;
}

// Busca Taxa Selic/CDI Real do Banco Central
async function buscarCDI() {
    try {
        const r = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        const d = await r.json();
        document.getElementById("cofrinho_percentual").value = parseFloat(d[0].valor);
    } catch (e) {
        document.getElementById("cofrinho_percentual").value = 10.75; // Fallback
    }
}

// FUNÇÕES DE LIMPEZA (Acionadas por botões ou OCR)
function limparSecao(tipo) {
    if (tipo === 'mp') {
        document.getElementById("mp_pix").value = "0.49";
        document.getElementById("mp_debito").value = "0.99";
        document.getElementById("mp1").value = "3.05";
        document.querySelectorAll(".input-mp").forEach(i => i.value = "");
    } else if (tipo === 'out') {
        const ids = ["out_pix","out_debito","out1","mdr1","mdr2","mdr3","antecipacao","out_pix_manual","out_debito_manual","out1_manual"];
        ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ""; });
        document.querySelectorAll(".input-out").forEach(i => i.value = "");
    } else if (tipo === 'share') {
        const ids = ["share_pix","share_debito","share_1x","share_2x","share_4x","share_6x","share_10x"];
        ids.forEach(id => document.getElementById(id).value = "");
        atualizarBarra();
    } else if (tipo === 'cofrinho') {
        document.getElementById("custos_fixos_total").value = "";
        document.getElementById("cofrinho_reserva").value = "";
        buscarCDI();
    }
}

// Alternar entre modo MDR e Manual
function trocarModoOutras() {
    let m = document.querySelector('input[name="modoOutras"]:checked').value;
    document.getElementById("modoMDR").style.display = (m === "mdr") ? "block" : "none";
    document.getElementById("modoManual").style.display = (m === "manual") ? "block" : "none";
}

// Cálculo da Tabela Comparativa
function simular() {
    let v = parseFloat(document.getElementById("valor").value);
    if (!v) { alert("Por favor, digite um valor de venda."); return; }

    let mp = { pix: parseFloat(mp_pix.value), deb: parseFloat(mp_debito.value), 1: parseFloat(mp1.value) };
    for (let i = 2; i <= 21; i++) mp[i] = parseFloat(document.getElementById("mp" + i).value) || 0;

    let out = {};
    let modo = document.querySelector('input[name="modoOutras"]:checked').value;

    if (modo === "manual") {
        out.pix = parseFloat(out_pix_manual.value) || 0;
        out.deb = parseFloat(out_debito_manual.value) || 0;
        out[1] = parseFloat(out1_manual.value) || 0;
        for (let i = 2; i <= 21; i++) out[i] = parseFloat(document.getElementById("out" + i + "_manual").value) || 0;
    } else {
        out.pix = parseFloat(out_pix.value) || 0;
        out.deb = parseFloat(out_debito.value) || 0;
        out[1] = parseFloat(out1.value) || 0;
        let m1 = parseFloat(mdr1.value)||0, m2 = parseFloat(mdr2.value)||0, m3 = parseFloat(mdr3.value)||0, ant = parseFloat(antecipacao.value)||0;
        for (let i = 2; i <= 6; i++) out[i] = m1 + (ant * (i-1));
        for (let i = 7; i <= 12; i++) out[i] = m2 + (ant * (i-1));
        for (let i = 13; i <= 21; i++) out[i] = m3 + (ant * (i-1));
    }

    let tab = `<table><tr><th>Plano</th><th>MP %</th><th>Líquido</th><th>Conc %</th><th>Líquido</th></tr>`;
    let rows = ["pix", "deb", 1, 2, 3, 6, 10, 12, 18, 21]; // Exibir principais
    
    rows.forEach(r => {
        let label = r === "pix" ? "Pix" : r === "deb" ? "Débito" : r + "x";
        let tMP = mp[r], tOut = out[r];
        let liqMP = v * (1 - (tMP/100)), liqOut = v * (1 - (tOut/100));
        let badMP = tMP > tOut ? "taxaRuim" : "";
        let badOut = tOut > tMP ? "taxaRuim" : "";
        tab += `<tr><td>${label}</td><td class="${badMP}">${tMP.toFixed(2)}%</td><td>${liqMP.toFixed(2)}</td><td class="${badOut}">${tOut.toFixed(2)}%</td><td>${liqOut.toFixed(2)}</td></tr>`;
    });
    document.getElementById("resultado").innerHTML = tab + "</table>";
    document.getElementById("dataSimulacao").innerText = "Gerado em: " + new Date().toLocaleString();
}

// Atualiza Barra de Progresso do Share
function atualizarBarra() {
    let ids = ["share_pix","share_debito","share_1x","share_2x","share_4x","share_6x","share_10x"];
    let soma = 0;
    ids.forEach(id => soma += parseFloat(document.getElementById(id).value) || 0);
    if(soma > 100) { alert("A soma do share ultrapassou 100%!"); return; }
    document.getElementById("contador").innerText = soma + "%";
    document.getElementById("barra").style.width = soma + "%";
}

// Cálculo de Economia e Faturamento Mensal
function simularFaturamento() {
    let f = parseFloat(faturamento.value) || 0;
    if(f <= 0) { alert("Informe o faturamento mensal."); return; }

    let econMedia = f * 0.025; // Baseado em 2.5% de diferença média
    let custoFixo = parseFloat(custos_fixos_total.value) || 0;
    let ecoMes = econMedia + custoFixo;
    
    let res = parseFloat(cofrinho_reserva.value) || 0;
    let cdi = parseFloat(cofrinho_percentual.value) || 10.75;
    let rend5Anos = (res * 60) * (1 + (cdi/100) * 2.5); // Projeção simples juros compostos parcial

    document.getElementById("resultadoFaturamento").innerHTML = `
        <div style="background:#e3f2fd; padding:15px; border-radius:8px; margin-top:15px; border-left: 5px solid #2196f3;">
            <b>💰 Economia Mensal Estimada:</b> R$ ${ecoMes.toFixed(2)}<br>
            <b>📅 Economia em 5 Anos:</b> R$ ${(ecoMes * 60).toFixed(2)}<br>
            <b>📈 Saldo Cofrinho (5 anos):</b> R$ ${rend5Anos.toFixed(2)}
        </div>`;
    
    gerarGrafico(ecoMes * 12, ecoMes * 60, rend5Anos);
}

// Gerador de Gráfico
function gerarGrafico(a, c, cof) {
    let ctx = document.getElementById("graficoEconomia");
    if (window.meuGrafico) window.meuGrafico.destroy();
    window.meuGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Eco 1 Ano", "Eco 5 Anos", "Cofre 5 Anos"],
            datasets: [{ label: 'R$', data: [a, c, cof], backgroundColor: ['#FFE600', '#FFD400', '#3483FA'] }]
        }
    });
}

// Lógica de OCR (Câmera / Galeria)
async function processarOCRMP(event) {
    limparSecao('mp'); // APAGA TUDO ANTES DE COMEÇAR
    executarOCR(event, "mp");
}

async function processarOCRConc(event) {
    limparSecao('out'); // APAGA TUDO ANTES DE COMEÇAR
    executarOCR(event, "out");
}

async function executarOCR(event, prefixo) {
    const file = event.target.files[0];
    if(!file) return;
    
    alert("Iniciando leitura da imagem... Aguarde o aviso de conclusão.");
    
    try {
        const result = await Tesseract.recognize(file, 'por');
        let txt = result.data.text.toLowerCase().replace(/,/g, ".");
        
        // Regex para capturar "Número x Taxa" (Ex: 12x 15.50)
        let regex = /(\d{1,2})\s*x\s*([\d.]+)/g;
        let match;
        while ((match = regex.exec(txt)) !== null) {
            let parc = parseInt(match[1]);
            let taxa = parseFloat(match[2]);
            if (parc >= 1 && parc <= 21) {
                let id = (parc === 1) ? (prefixo === "mp" ? "mp1" : "out1_manual") : (prefixo + parc + (prefixo === "out" ? "_manual" : ""));
                if(document.getElementById(id)) document.getElementById(id).value = taxa.toFixed(2);
            }
        }
        alert("Leitura finalizada! Verifique os campos.");
    } catch (err) {
        alert("Erro ao ler imagem. Tente uma foto mais nítida.");
    }
}

// Exportar para Imagem (PNG)
function exportar() {
    html2canvas(document.getElementById("conteudoParaExportar")).then(canvas => {
        let link = document.createElement("a");
        link.download = "Relatorio_Faloes_BA21.png";
        link.href = canvas.toDataURL();
        link.click();
    });
}
