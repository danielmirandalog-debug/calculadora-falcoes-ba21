window.onload = function(){

let html="";

for(let i=2;i<=21;i++){

html += `<label>${i}x (%)</label> <input id="mp${i}" type="number">`;

}

document.getElementById("mpParcelas").innerHTML = html;

}

function liquido(valor,taxa){

if(!taxa || isNaN(taxa)){

return "NÃO SE APLICA";

}

let resultado = valor * (1 - taxa/100);

return "R$ " + resultado.toFixed(2);

}

function simular(){

let valor = parseFloat(document.getElementById("valor").value);

let mp = {};
let outras = {};

mp[0] = parseFloat(document.getElementById("mp_pix").value);
mp[1] = parseFloat(document.getElementById("mp1").value);

for(let i=2;i<=21;i++){

mp[i] = parseFloat(document.getElementById("mp"+i).value);

}

outras[0] = parseFloat(document.getElementById("out_pix").value);
outras[1] = parseFloat(document.getElementById("out1").value);

let mdr1 = parseFloat(document.getElementById("mdr1").value);
let mdr2 = parseFloat(document.getElementById("mdr2").value);
let mdr3 = parseFloat(document.getElementById("mdr3").value);

let antecipacao = parseFloat(document.getElementById("antecipacao").value);

for(let i=2;i<=6;i++){

outras[i] = mdr1 + (antecipacao*(i-1));

}

for(let i=7;i<=12;i++){

outras[i] = mdr2 + (antecipacao*(i-1));

}

for(let i=13;i<=21;i++){

outras[i] = mdr3 + (antecipacao*(i-1));

}

gerarTabela(valor,mp,outras);

compararResultados(valor,mp,outras);

}

function gerarTabela(valor,mp,outras){

let html = "<table>";

html += "<tr><th>Parcela</th><th>Mercado Pago</th><th>Outras</th></tr>";

for(let i=0;i<=21;i++){

let nome = i==0 ? "Pix" : i+"x";

html += `<tr>

<td>${nome}</td>

<td class="mp">${liquido(valor,mp[i])}</td>

<td class="outras">${liquido(valor,outras[i])}</td>

</tr>`;

}

html += "</table>";

let seller = document.getElementById("custoSeller").value;
let conta = document.getElementById("custoConta").value;
let maquina = document.getElementById("custoMaquina").value;

if(seller || conta || maquina){

html += "<h3>Custos adicionais</h3>";

if(seller) html += "Software Seller: R$ "+seller+"<br>";
if(conta) html += "Cesta de serviços: R$ "+conta+"<br>";
if(maquina) html += "Aluguel da máquina: R$ "+maquina+"<br>";

}

document.getElementById("resultado").innerHTML = html;

}

function compararResultados(valor,mp,outras){

let totalMP = 0;
let totalOutras = 0;

for(let i=1;i<=12;i++){

if(mp[i]){

totalMP += valor*(1-mp[i]/100);

}

if(outras[i]){

totalOutras += valor*(1-outras[i]/100);

}

}

let melhor = "";

if(totalMP > totalOutras){

melhor = "Mercado Pago compensa mais.";

}else if(totalOutras > totalMP){

melhor = "Outras adquirências compensam mais.";

}else{

melhor = "Resultados iguais.";

}

document.getElementById("comparador").innerHTML = "<h3>"+melhor+"</h3>";

}

function exportar(){

html2canvas(document.getElementById("resultado")).then(canvas=>{

let link = document.createElement("a");

link.download = "simulacao.png";

link.href = canvas.toDataURL();

link.click();

});

}

function enviarWhats(){

let valor = document.getElementById("valor").value;

let texto = "Simulação de taxas%0A";
texto += "Valor da venda: R$ "+valor+"%0A%0A";
texto += "Gerado pela Calculadora Falcões BA21";

let url = "https://wa.me/?text="+texto;

window.open(url);

}

function lerOCR(){

let file = document.getElementById("uploadOCR").files[0];

if(!file){

alert("Selecione uma imagem.");

return;

}

Tesseract.recognize(

file,

"eng",

{

logger: m => console.log(m)

}

).then(({data:{text}})=>{

alert("Texto detectado:\n"+text);

});

}
