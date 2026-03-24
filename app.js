// 1. SEGURANÇA
(function() {
    const senha = "123456"; 
    if (localStorage.getItem("acesso_simulador") !== "permitido") {
        let t = prompt("Senha de acesso:");
        if (t === senha) localStorage.setItem("acesso_simulador", "permitido");
        else { document.body.innerHTML = "Acesso Negado"; window.location.reload(); }
    }
})();

// 2. INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", () => {
    gerarInputs();
    buscarCDI();
    document.getElementById("input_data").value = new Date().toLocaleDateString('pt-BR');
});

async function buscarCDI() {
    try {
        const r = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        const d = await r.json();
        window.selicAtual = parseFloat(d[0].valor);
    } catch (e) { window.selicAtual = 10.75; }
}

function gerarInputs() {
    let mH = ""; let oH = "";
    for (let i = 2; i <= 18; i++) {
        mH += `<span><label>${i}x (%)</label> <input id="mp${i}" type="number" step="0.01"></span>`;
        oH += `<span><label>${i}x (%)</label> <input id="out${i}_manual" type="number" step="0.01"></span>`;
    }
    document.getElementById("mpParcelas").innerHTML = mH;
    document.getElementById("outrasParcelas").innerHTML = oH;
}

// 3. OCR (LEITURA DE IMAGEM)
async function processarOCR(event, pref) {
    const file = event.target.files[0]; if(!file) return;
    alert("Processando imagem...");
    try {
        const res = await Tesseract.recognize(file, 'por');
        let txt = res.data.text.toLowerCase().replace(/,/g, ".");
        let reg = /(\d{1,2})\s*x\s*([\d.]+)/g; let m; let cont = 0;
        while ((m = reg.exec(txt)) !== null) {
            let p = parseInt(m[1]), t = parseFloat(m[2]);
            let id = (p===1) ? (pref==="mp"?"mp1":"out1_manual") : (pref+p+(pref==="out"?"_manual":""));
            if(document.getElementById(id)) { document.getElementById(id).value = t.toFixed(2); cont++; }
        }
        alert("Sucesso! " + cont + " taxas lidas.");
    } catch(e) { alert("Erro na leitura."); }
}

// 4. COMPARAÇÃO SIMPLES (COM TAÇA)
function simular() {
    let v = parseFloat(valor.value);
    let html = `<table><tr><th>Plano</th><th>Mercado Pago</th><th>Concorrência</th></tr>`;
    let mpSoma = 0, outSoma = 0;
    const planos = ["pix", "debito", 1, 2, 3, 4, 6, 10, 12];

    planos.forEach(p => {
        let tM = (p==="pix")?parseFloat(mp_pix.value):(p==="debito"?parseFloat(mp_debito.value):parseFloat(document.getElementById("mp"+p).value));
        let tO = (p==="pix")?parseFloat(out_pix_manual.value):(p==="debito"?parseFloat(out_debito_manual.value):parseFloat(document.getElementById("out"+p+"_manual").value));
        if(!isNaN(tM)) {
            mpSoma += tM; outSoma += (tO || 0);
            let bad = tM > tO ? 'class="taxaRuim"' : '';
            html += `<tr><td>${p==="pix"?"Pix":p==="debito"?"Débito":p+"x"}</td><td ${bad}>${tM.toFixed(2)}%</td><td>${(tO||0).toFixed(2)}%</td></tr>`;
        }
    });

    let taca = (mpSoma < outSoma) ? '<div class="campeao-msg">🏆 Mercado Pago é o Campeão!</div>' : '';
    document.getElementById("resultado").innerHTML = taca + html + "</table>";
    document.getElementById("btnExportarSimples").style.display = "block";
}

