document.addEventListener("DOMContentLoaded", function() {
    gerarInputs();
    buscarCDI();
    document.getElementById("input_data").value = new Date().toLocaleDateString('pt-BR');
});

function gerarInputs() {
    let mpH = ""; let outH = "";
    for (let i = 2; i <= 18; i++) {
        mpH += `<span><label>${i}x (%)</label> <input id="mp${i}" type="number" step="0.01"></span>`;
        outH += `<span><label>${i}x (%)</label> <input id="out${i}_manual" type="number" step="0.01"></span>`;
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
    location.reload(); // Simplificado para garantir blindagem
}

function trocarModoOutras() {
    let m = document.querySelector('input[name="modoOutras"]:checked').value;
    document.getElementById("modoMDR").style.display = (m === "mdr") ? "block" : "none";
    document.getElementById("modoManual").style.display = (m === "manual") ? "block" : "none";
}

function simular() {
    let v = parseFloat(document.getElementById("valor").value);
    if (!v) return alert("Informe o valor.");

    let mp = { pix: parseFloat(mp_pix.value), debito: parseFloat(mp_debito.value) };
    for (let i = 1; i <= 18; i++) mp[i] = parseFloat(document.getElementById("mp" + i)?.value) || null;

    let out = {};
    let modo = document.querySelector('input[name="modoOutras"]:checked').value;

    if (modo === "manual") {
        out.pix = parseFloat(out_pix_manual.value) || 0;
        out.debito = parseFloat(out_debito_manual.value) || 0;
        for (let i = 1; i <= 18; i++) out[i] = parseFloat(document.getElementById("out"+i+"_manual").value) || 0;
    } else {
        out.pix = parseFloat(out_pix.value) || 0;
        out.debito = parseFloat(out_debito.value) || 0;
        let ant = parseFloat(antecipacao.value) || 0;
        
        // FAIXA 1x
        out[1] = (parseFloat(out_mdr_1x.value) || 0) + ant;

        // LÓGICA DAS 3 FAIXAS DE MDR SOLICITADAS
        let m2_6 = parseFloat(mdr_2_6.value) || 0;
        let m7_13 = parseFloat(mdr_7_13.value) || 0;
        let m14_18 = parseFloat(mdr_14_18.value) || 0;

        for (let i = 2; i <= 18; i++) {
            let mdrUso = (i <= 6) ? m2_6 : (i <= 13 ? m7_13 : m14_18);
            out[i] = mdrUso + (ant * (i + 1) / 2);
        }
    }

    let html = `<table><tr><th>Plano</th><th>MP</th><th>Conc.</th><th>Dif.</th></tr>`;
    let planos = ["pix", "debito", 1, 2, 6, 10, 12, 18];
    let vitorias = 0;

    planos.forEach(p => {
        let tMP = (p === "pix") ? mp.pix : (p === "debito" ? mp.debito : mp[p]);
        let tOut = (p === "pix") ? out.pix : (p === "debito" ? out.debito : out[p]);
        if (tMP !== null) {
            let dif = (tOut - tMP).toFixed(2);
            if (dif > 0) vitorias++;
            html += `<tr><td><b>${p}</b></td><td class="${tMP > tOut ? 'taxaRuim' : ''}">${tMP.toFixed(2)}%</td><td>${tOut.toFixed(2)}%</td><td style="color:${dif>=0?'#007bff':'red'}"><b>${dif}%</b></td></tr>`;
        }
    });

    html += "</table>";
    if (vitorias > 0) html += `<div class="campeao-msg">Mercado Pago Campeão!!! 🏆</div>`;
    document.getElementById("resultado").innerHTML = html;
    document.getElementById("btnExportarSimples").style.display = "block";
}

function atualizarBarra() {
    let ids = ["share_pix","share_debito","share_1x","share_2_6","share_7_12"];
    let soma = 0;
    ids.forEach(id => soma += parseFloat(document.getElementById(id).value) || 0);
    document.getElementById("contador").innerText = Math.round(soma) + "%";
    document.getElementById("barra").style.width = soma + "%";
}

function simularFaturamento() {
    let f = parseFloat(faturamento.value) || 0;
    let ecoMes = f * 0.025; // Estimativa conservadora
    document.getElementById("resultadoFaturamento").innerHTML = `<div class="resumo-financeiro"><b>Economia Mensal Est.:</b> R$ ${ecoMes.toFixed(2)}</div>`;
}

function exportarRelatorio(apenasTaxas) {
    document.getElementById("rel_corpo").innerHTML = document.getElementById("resultado").innerHTML;
    setTimeout(() => {
        html2canvas(document.getElementById("areaRelatorio"), { scale: 2 }).then(canvas => {
            let link = document.createElement("a");
            link.download = "BA21_Proposta.png";
            link.href = canvas.toDataURL();
            link.click();
        });
    }, 500);
}
