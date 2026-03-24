// 1. INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", () => {
    gerarInputs();
    document.getElementById("input_data").value = new Date().toLocaleDateString('pt-BR');
});

// Sincroniza os dois checkboxes para que marquem/desmarquem juntos
function sincronizarChecks(elem) {
    const checks = document.querySelectorAll('.sync-check');
    checks.forEach(c => c.checked = elem.checked);
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

// 2. OCR
async function processarOCR(event, pref) {
    const file = event.target.files[0]; if(!file) return;
    alert("Processando imagem...");
    try {
        const res = await Tesseract.recognize(file, 'por');
        let txt = res.data.text.toLowerCase().replace(/,/g, ".");
        let reg = /(\d{1,2})\s*x\s*([\d.]+)/g; let m;
        while ((m = reg.exec(txt)) !== null) {
            let p = parseInt(m[1]), t = parseFloat(m[2]);
            let id = (p===1) ? (pref==="mp"?"mp1":"out1_manual") : (pref+p+(pref==="out"?"_manual":""));
            if(document.getElementById(id)) document.getElementById(id).value = t.toFixed(2);
        }
        alert("Leitura finalizada!");
    } catch(e) { alert("Erro ao ler imagem."); }
}

// 3. COMPARAR TAXAS
function simular() {
    let html = `<table><tr><th>Plano</th><th>Mercado Pago</th><th>Concorrência</th></tr>`;
    let mpSoma = 0, outSoma = 0;
    const planos = ["pix", "debito", 1, 2, 3, 4, 6, 10, 12];

    planos.forEach(p => {
        let tM = (p==="pix")?parseFloat(mp_pix.value):(p==="debito"?parseFloat(mp_debito.value):parseFloat(document.getElementById("mp"+p).value));
        let tO = (p==="pix")?parseFloat(out_pix_manual.value):(p==="debito"?parseFloat(out_debito_manual.value):parseFloat(document.getElementById("out"+p+"_manual").value));
        
        if(!isNaN(tM)) {
            mpSoma += tM; outSoma += (tO || 0);
            let badM = (tM > tO) ? 'class="taxaRuim"' : '';
            let badO = (tO > tM) ? 'class="taxaRuim"' : '';
            html += `<tr><td><b>${p==="pix"?"Pix":p==="debito"?"Débito":p+"x"}</b></td><td ${badM}>${tM.toFixed(2)}%</td><td ${badO}>${(tO||0).toFixed(2)}%</td></tr>`;
        }
    });

    let taca = (mpSoma < outSoma) ? '<div class="campeao-msg">🏆 Mercado Pago é o Campeão!</div>' : '';
    document.getElementById("resultado").innerHTML = taca + html + "</table>";
    document.getElementById("btnExportarSimples").style.display = "block";
}

// 4. PROJEÇÃO (TRAVA 100% GARANTIDA)
function simularFaturamento() {
    const ids = ['share_pix', 'share_debito', 'share_1x', 'share_2x', 'share_3x', 'share_4x', 'share_6x', 'share_10x'];
    let somaShare = 0;
    ids.forEach(id => {
        let val = parseFloat(document.getElementById(id).value) || 0;
        somaShare += val;
    });

    if (Math.round(somaShare) !== 100) {
        alert("Erro: O total do Share deve ser 100%. Atualmente: " + somaShare.toFixed(1) + "%");
        return; 
    }

    let f = parseFloat(faturamento.value) || 0;
    if (f <= 0) return alert("Informe o faturamento mensal.");

    let custoMP = 0, custoOut = 0;
    ids.forEach(id => {
        let p = id.split('_')[1];
        let sh = (parseFloat(document.getElementById(id).value) || 0) / 100;
        let tM = (p==='pix')?parseFloat(mp_pix.value):(p==='debito'?parseFloat(mp_debito.value):parseFloat(document.getElementById('mp'+p).value)||0);
        let tO = (p==='pix')?parseFloat(out_pix_manual.value):(p==='debito'?parseFloat(out_debito_manual.value):parseFloat(document.getElementById('out'+p+'_manual').value)||0);
        custoMP += (f * sh) * (tM / 100); custoOut += (f * sh) * (tO / 100);
    });

    let fixos = (parseFloat(fixo_cesta.value)||0) + (parseFloat(fixo_manutencao.value)||0) + (parseFloat(fixo_sistema.value)||0) + (parseFloat(fixo_maquina.value)||0);
    custoOut += fixos;

    let eco = custoOut - custoMP;
    document.getElementById("resultadoFaturamento").innerHTML = `
        <div class="resumo-financeiro">
            <b>Economia Mensal:</b> R$ ${eco.toFixed(2)}<br>
            <b>Economia Anual:</b> R$ ${(eco * 12).toFixed(2)}<br>
            <b>Economia em 5 Anos:</b> R$ ${(eco * 60).toFixed(2)}
        </div>`;

    if(window.myChart) window.myChart.destroy();
    window.myChart = new Chart(document.getElementById("graficoEconomia"), {
        type: 'bar',
        data: { labels: ["1 Ano", "5 Anos"], datasets: [{ label: 'Economia Total R$', data: [eco*12, eco*60], backgroundColor: '#FFE600' }] }
    });
}

// 5. EXPORTAÇÃO
function atualizarBarra() {
    let s = 0; ['share_pix','share_debito','share_1x','share_2x','share_3x','share_4x','share_6x','share_10x'].forEach(id => s += parseFloat(document.getElementById(id).value)||0);
    document.getElementById("contador").innerText = Math.round(s) + "%";
    document.getElementById("barra").style.width = s + "%";
    document.getElementById("barra").style.background = s > 100 ? "red" : "#FFE600";
}

function exportarRelatorio(soTaxas) {
    document.getElementById("rel_loja").innerText = document.getElementById("input_loja").value || "---";
    document.getElementById("rel_cliente").innerText = document.getElementById("input_cliente").value || "---";
    document.getElementById("rel_data").innerText = document.getElementById("input_data").value;
    document.getElementById("rel_tabela_taxas").innerHTML = "<h3>Comparativo de Taxas</h3>" + document.getElementById("resultado").innerHTML;
    
    // Pega o estado de qualquer um dos checkboxes (pois estão sincronizados)
    const infoCheck = document.querySelector('.sync-check').checked;
    document.getElementById("box_beneficios").style.display = infoCheck ? "block" : "none";

    if(soTaxas) {
        document.getElementById("rel_financeiro").style.display = "none";
        document.getElementById("rel_grafico").style.display = "none";
    } else {
        document.getElementById("rel_financeiro").style.display = "block";
        document.getElementById("rel_grafico").style.display = "block";
        document.getElementById("rel_financeiro").innerHTML = "<h3>Projeção de Economia</h3>" + document.getElementById("resultadoFaturamento").innerHTML;
        if(window.myChart) document.getElementById("img_grafico").src = document.getElementById("graficoEconomia").toDataURL();
    }

    setTimeout(() => {
        html2canvas(document.getElementById("areaRelatorio"), { scale: 2 }).then(canvas => {
            let link = document.createElement("a");
            link.download = "Proposta_Falcões_BA21.png";
            link.href = canvas.toDataURL();
            link.click();
        });
    }, 800);
}
