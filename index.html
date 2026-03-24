// 1. SEGURANÇA E ACESSO
(function() {
    const senhaCorreta = "123456"; 
    if (localStorage.getItem("acesso_simulador") !== "permitido") {
        let tentativa = prompt("Digite a senha de acesso dos Falcões BA21:");
        if (tentativa === senhaCorreta) {
            localStorage.setItem("acesso_simulador", "permitido");
        } else {
            alert("Acesso negado.");
            document.body.innerHTML = "<h1>Acesso Restrito.</h1>";
            window.location.reload();
        }
    }
})();

// 2. INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", function() {
    gerarInputs();
    buscarCDI();
    document.getElementById("input_data").value = new Date().toLocaleDateString('pt-BR');
});

const IDs_SHARE = ["share_pix","share_debito","share_1x","share_2x","share_3x","share_4x","share_6x","share_10x"];

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

// 3. LÓGICA DE COMPARAÇÃO DE TAXAS
function simular() {
    let v = parseFloat(document.getElementById("valor").value);
    if (!v) return alert("Informe o valor da venda.");

    let mp = { pix: parseFloat(mp_pix.value), debito: parseFloat(mp_debito.value), 1: parseFloat(mp1.value) };
    for (let i = 2; i <= 18; i++) mp[i] = parseFloat(document.getElementById("mp"+i).value) || null;

    let out = {
        pix: parseFloat(document.getElementById("out_pix_manual").value) || 0,
        debito: parseFloat(document.getElementById("out_debito_manual").value) || 0,
        1: parseFloat(document.getElementById("out1_manual").value) || 0
    };
    for (let i = 2; i <= 18; i++) out[i] = parseFloat(document.getElementById("out"+i+"_manual").value) || 0;

    let html = `<table><tr><th>Plano</th><th>Mercado Pago</th><th>Concorrência</th></tr>`;
    let parcelas = ["pix", "debito", ...Array.from({length: 18}, (_, i) => i + 1)];

    parcelas.forEach(p => {
        let tMP = (p === "pix") ? mp.pix : (p === "debito" ? mp.debito : mp[p]);
        if (tMP !== null && !isNaN(tMP)) {
            let tOut = (p === "pix") ? out.pix : (p === "debito" ? out.debito : out[p]);
            let nome = p === "pix" ? "Pix" : p === "debito" ? "Débito" : p + "x";
            let classeMP = tMP > tOut ? 'taxaRuim' : ''; 
            html += `<tr><td><b>${nome}</b></td><td class="${classeMP}">${tMP.toFixed(2)}%</td><td>${tOut.toFixed(2)}%</td></tr>`;
        }
    });
    document.getElementById("resultado").innerHTML = html + "</table>";
    document.getElementById("btnExportarSimples").style.display = "block";
}

// 4. LÓGICA DE FATURAMENTO E PIX APP
function simularFaturamento() {
    let f = parseFloat(faturamento.value) || 0;
    if(f <= 0) return alert("Informe o faturamento.");

    let custoMP = 0, custoConc = 0;
    const shareMap = { pix: 'share_pix', debito: 'share_debito', 1: 'share_1x', 2: 'share_2x', 3: 'share_3x', 4: 'share_4x', 6: 'share_6x', 10: 'share_10x' };

    Object.keys(shareMap).forEach(p => {
        let percShare = parseFloat(document.getElementById(shareMap[p]).value) || 0;
        let valorFatia = f * (percShare / 100);
        
        let tMP = (p === 'pix') ? parseFloat(mp_pix.value) : (p === 'debito' ? parseFloat(mp_debito.value) : parseFloat(document.getElementById('mp'+p).value) || 0);
        let tOut = (p === 'pix') ? parseFloat(out_pix_manual.value) : (p === 'debito' ? parseFloat(out_debito_manual.value) : parseFloat(document.getElementById('out'+p+'_manual').value) || 0);
        
        custoMP += valorFatia * (tMP / 100);
        custoConc += valorFatia * (tOut / 100);
    });

    let fixos = (parseFloat(fixo_sistema.value)||0) + (parseFloat(fixo_maquina.value)||0);
    let custoPixExtra = (parseFloat(vol_pix_app.value)||0) * ((parseFloat(taxa_pix_app.value)||1) / 100);
    custoConc += (fixos + custoPixExtra);

    let ecoMes = custoConc - custoMP;
    let res = parseFloat(cofrinho_reserva.value) || 0;
    let cdi = (window.selicAtual || 10.75) - 0.1;
    let alvo = (parseFloat(cofrinho_cdi_alvo.value) || 105) / 100;

    const calcCofre = (m) => {
        let s = 0;
        for(let i=0; i<m; i++){
            s += res;
            s += (s <= 10000) ? s * (cdi * alvo / 1200) : (s <= 100000 ? s * (cdi / 1200) : 0);
        }
        return s;
    };

    document.getElementById("resultadoFaturamento").innerHTML = `
        <div class="resumo-financeiro">
            <b>Custo MP:</b> R$ ${custoMP.toFixed(2)} | <b>Custo Conc.:</b> R$ ${custoConc.toFixed(2)}<br>
            <b>Economia Mensal:</b> R$ ${ecoMes.toFixed(2)}<br>
            <b style="color:green">Eco. 5 Anos: R$ ${(ecoMes * 60).toFixed(2)}</b><hr>
            <b>Cofrinho 5 Anos:</b> R$ ${calcCofre(60).toFixed(2)}
        </div>`;

    if (window.g) window.g.destroy();
    window.g = new Chart(document.getElementById("graficoEconomia"), {
        type: 'bar',
        data: { labels: ["Eco. 1 Ano", "Eco. 5 Anos"], datasets: [{ label: 'R$', data: [ecoMes*12, ecoMes*60], backgroundColor: ['#FFE600','#FFD400'] }] }
    });
}

