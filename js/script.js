const API = "https://sensfrifras.onrender.com";
const $ = s => document.querySelector(s);
const sessionKey = "ff_api_session_v1";

const base = {
  geral: 199,
  redDot: 199,
  duasX: 198,
  quatroX: 193,
  awm: 17
};

function token() {
  return localStorage.getItem(sessionKey);
}

function setToken(t) {
  localStorage.setItem(sessionKey, t);
}

function clearToken() {
  localStorage.removeItem(sessionKey);
}

function money(n) {
  return Number(n || 0).toFixed(2).replace(".", ",");
}

function toast(t) {
  const x = $("#toast");
  if (!x) return;

  x.textContent = t;
  x.style.display = "block";

  setTimeout(() => {
    x.style.display = "none";
  }, 2500);
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const t = token();

  if (t) {
    headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(API + path, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || "Erro na API");
  }

  return data;
}

/* =========================
   ABAS DE LOGIN/CADASTRO
========================= */

document.querySelectorAll(".tab").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll(".tab").forEach(x => {
      x.classList.remove("active");
    });

    b.classList.add("active");

    const login = b.dataset.auth === "login";

    $("#loginForm")?.classList.toggle("hidden", !login);
    $("#registerForm")?.classList.toggle("hidden", login);
  };
});

/* =========================
   CADASTRO
========================= */

$("#registerForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  try {
    const name = $("#regName")?.value.trim();
    const email = $("#regEmail")?.value.trim();
    const password = $("#regPassword")?.value;

    if (!name || !email || !password) {
      toast("Preencha todos os campos.");
      return;
    }

    const data = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    if (!data.token) {
      throw new Error("Cadastro realizado, mas a API não enviou o token.");
    }

    setToken(data.token);

    toast("Conta criada com sucesso!");

    await start();

  } catch (err) {
    toast(err.message || "Erro ao criar conta.");
  }
});

/* =========================
   LOGIN
========================= */

$("#loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  try {
    const email = $("#loginEmail")?.value.trim();
    const password = $("#loginPassword")?.value;

    if (!email || !password) {
      toast("Digite seu e-mail e sua senha.");
      return;
    }

    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!data.token) {
      throw new Error("Login realizado, mas a API não enviou o token.");
    }

    setToken(data.token);

    toast("Login realizado!");

    await start();

  } catch (err) {
    toast(err.message || "E-mail ou senha incorretos.");
  }
});

/* =========================
   LOGOUT
========================= */

$("#logout")?.addEventListener("click", () => {
  clearToken();
  location.reload();
});

/* =========================
   USUÁRIO LOGADO
========================= */

async function me() {
  if (!token()) {
    return null;
  }

  try {
    return await api("/api/me");
  } catch (e) {
    clearToken();
    return null;
  }
}

/* =========================
   INICIALIZAÇÃO DO PAINEL
========================= */

async function start() {
  const u = await me();

  if (!u) {
    $("#auth")?.classList.remove("hidden");
    $("#app")?.classList.add("hidden");
    return;
  }

  $("#auth")?.classList.add("hidden");
  $("#app")?.classList.remove("hidden");

  if ($("#userName")) {
    $("#userName").textContent = u.name || "Usuário";
  }

  if ($("#balance")) {
    $("#balance").textContent = money(u.balance);
  }

  render("generate");
}

/* =========================
   TELAS
========================= */

function render(view) {
  const c = $("#content");

  if (!c) return;

  if (view === "generate") {
    c.innerHTML = `
      <h2>🎯 Gerar sensibilidade</h2>

      <p class="small">
        Geração gratuita baseada na base configurada.
      </p>

      <label>Modelo do celular</label>

      <input
        id="device"
        placeholder="Ex.: Moto G84, Samsung A55..."
      >

      <button class="primary" id="gen">
        Gerar agora
      </button>

      <div id="out"></div>
    `;
  }

  if (view === "vip") {
    c.innerHTML = `
      <h2>👑 Sensibilidade VIP</h2>

      <p class="small">
        Inclui sensibilidade e configurações do celular.
      </p>

      <label>Modelo do celular</label>

      <input
        id="device"
        placeholder="Ex.: iPhone, Samsung, Motorola..."
      >

      <button class="primary" id="genVip">
        Gerar VIP
      </button>

      <div id="out"></div>
    `;
  }

  if (view === "history") {
    c.innerHTML = `
      <h2>📜 Seu histórico</h2>

      <div id="historyList">
        <p class="small">Carregando...</p>
      </div>
    `;
  }

  if (view === "plans") {
    c.innerHTML = `
      <h2>💳 Adicionar saldo</h2>

      <p class="small">
        Modo de teste: estes botões simulam as compras.
        Mercado Pago será ligado depois.
      </p>

      <div class="row">

        <div class="price">
          <b>R$10</b>
          <p>Crédito para uma geração.</p>

          <button class="primary add" data-v="10">
            Adicionar
          </button>
        </div>

        <div class="price">
          <b>R$20</b>
          <p>VIP por 3 meses.</p>

          <button class="primary addVip" data-v="20">
            Ativar VIP
          </button>
        </div>

        <div class="price">
          <b>R$60</b>
          <p>VIP por 1 ano.</p>

          <button class="primary addVip" data-v="60">
            Ativar VIP
          </button>
        </div>

      </div>
    `;
  }

  if (view === "admin") {
    c.innerHTML = `
      <h2>⚙️ Administração</h2>

      <div id="adminPanel">
        <p class="small">Carregando...</p>
      </div>
    `;
  }

  bind();

  if (view === "history") {
    loadHistory();
  }

  if (view === "admin") {
    loadAdmin();
  }
}