// 5. FATURAMENTO E COFRINHO
function simularFaturamento() {
    let f = parseFloat(faturamento.value) || 0;
    let cM = 0, cO = 0;
    const sMap = {pix:'share_pix', debito:'share_debito', 1:'share_1x', 2:'share_2x', 3:'share_3x', 4:'share_4x', 6:'share_6x', 10:'share_10x'};

    Object.keys(sMap).forEach(p => {
        let sh = (parseFloat(document.getElementById(sMap[p]).value) || 0) / 100;
        let tM = (p==='pix')?parseFloat(mp_pix.value):(p==='debito'?parseFloat(mp_debito.value):parseFloat(document.getElementById('mp'+p).value)||0);
        let tO = (p==='pix')?parseFloat(out_pix_manual.value):(p==='debito'?parseFloat(out_debito_manual.value):parseFloat(document.getElementById('out'+p+'_manual').value)||0);
        cM += (f * sh) * (tM / 100); cO += (f * sh) * (tO / 100);
    });

    let fix = (parseFloat(fixo_cesta.value)||0) + (parseFloat(fixo_manutencao.value)||0) + (parseFloat(fixo_sistema.value)||0) + (parseFloat(fixo_maquina.value)||0);
    let pixApp = (parseFloat(vol_pix_app.value)||0) * ((parseFloat(taxa_pix_app.value)||1)/100);
    cO += (fix + pixApp);

    let eco = cO - cM;
    let res = parseFloat(cofrinho_reserva.value) || 0;
    let alvo = (parseFloat(cofrinho_cdi_alvo.value)||105)/100;

    const calc = (m) => {
        let s = 0; let tCDI = (window.selicAtual || 10.65)/1200;
        for(let i=0; i<m; i++){ s += res; s += (s<=10000 ? s*(tCDI*alvo) : s*tCDI); }
        return s;
    };

    document.getElementById("resultadoFaturamento").innerHTML = `
        <div class="resumo-financeiro">
            <b>Economia Mensal:</b> R$ ${eco.toFixed(2)}<br>
            <b>Economia Anual:</b> R$ ${(eco * 12).toFixed(2)}<br>
            <b>Economia em 5 Anos:</b> R$ ${(eco * 60).toFixed(2)}<hr>
            <b>Cofrinho (1 ano):</b> R$ ${calc(12).toFixed(2)}<br>
            <b>Cofrinho (5 anos):</b> R$ ${calc(60).toFixed(2)}
        </div>`;

    if(window.chart) window.chart.destroy();
    window.chart = new Chart(document.getElementById("graficoEconomia"), {
        type: 'bar',
        data: { labels: ["1 Ano", "5 Anos"], datasets: [{ label: 'Economia R$', data: [eco*12, eco*60], backgroundColor: '#FFE600' }] }
    });
}

// 6. EXPORTAR PNG
function exportarRelatorio(soTaxas) {
    document.getElementById("rel_loja").innerText = document.getElementById("input_loja").value || "---";
    document.getElementById("rel_cliente").innerText = document.getElementById("input_cliente").value || "---";
    document.getElementById("rel_data").innerText = document.getElementById("input_data").value;
    document.getElementById("rel_tabela_taxas").innerHTML = "<h3>Comparativo de Taxas</h3>" + document.getElementById("resultado").innerHTML;
    
    let isC = soTaxas ? document.getElementById("chk_info_adicional_1").checked : document.getElementById("chk_info_adicional_2").checked;
    document.getElementById("rel_info_adicional").style.display = isC ? "block" : "none";

    if(soTaxas) { 
        document.getElementById("rel_share_cofrinho").style.display = "none";
        document.getElementById("rel_grafico_box").style.display = "none";
    } else {
        document.getElementById("rel_share_cofrinho").style.display = "block";
        document.getElementById("rel_grafico_box").style.display = "block";
        document.getElementById("rel_share_cofrinho").innerHTML = "<h3>Projeção de Lucro</h3>" + document.getElementById("resultadoFaturamento").innerHTML;
        if(window.chart) document.getElementById("img_grafico").src = document.getElementById("graficoEconomia").toDataURL();
    }

    setTimeout(() => {
        html2canvas(document.getElementById("areaRelatorio"), { scale: 2 }).then(can => {
            let l = document.createElement("a"); l.download = "Proposta_MP.png"; l.href = can.toDataURL(); l.click();
        });
    }, 800);
}

function atualizarBarra() {
    let s = 0; ["share_pix","share_debito","share_1x","share_2x","share_3x","share_4x","share_6x","share_10x"].forEach(id => s += parseFloat(document.getElementById(id).value)||0);
    document.getElementById("contador").innerText = Math.round(s) + "%";
    document.getElementById("barra").style.width = s + "%";
}

function limparSecao(tipo) {
    if(tipo==='mp') { mp_pix.value="0.49"; mp_debito.value="0.99"; mp1.value="3.05"; }
    if(tipo==='out') { out_pix_manual.value=""; out_debito_manual.value=""; out1_manual.value=""; }
    if(tipo==='share') { ["share_pix","share_debito","share_1x","share_2x","share_3x","share_4x","share_6x","share_10x"].forEach(id => document.getElementById(id).value=""); atualizarBarra(); }
}
