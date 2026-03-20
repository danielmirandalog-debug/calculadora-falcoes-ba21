document.addEventListener("DOMContentLoaded", function() {
    gerarInputs();
    buscarCDI();
    document.getElementById("input_data").value = new Date().toLocaleDateString('pt-BR');
});

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
        ["share_pix","share_debito","share_1x","share_2x","share_4x","share_6x","share_10x"].forEach(id => document.getElementById(id).value = "");
        atualizarBarra();
    } else if (tipo === 'fixos') {
        ["fixo_sistema","fixo_maquina","fixo_manutencao","fixo_cesta"].forEach(id => document.getElementById(id).value = "");
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

function simular() {
    let v = parseFloat(document.getElementById("valor").value);
    if (!v) { alert("Informe o valor da venda."); return; }

    let mp = { pix: parseFloat(mp_pix.value), debito: parseFloat(mp_debito.value), 1: parseFloat(mp1.value) };
    for (let i = 2; i <= 18; i++) mp[i] = parseFloat(document.getElementById("mp" + i).value) || null;

    let out = {};
    let modo = document.querySelector('input[name="modoOutras"]:checked').value;
    if (modo === "manual") {
        out.pix = parseFloat(document.getElementById("out_pix_manual").value) || 0;
        out.debito = parseFloat(document.getElementById("out_debito_manual").value) || 0;
        out[1] = parseFloat(document.getElementById("out1_manual").value) || 0;
        for (let i = 2; i <= 18; i++) out[i] = parseFloat(document.getElementById("out" + i + "_manual").value) || 0;
    } else {
        out.pix = parseFloat(out_pix.value) || 0; out.debito = parseFloat(out_debito.value) || 0;
        out[1] = parseFloat(out1.value) || 0;
        let m1 = parseFloat(mdr1.value)||0, m2 = parseFloat(mdr2.value)||0, m3 = parseFloat(mdr3.value)||0, ant = parseFloat(antecipacao.value)||0;
        for (let i = 2; i <= 6; i++) out[i] = m1 + (ant * (i-1));
        for (let i = 7; i <= 12; i++) out[i] = m2 + (ant * (i-1));
        for (let i = 13; i <= 18; i++) out[i] = m3 + (ant * (i-1));
    }

    let html = `<table><tr><th>Parc.</th><th>MP %</th><th>Conc %</th><th>Dif.</th></tr>`;
    ["pix", "debito", 1, 2, 4, 6, 10, 12].forEach(p => {
        let tMP = (p === "debito") ? mp.debito : (p === "pix" ? mp.pix : mp[p]);
        let tOut = (p === "debito") ? out.debito : (p === "pix" ? out.pix : out[p]);
        if (tMP !== null) {
            html += `<tr><td>${p}x</td><td class="${tMP > tOut ? 'taxaRuim' : ''}">${tMP.toFixed(2)}%</td><td>${tOut.toFixed(2)}%</td><td>${(tOut - tMP).toFixed(2)}%</td></tr>`;
        }
    });
    document.getElementById("resultado").innerHTML = html + "</table>";
}

function atualizarBarra() {
    let soma = 0;
    ["share_pix","share_debito","share_1x","share_2x","share_4x","share_6x","share_10x"].forEach(id => soma += parseFloat(document.getElementById(id).value) || 0);
    document.getElementById("contador").innerText = soma + "%";
    document.getElementById("barra").style.width = soma + "%";
}

function simularFaturamento() {
    let f = parseFloat(faturamento.value) || 0;
    if(f <= 0) return alert("Informe o faturamento");
    let fixos = (parseFloat(fixo_sistema.value)||0) + (parseFloat(fixo_maquina.value)||0) + (parseFloat(fixo_manutencao.value)||0) + (parseFloat(fixo_cesta.value)||0);
    let ecoTaxas = f * 0.025;
    let res = parseFloat(cofrinho_reserva.value) || 0;
    let cdi = (window.selicAtual || 10.75) - 0.1;
    let alvo = parseFloat(cofrinho_cdi_alvo.value) / 100;

    const calc = (m) => {
        let s = 0;
        for(let i=0; i<m; i++) {
            s += res;
            let r = s <= 10000 ? s * (cdi * alvo / 1200) : (s <= 100000 ? s * (cdi / 1200) : 100000 * (cdi / 1200));
            s += r;
        }
        return s;
    };

    document.getElementById("resultadoFaturamento").innerHTML = `
        <div class="resumo-financeiro">
            <b>Economia Mensal:</b> R$ ${(ecoTaxas + fixos).toFixed(2)}<br>
            <b>Saldo Cofrinho (1 ano):</b> R$ ${calc(12).toFixed(2)}
        </div>`;
    
    if (window.g) window.g.destroy();
    window.g = new Chart(document.getElementById("graficoEconomia"), {
        type: 'bar',
        data: { labels: ["1 Ano", "5 Anos", "Cofre"], datasets: [{ label: 'R$', data: [(ecoTaxas+fixos)*12, (ecoTaxas+fixos)*60, calc(60)], backgroundColor: ['#FFE600','#FFD400','#3483FA'] }] }
    });
}

function exportarRelatorio() {
    document.getElementById("rel_loja").innerText = document.getElementById("input_loja").value || "---";
    document.getElementById("rel_cliente").innerText = document.getElementById("input_cliente").value || "---";
    document.getElementById("rel_data").innerText = document.getElementById("input_data").value;
    document.getElementById("rel_tabela_taxas").innerHTML = document.getElementById("resultado").innerHTML;
    document.getElementById("rel_share_cofrinho").innerHTML = document.getElementById("resultadoFaturamento").innerHTML;
    if (window.g) document.getElementById("img_grafico").src = document.getElementById("graficoEconomia").toDataURL();
    
    setTimeout(() => {
        html2canvas(document.getElementById("areaRelatorio"), { scale: 2 }).then(canvas => {
            let link = document.createElement("a");
            link.download = `Faloes_BA21.png`; link.href = canvas.toDataURL(); link.click();
        });
    }, 400);
}

async function processarOCR(event, pref) {
    const file = event.target.files[0];
    if(!file) return;
    alert("Lendo imagem...");
    const res = await Tesseract.recognize(file, 'por');
    let txt = res.data.text.toLowerCase().replace(/,/g, ".");
    let regex = /(\d{1,2})\s*x\s*([\d.]+)/g;
    let match;
    while ((match = regex.exec(txt)) !== null) {
        let p = parseInt(match[1]), t = parseFloat(match[2]);
        let id = (p === 1) ? (pref === "mp" ? "mp1" : "out1_manual") : (pref + p + (pref === "out" ? "_manual" : ""));
        if(document.getElementById(id)) document.getElementById(id).value = t.toFixed(2);
    }
    alert("Leitura finalizada!");
}
