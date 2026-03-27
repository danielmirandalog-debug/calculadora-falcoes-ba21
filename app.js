/* PROJETO: Falcões da BA21 - Simulador Premium
   MELHORIA DE OCR: Pré-processamento de Imagem e Sanitização de Dados
*/

// 1. PROTEÇÃO E BLINDAGEM
document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function(e) {
    if(e.keyCode == 123 || (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74)) || (e.ctrlKey && e.keyCode == 85)) return false;
};

// 2. MODAL DE CONSENTIMENTO
function confirmarTermos() {
    const checkbox = document.getElementById("chk_termos_uso");
    if (checkbox.checked) {
        document.getElementById("modalTermos").style.display = "none";
        localStorage.setItem("termos_aceitos_ba21", "sim");
    } else {
        alert("Para utilizar o simulador, você deve ler e aceitar os termos de uso.");
    }
}

// 3. INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("modalTermos").style.display = "flex";
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

function limparSecao(tipo) {
    if (tipo === 'mp') {
        document.getElementById("mp_pix").value = "0.49"; 
        document.getElementById("mp_debito").value = "0.99";
        document.getElementById("mp1").value = "3.05";
        document.querySelectorAll(".input-mp").forEach(i => i.value = "");
    } else if (tipo === 'out') {
        ["out_pix_manual","out_debito_manual","out1_manual"].forEach(id => {
            if(document.getElementById(id)) document.getElementById(id).value = "";
        });
        document.querySelectorAll(".input-out").forEach(i => i.value = "");
    } else if (tipo === 'share') {
        IDs_SHARE.forEach(id => document.getElementById(id).value = "");
        atualizarBarra();
    } else if (tipo === 'fixos') {
        ["fixo_sistema","fixo_maquina","fixo_cesta","fixo_manutencao","vol_pix_app","taxa_pix_app"].forEach(id => {
            if(document.getElementById(id)) document.getElementById(id).value = "";
        });
    } else if (tipo === 'cofrinho') {
        document.getElementById("cofrinho_reserva").value = "";
        document.getElementById("cofrinho_cdi_alvo").value = "105";
    }
}

function simular() {
    let html = `<table class="tabela-moderna"><tr><th>Plano</th><th>Mercado Pago</th><th>Concorrência</th></tr>`;
    const bases = ["pix", "debito", "1"];
    bases.forEach(p => {
        let idMP = (p === "pix") ? "mp_pix" : (p === "debito" ? "mp_debito" : "mp1");
        let idOut = (p === "pix") ? "out_pix_manual" : (p === "debito" ? "out_debito_manual" : "out1_manual");
        let tMP = parseFloat(document.getElementById(idMP).value) || 0;
        let tOut = parseFloat(document.getElementById(idOut).value) || 0;
        let nome = p === "pix" ? "Pix" : p === "debito" ? "Débito" : "1x";
        let classeMP = tMP > tOut ? 'taxaRuim' : 'taxaBoa'; 
        let classeOut = tOut > tMP ? 'taxaRuim' : '';
        html += `<tr><td><b>${nome}</b></td><td class="taxa-destaque ${classeMP}">${tMP.toFixed(2)}%</td><td class="taxa-destaque ${classeOut}">${tOut.toFixed(2)}%</td></tr>`;
    });
    for (let i = 2; i <= 18; i++) {
        let valMP = document.getElementById("mp" + i).value;
        if (valMP !== "" && !isNaN(valMP)) {
            let tMP = parseFloat(valMP);
            let tOut = parseFloat(document.getElementById("out" + i + "_manual").value) || 0;
            let classeMP = tMP > tOut ? 'taxaRuim' : 'taxaBoa'; 
            let classeOut = tOut > tMP ? 'taxaRuim' : '';
            html += `<tr><td><b>${i}x</b></td><td class="taxa-destaque ${classeMP}">${tMP.toFixed(2)}%</td><td class="taxa-destaque ${classeOut}">${tOut.toFixed(2)}%</td></tr>`;
        }
    }
    html += "</table>";
    document.getElementById("resultado").innerHTML = html;
    document.getElementById("btnExportarSimples").style.display = "block";
}

function atualizarBarra() {
    let soma = 0;
    IDs_SHARE.forEach(id => soma += parseFloat(document.getElementById(id).value) || 0);
    document.getElementById("contador").innerText = Math.round(soma) + "%";
    document.getElementById("barra").style.width = soma + "%";
    document.getElementById("barra").style.background = (Math.round(soma) === 100) ? "#4CAF50" : "#FFE600";
}

