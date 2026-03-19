const CDI_ANUAL = 10.65;

window.onload=function(){

let html="";

for(let i=2;i<=21;i++){
html+=`<label>${i}x (%)</label> <input id="mp${i}" type="number">`;
}

document.getElementById("mpParcelas").innerHTML=html;

gerarCamposManual();

document.getElementById("uploadOCR").addEventListener("change",processarOCR);
document.getElementById("uploadOCRConc").addEventListener("change",processarOCRConc);

}

function gerarCamposManual(){

let html="";

for(let i=2;i<=21;i++){
html+=`<label>${i}x (%)</label> <input id="out${i}_manual" type="number">`;
}

document.getElementById("outrasParcelas").innerHTML=html;

}

function trocarModoOutras(){

let modo=document.querySelector('input[name="modoOutras"]:checked').value;

if(modo==="manual"){
document.getElementById("modoMDR").style.display="none";
document.getElementById("modoManual").style.display="block";
}else{
document.getElementById("modoMDR").style.display="block";
document.getElementById("modoManual").style.display="none";
}

}

function liquido(valor,taxa){

if(taxa===undefined || taxa===null || taxa==="") return null;

return valor*(1-(taxa/100));

}

function formatarTaxa(taxa){

if(taxa===undefined || taxa===null || taxa==="") return "Não se aplica";

return parseFloat(taxa).toFixed(2)+"%";

}

function simular(){

let valor=parseFloat(document.getElementById("valor").value);

if(!valor){
alert("Informe o valor da venda");
return;
}

let mp={};
let outras={};

mp["pix"]=parseFloat(mp_pix.value);
mp["debito"]=parseFloat(mp_debito.value);
mp[1]=parseFloat(mp1.value);

for(let i=2;i<=21;i++){
mp[i]=parseFloat(document.getElementById("mp"+i).value);
}

let modo=document.querySelector('input[name="modoOutras"]:checked').value;

if(modo==="manual"){

outras["pix"]=parseFloat(out_pix_manual.value);
outras["debito"]=parseFloat(out_debito_manual.value);
outras[1]=parseFloat(out1_manual.value);

for(let i=2;i<=21;i++){
outras[i]=parseFloat(document.getElementById("out"+i+"_manual").value);
}

}else{

outras["pix"]=parseFloat(out_pix.value);
outras["debito"]=parseFloat(out_debito.value);
outras[1]=parseFloat(out1.value);

let mdrA=parseFloat(document.getElementById("mdr1").value);
let mdrB=parseFloat(document.getElementById("mdr2").value);
let mdrC=parseFloat(document.getElementById("mdr3").value);
let ant=parseFloat(document.getElementById("antecipacao").value);

for(let i=2;i<=6;i++) outras[i]=parseFloat((mdrA+(ant*(i-1))).toFixed(2));
for(let i=7;i<=12;i++) outras[i]=parseFloat((mdrB+(ant*(i-1))).toFixed(2));
for(let i=13;i<=21;i++) outras[i]=parseFloat((mdrC+(ant*(i-1))).toFixed(2));

document.querySelector('input[value="manual"]').checked=true;
trocarModoOutras();

out_pix_manual.value=outras["pix"];
out_debito_manual.value=outras["debito"];
out1_manual.value=outras[1];

for(let i=2;i<=21;i++){
document.getElementById("out"+i+"_manual").value=outras[i];
}

}

gerarTabela(valor,mp,outras);

}

function gerarTabela(valor,mp,outras){

let parcelas=["pix","debito",1];

for(let i=2;i<=21;i++) parcelas.push(i);

let html=`<table>

<tr>
<th>Parcela</th>
<th>Taxa MP</th>
<th>R$ Mercado Pago</th>
<th>Taxa Concorrência</th>
<th>R$ Concorrência</th>
</tr>`;

parcelas.forEach(p=>{

let nome=p==="pix"?"Pix":p==="debito"?"Débito":p+"x";

let taxaMP=mp[p];
let taxaOut=outras[p];

let valorMP=liquido(valor,taxaMP);
let valorOut=liquido(valor,taxaOut);

let classeMP="";
let classeOut="";

if(taxaMP>taxaOut) classeMP="taxaRuim";
if(taxaOut>taxaMP) classeOut="taxaRuim";

html+=`<tr>

<td>${nome}</td>

<td class="${classeMP}">${formatarTaxa(taxaMP)}</td>

<td>${valorMP!=null?"R$ "+valorMP.toFixed(2):"Não se aplica"}</td>

<td class="${classeOut}">${formatarTaxa(taxaOut)}</td>

<td>${valorOut!=null?"R$ "+valorOut.toFixed(2):"Não se aplica"}</td>

</tr>`;

});

html+="</table>";

document.getElementById("resultado").innerHTML=html;

}

