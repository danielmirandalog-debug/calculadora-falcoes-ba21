window.onload = function() {
    let htmlMP = "";
    let htmlOut = "";

    for (let i = 2; i <= 21; i++) {
        htmlMP += `<label>${i}x (%)</label> <input id="mp${i}" type="number" step="0.01">`;
        htmlOut += `<label>${i}x (%)</label> <input id="out${i}_manual" type="number" step="0.01">`;
    }

    document.getElementById("mpParcelas").innerHTML = htmlMP;
    document.getElementById("outrasParcelas").innerHTML = htmlOut;

    document.getElementById("uploadOCR").addEventListener("change", processarOCRMP);
    document.getElementById("uploadOCRConc").addEventListener("change", processarOCRConc);

    // Busca CDI do Banco Central ao iniciar
    buscarCDIAtual();
}

async function buscarCDIAtual() {
    try {
        // Série 432: Meta Selic definida pelo COPOM
        const resp = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        const dados = await resp.json();
        const taxa = parseFloat(dados[0].valor);
        document.getElementById("cofrinho_percentual").value = taxa;
        console.log("Taxa Selic/CDI atualizada: " + taxa + "%");
    } catch (e) {
        console.error("Falha ao buscar CDI", e);
        document.getElementById("cofrinho_percentual").value = 10.75; // Fallback
    }
}

function trocarModoOutras() {
    let modo = document.querySelector('input[name="modoOutras"]:checked').value;
    document.getElementById("modoMDR").style.display = (modo === "mdr") ? "block" : "none";
    document.getElementById("modoManual").style.display = (modo === "manual") ? "block" : "none";
}

function liquido(valor, taxa) {
    if (!taxa && taxa !== 0) return null;
    return valor * (1 - (taxa / 100));
}

function formatarTaxa(taxa) {
    if (isNaN(taxa) || taxa === null) return "---";
    return parseFloat(taxa).toFixed(2) + "%";
}

function simular() {
    let valor = parseFloat(document.getElementById("valor").value);
    if (!valor) { alert("Informe o valor da venda"); return; }

    let mp = { pix: parseFloat(mp_pix.value), debito: parseFloat(mp_debito.value), 1: parseFloat(mp1.value) };
    for (let i = 2; i <= 21; i++) mp[i] = parseFloat(document.getElementById("mp" + i).value);

    let outras = {};
    let modo = document.querySelector('input[name="modoOutras"]:checked').value;

    if (modo === "manual") {
        outras["pix"] = parseFloat(out_pix_manual.value);
        outras["debito"] = parseFloat(out_debito_manual.value);
        outras[1] = parseFloat(out1_manual.value);
        for (let i = 2; i <= 21; i++) outras[i] = parseFloat(document.getElementById("out" + i + "_manual").value);
    } else {
        outras["pix"] = parseFloat(out_pix.value);
        outras["debito"] = parseFloat(out_debito.value);
        outras[1] = parseFloat(out1.value);
        let mdrA = parseFloat(mdr1.value) || 0;
        let mdrB = parseFloat(mdr2.value) || 0;
        let mdrC = parseFloat(mdr3.value) || 0;
        let ant = parseFloat(antecipacao.value) || 0;

        for (let i = 2; i <= 6; i++) outras[i] = parseFloat((mdrA + (ant * (i - 1))).toFixed(2));
        for (let i = 7; i <= 12; i++) outras[i] = parseFloat((mdrB + (ant * (i - 1))).toFixed(2));
        for (let i = 13; i <= 21; i++) outras[i] = parseFloat((mdrC + (ant * (i - 1))).toFixed(2));
    }

    gerarTabela(valor, mp, outras);
    
    let agora = new Date();
    document.getElementById("dataSimulacao").innerText = "Simulação realizada em: " + agora.toLocaleString();
}