// 5. EXPORTAÇÃO E OCR
function exportarRelatorio(apenasTaxas) {
    document.getElementById("rel_loja").innerText = document.getElementById("input_loja").value || "---";
    document.getElementById("rel_cliente").innerText = document.getElementById("input_cliente").value || "---";
    document.getElementById("rel_data").innerText = document.getElementById("input_data").value;
    document.getElementById("rel_tabela_taxas").innerHTML = "<h3>Comparativo de Taxas</h3>" + document.getElementById("resultado").innerHTML;
    
    let isChecked = apenasTaxas ? document.getElementById("chk_info_adicional_1").checked : document.getElementById("chk_info_adicional_2").checked;
    document.getElementById("rel_info_adicional").style.display = isChecked ? "block" : "none";

    if (apenasTaxas) {
        document.getElementById("rel_share_cofrinho").style.display = "none";
        document.getElementById("rel_grafico_box").style.display = "none";
    } else {
        document.getElementById("rel_share_cofrinho").style.display = "block";
        document.getElementById("rel_grafico_box").style.display = "block";
        document.getElementById("rel_share_cofrinho").innerHTML = "<h3>Rentabilidade</h3>" + document.getElementById("resultadoFaturamento").innerHTML;
        if (window.g) document.getElementById("img_grafico").src = document.getElementById("graficoEconomia").toDataURL();
    }

    setTimeout(() => {
        html2canvas(document.getElementById("areaRelatorio"), { scale: 2 }).then(canvas => {
            let link = document.createElement("a");
            link.download = `PROPOSTA_BA21.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    }, 800);
}

function atualizarBarra() {
    let soma = 0;
    IDs_SHARE.forEach(id => soma += parseFloat(document.getElementById(id).value) || 0);
    document.getElementById("contador").innerText = Math.round(soma) + "%";
    document.getElementById("barra").style.width = soma + "%";
}

async function processarOCR(event, pref) {
    const file = event.target.files[0]; if(!file) return;
    alert("Lendo imagem...");
    const res = await Tesseract.recognize(file, 'por');
    let txt = res.data.text.toLowerCase().replace(/,/g, ".");
    let regex = /(\d{1,2})\s*x\s*([\d.]+)/g; let match;
    while ((match = regex.exec(txt)) !== null) {
        let p = parseInt(match[1]), t = parseFloat(match[2]);
        let id = (p === 1) ? (pref === "mp" ? "mp1" : "out1_manual") : (pref + p + (pref === "out" ? "_manual" : ""));
        if(document.getElementById(id)) document.getElementById(id).value = t.toFixed(2);
    }
    alert("Leitura concluída!");
}

function limparSecao(tipo) {
    if (tipo === 'mp') { mp_pix.value="0.49"; mp_debito.value="0.99"; mp1.value="3.05"; document.querySelectorAll(".input-mp").forEach(i=>i.value=""); }
    if (tipo === 'out') { out_pix_manual.value=""; out_debito_manual.value=""; out1_manual.value=""; document.querySelectorAll(".input-out").forEach(i=>i.value=""); }
    if (tipo === 'share') { IDs_SHARE.forEach(id => document.getElementById(id).value = ""); atualizarBarra(); }
}
