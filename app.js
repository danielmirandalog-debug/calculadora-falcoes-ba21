window.onload=function(){

let html="";

for(let i=2;i<=21;i++){

html+=`<label>${i}x (%)</label> <input id="mp${i}" type="number">`;

}

document.getElementById("mpParcelas").innerHTML=html;

}

function liquido(valor,taxa){

if(!taxa || isNaN(taxa)) return "NÃO SE APLICA";

let v=valor*(1-(taxa/100));

return "R$ "+v.toFixed(2);

}

function simular(){

let valor=parseFloat(document.getElementById("valor").value);

let mp={};
let outras={};

mp[0]=parseFloat(document.getElementById("mp_pix").value);
mp[1]=parseFloat(document.getElementById("mp1").value);

for(let i=2;i<=21;i++){

mp[i]=parseFloat(document.getElementById("mp"+i).value);

}

outras[0]=parseFloat(document.getElementById("out_pix").value);
outras[1]=parseFloat(document.getElementById("out1").value);

let mdr1=parseFloat(document.getElementById("mdr1").value);
let mdr2=parseFloat(document.getElementById("mdr2").value);
let mdr3=parseFloat(document.getElementById("mdr3").value);

let ant=parseFloat(document.getElementById("antecipacao").value);

for(let i=2;i<=6;i++){
outras[i]=mdr1+(ant*(i-1));
}

for(let i=7;i<=12;i++){
outras[i]=mdr2+(ant*(i-1));
}

for(let i=13;i<=21;i++){
outras[i]=mdr3+(ant*(i-1));
}

gerarTabela(valor,mp,outras);

}

function gerarTabela(valor,mp,outras){

let html=`<table>

<tr>

<th>Parcela</th>
<th>Taxa MP</th>
<th>R$ Mercado Pago</th>
<th>Taxa Concorrência</th>
<th>R$ Concorrência</th>

</tr>`;

for(let i=0;i<=21;i++){

let nome=i==0?"Pix":i+"x";

let taxaMP=mp[i];
let taxaOut=outras[i];

let classeMP="";
let classeOut="";

if(taxaMP && taxaOut){

if(taxaMP>taxaOut){

classeMP="taxaRuim";

}

if(taxaOut>taxaMP){

classeOut="taxaRuim";

}

}

html+=`<tr>

<td>${nome}</td>

<td class="${classeMP}">${taxaMP?taxaMP+"%":"-"}</td>

<td class="mp">${liquido(valor,taxaMP)}</td>

<td class="${classeOut}">${taxaOut?taxaOut+"%":"-"}</td>

<td class="outras">${liquido(valor,taxaOut)}</td>

</tr>`;

}

html+="</table>";

document.getElementById("resultado").innerHTML=html;

}

function exportar(){

html2canvas(document.getElementById("resultado")).then(canvas=>{

let link=document.createElement("a");

link.download="simulacao.png";

link.href=canvas.toDataURL();

link.click();

});

}

function lerOCR(){

let file=document.getElementById("uploadOCR").files[0];

if(!file){

alert("Selecione o print das taxas.");

return;

}

Tesseract.recognize(
file,
"eng",
{
tessedit_char_whitelist:"0123456789.,%"
}
).then(({data:{text}})=>{

let numeros=text.match(/[0-9]+[.,][0-9]+/g);

if(!numeros){

alert("Não consegui identificar as taxas.");

return;

}

let campos=["mp_pix","mp_debito","mp1"];

for(let i=2;i<=21;i++){

campos.push("mp"+i);

}

for(let i=0;i<numeros.length && i<campos.length;i++){

let valor=numeros[i].replace(",",".");
document.getElementById(campos[i]).value=valor;

}

alert("Taxas do Mercado Pago preenchidas automaticamente.");

});

}