function gerarTabela(valor, mp, outras) {
    let parcelas = ["pix", "debito", 1];
    for (let i = 2; i <= 21; i++) parcelas.push(i);

    let html = `<table><tr><th>Parcela</th><th>Taxa MP</th><th>R$ Líquido</th><th>Taxa Conc.</th><th>R$ Líquido</th></tr>`;

    parcelas.forEach(p => {
        let nome = p === "pix" ? "Pix" : p === "debito" ? "Débito" : p + "x";
        let vMP = liquido(valor, mp[p]);
        let vOut = liquido(valor, outras[p]);
        let clMP = (mp[p] > outras[p]) ? "taxaRuim" : "";
        let clOut = (outras[p] > mp[p]) ? "taxaRuim" : "";

        html += `<tr><td>${nome}</td><td class="${clMP}">${formatarTaxa(mp[p])}</td><td>${vMP ? "R$ " + vMP.toFixed(2) : "-"}</td>
                 <td class="${clOut}">${formatarTaxa(outras[p])}</td><td>${vOut ? "R$ " + vOut.toFixed(2) : "-"}</td></tr>`;
    });
    document.getElementById("resultado").innerHTML = html + "</table>";
}

function atualizarBarra() {
    let ids = ["share_pix", "share_debito", "share_1x", "share_2x", "share_4x", "share_6x", "share_10x"];
    let total = 0;
    ids.forEach(id => { let v = parseFloat(document.getElementById(id).value); if (!isNaN(v)) total += v; });
    
    if (total > 100) { alert("A soma não pode ultrapassar 100%"); document.activeElement.value = ""; return; }
    document.getElementById("contador").innerText = total + "%";
    document.getElementById("barra").style.width = total + "%";
}

function simularFaturamento() {
    let fat = parseFloat(document.getElementById("faturamento").value) || 0;
    let s_pix = parseFloat(share_pix.value) || 0;
    let s_deb = parseFloat(share_debito.value) || 0;
    let s_1 = parseFloat(share_1x.value) || 0;
    let s_2 = parseFloat(share_2x.value) || 0;
    let s_4 = parseFloat(share_4x.value) || 0;
    let s_6 = parseFloat(share_6x.value) || 0;
    let s_10 = parseFloat(share_10x.value) || 0;

    if ((s_pix + s_deb + s_1 + s_2 + s_4 + s_6 + s_10) !== 100) {
        alert("A soma do Share de vendas deve ser 100%"); return;
    }

    // Cálculo simplificado de economia de taxas baseado no share
    let mps = { pix: mp_pix.value, deb: mp_debito.value, c1: mp1.value, c2: mp2.value, c4: mp4.value, c6: mp6.value, c10: mp10.value };
    let outs = { 
        pix: out_pix_manual.value || out_pix.value, 
        deb: out_debito_manual.value || out_debito.value, 
        c1: out1_manual.value || out1.value,
        c2: document.getElementById("out2_manual").value || (parseFloat(mdr1.value) + parseFloat(antecipacao.value)),
        c4: document.getElementById("out4_manual").value || (parseFloat(mdr1.value) + (parseFloat(antecipacao.value)*3)),
        c6: document.getElementById("out6_manual").value || (parseFloat(mdr1.value) + (parseFloat(antecipacao.value)*5)),
        c10: document.getElementById("out10_manual").value || (parseFloat(mdr2.value) + (parseFloat(antecipacao.value)*9))
    };

    let economiaTaxas = (fat * (s_pix/100) * ((outs.pix - mps.pix)/100)) +
                        (fat * (s_deb/100) * ((outs.deb - mps.deb)/100)) +
                        (fat * (s_1/100) * ((outs.c1 - mps.c1)/100)) +
                        (fat * (s_2/100) * ((outs.c2 - mps.c2)/100)) +
                        (fat * (s_4/100) * ((outs.c4 - mps.c4)/100)) +
                        (fat * (s_6/100) * ((outs.c6 - mps.c6)/100)) +
                        (fat * (s_10/100) * ((outs.c10 - mps.c10)/100));

    let custoFixo = parseFloat(document.getElementById("custos_fixos_total").value) || 0;
    let economiaMensal = economiaTaxas + custoFixo;
    let econAnual = economiaMensal * 12;

    // Lógica Cofrinho MP
    let reserva = parseFloat(document.getElementById("cofrinho_reserva").value) || 0;
    let cdiBase = parseFloat(document.getElementById("cofrinho_percentual").value) || 10.75;
    let saldo = 0, rendBrutoTotal = 0, rendBruto1ano = 0;

    for (let i = 1; i <= 60; i++) {
        saldo += reserva;
        let tMes = (cdiBase / 100) / 12;
        let rMes = 0;
        if (saldo <= 10000) rMes = saldo * (tMes * 1.15);
        else if (saldo <= 100000) rMes = (10000 * tMes * 1.15) + ((saldo - 10000) * tMes);
        else rMes = (10000 * tMes * 1.15) + (90000 * tMes);
        
        saldo += rMes;
        rendBrutoTotal += rMes;
        if (i === 12) rendBruto1ano = rendBrutoTotal;
    }

    let rendLiq1 = rendBruto1ano * 0.825; // Desconto 17.5% IR
    let rendLiq5 = rendBrutoTotal * 0.825;

    document.getElementById("resultadoFaturamento").innerHTML = `
        <div style="padding:15px; background:#f4f4f4; border-radius:8px; margin-top:10px;">
            <b>Economia Mensal Total: R$ ${economiaMensal.toFixed(2)}</b><br>
            Economia em 1 Ano: R$ ${econAnual.toFixed(2)}<br><br>
            <b>Cofrinho MP (Líquido):</b><br>
            Rendimento em 1 Ano: R$ ${rendLiq1.toFixed(2)}<br>
            Rendimento em 5 Anos: R$ ${rendLiq5.toFixed(2)}
            <p style="font-size:10px; color:#777;">*Cálculo de rendimento fatiado (115%/100% CDI) com IR de 17,5%.</p>
        </div>`;

    gerarGrafico(econAnual, econAnual * 5, rendLiq5);
}

