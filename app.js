window.onload = function() {
    gerarInputs();
    buscarCDI();
    document.getElementById("input_data").value = new Date().toLocaleDateString('pt-BR');
}

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
        document.getElementById("mp_pix").value = "0.49";
        document.getElementById("mp_debito").value = "0.99";
        document.getElementById("mp1").value = "3.05";
        document.querySelectorAll(".input-mp").forEach(i => i.value = "");
    } else if (tipo === 'out') {
        ["out_pix","out_debito","out1","mdr1","mdr2","mdr3","antecipacao"].forEach(id => {
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
        out.pix = parseFloat(document.getElementById("out_pix").value) || 0;
        out.debito = parseFloat(document.getElementById("out_debito").value) || 0;
        out[1] = parseFloat(document.getElementById("out1").value) || 0;
        for (let i = 2; i <= 18; i++) out[i] = parseFloat(document.getElementById("out" + i + "_manual").value) || 0;
    } else {
        out.pix = parseFloat(out_pix.value) || 0;
        out.debito = parseFloat(out_debito.value) || 0;
        out[1] = parseFloat(out1.value) || 0;
        let m1 = parseFloat(mdr1.value)||0, m2 = parseFloat(mdr2.value)||0, m3 = parseFloat(mdr3.value)||0, ant = parseFloat(antecipacao.value)||0;
        for (let i = 2; i <= 6; i++) out[i] = m1 + (ant * (i-1));
        for (let i = 7; i <= 12; i++) out[i] = m2 + (ant * (i-1));
        for (let i = 13; i <= 18; i++) out[i] = m3 + (ant * (i-1));
    }

    let html = `<table><tr><th>Plano</th><th>MP %</th><th>Conc %</th><th>Dif.</th></tr>`;
    let parcelas = ["pix", "debito", 1, 2, 4, 6, 10, 12, 18];
    
    parcelas.forEach(p => {
        let tMP = (p === "debito") ? mp.debito : (p === "pix" ? mp.pix : mp[p]);
        let tOut = (p === "debito") ? out.debito : (p === "pix" ? out.pix : out[p]);
        
        if (tMP !== null && !isNaN(tMP)) {
            let nome = p === "pix" ? "Pix" : p === "debito" ? "Déb" : p + "x";
            let cM = tMP > tOut ? "taxaRuim" : "";
            let cO = tOut > tMP ? "taxaRuim" : "";
            html += `<tr><td>${nome}</td><td class="${cM}">${tMP.toFixed(2)}%</td><td class="${cO}">${tOut.toFixed(2)}%</td><td>${(tOut - tMP).toFixed(2)}%</td></tr>`;
        }
    });
    document.getElementById("resultado").innerHTML = html + "</table>";
}

function atualizarBarra() {
    let ids = ["share_pix","share_debito","share_1x","share_2x","share_4x","share_6x","share_10x"];
    let soma = 0;
    ids.forEach(id => soma += parseFloat(document.getElementById(id).value) || 0);
    document.getElementById("contador").innerText = soma + "%";
    document.getElementById("barra").style.width = soma + "%";
    if(soma > 100) alert("Soma do Share excedeu 100%!");
}

function simularFaturamento() {
    let f = parseFloat(faturamento.value) || 0;
    if(f <= 0) { alert("Informe o faturamento mensal!"); return; }
    
    let totalFixos = (parseFloat(fixo_sistema.value)||0) + (parseFloat(fixo_maquina.value)||0) + (parseFloat(fixo_manutencao.value)||0) + (parseFloat(fixo_cesta.value)||0);
    
    let custoExtraPix = 0;
    if(document.getElementById("check_pix_taxa").checked) {
        let pPix = parseFloat(document.getElementById("share_pix").value) || 0;
        custoExtraPix = (f * (pPix/100)) * 0.01;
    }

    // Economia estimada em taxas (Média de 2.5% de ganho sobre o share crédito/débito)
    let ecoTaxas = f * 0.025; 
    let ecoTotalMes = ecoTaxas + totalFixos + custoExtraPix;

    let res = parseFloat(cofrinho_reserva.value) || 0;
    let cdiAlvo = parseFloat(document.getElementById("cofrinho_cdi_alvo").value) || 105;
    
    const calcCofre = (meses) => {
        let saldo = 0;
        let cdiAnual = window.selicAtual - 0.10; 
        for(let i=0; i<meses; i++) {
            saldo += res;
            let rend = 0;
            if (saldo <= 10000) rend = saldo * ((cdiAnual * (cdiAlvo/100)) / 100 / 12);
            else if (saldo <= 100000) rend = saldo * (cdiAnual / 100 / 12);
            else rend = 100000 * (cdiAnual / 100 / 12);
            saldo += rend;
        }
        return saldo;
    };

    let cof1 = calcCofre(12);
    let cof5 = calcCofre(60);

    document.getElementById("resultadoFaturamento").innerHTML = `
        <div class="resumo-financeiro">
            <b>Economia Mensal:</b> R$ ${ecoTotalMes.toFixed(2)}<br>
            <b>Economia em 1 Ano:</b> R$ ${(ecoTotalMes * 12).toFixed(2)}<br>
            <b>Economia em 5 Anos:</b> R$ ${(ecoTotalMes * 60).toFixed(2)}<hr>
            <b>Saldo Cofrinho (1 ano):</b> R$ ${cof1.toFixed(2)}<br>
            <b>Saldo Cofrinho (5 anos):</b> R$ ${cof5.toFixed(2)}
        </div>`;

    let ctx = document.getElementById("graficoEconomia");
    if (window.g) window.g.destroy();
    window.g = new Chart(ctx, { 
        type: 'bar', 
        data: { 
            labels: ["1 Ano", "5 Anos", "Cofre 5a"], 
            datasets: [{ 
                label: 'R$', 
                data: [ecoTotalMes*12, ecoTotalMes*60, cof5], 
                backgroundColor: ['#FFE600','#FFD400','#3483FA'] 
            }] 
        },
        options: { devicePixelRatio: 2 }
    });
}

function exportarRelatorio() {
    if (!window.g) { alert("Calcule os resultados primeiro!"); return; }

    // Sincroniza dados para a área de relatório
    document.getElementById("rel_loja").innerText = document.getElementById("input_loja").value || "Cliente Especial";
    document.getElementById("rel_cliente").innerText = document.getElementById("input_cliente").value || "Consultoria BA21";
    document.getElementById("rel_data").innerText = document.getElementById("input_data").value;

    document.getElementById("rel_tabela_taxas").innerHTML = "<h3 style='border:none; color:#333; margin-top:20px;'>Tabela de Comparação</h3>" + document.getElementById("resultado").innerHTML;
    document.getElementById("rel_share_cofrinho").innerHTML = "<h3 style='border:none; color:#333;'>Resumo Financeiro</h3>" + document.getElementById("resultadoFaturamento").innerHTML;

    // Converte o gráfico para imagem
    document.getElementById("img_grafico").src = document.getElementById("graficoEconomia").toDataURL("image/png");

    setTimeout(() => {
        html2canvas(document.getElementById("areaRelatorio"), { scale: 2 }).then(canvas => {
            let link = document.createElement("a");
            link.download = `Relatorio_Faloes_${document.getElementById("input_loja").value}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        });
    }, 400);
}
