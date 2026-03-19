// Inicialização do Sistema
window.onload = function() {
    gerarInputsParcelas();
    buscarCDIAtual();
}

function gerarInputsParcelas() {
    let htmlMP = "";
    let htmlOut = "";
    for (let i = 2; i <= 21; i++) {
        htmlMP += `<label>${i}x (%)</label> <input id="mp${i}" type="number" step="0.01" class="input-mp">`;
        htmlOut += `<label>${i}x (%)</label> <input id="out${i}_manual" type="number" step="0.01" class="input-out">`;
    }
    document.getElementById("mpParcelas").innerHTML = htmlMP;
    document.getElementById("outrasParcelas").innerHTML = htmlOut;
}

async function buscarCDIAtual() {
    try {
        const resp = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        const dados = await resp.json();
        document.getElementById("cofrinho_percentual").value = parseFloat(dados[0].valor);
    } catch (e) {
        document.getElementById("cofrinho_percentual").value = 10.75;
    }
}

// Lógica dos Botões de Limpar
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
        buscarCDIAtual();
    }
}

// Lógica de Comparação de Taxas
function trocarModoOutras() {
    let modo = document.querySelector('input[name="modoOutras"]:checked').value;
    document.getElementById("modoMDR").style.display = (modo === "mdr") ? "block" : "none";
    document.getElementById("modoManual").style.display = (modo === "manual") ? "block" : "none";
}

function simular() {
    let valor = parseFloat(document.getElementById("valor").value);
    if (!valor) { alert("Informe o valor da venda!"); return; }

    let mp = { pix: parseFloat(mp_pix.value), debito: parseFloat(mp_debito.value), 1: parseFloat(mp1.value) };
    for (let i = 2; i <= 21; i++) mp[i] = parseFloat(document.getElementById("mp" + i).value);

    let outras = {};
    let modo = document.querySelector('input[name="modoOutras"]:checked').value;

    if (modo === "manual") {
        outras.pix = parseFloat(out_pix_manual.value);
        outras.debito = parseFloat(out_debito_manual.value);
        outras[1] = parseFloat(out1_manual.value);
        for (let i = 2; i <= 21; i++) outras[i] = parseFloat(document.getElementById("out" + i + "_manual").value);
    } else {
        outras.pix = parseFloat(out_pix.value);
        outras.debito = parseFloat(out_debito.value);
        outras[1] = parseFloat(out1.value);
        let m1 = parseFloat(mdr1.value) || 0, m2 = parseFloat(mdr2.value) || 0, m3 = parseFloat(mdr3.value) || 0, ant = parseFloat(antecipacao.value) || 0;
        for (let i = 2; i <= 6; i++) outras[i] = m1 + (ant * (i-1));
        for (let i = 7; i <= 12; i++) outras[i] = m2 + (ant * (i-1));
        for (let i = 13; i <= 21; i++) outras[i] = m3 + (ant * (i-1));
    }

    let html = `<table><tr><th>Parcela</th><th>MP</th><th>Líquido</th><th>Conc.</th><th>Líquido</th></tr>`;
    let parcelas = ["pix", "debito", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 21];
    
    parcelas.forEach(p => {
        let n = p === "pix" ? "Pix" : p === "debito" ? "Déb" : p + "x";
        let tMP = mp[p], tOut = outras[p];
        let vMP = valor * (1 - (tMP/100)), vOut = valor * (1 - (tOut/100));
        let cM = tMP > tOut ? "taxaRuim" : "", cO = tOut > tMP ? "taxaRuim" : "";
        html += `<tr><td>${n}</td><td class="${cM}">${tMP||0}%</td><td>${vMP.toFixed(2)}</td><td class="${cO}">${tOut||0}%</td><td>${vOut.toFixed(2)}</td></tr>`;
    });
    document.getElementById("resultado").innerHTML = html + "</table>";
    document.getElementById("dataSimulacao").innerText = "Gerado em: " + new Date().toLocaleString();
}

// Lógica de Faturamento e Cofrinho
function atualizarBarra() {
    let ids = ["share_pix","share_debito","share_1x","share_2x","share_4x","share_6x","share_10x"];
    let total = 0;
    ids.forEach(id => total += parseFloat(document.getElementById(id).value) || 0);
    if(total > 100) { alert("Soma não pode exceder 100%"); return; }
    document.getElementById("contador").innerText = total + "%";
    document.getElementById("barra").style.width = total + "%";
}

function simularFaturamento() {
    let fat = parseFloat(faturamento.value) || 0;
    let econTaxas = (fat * 0.02); // Estimativa simples baseada na diferença média
    let fixo = parseFloat(custos_fixos_total.value) || 0;
    let totalMes = econTaxas + fixo;
    
    // Rendimento Cofrinho Simplificado
    let res = parseFloat(cofrinho_reserva.value) || 0;
    let rend5 = (res * 60) * 1.35; // Estimativa 5 anos

    document.getElementById("resultadoFaturamento").innerHTML = `
        <div style="background:#eee; padding:10px; border-radius:5px; margin-top:10px">
            <b>Economia Mensal: R$ ${totalMes.toFixed(2)}</b><br>
            <b>Economia 5 Anos: R$ ${(totalMes * 60).toFixed(2)}</b><br>
            <b>Saldo Cofrinho (5 anos): R$ ${rend5.toFixed(2)}</b>
        </div>`;
}

// Lógica de OCR (Câmera / Galeria)
async function processarOCRMP(event) {
    limparSecao('mp');
    const file = event.target.files[0];
    if(!file) return;
    alert("Lendo imagem...");
    const res = await Tesseract.recognize(file, 'por');
    alert("Leitura concluída. Verifique os campos preenchidos.");
    console.log(res.data.text);
    // Aqui entra sua lógica de Regex se desejar extrair dados específicos automaticamente
}

async function processarOCRConc(event) {
    limparSecao('out');
    const file = event.target.files[0];
    if(!file) return;
    alert("Lendo imagem...");
    const res = await Tesseract.recognize(file, 'por');
    alert("Leitura concluída.");
}

function exportar() {
    html2canvas(document.getElementById("conteudoParaExportar")).then(canvas => {
        let link = document.createElement("a");
        link.download = "Relatorio_BA21.png";
        link.href = canvas.toDataURL();
        link.click();
    });
}
