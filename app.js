window.onload = function() {
    let htmlMP = "";
    let htmlOut = "";

    // Gerando parcelas de 2x a 21x
    for (let i = 2; i <= 21; i++) {
        htmlMP += `<label>${i}x (%)</label> <input id="mp${i}" type="number" step="0.01" class="input-mp">`;
        htmlOut += `<label>${i}x (%)</label> <input id="out${i}_manual" type="number" step="0.01" class="input-out">`;
    }

    document.getElementById("mpParcelas").innerHTML = htmlMP;
    document.getElementById("outrasParcelas").innerHTML = htmlOut;

    // Listeners para os inputs de arquivo
    document.getElementById("uploadOCR").addEventListener("change", processarOCRMP);
    document.getElementById("uploadOCRConc").addEventListener("change", processarOCRConc);

    buscarCDIAtual();
}

async function buscarCDIAtual() {
    try {
        const resp = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        const dados = await resp.json();
        const taxa = parseFloat(dados[0].valor);
        document.getElementById("cofrinho_percentual").value = taxa;
    } catch (e) {
        document.getElementById("cofrinho_percentual").value = 10.75;
    }
}

// FUNÇÕES DE LIMPEZA
function limparSecao(tipo) {
    if (tipo === 'mp') {
        document.getElementById("mp_pix").value = "0.49";
        document.getElementById("mp_debito").value = "0.99";
        document.getElementById("mp1").value = "3.05";
        document.querySelectorAll(".input-mp").forEach(i => i.value = "");
    } else if (tipo === 'out') {
        document.getElementById("out_pix").value = "";
        document.getElementById("out_debito").value = "";
        document.getElementById("out1").value = "";
        document.getElementById("mdr1").value = "";
        document.getElementById("mdr2").value = "";
        document.getElementById("mdr3").value = "";
        document.getElementById("antecipacao").value = "";
        document.getElementById("out_pix_manual").value = "";
        document.getElementById("out_debito_manual").value = "";
        document.getElementById("out1_manual").value = "";
        document.querySelectorAll(".input-out").forEach(i => i.value = "");
    } else if (tipo === 'share') {
        document.querySelectorAll(".input-share").forEach(i => i.value = "");
        atualizarBarra();
    } else if (tipo === 'cofrinho') {
        document.getElementById("custos_fixos_total").value = "";
        document.getElementById("cofrinho_reserva").value = "";
        buscarCDIAtual();
    }
}

// Limpa os campos antes de iniciar o novo processo de OCR
function prepararOCR(prefixo) {
    if(prefixo === 'mp') {
        // Para MP, resetamos para o padrão que você pediu
        document.getElementById("mp_pix").value = "0.49";
        document.getElementById("mp_debito").value = "0.99";
        document.getElementById("mp1").value = "3.05";
        document.querySelectorAll(".input-mp").forEach(i => i.value = "");
    } else {
        document.getElementById("out_pix_manual").value = "";
        document.getElementById("out_debito_manual").value = "";
        document.getElementById("out1_manual").value = "";
        document.querySelectorAll(".input-out").forEach(i => i.value = "");
    }
}

function trocarModoOutras() {
    let modo = document.querySelector('input[name="modoOutras"]:checked').value;
    document.getElementById("modoMDR").style.display = (modo === "mdr") ? "block" : "none";
    document.getElementById("modoManual").style.display = (modo === "manual") ? "block" : "none";
}

function liquido(valor, taxa) {
    if (isNaN(taxa) || taxa === null || taxa === "") return null;
    return valor * (1 - (taxa / 100));
}

