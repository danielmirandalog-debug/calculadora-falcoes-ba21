/* ==========================================================================
   PROJETO: CALCULADORA PREMIUM - FALCÕES DA BA21
   ESTADO: COMPLETO (RESTAURAÇÃO TOTAL + NOVOS BENEFÍCIOS)
   ========================================================================== 
*/

// 1. SEGURANÇA E ACESSO (Bloqueio Inicial)
(function() {
    const senhaCorreta = "123456"; 
    if (localStorage.getItem("acesso_simulador") !== "permitido") {
        let tentativa = prompt("Digite a senha de acesso dos Falcões BA21:");
        if (tentativa === senhaCorreta) {
            localStorage.setItem("acesso_simulador", "permitido");
        } else {
            alert("Acesso negado.");
            document.body.innerHTML = "<h1 style='text-align:center; margin-top:50px;'>Acesso Restrito - Falcões BA21</h1>";
            window.location.reload();
        }
    }
})();

// 2. INICIALIZAÇÃO E BUSCA DE DADOS ECONÔMICOS
document.addEventListener("DOMContentLoaded", function() {
    gerarInputs();
    buscarCDI();
    document.getElementById("input_data").value = new Date().toLocaleDateString('pt-BR');
});

// Busca a Taxa Selic/CDI em tempo real da API do Banco Central
async function buscarCDI() {
    try {
        const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        const dados = await response.json();
        window.selicAtual = parseFloat(dados[0].valor);
    } catch (e) { 
        console.log("Erro ao buscar CDI, usando padrão.");
        window.selicAtual = 10.75; 
    }
}

// Gera os campos de taxas de 2x até 18x dinamicamente
function gerarInputs() {
    let mpHTML = ""; 
    let outHTML = "";
    for (let i = 2; i <= 18; i++) {
        mpHTML += `<span><label>${i}x (%)</label> <input id="mp${i}" type="number" step="0.01" class="input-mp"></span>`;
        outHTML += `<span><label>${i}x (%)</label> <input id="out${i}_manual" type="number" step="0.01" class="input-out"></span>`;
    }
    document.getElementById("mpParcelas").innerHTML = mpHTML;
    document.getElementById("outrasParcelas").innerHTML = outHTML;
}

// 3. LÓGICA DE OCR (LEITURA DE IMAGEM/CÂMERA)
async function processarOCR(event, prefixo) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    alert("Iniciando leitura da imagem... Aguarde.");
    
    try {
        const resultado = await Tesseract.recognize(arquivo, 'por');
        let texto = resultado.data.text.toLowerCase().replace(/,/g, ".");
        
        // Regex para capturar padrões como "2x 4.50" ou "10 x 12.9"
        let regex = /(\d{1,2})\s*x\s*([\d.]+)/g;
        let achado;
        let contador = 0;

        while ((achado = regex.exec(texto)) !== null) {
            let parcela = parseInt(achado[1]);
            let taxa = parseFloat(achado[2]);
            
            let idCampo = (parcela === 1) ? 
                (prefixo === "mp" ? "mp1" : "out1_manual") : 
                (prefixo + parcela + (prefixo === "out" ? "_manual" : ""));

            let campo = document.getElementById(idCampo);
            if (campo) {
                campo.value = taxa.toFixed(2);
                contador++;
            }
        }
        alert(`Leitura finalizada! ${contador} taxas identificadas.`);
    } catch (erro) {
        alert("Erro ao processar imagem. Tente digitar manualmente.");
        console.error(erro);
    }
}

