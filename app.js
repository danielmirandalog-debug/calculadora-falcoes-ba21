document.addEventListener("DOMContentLoaded", function() {
    gerarInputs();
    buscarCDI();
    document.getElementById("input_data").value = new Date().toLocaleDateString('pt-BR');
});

const IDs_SHARE = ["share_pix","share_debito","share_1x","share_2x","share_3x","share_4x","share_6x","share_10x"];

function gerarInputs() {
    let mpH = ""; let outH = "";
    for (let i = 2; i <= 18; i++) {
        mpH += `<span><label>${i}x (%)</label> <input id="mp${i}" type="number" step="0.01" class="input-mp"></span>`;
        outH += `<span><label>${i}x (%)</label> <input id="out${i}_manual" type="number" step="0.01" class="input-out"></span>`;
    }
    document.getElementById("mpParcelas").innerHTML = mpH;
    document.getElementById("outrasParcelas").innerHTML = outH;
}

async function buscarCDI() {
    try {
        const r = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        const d = await r.json();
        window.selicAtual = parseFloat(d[0].valor);
    } catch (e) { window.selicAtual = 10.75; }
}

function limparSecao(tipo) {
    if (tipo === 'mp') {
        document.getElementById("mp_pix").value = "0.49"; document.getElementById("mp_debito").value = "0.99";
        document.getElementById("mp1").value = "3.05";
        document.querySelectorAll(".input-mp").forEach(i => i.value = "");
    } else if (tipo === 'out') {
        ["out_pix","out_debito","out1","mdr1","mdr2","mdr3","antecipacao","out_pix_manual","out_debito_manual","out1_manual"].forEach(id => {
            if(document.getElementById(id)) document.getElementById(id).value = "";
        });
        document.querySelectorAll(".input-out").forEach(i => i.value = "");
    } else if (tipo === 'share') {
        IDs_SHARE.forEach(id => document.getElementById(id).value = "");
        atualizarBarra();
    } else if (tipo === 'fixos') {
        ["fixo_sistema","fixo_maquina","fixo_cesta","fixo_manutencao"].forEach(id => document.getElementById(id).value = "");
        document.getElementById("check_pix_taxa").checked = false;
    } else if (tipo === 'cofrinho') {
        document.getElementById("cofrinho_reserva").value = "";
        document.getElementById("cofrinho_cdi_alvo").value = "105";
    }
}

function trocarModoOutras() {
    let m = document.querySelector('input[name="modoOutras"]:checked').value;
    document.getElementById("modoMDR").style.display = (m === "mdr") ? "block" : "none";
    document.getElementById("modoManual").style.display = (m === "manual") ? "block" : "none";
}