function formatarTaxa(taxa) {
    if (isNaN(taxa) || taxa === null || taxa === "") return "---";
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
    document.getElementById("dataSimulacao").innerText = "Simulação realizada em: " + new Date().toLocaleString();
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
    let tShare = 0;
    ["share_pix", "share_debito", "share_1x", "share_2x", "share_4x", "share_6x", "share_10x"].forEach(id => tShare += parseFloat(document.getElementById(id).value) || 0);
    if (tShare !== 100) { alert("A soma do Share deve ser 100%"); return; }

    let mps = { pix: mp_pix.value, deb: mp_debito.value, c1: mp1.value, c2: document.getElementById("mp2").value, c4: document.getElementById("mp4").value, c6: document.getElementById("mp6").value, c10: document.getElementById("mp10").value };
    let isManual = document.querySelector('input[name="modoOutras"]:checked').value === "manual";
    let outs = isManual ? {
        pix: out_pix_manual.value, deb: out_debito_manual.value, c1: out1_manual.value,
        c2: document.getElementById("out2_manual").value, c4: document.getElementById("out4_manual").value,
        c6: document.getElementById("out6_manual").value, c10: document.getElementById("out10_manual").value
    } : {
        pix: out_pix.value, deb: out_debito.value, c1: out1.value,
        c2: parseFloat(mdr1.value) + parseFloat(antecipacao.value),
        c4: parseFloat(mdr1.value) + (parseFloat(antecipacao.value)*3),
        c6: parseFloat(mdr1.value) + (parseFloat(antecipacao.value)*5),
        c10: parseFloat(mdr2.value) + (parseFloat(antecipacao.value)*9)
    };

    let economiaTaxas = (fat * (share_pix.value/100) * ((outs.pix - mps.pix)/100)) +
                        (fat * (share_debito.value/100) * ((outs.deb - mps.deb)/100)) +
                        (fat * (share_1x.value/100) * ((outs.c1 - mps.c1)/100)) +
                        (fat * (share_2x.value/100) * ((outs.c2 - mps.c2)/100)) +
                        (fat * (share_4x.value/100) * ((outs.c4 - mps.c4)/100)) +
                        (fat * (share_6x.value/100) * ((outs.c6 - mps.c6)/100)) +
                        (fat * (share_10x.value/100) * ((outs.c10 - mps.c10)/100));

    let economiaMensal = economiaTaxas + (parseFloat(document.getElementById("custos_fixos_total").value) || 0);
    let econAnual = economiaMensal * 12;

    let reserva = parseFloat(document.getElementById("cofrinho_reserva").value) || 0;
    let cdi = parseFloat(document.getElementById("cofrinho_percentual").value) || 10.75;
    let saldo = 0, rendTotal = 0, rend1ano = 0;

    for (let i = 1; i <= 60; i++) {
        saldo += reserva;
        let tM = (cdi / 100) / 12;
        let rM = (saldo <= 10000) ? saldo*(tM*1.15) : (saldo <= 100000) ? (10000*tM*1.15)+((saldo-10000)*tM) : (10000*tM*1.15)+(90000*tM);
        saldo += rM; rendTotal += rM; if (i === 12) rend1ano = rendTotal;
    }

    document.getElementById("resultadoFaturamento").innerHTML = `
        <div style="padding:15px; background:#f4f4f4; border-radius:8px; margin-top:10px;">
            <b>Economia Mensal: R$ ${economiaMensal.toFixed(2)}</b><br>
            Economia 1 Ano: R$ ${econAnual.toFixed(2)}<br><br>
            <b>Cofrinho MP (Líquido IR 17,5%):</b><br>
            Rendimento 1 Ano: R$ ${(rend1ano * 0.825).toFixed(2)}<br>
            Rendimento 5 Anos: R$ ${(rendTotal * 0.825).toFixed(2)}
        </div>`;
    gerarGrafico(econAnual, econAnual * 5, rendTotal * 0.825);
}

function gerarGrafico(a, c, cof) {
    let ctx = document.getElementById("graficoEconomia");
    if (window.grafico) window.grafico.destroy();
    window.grafico = new Chart(ctx, { type: 'bar', data: { labels: ["Eco 1 ano", "Eco 5 anos", "Cofre 5 anos"], datasets: [{ label: "R$", data: [a, c, cof], backgroundColor: ['#FFE600', '#FFD400', '#3483FA'] }] } });
}

function exportar() {
    html2canvas(document.getElementById("conteudoParaExportar")).then(canvas => {
        let link = document.createElement("a");
        link.download = "Relatorio_BA21.png";
        link.href = canvas.toDataURL();
        link.click();
    });
}

async function processarOCRMP(event) { processarOCRGeneric(event, "mp"); }
async function processarOCRConc(event) { processarOCRGeneric(event, "out"); }

async function processarOCRGeneric(event, prefixo) {
    const file = event.target.files[0];
    if (!file) return;
    alert("Lendo imagem... Isso pode levar alguns segundos.");
    const result = await Tesseract.recognize(file, 'por+eng');
    let texto = result.data.text.toLowerCase().replace(/\n/g, " ").replace(/,/g, ".");
    let regex = /(\d{1,2})\s*x\s*[-–s]*\s*([\d.]+)/g;
    let match;
    while ((match = regex.exec(texto)) !== null) {
        let p = parseInt(match[1]), t = parseFloat(match[2]);
        if (p >= 1 && p <= 21) {
            let id = (p === 1) ? (prefixo === "mp" ? "mp1" : "out1_manual") : (prefixo + p + (prefixo === "out" ? "_manual" : ""));
            let campo = document.getElementById(id);
            if (campo) campo.value = t.toFixed(2);
        }
    }
    if (prefixo === "out") { document.querySelector('input[value="manual"]').checked = true; trocarModoOutras(); }
    alert("Leitura finalizada.");
}
