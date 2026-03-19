window.onload = function() {
    gerarInputs();
    buscarCDI();
}

function gerarInputs() {
    let mpH = ""; let outH = "";
    for (let i = 2; i <= 21; i++) {
        mpH += `<label>${i}x (%)</label> <input id="mp${i}" type="number" step="0.01" class="input-mp">`;
        outH += `<label>${i}x (%)</label> <input id="out${i}_manual" type="number" step="0.01" class="input-out">`;
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

    let mp = { pix: parseFloat(mp_pix.value), debito: parseFloat(mp_debito.value), 1: parseFloat(mp1.value) };
    for (let i = 2; i <= 21; i++) mp[i] = parseFloat(document.getElementById("mp" + i).value) || 0;

    let out = {};
    let modo = document.querySelector('input[name="modoOutras"]:checked').value;

    if (modo === "manual") {
        out.pix = parseFloat(out_pix_manual.value) || 0;
        out.debito = parseFloat(out_debito_manual.value) || 0;
        out[1] = parseFloat(out1_manual.value) || 0;
        for (let i = 2; i <= 21; i++) out[i] = parseFloat(document.getElementById("out" + i + "_manual").value) || 0;
    } else {
        out.pix = parseFloat(out_pix.value) || 0;
        out.debito = parseFloat(out_debito.value) || 0;
        out[1] = parseFloat(out1.value) || 0;
        let m1 = parseFloat(mdr1.value)||0, m2 = parseFloat(mdr2.value)||0, m3 = parseFloat(mdr3.value)||0, ant = parseFloat(antecipacao.value)||0;
        for (let i = 2; i <= 6; i++) out[i] = m1 + (ant * (i-1));
        for (let i = 7; i <= 12; i++) out[i] = m2 + (ant * (i-1));
        for (let i = 13; i <= 21; i++) out[i] = m3 + (ant * (i-1));
    }

    let html = `<table><tr><th>Parc</th><th>MP %</th><th>Líq.</th><th>Conc %</th><th>Líq.</th></tr>`;
    let parcelas = ["pix", "debito", 1, 2, 3, 6, 10, 12, 18, 21];
    
    parcelas.forEach(p => {
        let n = p === "pix" ? "Pix" : p === "debito" ? "Déb" : p + "x";
        let tMP = mp[p === "debito" ? "debito" : p], tOut = out[p === "debito" ? "debito" : p];
        let vMP = v * (1 - (tMP/100)), vOut = v * (1 - (tOut/100));
        let cM = tMP > tOut ? "taxaRuim" : "", cO = tOut > tMP ? "taxaRuim" : "";
        html += `<tr><td>${n}</td><td class="${cM}">${tMP.toFixed(2)}%</td><td>${vMP.toFixed(2)}</td><td class="${cO}">${tOut.toFixed(2)}%</td><td>${vOut.toFixed(2)}</td></tr>`;
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
    let econTaxas = f * 0.025; // Diferença média 2.5%
    let fixo = parseFloat(custos_fixos_total.value) || 0;
    let ecoMes = econTaxas + fixo;
    let res = parseFloat(cofrinho_reserva.value) || 0;
    let cdi = parseFloat(cofrinho_percentual.value) || 10.75;
    let rend5 = (res * 60) * (1 + (cdi/100) * 2.5);

    document.getElementById("resultadoFaturamento").innerHTML = `
        <div style="background:#e3f2fd; padding:15px; border-radius:8px; margin-top:10px;">
            <b>Economia Mensal: R$ ${ecoMes.toFixed(2)}</b><br>
            Economia 5 anos: R$ ${(ecoMes * 60).toFixed(2)}<br>
            Saldo Cofrinho (5 anos): R$ ${rend5.toFixed(2)}
        </div>`;
    
    let ctx = document.getElementById("graficoEconomia");
    if (window.g) window.g.destroy();
    window.g = new Chart(ctx, { type: 'bar', data: { labels: ["1 ano", "5 anos", "Cofre 5a"], datasets: [{ label: 'R$', data: [ecoMes*12, ecoMes*60, rend5], backgroundColor: ['#FFE600','#FFD400','#3483FA'] }] } });
}

// OCR (Foto / Galeria)
async function processarOCRMP(event) {
    limparSecao('mp'); // APAGA TUDO AO CLICAR
    executarOCR(event, "mp");
}

async function processarOCRConc(event) {
    limparSecao('out'); // APAGA TUDO AO CLICAR
    executarOCR(event, "out");
}

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
        if (p >= 1 && p <= 21) {
            let id = (p === 1) ? (pref === "mp" ? "mp1" : "out1_manual") : (pref + p + (pref === "out" ? "_manual" : ""));
            if(document.getElementById(id)) document.getElementById(id).value = t.toFixed(2);
        }
    }
    alert("Concluído!");
}

function exportar() {
    html2canvas(document.getElementById("conteudoParaExportar")).then(canvas => {
        let link = document.createElement("a");
        link.download = "Relatorio.png";
        link.href = canvas.toDataURL();
        link.click();
    });
}