// FUNÇÃO ATUALIZADA COM LÓGICA DE ANTECIPAÇÃO REAL (MODELO DAS FOTOS)
function simular() {
    let v = parseFloat(document.getElementById("valor").value);
    if (!v) { alert("Informe o valor da venda."); return; }

    let mp = { pix: parseFloat(mp_pix.value), debito: parseFloat(mp_debito.value), 1: parseFloat(mp1.value) };
    for (let i = 2; i <= 18; i++) {
        let val = document.getElementById("mp" + i).value;
        mp[i] = (val === "" || isNaN(val)) ? null : parseFloat(val);
    }

    let out = {};
    let modo = document.querySelector('input[name="modoOutras"]:checked').value;

    if (modo === "mdr") {
        out.pix = parseFloat(out_pix.value) || 0; 
        out.debito = parseFloat(out_debito.value) || 0;
        out[1] = parseFloat(out1.value) || 0;
        
        let mdr_2_6 = parseFloat(mdr1.value) || 0;
        let mdr_7_12 = parseFloat(mdr2.value) || 0;
        let mdr_13_18 = parseFloat(mdr3.value) || 0;
        let ant_mensal = parseFloat(antecipacao.value) || 0;

        // Cálculo D+1 Real: MDR + (Antecipação * Prazo Médio)
        // Onde Prazo Médio = (n + 1) / 2
        for (let i = 2; i <= 6; i++) { 
            let tx = mdr_2_6 + (ant_mensal * ((i + 1) / 2)); 
            out[i] = tx; 
            document.getElementById("out" + i + "_manual").value = tx.toFixed(2); 
        }
        for (let i = 7; i <= 12; i++) { 
            let tx = mdr_7_12 + (ant_mensal * ((i + 1) / 2)); 
            out[i] = tx; 
            document.getElementById("out" + i + "_manual").value = tx.toFixed(2); 
        }
        for (let i = 13; i <= 18; i++) { 
            let tx = mdr_13_18 + (ant_mensal * ((i + 1) / 2)); 
            out[i] = tx; 
            document.getElementById("out" + i + "_manual").value = tx.toFixed(2); 
        }
        
        document.getElementById("out_pix_manual").value = out.pix.toFixed(2);
        document.getElementById("out_debito_manual").value = out.debito.toFixed(2);
        document.getElementById("out1_manual").value = out[1].toFixed(2);
        
        // Mantém visual e troca modo para permitir conferência manual
        document.getElementById("radioManual").checked = true;
        trocarModoOutras();
    } else {
        out.pix = parseFloat(document.getElementById("out_pix_manual").value) || 0;
        out.debito = parseFloat(document.getElementById("out_debito_manual").value) || 0;
        out[1] = parseFloat(document.getElementById("out1_manual").value) || 0;
        for (let i = 2; i <= 18; i++) out[i] = parseFloat(document.getElementById("out" + i + "_manual").value) || 0;
    }

    // Geração da Tabela de Comparação
    let html = `<table><tr><th>Plano</th><th>Mercado Pago</th><th>Concorrência</th><th>Diferença</th></tr>`;
    let parcelas = ["pix", "debito"];
    for(let i=1; i<=18; i++) parcelas.push(i);

    parcelas.forEach(p => {
        let tMP = (p === "pix") ? mp.pix : (p === "debito" ? mp.debito : mp[p]);
        if (tMP !== null && !isNaN(tMP)) {
            let tOut = (p === "pix") ? out.pix : (p === "debito" ? out.debito : out[p]);
            let nome = p === "pix" ? "Pix" : p === "debito" ? "Débito" : p + "x";
            let dif = (tOut - tMP).toFixed(2);
            let corDiferenca = dif >= 0 ? '#007bff' : 'red';
            html += `<tr><td><b>${nome}</b></td><td class="${tMP > tOut ? 'taxaRuim' : ''}">${tMP.toFixed(2)}%</td><td>${tOut.toFixed(2)}%</td><td style="color:${corDiferenca}"><b>${dif}%</b></td></tr>`;
        }
    });
    html += "</table>";
    document.getElementById("resultado").innerHTML = html;
    document.getElementById("btnExportarSimples").style.display = "block";
}

function atualizarBarra() {
    let soma = 0;
    IDs_SHARE.forEach(id => soma += parseFloat(document.getElementById(id).value) || 0);
    document.getElementById("contador").innerText = Math.round(soma) + "%";
    document.getElementById("barra").style.width = soma + "%";
    document.getElementById("barra").style.background = (Math.round(soma) === 100) ? "#4CAF50" : "#FFE600";
}