function simularFaturamento() {
    let soma = 0;
    IDs_SHARE.forEach(id => soma += parseFloat(document.getElementById(id).value) || 0);
    if (Math.round(soma) !== 100) return alert("O Share total deve somar 100%!");
    let f = parseFloat(faturamento.value) || 0;
    if(f <= 0) return alert("Informe o faturamento mensal.");
    const getTaxa = (p, tipo) => {
        let id = (tipo === 'mp') ? (p === 'pix' ? 'mp_pix' : p === 'debito' ? 'mp_debito' : 'mp' + p) : 
                                  (p === 'pix' ? 'out_pix_manual' : p === 'debito' ? 'out_debito_manual' : 'out' + p + '_manual');
        let el = document.getElementById(id);
        return el ? parseFloat(el.value) || 0 : 0;
    };
    let custoMP = 0; let custoConc = 0;
    const shareMap = { pix: 'share_pix', debito: 'share_debito', 1: 'share_1x', 2: 'share_2x', 3: 'share_3x', 4: 'share_4x', 6: 'share_6x', 10: 'share_10x' };
    Object.keys(shareMap).forEach(p => {
        let percShare = parseFloat(document.getElementById(shareMap[p]).value) || 0;
        let valorFatia = f * (percShare / 100);
        custoMP += valorFatia * (getTaxa(p, 'mp') / 100);
        custoConc += valorFatia * (getTaxa(p, 'out') / 100);
    });
    let fixosGerais = (parseFloat(fixo_sistema.value)||0) + (parseFloat(fixo_maquina.value)||0) + (parseFloat(fixo_cesta.value)||0) + (parseFloat(fixo_manutencao.value)||0);
    let volPixApp = parseFloat(document.getElementById("vol_pix_app").value) || 0;
    let taxaPixApp = parseFloat(document.getElementById("taxa_pix_app").value) || 0;
    custoConc += (fixosGerais + (volPixApp * (taxaPixApp / 100)));
    let ecoMes = custoConc - custoMP;
    let res = parseFloat(cofrinho_reserva.value) || 0;
    let cdi = (window.selicAtual || 10.75) - 0.1;
    let alvo = (parseFloat(cofrinho_cdi_alvo.value) || 105) / 100;
    const calcCofre = (m) => {
        let s = 0;
        for(let i=0; i<m; i++){
            s += res;
            let r = (s <= 10000) ? s * (cdi * alvo / 1200) : (s <= 100000 ? s * (cdi / 1200) : 0);
            s += r;
        }
        return s;
    };
    document.getElementById("resultadoFaturamento").innerHTML = `
        <div class="resumo-financeiro">
            <h4 style="margin-top:0">💰 Rentabilidade Real Individualizada</h4>
            <b>Custo Operacional MP:</b> R$ ${custoMP.toFixed(2)}<br>
            <b>Custo Operacional Conc.:</b> R$ ${custoConc.toFixed(2)}<br>
            <b>Economia Mensal:</b> <span style="color:${ecoMes > 0 ? '#007bff' : 'red'}; font-size:16px; font-weight:bold">R$ ${ecoMes.toFixed(2)}</span><br>
            <b>Economia em 1 Ano:</b> R$ ${(ecoMes * 12).toFixed(2)}<br>
            <b style="color: #2e7d32; font-size:16px;">Economia em 5 Anos: R$ ${(ecoMes * 60).toFixed(2)}</b><hr>
            <h4>📈 Projeção Cofrinho</h4>
            <b>Saldo 1 Ano:</b> R$ ${calcCofre(12).toFixed(2)}<br>
            <b>Saldo 5 Anos:</b> R$ ${calcCofre(60).toFixed(2)}
        </div>`;
    if (window.g) window.g.destroy();
    window.g = new Chart(document.getElementById("graficoEconomia"), {
        type: 'bar',
        data: { labels: ["Eco. 1 Ano", "Eco. 5 Anos", "Cofre 5 Anos"], datasets: [{ label: 'R$', data: [ecoMes*12, ecoMes*60, calcCofre(60)], backgroundColor: ['#FFE600','#FFD400','#3483FA'] }] },
        options: { animation: false }
    });
}

