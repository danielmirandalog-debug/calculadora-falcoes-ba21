window.onload = function() {
    gerarInputs();
    buscarCDI();
}

function gerarInputs() {
    let mpH = ""; let outH = "";
    // Limite de 18x conforme solicitado
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
        document.getElementById("cofrinho_percentual").value = parseFloat(d[0].valor);
    } catch (e) { document.getElementById("cofrinho_percentual").value = 10.75; }
}

function limparSecao(tipo) {
    if (tipo === 'mp') {
        document.getElementById("mp_pix").value = "0.49";
        document.getElementById("mp_debito").value = "0.99";
        document.getElementById("mp1").value = "3.05";
        document.querySelectorAll(".input-mp").forEach(i => i.value = "");
    } else if (tipo === 'out') {
        ["out_pix","out_debito","out1","mdr1","mdr2","mdr3","antecipacao","out_pix_manual","out_debito_manual","out1_manual"].forEach(id => {
            let el = document.getElementById(id); if(el) el.value = "";
        });
        document.querySelectorAll(".input-out").forEach(i => i.value = "");
    } else if (tipo === 'share') {
        ["share_pix","share_debito","share_1x","share_2x","share_4x","share_6x","share_10x"].forEach(id => {
            document.getElementById(id).value = "";
        });
        atualizarBarra();
    } else if (tipo === 'cofrinho') {
        document.getElementById("custos_fixos_total").value = "";
        document.getElementById("cofrinho_reserva").value = "";
        buscarCDI();
    }
}

function trocarModoOutras() {
    let m = document.querySelector('input[name="modoOutras"]:checked').value;
    document.getElementById("modoMDR").style.display = (m === "mdr") ? "block" : "none";
    document.getElementById("modoManual").style.display = (m === "manual") ? "block" : "none";
}

function simular() {
    let v = parseFloat(document.getElementById("valor").value);
    if (!v) { alert("Digite o valor da venda."); return; }

    // Coleta Taxas MP
    let mp = { pix: parseFloat(mp_pix.value), debito: parseFloat(mp_debito.value), 1: parseFloat(mp1.value) };
    for (let i = 2; i <= 18; i++) {
        let val = document.getElementById("mp" + i).value;
        mp[i] = val === "" ? null : parseFloat(val);
    }

    // Coleta Taxas Concorrência
    let out = {};
    let modo = document.querySelector('input[name="modoOutras"]:checked').value;

    if (modo === "manual") {
        out.pix = parseFloat(out_pix_manual.value) || 0;
        out.debito = parseFloat(out_debito_manual.value) || 0;
        out[1] = parseFloat(out1_manual.value) || 0;
        for (let i = 2; i <= 18; i++) out[i] = parseFloat(document.getElementById("out" + i + "_manual").value) || 0;
    } else {
        out.pix = parseFloat(out_pix.value) || 0;
        out.debito = parseFloat(out_debito.value) || 0;
        out[1] = parseFloat(out1.value) || 0;
        let m1 = parseFloat(mdr1.value)||0, m2 = parseFloat(mdr2.value)||0, m3 = parseFloat(mdr3.value)||0, ant = parseFloat(antecipacao.value)||0;
        // Lógica MDR + Antecipação convertendo para taxa cheia (análise de conversão)
        for (let i = 2; i <= 6; i++) out[i] = m1 + (ant * (i-1));
        for (let i = 7; i <= 12; i++) out[i] = m2 + (ant * (i-1));
        for (let i = 13; i <= 18; i++) out[i] = m3 + (ant * (i-1));
        
        // Atualiza os campos manuais escondidos para que o usuário veja a conversão se trocar de aba
        for (let i = 2; i <= 18; i++) document.getElementById("out" + i + "_manual").value = out[i].toFixed(2);
        document.getElementById("out_pix_manual").value = out.pix;
        document.getElementById("out_debito_manual").value = out.debito;
        document.getElementById("out1_manual").value = out[1];
    }

    let html = `<table><tr><th>Parc</th><th>MP %</th><th>Líq.</th><th>Conc %</th><th>Líq.</th></tr>`;
    
    // Lista de todas as parcelas possíveis
    let todasParcelas = ["pix", "debito"];
    for(let i=1; i<=18; i++) todasParcelas.push(i);
    
    todasParcelas.forEach(p => {
        let tMP = (p === "debito") ? mp.debito : mp[p];
        
        // SÓ MOSTRA SE O CAMPO DO MERCADO PAGO ESTIVER PREENCHIDO
        if (tMP !== null && !isNaN(tMP)) {
            let n = p === "pix" ? "Pix" : p === "debito" ? "Deb" : p + "x";
            let tOut = (p === "debito") ? out.debito : out[p];
            let vMP = v * (1 - (tMP/100)), vOut = v * (1 - (tOut/100));
            let cM = tMP > tOut ? "taxaRuim" : "", cO = tOut > tMP ? "taxaRuim" : "";
            html += `<tr><td>${n}</td><td class="${cM}">${tMP.toFixed(2)}%</td><td>${vMP.toFixed(2)}</td><td class="${cO}">${tOut.toFixed(2)}%</td><td>${vOut.toFixed(2)}</td></tr>`;
        }
    });
    document.getElementById("resultado").innerHTML = html + "</table>";
    document.getElementById("dataSimulacao").innerText = "Gerado em: " + new Date().toLocaleString();
}