/* =========================
   RESULTADO
========================= */

function output(sens, vip) {
  const labels = {
    geral: "Geral",
    redDot: "Red Dot",
    duasX: "2X",
    quatroX: "4X",
    awm: "AWM"
  };

  const result = Object.entries(sens || {})
    .map(([k, v]) => `
      <div class="stat">
        <span>${labels[k] || k}</span>
        <b>${v}</b>
      </div>
    `)
    .join("");

  return `
    <div class="result">
      ${result}
    </div>

    ${
      vip
        ? `
          <div class="stat">

            <b>Configurações VIP</b>

            <p class="small">
              Velocidade do ponteiro: CS máximo · BR metade<br>
              Ponteiro grande do mouse: ativado · Remover animações: ativado<br>
              Acesso com interruptor: ativado · Atraso no primeiro item: 0,01<br>
              Número de repetições: 500 · Leitura por ponto: 38,00 / 30,00 / 6,9<br>
              Leitura vertical: baixo · Horizontal: direita<br>
              Destaque: fino/médio · Ignorar pressionamento: 0,01
            </p>

          </div>
        `
        : ""
    }
  `;
}

/* =========================
   BOTÕES
========================= */

function bind() {

  /* GERAR FREE */

  $("#gen")?.addEventListener("click", async () => {

    try {

      const d = $("#device")?.value.trim();

      const r = await api("/api/generate", {
        method: "POST",

        body: JSON.stringify({
          device: d,
          type: "free"
        })
      });

      $("#out").innerHTML = output(
        r.sensitivity,
        false
      );

      toast("Sensibilidade gerada!");

    } catch (e) {

      toast(e.message || "Erro ao gerar sensibilidade.");

    }

  });


  /* GERAR VIP */

  $("#genVip")?.addEventListener("click", async () => {

    try {

      const d = $("#device")?.value.trim();

      const r = await api("/api/generate", {
        method: "POST",

        body: JSON.stringify({
          device: d,
          type: "vip"
        })
      });

      $("#out").innerHTML = output(
        r.sensitivity,
        true
      );

      toast("Configuração VIP gerada!");

    } catch (e) {

      toast(e.message || "Erro ao gerar configuração VIP.");

    }

  });


  /* ADICIONAR SALDO */

  document.querySelectorAll(".add").forEach(b => {

    b.onclick = async () => {

      try {

        const r = await api("/api/test/topup", {
          method: "POST",

          body: JSON.stringify({
            amount: Number(b.dataset.v)
          })
        });

        toast(r.message || "Saldo adicionado!");

        await start();

      } catch (e) {

        toast(e.message || "Erro ao adicionar saldo.");

      }

    };

  });


  /* ATIVAR VIP */

  document.querySelectorAll(".addVip").forEach(b => {

    b.onclick = async () => {

      try {

        const months =
          Number(b.dataset.v) === 20
            ? 3
            : 12;

        const r = await api("/api/test/vip", {
          method: "POST",

          body: JSON.stringify({
            months
          })
        });

        toast(r.message || "VIP ativado!");

        await start();

      } catch (e) {

        toast(e.message || "Erro ao ativar VIP.");

      }

    };

  });

}

/* =========================
   HISTÓRICO
========================= */

async function loadHistory() {

  try {

    const r = await api("/api/history");

    const h = r.history || [];

    if (!h.length) {

      $("#historyList").innerHTML = `
        <p class="small">
          Nenhuma sensibilidade gerada ainda.
        </p>
      `;

      return;
    }

    $("#historyList").innerHTML = h
      .map(x => `
        <div
          class="stat"
          style="margin:8px 0"
        >

          <b>
            ${x.type === "vip" ? "VIP" : "Grátis"}
          </b>

          <div class="small">
            ${new Date(x.date).toLocaleString("pt-BR")}
            ·
            ${x.device || "Celular não informado"}
          </div>

          <div>
            ${Object.entries(x.sensitivity || {})
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · ")}
          </div>

        </div>
      `)
      .join("");

  } catch (e) {

    $("#historyList").innerHTML = `
      <p class="small">
        ${e.message}
      </p>
    `;

  }

}

/* =========================
   ADMIN
========================= */

async function loadAdmin() {

  try {

    const r = await api("/api/admin/users");

    const users = r.users || [];

    $("#adminPanel").innerHTML = `
      <p class="small">
        Usuários: ${users.length}
      </p>

      ${
        users.length
          ? users.map(u => `
              <div
                class="stat"
                style="margin:8px 0"
              >

                <b>
                  ${u.name}
                </b>

                <div class="small">
                  ${u.email}
                </div>

                <div>
                  Saldo:
                  R$ ${money(u.balance)}

                  · VIP:

                  ${
                    u.vipUnlimited
                      ? "Ilimitado"
                      : (
                          u.vipUntil
                            ? new Date(u.vipUntil)
                                .toLocaleDateString("pt-BR")
                            : "Não"
                        )
                  }
                </div>

              </div>
            `).join("")
          : `
              <p class="small">
                Nenhum usuário cadastrado.
              </p>
            `
      }
    `;

  } catch (e) {

    $("#adminPanel").innerHTML = `
      <p class="small">
        ${e.message}
      </p>
    `;

  }

}

/* =========================
   NAVEGAÇÃO DO PAINEL
========================= */

document.querySelectorAll("[data-view]").forEach(b => {

  b.onclick = () => {
    render(b.dataset.view);
  };

});

/* =========================
   INICIAR
========================= */

start();
