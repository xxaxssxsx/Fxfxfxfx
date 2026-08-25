const API = "https://sensfrifras.onrender.com";
const $ = s => document.querySelector(s);
const sessionKey = "ff_api_session_v1";

const base = { geral:199, redDot:199, duasX:198, quatroX:193, awm:17 };

function token(){ return localStorage.getItem(sessionKey); }
function setToken(t){ localStorage.setItem(sessionKey,t); }
function clearToken(){ localStorage.removeItem(sessionKey); }
function money(n){ return Number(n||0).toFixed(2).replace(".",","); }
function toast(t){ const x=$("#toast"); x.textContent=t; x.style.display="block"; setTimeout(()=>x.style.display="none",2500); }

async function api(path, options={}) {
  const headers = {"Content-Type":"application/json", ...(options.headers||{})};
  if(token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(API + path, {...options, headers});
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.message || "Erro na API");
  return data;
}

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  const login=b.dataset.auth==="login";
  $("#loginForm").classList.toggle("hidden",!login);
  $("#registerForm").classList.toggle("hidden",login);
});

$("#registerForm").onsubmit=async e=>{
  e.preventDefault();
  try{
    const data=await api("/api/auth/register",{method:"POST",body:JSON.stringify({
      name:$("#regName").value.trim(), email:$("#regEmail").value.trim(), password:$("#regPassword").value
    })});
    setToken(data.token); start(); toast("Conta criada com sucesso!");
  }catch(err){ toast(err.message); }
};

$("#loginForm").onsubmit=async e=>{
  e.preventDefault();
  try{
    const data=await api("/api/auth/login",{method:"POST",body:JSON.stringify({
      email:$("#loginEmail").value.trim(), password:$("#loginPassword").value
    })});
    setToken(data.token); start();
  }catch(err){ toast(err.message); }
};

$("#logout").onclick=()=>{ clearToken(); location.reload(); };

async function me(){
  if(!token()) return null;
  try { return await api("/api/me"); } catch(e){ clearToken(); return null; }
}

async function start(){
  const u=await me();
  if(!u){ $("#auth").classList.remove("hidden"); $("#app").classList.add("hidden"); return; }
  $("#auth").classList.add("hidden"); $("#app").classList.remove("hidden");
  $("#userName").textContent=u.name;
  $("#balance").textContent=money(u.balance);
  render("generate");
}

function render(view){
  const c=$("#content");
  if(view==="generate") c.innerHTML=`<h2>🎯 Gerar sensibilidade</h2><p class="small">Geração gratuita baseada na base configurada.</p><label>Modelo do celular</label><input id="device" placeholder="Ex.: Moto G84, Samsung A55..."><button class="primary" id="gen">Gerar agora</button><div id="out"></div>`;
  if(view==="vip") c.innerHTML=`<h2>👑 Sensibilidade VIP</h2><p class="small">Inclui sensibilidade e configurações do celular.</p><label>Modelo do celular</label><input id="device" placeholder="Ex.: iPhone, Samsung, Motorola..."><button class="primary" id="genVip">Gerar VIP</button><div id="out"></div>`;
  if(view==="history") c.innerHTML=`<h2>📜 Seu histórico</h2><div id="historyList"><p class="small">Carregando...</p></div>`;
  if(view==="plans") c.innerHTML=`<h2>💳 Adicionar saldo</h2><p class="small">Modo de teste: estes botões simulam as compras. Mercado Pago será ligado depois.</p><div class="row"><div class="price"><b>R$10</b><p>Crédito para uma geração.</p><button class="primary add" data-v="10">Adicionar</button></div><div class="price"><b>R$20</b><p>VIP por 3 meses.</p><button class="primary addVip" data-v="20">Ativar VIP</button></div><div class="price"><b>R$60</b><p>VIP por 1 ano.</p><button class="primary addVip" data-v="60">Ativar VIP</button></div></div>`;
  if(view==="admin") c.innerHTML=`<h2>⚙️ Administração</h2><div id="adminPanel"><p class="small">Carregando...</p></div>`;
  bind();
  if(view==="history") loadHistory();
  if(view==="admin") loadAdmin();
}