function simularFaturamento() {
    let soma = 0;
    IDs_SHARE.forEach(id => soma += parseFloat(document.getElementById(id).value) || 0);
    if (Math.round(soma) !== 100) return alert("O Share total deve somar 100%!");

    let f = parseFloat(faturamento.value) || 0;
    if(f <= 0) return alert("Informe o faturamento mensal.");

    const getTaxa = (p, tipo) => {
        let id = (tipo === 'mp') ? (p === 'pix' ? 'mp_pix' : p === 'debito' ? 'mp_debito' : 'mp' + p) : 
                                  (p === 'pix' ? 'out_pix_manual' : p === 'debito' ? 'out_debito_manual' : 'out' + p + '_manual');
        let el = document.getElementById(id);
        return el ? parseFloat(el.value) || 0 : 0;
    };

    let custoMP = 0;
    let custoConc = 0;

    const shareMap = { pix: 'share_pix', debito: 'share_debito', 1: 'share_1x', 2: 'share_2x', 3: 'share_3x', 4: 'share_4x', 6: 'share_6x', 10: 'share_10x' };

    Object.keys(shareMap).forEach(p => {
        let percShare = parseFloat(document.getElementById(shareMap[p]).value) || 0;
        let valorFatia = f * (percShare / 100);
        
        let taxaMP = getTaxa(p, 'mp');
        let taxaConc = getTaxa(p, 'out');

        if(p === 'pix' && document.getElementById("check_pix_taxa").checked) {
            taxaConc += 1.00;
        }

        custoMP += valorFatia * (taxaMP / 100);
        custoConc += valorFatia * (taxaConc / 100);
    });

    let fixos = (parseFloat(fixo_sistema.value)||0) + (parseFloat(fixo_maquina.value)||0) + (parseFloat(fixo_cesta.value)||0) + (parseFloat(fixo_manutencao.value)||0);
    custoConc += fixos;

    let ecoMes = custoConc - custoMP;
    let res = parseFloat(cofrinho_reserva.value) || 0;
    let cdi = (window.selicAtual || 10.75) - 0.1;
    let alvo = (parseFloat(cofrinho_cdi_alvo.value) || 105) / 100;

    const calcCofre = (m) => {
        let s = 0;
        for(let i=0; i<m; i++){
            s += res;
            let r = (s <= 10000) ? s * (cdi * alvo / 1200) : (s <= 100000 ? s * (cdi / 1200) : 0);
            s += r;
        }
        return s;
    };

    let c1 = calcCofre(12), c5 = calcCofre(60);
    let msgCampeao = (ecoMes > 0) ? "Mercado Pago Campeão!!! 🏆" : "Concorrência mais rentável neste cenário.";

    document.getElementById("resultadoFaturamento").innerHTML = `
        <div class="resumo-financeiro">
            <h4>💰 Rentabilidade Real Individualizada</h4>
            <b>Custo Operacional MP:</b> R$ ${custoMP.toFixed(2)}<br>
            <b>Custo Operacional Conc.:</b> R$ ${custoConc.toFixed(2)}<br>
            <b>Economia Mensal:</b> <span style="color:${ecoMes > 0 ? '#007bff' : 'red'}">R$ ${ecoMes.toFixed(2)}</span><br>
            <b>Economia em 1 Ano:</b> R$ ${(ecoMes * 12).toFixed(2)}<br><hr>
            <h4>📈 Projeção Cofrinho</h4>
            <b>Saldo 1 Ano:</b> R$ ${c1.toFixed(2)}<br>
            <b>Saldo 5 Anos:</b> R$ ${c5.toFixed(2)}
        </div>
        <div class="campeao-msg">${msgCampeao}</div>`;
    
    if (window.g) window.g.destroy();
    window.g = new Chart(document.getElementById("graficoEconomia"), {
        type: 'bar',
        data: { labels: ["Eco. 1 Ano", "Eco. 5 Anos", "Cofre 5 Anos"], datasets: [{ label: 'R$', data: [ecoMes*12, ecoMes*60, c5], backgroundColor: ['#FFE600','#FFD400','#3483FA'] }] },
        options: { animation: false }
    });
}

function exportarRelatorio(apenasTaxas) {
    document.getElementById("rel_loja").innerText = document.getElementById("input_loja").value || "---";
    document.getElementById("rel_cliente").innerText = document.getElementById("input_cliente").value || "---";
    document.getElementById("rel_data").innerText = document.getElementById("input_data").value;
    document.getElementById("rel_tabela_taxas").innerHTML = "<h3>Comparativo de Taxas</h3>" + document.getElementById("resultado").innerHTML;
    
    let boxCorpo = document.getElementById("rel_share_cofrinho");
    let boxGrafico = document.getElementById("rel_grafico_box");

    if (apenasTaxas) {
        boxCorpo.style.display = "none"; boxGrafico.style.display = "none";
    } else {
        boxCorpo.style.display = "block"; boxGrafico.style.display = "block";
        boxCorpo.innerHTML = "<h3>Rentabilidade e Projeção</h3>" + document.getElementById("resultadoFaturamento").innerHTML;
        if (window.g) document.getElementById("img_grafico").src = document.getElementById("graficoEconomia").toDataURL();
    }

    setTimeout(() => {
        html2canvas(document.getElementById("areaRelatorio"), { scale: 2 }).then(canvas => {
            let link = document.createElement("a");
            link.download = `BA21_${document.getElementById("input_loja").value || 'Proposta'}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    }, 600);
}

async function processarOCR(event, pref) {
    const file = event.target.files[0];
    if(!file) return;
    alert("Processando imagem...");
    const res = await Tesseract.recognize(file, 'por');
    let txt = res.data.text.toLowerCase().replace(/,/g, ".");
    let regex = /(\d{1,2})\s*x\s*([\d.]+)/g;
    let match;
    while ((match = regex.exec(txt)) !== null) {
        let p = parseInt(match[1]), t = parseFloat(match[2]);
        let id = (p === 1) ? (pref === "mp" ? "mp1" : "out1_manual") : (pref + p + (pref === "out" ? "_manual" : ""));
        if(document.getElementById(id)) document.getElementById(id).value = t.toFixed(2);
    }
    alert("Pronto!");
}