// 4. COMPARAÇÃO DE TAXAS (MÓDULO SIMPLES)
function simular() {
    let v = parseFloat(document.getElementById("valor").value);
    if (!v) return alert("Informe o valor da venda para simular.");

    let html = `<table><tr><th>Plano</th><th>Mercado Pago</th><th>Concorrência</th></tr>`;
    let mpSomaTotal = 0;
    let outSomaTotal = 0;

    // Array de modalidades a comparar
    const modalidades = ["pix", "debito", 1, 2, 3, 4, 6, 10, 12];

    modalidades.forEach(p => {
        let tMP = (p === "pix") ? parseFloat(document.getElementById("mp_pix").value) : 
                  (p === "debito" ? parseFloat(document.getElementById("mp_debito").value) : 
                  parseFloat(document.getElementById("mp"+p).value));
        
        let tOut = (p === "pix") ? parseFloat(document.getElementById("out_pix_manual").value) : 
                   (p === "debito" ? parseFloat(document.getElementById("out_debito_manual").value) : 
                   parseFloat(document.getElementById("out"+p+"_manual").value));

        if (!isNaN(tMP)) {
            mpSomaTotal += tMP;
            outSomaTotal += (tOut || 0);
            let nome = p === "pix" ? "Pix" : (p === "debito" ? "Débito" : p + "x");
            let destaqueMP = tMP > tOut ? 'class="taxaRuim"' : '';
            html += `<tr><td><b>${nome}</b></td><td ${destaqueMP}>${tMP.toFixed(2)}%</td><td>${(tOut || 0).toFixed(2)}%</td></tr>`;
        }
    });

    // Lógica do Campeão (Troféu)
    let msgCampeao = (mpSomaTotal < outSomaTotal) ? '<div class="campeao-msg">🏆 Mercado Pago é a melhor opção!</div>' : '';
    
    document.getElementById("resultado").innerHTML = msgCampeao + html + "</table>";
    document.getElementById("btnExportarSimples").style.display = "block";
}

