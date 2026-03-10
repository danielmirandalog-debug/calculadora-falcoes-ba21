window.onload=function(){

let html=""

for(let i=2;i<=18;i++){

html+=`<label>${i}x %</label>
<input id="mp${i}">`

}

document.getElementById("mpParcelas").innerHTML=html

}

function liquido(valor,taxa){

if(!taxa)return "NÃO SE APLICA"

let v=valor*(1-(taxa/100))

return "R$ "+v.toFixed(2)

}

function simular(){

let valor=parseFloat(document.getElementById("valor").value)

let mp={}
let outras={}

let pix=parseFloat(document.getElementById("mp_pix").value)
let deb=parseFloat(document.getElementById("mp_debito").value)
let um=parseFloat(document.getElementById("mp1").value)

mp[0]=pix
mp[1]=um

for(let i=2;i<=18;i++){

mp[i]=parseFloat(document.getElementById("mp"+i).value)

}

let outpix=parseFloat(document.getElementById("out_pix").value)
let outdeb=parseFloat(document.getElementById("out_debito").value)
let out1=parseFloat(document.getElementById("out1").value)

outras[0]=outpix
outras[1]=out1

let mdr1=parseFloat(document.getElementById("mdr1").value)
let mdr2=parseFloat(document.getElementById("mdr2").value)
let mdr3=parseFloat(document.getElementById("mdr3").value)

let ant=parseFloat(document.getElementById("antecipacao").value)

for(let i=2;i<=6;i++){

outras[i]=mdr1+(ant*((i-1)/2))

}

for(let i=7;i<=12;i++){

outras[i]=mdr2+(ant*((i-1)/2))

}

for(let i=13;i<=21;i++){

outras[i]=mdr3+(ant*((i-1)/2))

}

montarTabela(valor,mp,outras)

}

function montarTabela(valor,mp,outras){

let html=`<table>

<tr>

<th>Parcela</th>
<th>Mercado Pago</th>
<th>Outras</th>

</tr>`

for(let i=0;i<=21;i++){

let nome=""

if(i==0)nome="Pix"
else nome=i+"x"

html+=`<tr>

<td>${nome}</td>

<td class="mp">${liquido(valor,mp[i])}</td>

<td class="outras">${liquido(valor,outras[i])}</td>

</tr>`

}

html+="</table>"

let seller=document.getElementById("custoSeller").value
let conta=document.getElementById("custoConta").value
let maq=document.getElementById("custoMaquina").value

if(seller||conta||maq){

html+=`<h3>Custos adicionais</h3>`

if(seller)html+="Software seller: "+seller+"<br>"
if(conta)html+="Cesta serviços: "+conta+"<br>"
if(maq)html+="Aluguel máquina: "+maq+"<br>"

}

document.getElementById("resultado").innerHTML=html

}

function exportar(){

html2canvas(document.getElementById("resultado")).then(canvas=>{

let link=document.createElement("a")

link.download="simulacao.png"

link.href=canvas.toDataURL()

link.click()

})

}