function exportarRelatorio(apenasTaxas) {
    document.getElementById("rel_loja").innerText = document.getElementById("input_loja").value || "---";
    document.getElementById("rel_cliente").innerText = document.getElementById("input_cliente").value || "---";
    document.getElementById("rel_data").innerText = document.getElementById("input_data").value;
    document.getElementById("rel_tabela_taxas").innerHTML = "<h3>Comparativo de Taxas</h3>" + document.getElementById("resultado").innerHTML;
    let boxCorpo = document.getElementById("rel_share_cofrinho");
    let boxGrafico = document.getElementById("rel_grafico_box");
    let boxInfoAdicional = document.getElementById("rel_info_adicional");
    const textoCompleto = `<b>Informações adicionais:</b>\n➡️ Máquina sem aluguel\n➡️ Conta sem anuidade e taxas administrativas\n➡️ Link de pagamento com recebimento na hora e mesmas taxas da point\n➡️ Parcelamento até 18x\n➡️ Rendimentos diários no cofrinho\n➡️ NOVIDADE: Software de gestão completo (consulte condições)`;
    let checkboxAtivo = apenasTaxas ? document.getElementById("chk_info_simples") : document.getElementById("chk_info_completo");
    boxInfoAdicional.style.display = checkboxAtivo.checked ? "block" : "none";
    if (checkboxAtivo.checked) boxInfoAdicional.innerHTML = textoCompleto;
    if (apenasTaxas) {
        boxCorpo.style.display = "none"; boxGrafico.style.display = "none";
    } else {
        boxCorpo.style.display = "block"; boxGrafico.style.display = "block";
        boxCorpo.innerHTML = "<h3>Rentabilidade e Projeção</h3>" + document.getElementById("resultadoFaturamento").innerHTML;
        if (window.g) document.getElementById("img_grafico").src = document.getElementById("graficoEconomia").toDataURL();
    }
    setTimeout(() => {
        html2canvas(document.getElementById("areaRelatorio"), { scale: 2 }).then(canvas => {
            let link = document.createElement("a");
            link.download = `BA21_Relatorio.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    }, 600);
}

function toggleDescobreTaxa() {
    const box = document.getElementById("boxDescobreTaxa");
    box.style.display = (box.style.display === "none" || box.style.display === "") ? "block" : "none";
}

function limparDescobreTaxa() {
    document.getElementById("calc_valor_op").value = "";
    document.getElementById("calc_valor_rec").value = "";
    document.getElementById("calc_taxa_perc").value = "";
    document.getElementById("res_taxa_percent").innerText = "0.00%";
    document.getElementById("res_valor_desc").innerText = "- $ 0,00";
    document.getElementById("res_valor_final").innerText = "$ 0,00";
}

function calcularDescobreTaxa(origem) {
    let valorOp = parseFloat(document.getElementById("calc_valor_op").value) || 0;
    let valorRec = parseFloat(document.getElementById("calc_valor_rec").value) || 0;
    let taxaPercent = parseFloat(document.getElementById("calc_taxa_perc").value) || 0;
    if (valorOp > 0) {
        if (origem === 'recebido' && valorRec > 0) {
            let taxa = ((valorRec / valorOp) - 1) * 100;
            document.getElementById("calc_taxa_perc").value = taxa.toFixed(2);
            document.getElementById("res_taxa_percent").innerText = `${taxa.toFixed(2)}%`;
            document.getElementById("res_valor_desc").innerText = `- $ ${(valorOp - valorRec).toFixed(2)}`;
            document.getElementById("res_valor_final").innerText = `$ ${valorRec.toFixed(2)}`;
        } else if (origem === 'taxa' || (origem === 'valor' && taxaPercent !== 0)) {
            let taxaReal = taxaPercent > 0 ? taxaPercent * -1 : taxaPercent;
            let valorFinal = valorOp + (valorOp * (taxaReal / 100));
            document.getElementById("calc_valor_rec").value = valorFinal.toFixed(2);
            document.getElementById("res_taxa_percent").innerText = `${taxaReal.toFixed(2)}%`;
            document.getElementById("res_valor_desc").innerText = `- $ ${(valorOp - valorFinal).toFixed(2)}`;
            document.getElementById("res_valor_final").innerText = `$ ${valorFinal.toFixed(2)}`;
        }
    }
}

// 6. OCR DE ELITE (COM PRÉ-PROCESSAMENTO E SANITIZAÇÃO)
async function processarOCR(event, pref) {
    const file = event.target.files[0];
    if(!file) return;
    
    alert("Iniciando Escaneamento Inteligente...");

    const reader = new FileReader();
    reader.onload = async (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = async () => {
            // Criar um Canvas para pré-processar a imagem (Melhorar Contraste)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            
            ctx.drawImage(img, 0, 0);
            
            // Filtro de Escala de Cinza e Threshold (Preto e Branco puro)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const v = avg > 128 ? 255 : 0; // Se for claro vira branco, se escuro vira preto
                data[i] = data[i+1] = data[i+2] = v;
            }
            ctx.putImageData(imageData, 0, 0);

            // Iniciar Tesseract com a imagem tratada
            const worker = await Tesseract.createWorker('por');
            const res = await worker.recognize(canvas.toDataURL('image/png'));
            
            // SANITIZAÇÃO DO TEXTO EXTRAÍDO
            let txt = res.data.text.toLowerCase()
                .replace(/,/g, ".")       // Converte vírgulas em pontos
                .replace(/o/g, "0")       // Letra O vira Zero
                .replace(/i|l/g, "1")     // Letra I ou L vira Um
                .replace(/s/g, "5");      // Letra S vira Cinco

            // Regex Tolerante: Procura padrões como "2x 3.05" ou "2 3.05"
            let regex = /(\d{1,2})\s*[x\s-]*\s*([\d.]+)/g;
            let match;
            let encontrados = 0;

            while ((match = regex.exec(txt)) !== null) {
                let p = parseInt(match[1]), t = parseFloat(match[2]);
                if (p >= 1 && p <= 18 && t < 100) { // Validação básica para evitar erros
                    let id = (p === 1) ? (pref === "mp" ? "mp1" : "out1_manual") : (pref + p + (pref === "out" ? "_manual" : ""));
                    if(document.getElementById(id)) {
                        document.getElementById(id).value = t.toFixed(2);
                        encontrados++;
                    }
                }
            }
            
            await worker.terminate();
            alert(encontrados > 0 ? `Pronto! ${encontrados} taxas identificadas.` : "Não consegui ler as taxas. Tente uma foto mais nítida.");
        };
    };
    reader.readAsDataURL(file);
}