function output(sens, vip){
  const labels={geral:"Geral",redDot:"Red Dot",duasX:"2X",quatroX:"4X",awm:"AWM"};
  return `<div class="result">${Object.entries(sens).map(([k,v])=>`<div class="stat"><span>${labels[k]}</span><b>${v}</b></div>`).join("")}</div>`+
  (vip?`<div class="stat"><b>Configurações VIP</b><p class="small">Velocidade do ponteiro: CS máximo · BR metade<br>Ponteiro grande do mouse: ativado · Remover animações: ativado<br>Acesso com interruptor: ativado · Atraso no primeiro item: 0,01<br>Número de repetições: 500 · Leitura por ponto: 38,00 / 30,00 / 6,9<br>Leitura vertical: baixo · Horizontal: direita<br>Destaque: fino/médio · Ignorar pressionamento: 0,01</p></div>`:"");
}

function bind(){
  $("#gen")?.addEventListener("click",async()=>{
    try{
      const d=$("#device").value.trim();
      const r=await api("/api/generate",{method:"POST",body:JSON.stringify({device:d,type:"free"})});
      $("#out").innerHTML=output(r.sensitivity,false); toast("Sensibilidade gerada!");
    }catch(e){toast(e.message);}
  });
  $("#genVip")?.addEventListener("click",async()=>{
    try{
      const d=$("#device").value.trim();
      const r=await api("/api/generate",{method:"POST",body:JSON.stringify({device:d,type:"vip"})});
      $("#out").innerHTML=output(r.sensitivity,true); toast("Configuração VIP gerada!");
    }catch(e){toast(e.message);}
  });
  document.querySelectorAll(".add").forEach(b=>b.onclick=async()=>{
    try{const r=await api("/api/test/topup",{method:"POST",body:JSON.stringify({amount:Number(b.dataset.v)})}); toast(r.message); start();}
    catch(e){toast(e.message);}
  });
  document.querySelectorAll(".addVip").forEach(b=>b.onclick=async()=>{
    try{const months=Number(b.dataset.v)===20?3:12;const r=await api("/api/test/vip",{method:"POST",body:JSON.stringify({months})});toast(r.message);start();}
    catch(e){toast(e.message);}
  });
}

async function loadHistory(){
  try{
    const r=await api("/api/history");
    const h=r.history||[];
    $("#historyList").innerHTML=h.length?h.map(x=>`<div class="stat" style="margin:8px 0"><b>${x.type==="vip"?"VIP":"Grátis"}</b><div class="small">${new Date(x.date).toLocaleString("pt-BR")} · ${x.device||"Celular não informado"}</div><div>${Object.entries(x.sensitivity).map(([k,v])=>`${k}: ${v}`).join(" · ")}</div></div>`).join(""):"<p class='small'>Nenhuma sensibilidade gerada ainda.</p>";
  }catch(e){$("#historyList").innerHTML=`<p class="small">${e.message}</p>`;}
}

async function loadAdmin(){
  try{
    const r=await api("/api/admin/users");
    $("#adminPanel").innerHTML=`<p class="small">Usuários: ${r.users.length}</p>`+
      r.users.map(u=>`<div class="stat" style="margin:8px 0"><b>${u.name}</b><div class="small">${u.email}</div><div>Saldo: R$ ${money(u.balance)} · VIP: ${u.vipUnlimited?"Ilimitado":(u.vipUntil?new Date(u.vipUntil).toLocaleDateString("pt-BR"):"Não")}</div></div>`).join("");
  }catch(e){$("#adminPanel").innerHTML=`<p class="small">${e.message}</p>`;}
}

document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>render(b.dataset.view));
start();
  
