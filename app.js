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
    location.reload(); 
}

function trocarModoOutras() {
    let m = document.querySelector('input[name="modoOutras"]:checked').value;
    document.getElementById("modoMDR").style.display = (m === "mdr") ? "block" : "none";
    document.getElementById("modoManual").style.display = (m === "manual") ? "block" : "none";
}

function simular() {
    let v = parseFloat(document.getElementById("valor").value);
    if (!v) return alert("Informe o valor da venda.");

    let mp = { pix: parseFloat(document.getElementById("mp_pix").value) || 0, 
               debito: parseFloat(document.getElementById("mp_debito").value) || 0 };
    for (let i = 1; i <= 18; i++) mp[i] = parseFloat(document.getElementById("mp" + i)?.value) || null;

    let out = {};
    let modo = document.querySelector('input[name="modoOutras"]:checked').value;

    if (modo === "manual") {
        out.pix = parseFloat(document.getElementById("out_pix_manual").value) || 0;
        out.debito = parseFloat(document.getElementById("out_debito_manual").value) || 0;
        for (let i = 1; i <= 18; i++) {
            let campo = document.getElementById(i === 1 ? "out1_manual" : "out" + i + "_manual");
            out[i] = parseFloat(campo?.value) || 0;
        }
    } else {
        out.pix = parseFloat(document.getElementById("out_pix").value) || 0;
        out.debito = parseFloat(document.getElementById("out_debito").value) || 0;
        let ant = parseFloat(document.getElementById("antecipacao").value) || 0;
        
        // MDR 1x
        out[1] = (parseFloat(document.getElementById("out_mdr_1x").value) || 0) + ant;

        // FAIXAS MDR
        let m2_6 = parseFloat(document.getElementById("mdr_2_6").value) || 0;
        let m7_13 = parseFloat(document.getElementById("mdr_7_13").value) || 0;
        let m14_18 = parseFloat(document.getElementById("mdr_14_18").value) || 0;

        for (let i = 2; i <= 18; i++) {
            let mdrUso = (i <= 6) ? m2_6 : (i <= 13 ? m7_13 : m14_18);
            out[i] = mdrUso + (ant * (i + 1) / 2);
        }
    }

    let html = `<table><tr><th>Plano</th><th>MP</th><th>Conc.</th><th>Dif.</th></tr>`;
    let planos = ["pix", "debito", 1, 2, 6, 12, 18];

    planos.forEach(p => {
        let tMP = (p === "pix") ? mp.pix : (p === "debito" ? mp.debito : mp[p]);
        let tOut = (p === "pix") ? out.pix : (p === "debito" ? out.debito : out[p]);
        if (tMP !== null) {
            let dif = (tOut - tMP).toFixed(2);
            html += `<tr><td><b>${p}</b></td><td class="${tMP > tOut ? 'taxaRuim' : ''}">${tMP.toFixed(2)}%</td><td>${tOut.toFixed(2)}%</td><td style="color:${dif>=0?'#007bff':'red'}"><b>${dif}%</b></td></tr>`;
        }
    });

    html += "</table>";
    document.getElementById("resultado").innerHTML = html;
    document.getElementById("btnExportarSimples").style.display = "block";
}

function atualizarBarra() {
    let ids = ["share_pix","share_debito","share_1x","share_2_6","share_7_13","share_14_18"];
    let soma = 0;
    ids.forEach(id => soma += parseFloat(document.getElementById(id).value) || 0);
    document.getElementById("barra").style.width = soma + "%";
    document.getElementById("barra").style.background = (Math.round(soma) === 100) ? "#4CAF50" : "#FFE600";
}

function simularFaturamento() {
    let f = parseFloat(document.getElementById("faturamento").value) || 0;
    if(!f) return alert("Informe o faturamento.");
    let ecoMes = f * 0.022; 
    let res = parseFloat(document.getElementById("cofrinho_reserva").value) || 0;
    let cdi = (window.selicAtual || 10.75) / 1200;
    let alvo = (parseFloat(document.getElementById("cofrinho_cdi_alvo").value) || 105) / 100;
    let saldo12 = 0;
    for(let i=0; i<12; i++) { saldo12 += res; saldo12 += saldo12 * (cdi * alvo); }

    document.getElementById("resultadoFaturamento").innerHTML = `
        <div style="background:#fcfcfc; padding:15px; border-radius:8px; border:1px solid #eee; margin-top:15px;">
            <b>Economia Mensal:</b> R$ ${ecoMes.toFixed(2)}<br>
            <b>Saldo Cofrinho (12m):</b> R$ ${saldo12.toFixed(2)}
        </div>
        <div class="campeao-msg">Mercado Pago Campeão!!! 🏆</div>`;

    if (window.g) window.g.destroy();
    window.g = new Chart(document.getElementById("graficoEconomia"), {
        type: 'bar',
        data: { labels: ["Eco 12m", "Cofre 12m"], datasets: [{ label: 'R$', data: [ecoMes*12, saldo12], backgroundColor: ['#FFE600', '#3483FA'] }] },
        options: { animation: false }
    });
}

function exportarRelatorio(apenasTaxas) {
    let corpo = document.getElementById("rel_corpo");
    corpo.innerHTML = "<h3>Proposta</h3>" + document.getElementById("resultado").innerHTML;
    if(!apenasTaxas) corpo.innerHTML += document.getElementById("resultadoFaturamento").innerHTML;
    
    setTimeout(() => {
        html2canvas(document.getElementById("areaRelatorio"), { scale: 2 }).then(canvas => {
            let link = document.createElement("a");
            link.download = "Proposta_BA21.png";
            link.href = canvas.toDataURL();
            link.click();
        });
    }, 500);
}

async function processarOCR(event, pref) {
    const file = event.target.files[0];
    if(!file) return;
    const res = await Tesseract.recognize(file, 'por');
    let txt = res.data.text.toLowerCase().replace(/,/g, ".");
    let regex = /(\d{1,2})\s*x\s*([\d.]+)/g;
    let match;
    while ((match = regex.exec(txt)) !== null) {
        let p = parseInt(match[1]), t = parseFloat(match[2]);
        let id = (p === 1) ? "out1_manual" : "out" + p + "_manual";
        if(document.getElementById(id)) document.getElementById(id).value = t.toFixed(2);
    }
    alert("Pronto!");
}