function atualizarBarra() {
    let ids = ["share_pix","share_debito","share_1x","share_2x","share_4x","share_6x","share_10x"];
    let soma = 0;
    ids.forEach(id => soma += parseFloat(document.getElementById(id).value) || 0);
    if(soma > 100) { alert("Soma não pode exceder 100%"); return; }
    document.getElementById("contador").innerText = soma + "%";
    document.getElementById("barra").style.width = soma + "%";
}

function simularFaturamento() {
    let f = parseFloat(faturamento.value) || 0;
    if(f <= 0) { alert("Informe o faturamento"); return; }
    
    let econTaxas = f * 0.028; // Estimativa média de ganho de 2.8%
    let fixo = parseFloat(custos_fixos_total.value) || 0;
    let ecoMes = econTaxas + fixo;
    
    let res = parseFloat(cofrinho_reserva.value) || 0;
    let cdi = parseFloat(cofrinho_percentual.value) || 10.75;
    
    // Funções de rendimento (Cálculo aproximado de juros compostos mensalizados)
    const calcCofre = (meses) => {
        let saldo = 0;
        let taxaMensal = (cdi / 100) / 12;
        for(let i=0; i<meses; i++) {
            saldo = (saldo + res) * (1 + taxaMensal);
        }
        return saldo;
    };

    let cof1 = calcCofre(12);
    let cof5 = calcCofre(60);

    document.getElementById("resultadoFaturamento").innerHTML = `
        <div class="resumo-financeiro">
            <b>💰 Economia Mensal Estimada:</b> R$ ${ecoMes.toFixed(2)}<br>
            <b>📅 Economia em 1 Ano:</b> R$ ${(ecoMes * 12).toFixed(2)}<br>
            <b>📅 Economia em 5 Anos:</b> R$ ${(ecoMes * 60).toFixed(2)}<br><br>
            <b>📈 Saldo Cofrinho em 1 Ano:</b> R$ ${cof1.toFixed(2)}<br>
            <b>📈 Saldo Cofrinho em 5 Anos:</b> R$ ${cof5.toFixed(2)}
        </div>`;
    
    let ctx = document.getElementById("graficoEconomia");
    if (window.g) window.g.destroy();
    window.g = new Chart(ctx, { type: 'bar', data: { labels: ["1 ano", "5 anos", "Cofre 5a"], datasets: [{ label: 'R$', data: [ecoMes*12, ecoMes*60, cof5], backgroundColor: ['#FFE600','#FFD400','#3483FA'] }] } });
}

// OCR
async function processarOCRMP(event) { limparSecao('mp'); executarOCR(event, "mp"); }
async function processarOCRConc(event) { limparSecao('out'); executarOCR(event, "out"); }

async function executarOCR(event, pref) {
    const file = event.target.files[0];
    if(!file) return;
    alert("Processando imagem...");
    const res = await Tesseract.recognize(file, 'por');
    let txt = res.data.text.toLowerCase().replace(/,/g, ".");
    let regex = /(\d{1,2})\s*x\s*([\d.]+)/g;
    let match;
    while ((match = regex.exec(txt)) !== null) {
        let p = parseInt(match[1]), t = parseFloat(match[2]);
        if (p >= 1 && p <= 18) {
            let id = (p === 1) ? (pref === "mp" ? "mp1" : "out1_manual") : (pref + p + (pref === "out" ? "_manual" : ""));
            if(document.getElementById(id)) document.getElementById(id).value = t.toFixed(2);
        }
    }
    alert("Concluído!");
}

function exportar() {
    html2canvas(document.getElementById("conteudoParaExportar")).then(canvas => {
        let link = document.createElement("a");
        link.download = "Relatorio_BA21.png";
        link.href = canvas.toDataURL();
        link.click();
    });
}