// 5. CÁLCULO DE FATURAMENTO, SHARE E PROJEÇÃO COMPLETA
function simularFaturamento() {
    let fatur = parseFloat(document.getElementById("faturamento").value) || 0;
    if (fatur <= 0) return alert("Informe o faturamento mensal estimado.");

    let custoMP = 0;
    let custoConc = 0;
    const shareIds = { 
        pix: 'share_pix', debito: 'share_debito', 1: 'share_1x', 2: 'share_2x', 
        3: 'share_3x', 4: 'share_4x', 6: 'share_6x', 10: 'share_10x' 
    };

    Object.keys(shareIds).forEach(p => {
        let sharePerc = (parseFloat(document.getElementById(shareIds[p]).value) || 0) / 100;
        let volumeFatia = fatur * sharePerc;

        let tMP = (p === 'pix') ? parseFloat(document.getElementById("mp_pix").value) : 
                  (p === 'debito' ? parseFloat(document.getElementById("mp_debito").value) : 
                  parseFloat(document.getElementById('mp'+p).value) || 0);
        
        let tOut = (p === 'pix') ? parseFloat(document.getElementById("out_pix_manual").value) : 
                   (p === 'debito' ? parseFloat(document.getElementById("out_debito_manual").value) : 
                   parseFloat(document.getElementById('out'+p+'_manual').value) || 0);

        custoMP += volumeFatia * (tMP / 100);
        custoConc += volumeFatia * (tOut / 100);
    });

    // Custos Fixos da Concorrência
    let fixosConc = (parseFloat(document.getElementById("fixo_cesta").value) || 0) + 
                    (parseFloat(document.getElementById("fixo_manutencao").value) || 0) + 
                    (parseFloat(document.getElementById("fixo_sistema").value) || 0) + 
                    (parseFloat(document.getElementById("fixo_maquina").value) || 0);

    // Custo Pix App (Oculto)
    let custoPixApp = (parseFloat(document.getElementById("vol_pix_app").value) || 0) * ((parseFloat(document.getElementById("taxa_pix_app").value) || 1) / 100);

    custoConc += (fixosConc + custoPixApp);

    let economiaMensal = custoConc - custoMP;
    let aporteCofre = parseFloat(document.getElementById("cofrinho_reserva").value) || 0;
    let cdiAlvo = (parseFloat(document.getElementById("cofrinho_cdi_alvo").value) || 105) / 100;

    // Função de cálculo de juros compostos do Cofrinho (Regra dos 10k)
    const calcCofre = (meses) => {
        let saldo = 0;
        let taxaCDI = (window.selicAtual || 10.65) / 1200; // mensal
        for (let i = 0; i < meses; i++) {
            saldo += aporteCofre;
            let taxaAplicada = (saldo <= 10000) ? (taxaCDI * cdiAlvo) : taxaCDI;
            saldo += (saldo * taxaAplicada);
        }
        return saldo;
    };

    // Renderiza o Resumo Financeiro Completo
    document.getElementById("resultadoFaturamento").innerHTML = `
        <div class="resumo-financeiro">
            <b>Economia Mensal:</b> R$ ${economiaMensal.toFixed(2)}<br>
            <b>Economia Anual:</b> R$ ${(economiaMensal * 12).toFixed(2)}<br>
            <b style="color: #0d47a1">Economia em 5 Anos: R$ ${(economiaMensal * 60).toFixed(2)}</b>
            <hr>
            <b>Rendimento Cofrinho (1 Ano):</b> R$ ${calcCofre(12).toFixed(2)}<br>
            <b>Rendimento Cofrinho (5 Anos):</b> R$ ${calcCofre(60).toFixed(2)}
        </div>`;

    // Atualiza o Gráfico
    if (window.meuGrafico) window.meuGrafico.destroy();
    const ctx = document.getElementById("graficoEconomia").getContext('2d');
    window.meuGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["1 Ano", "5 Anos"],
            datasets: [{
                label: 'Economia Acumulada (R$)',
                data: [economiaMensal * 12, economiaMensal * 60],
                backgroundColor: ['#FFE600', '#FFB300']
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

// 6. EXPORTAÇÃO DE RELATÓRIO (IMAGE GENERATION)
function exportarRelatorio(apenasTaxas) {
    // Sincroniza dados da tela com o template oculto
    document.getElementById("rel_loja").innerText = document.getElementById("input_loja").value || "---";
    document.getElementById("rel_cliente").innerText = document.getElementById("input_cliente").value || "---";
    document.getElementById("rel_data").innerText = document.getElementById("input_data").value;
    document.getElementById("rel_tabela_taxas").innerHTML = "<h3>Comparativo de Taxas</h3>" + document.getElementById("resultado").innerHTML;
    
    // Verifica qual checkbox de info adicional usar
    let checkID = apenasTaxas ? "chk_info_adicional_1" : "chk_info_adicional_2";
    let mostrarInfo = document.getElementById(checkID).checked;
    document.getElementById("rel_info_adicional").style.display = mostrarInfo ? "block" : "none";

    // Define se mostra faturamento e gráfico no PNG
    if (apenasTaxas) {
        document.getElementById("rel_share_cofrinho").style.display = "none";
        document.getElementById("rel_grafico_box").style.display = "none";
    } else {
        document.getElementById("rel_share_cofrinho").style.display = "block";
        document.getElementById("rel_grafico_box").style.display = "block";
        document.getElementById("rel_share_cofrinho").innerHTML = "<h3>Projeção e Rentabilidade</h3>" + document.getElementById("resultadoFaturamento").innerHTML;
        if (window.meuGrafico) {
            document.getElementById("img_grafico").src = document.getElementById("graficoEconomia").toDataURL();
        }
    }

    // Processa o canvas e faz o download
    setTimeout(() => {
        html2canvas(document.getElementById("areaRelatorio"), { 
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false 
        }).then(canvas => {
            let link = document.createElement("a");
            link.download = `PROPOSTA_MP_${document.getElementById("input_loja").value || 'CLIENTE'}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        });
    }, 800);
}

// 7. UTILITÁRIOS (Barra de Share e Limpeza)
function atualizarBarra() {
    let ids = ["share_pix","share_debito","share_1x","share_2x","share_3x","share_4x","share_6x","share_10x"];
    let soma = 0;
    ids.forEach(id => soma += (parseFloat(document.getElementById(id).value) || 0));
    
    document.getElementById("contador").innerText = Math.round(soma) + "%";
    let barra = document.getElementById("barra");
    barra.style.width = soma + "%";
    barra.style.background = soma > 100 ? "#f44336" : "#FFE600";
}

function limparSecao(tipo) {
    if (tipo === 'mp') {
        document.getElementById("mp_pix").value = "0.49";
        document.getElementById("mp_debito").value = "0.99";
        document.getElementById("mp1").value = "3.05";
        document.querySelectorAll(".input-mp").forEach(i => i.value = "");
    } else if (tipo === 'out') {
        document.getElementById("out_pix_manual").value = "";
        document.getElementById("out_debito_manual").value = "";
        document.getElementById("out1_manual").value = "";
        document.querySelectorAll(".input-out").forEach(i => i.value = "");
    } else if (tipo === 'share') {
        ["share_pix","share_debito","share_1x","share_2x","share_3x","share_4x","share_6x","share_10x"].forEach(id => {
            document.getElementById(id).value = "";
        });
        atualizarBarra();
    }
}