function gerarGrafico(anual, cincoanos, cofrinho) {
    let ctx = document.getElementById("graficoEconomia");
    if (window.grafico) window.grafico.destroy();
    window.grafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Economia 1 ano", "Economia 5 anos", "Lucro Cofrinho 5 anos"],
            datasets: [{ label: "R$", data: [anual, cincoanos, cofrinho], backgroundColor: ['#FFE600', '#FFD400', '#3483FA'] }]
        },
        options: { responsive: true }
    });
}

function exportar() {
    let area = document.getElementById("conteudoParaExportar");
    html2canvas(area).then(canvas => {
        let link = document.createElement("a");
        link.download = "Relatorio_Falcoes_BA21.png";
        link.href = canvas.toDataURL();
        link.click();
    });
}

// Funções OCR unificadas
async function processarOCRMP(event) { processarOCRGeneric(event, "mp"); }
async function processarOCRConc(event) { processarOCRGeneric(event, "out"); }

async function processarOCRGeneric(event, prefixo) {
    const file = event.target.files[0];
    if (!file) return;
    alert("Processando imagem...");
    const result = await Tesseract.recognize(file, 'eng');
    let texto = result.data.text.replace(/\n/g, " ").replace(/,/g, ".");
    let regex = /(\d{1,2})\s*[xX]\s*([\d\.]+)/g;
    let match;
    while ((match = regex.exec(texto)) !== null) {
        let p = parseInt(match[1]);
        let t = parseFloat(match[2]);
        if (p >= 1 && p <= 21) {
            let id = (p === 1) ? (prefixo === "mp" ? "mp1" : "out1_manual") : (prefixo + p + (prefixo === "out" ? "_manual" : ""));
            let campo = document.getElementById(id);
            if (campo) campo.value = t;
        }
    }
    if (prefixo === "out") { document.querySelector('input[value="manual"]').checked = true; trocarModoOutras(); }
    alert("Taxas processadas!");
}