function atualizarBarra(){

let ids=[
"share_pix",
"share_debito",
"share_1x",
"share_2x",
"share_4x",
"share_6x",
"share_10x"
];

let total=0;

ids.forEach(function(id){

let campo=document.getElementById(id);
let valor=parseFloat(campo.value);

if(!isNaN(valor)){
total+=valor;
}

});

if(total>100){
alert("A soma não pode ultrapassar 100%");
document.activeElement.value="";
return;
}

document.getElementById("contador").innerText = total + "%";
document.getElementById("barra").style.width = total + "%";

}

function simularFaturamento(){

let faturamento=parseFloat(document.getElementById("faturamento").value);
// validação do total de percentuais
let totalPercent =
(parseFloat(share_pix.value)||0) +
(parseFloat(share_debito.value)||0) +
(parseFloat(share_1x.value)||0) +
(parseFloat(share_2x.value)||0) +
(parseFloat(share_4x.value)||0) +
(parseFloat(share_6x.value)||0) +
(parseFloat(share_10x.value)||0);

if(totalPercent !== 100){
alert("A soma atual está em " + totalPercent + "%. Complete até 100% para simular.");
return;
}


let shares={
pix:parseFloat(share_pix.value)||0,
debito:parseFloat(share_debito.value)||0,
c1:parseFloat(share_1x.value)||0,
c2:parseFloat(share_2x.value)||0,
c4:parseFloat(share_4x.value)||0,
c6:parseFloat(share_6x.value)||0,
c10:parseFloat(share_10x.value)||0
};

let mp={
pix:parseFloat(mp_pix.value)||0,
debito:parseFloat(mp_debito.value)||0,
c1:parseFloat(mp1.value)||0,
c2:parseFloat(mp2.value)||0,
c4:parseFloat(mp4.value)||0,
c6:parseFloat(mp6.value)||0,
c10:parseFloat(mp10.value)||0
};

let out={
pix:parseFloat(out_pix_manual.value)||0,
debito:parseFloat(out_debito_manual.value)||0,
c1:parseFloat(out1_manual.value)||0,
c2:parseFloat(out2_manual.value)||0,
c4:parseFloat(out4_manual.value)||0,
c6:parseFloat(out6_manual.value)||0,
c10:parseFloat(out10_manual.value)||0
};

let economiaTaxas=0;

function calcular(tipo,percent){

let valor=faturamento*(percent/100);

let custoMP=valor*(mp[tipo]/100);
let custoOUT=valor*(out[tipo]/100);

economiaTaxas+=custoOUT-custoMP;

}

calcular("pix",shares.pix);
calcular("debito",shares.debito);
calcular("c1",shares.c1);
calcular("c2",shares.c2);
calcular("c4",shares.c4);
calcular("c6",shares.c6);
calcular("c10",shares.c10);

let custosFixos=
(parseFloat(document.getElementById("custo_sistema").value)||0)+
(parseFloat(document.getElementById("custo_maquina").value)||0)+
(parseFloat(document.getElementById("custo_cesta").value)||0)+
(parseFloat(document.getElementById("custo_manutencao").value)||0);

let economiaMensal=economiaTaxas+custosFixos;

let economiaAnual=economiaMensal*12;
let economia5anos=economiaAnual*5;

let reserva=parseFloat(document.getElementById("cofrinho_reserva").value)||0;
let percentual=parseFloat(document.getElementById("cofrinho_percentual").value)||0;

let taxaAnual=(CDI_ANUAL*(percentual/100))/100;
let taxaMensal=taxaAnual/12;

let saldo=0;
let rendimentoTotal=0;
let rendimento1ano=0;

for(let i=1;i<=60;i++){

saldo+=reserva;

let rendimento=saldo*taxaMensal;

saldo+=rendimento;

rendimentoTotal+=rendimento;

if(i<=12){
rendimento1ano+=rendimento;
}

}

document.getElementById("resultadoFaturamento").innerHTML=

`<div style="padding:20px;border:1px solid #ddd;border-radius:8px">

<h3>Resultado da simulação</h3>

Economia mensal: <b>R$ ${economiaMensal.toFixed(2)}</b><br><br>

Economia anual: <b>R$ ${economiaAnual.toFixed(2)}</b><br><br>

Economia em 5 anos: <b>R$ ${economia5anos.toFixed(2)}</b><br><br>

<hr>

Rendimento do cofrinho em 1 ano: <b>R$ ${rendimento1ano.toFixed(2)}</b><br><br>

Rendimento do cofrinho em 5 anos: <b>R$ ${rendimentoTotal.toFixed(2)}</b>

</div>`;

gerarGrafico(economiaAnual,economia5anos,rendimentoTotal);

}
function exportar(){

let area=document.getElementById("resultado");

if(!area.innerHTML){
alert("Primeiro simule as taxas.");
return;
}

html2canvas(area).then(canvas=>{

let link=document.createElement("a");
link.download="comparacao_taxas.png";
link.href=canvas.toDataURL();
link.click();

});

}

async function processarOCR(event){

const file=event.target.files[0];

const result=await Tesseract.recognize(file,'eng');

alert("OCR processado. Copie as taxas manualmente do texto detectado.");

console.log(result.data.text);

}

async function processarOCR(event){

const file = event.target.files[0];

if(!file){
alert("Selecione uma imagem.");
return;
}

alert("Processando imagem... aguarde");

const result = await Tesseract.recognize(file,'eng');

let texto = result.data.text;

console.log("TEXTO OCR:", texto);

// Normaliza texto
texto = texto.replace(/\n/g," ").replace(/,/g,".");

// Regex poderosa:
// pega: 1x 2x 3X etc + taxa (com % ou sem)
let regex = /(\d{1,2})\s*[xX]\s*([\d\.]+)/g;

let encontrados = {};
let match;

while((match = regex.exec(texto)) !== null){

let parcela = parseInt(match[1]);
let taxa = parseFloat(match[2]);

if(parcela >=1 && parcela <=21){
encontrados[parcela] = taxa;
}

}

// Preenche os campos
for(let i=1;i<=21;i++){

if(encontrados[i] !== undefined){

if(i === 1){
mp1.value = encontrados[i];
}else if(i >=2){
let campo = document.getElementById("mp"+i);
if(campo) campo.value = encontrados[i];
}

}

}

alert("Taxas preenchidas automaticamente!");

}

async function processarOCRConc(event){

const file = event.target.files[0];

if(!file){
alert("Selecione uma imagem.");
return;
}

alert("Processando imagem... aguarde");

const result = await Tesseract.recognize(file,'eng');

let texto = result.data.text;

console.log("TEXTO OCR CONCORRÊNCIA:", texto);

// Normaliza
texto = texto.replace(/\n/g," ").replace(/,/g,".");

let regex = /(\d{1,2})\s*[xX]\s*([\d\.]+)/g;

let encontrados = {};
let match;

while((match = regex.exec(texto)) !== null){

let parcela = parseInt(match[1]);
let taxa = parseFloat(match[2]);

if(parcela >=1 && parcela <=21){
encontrados[parcela] = taxa;
}

}

// Força modo manual (sem quebrar nada)
document.querySelector('input[value="manual"]').checked = true;
trocarModoOutras();

// Preenche
for(let i=1;i<=21;i++){

if(encontrados[i] !== undefined){

if(i === 1){
out1_manual.value = encontrados[i];
}else{
let campo = document.getElementById("out"+i+"_manual");
if(campo) campo.value = encontrados[i];
}

}

}

alert("Taxas da concorrência preenchidas!");

}
function gerarGrafico(anual,cincoanos,cofrinho){

let ctx=document.getElementById("graficoEconomia");

if(window.grafico){
window.grafico.destroy();
}

window.grafico=new Chart(ctx,{
type:'bar',
data:{
labels:["Economia 1 ano","Economia 5 anos","Cofrinho 5 anos"],
datasets:[{
label:"Resultado em R$",
data:[anual,cincoanos,cofrinho]
}]
},
options:{
responsive:true,
plugins:{
legend:{display:false}
}
}
});

}
