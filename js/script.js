const API = "https://sensfrifras.onrender.com";
const $ = s => document.querySelector(s);
const sessionKey = "ff_api_session_v1";

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

function toast(message) {
  const x = $("#toast");

  if (!x) {
    alert(message);
    return;
  }

  x.textContent = message;
  x.style.display = "block";

  setTimeout(() => {
    x.style.display = "none";
  }, 2500);
}

/* =========================================
   API
========================================= */

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const t = token();

  if (t) {
    headers.Authorization = `Bearer ${t}`;
  }

  let response;

  try {
    response = await fetch(API + path, {
      ...options,
      headers
    });
  } catch (error) {
    throw new Error(
      "Não foi possível conectar ao servidor."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Erro na API."
    );
  }

  return data;
}

/* =========================================
   ABAS LOGIN / CADASTRO
========================================= */

document.querySelectorAll(".tab").forEach(button => {

  button.addEventListener("click", () => {

    document.querySelectorAll(".tab").forEach(tab => {
      tab.classList.remove("active");
    });

    button.classList.add("active");

    const isLogin =
      button.dataset.auth === "login";

    $("#loginForm")?.classList.toggle(
      "hidden",
      !isLogin
    );

    $("#registerForm")?.classList.toggle(
      "hidden",
      isLogin
    );
  });

});

/* =========================================
   CADASTRO
========================================= */

$("#registerForm")?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    try {

      const name =
        $("#regName")?.value.trim();

      const email =
        $("#regEmail")?.value.trim();

      const password =
        $("#regPassword")?.value;

      if (!name || !email || !password) {
        toast("Preencha todos os campos.");
        return;
      }

      if (password.length < 6) {
        toast(
          "A senha precisa ter pelo menos 6 caracteres."
        );
        return;
      }

      const data = await api(
        "/api/auth/register",
        {
          method: "POST",

          body: JSON.stringify({
            name,
            email,
            password
          })
        }
      );

      if (!data.token) {
        throw new Error(
          "Conta criada, mas a sessão não foi iniciada."
        );
      }

      setToken(data.token);

      toast(
        "Conta criada com sucesso!"
      );

      await start();

    } catch (error) {

      toast(
        error.message ||
        "Erro ao criar conta."
      );

    }

  }
);

/* =========================================
   LOGIN
========================================= */

$("#loginForm")?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    try {

      const email =
        $("#loginEmail")?.value.trim();

      const password =
        $("#loginPassword")?.value;

      if (!email || !password) {
        toast(
          "Digite seu e-mail e sua senha."
        );
        return;
      }

      const data = await api(
        "/api/auth/login",
        {
          method: "POST",

          body: JSON.stringify({
            email,
            password
          })
        }
      );

      if (!data.token) {
        throw new Error(
          "Login realizado, mas a sessão não foi criada."
        );
      }

      setToken(data.token);

      toast(
        "Login realizado com sucesso!"
      );

      await start();

    } catch (error) {

      toast(
        error.message ||
        "E-mail ou senha incorretos."
      );

    }

  }
);

/* =========================================
   LOGOUT
========================================= */

$("#logout")?.addEventListener(
  "click",
  () => {

    clearToken();

    location.reload();

  }
);

/* =========================================
   USUÁRIO LOGADO
========================================= */

async function me() {

  if (!token()) {
    return null;
  }

  try {

    /*
      IMPORTANTE:
      O backend usa /api/auth/me
    */

    const data = await api(
      "/api/auth/me"
    );

    return data.usuario || null;

  } catch (error) {

    clearToken();

    return null;
  }
}

/* =========================================
   INICIAR PAINEL
========================================= */

async function start() {

  const user = await me();

  if (!user) {

    $("#auth")?.classList.remove(
      "hidden"
    );

    $("#app")?.classList.add(
      "hidden"
    );

    return;
  }

  $("#auth")?.classList.add(
    "hidden"
  );

  $("#app")?.classList.remove(
    "hidden"
  );

  /*
    O backend retorna "nome".
    Mantemos "name" como compatibilidade.
  */

  if ($("#userName")) {

    $("#userName").textContent =
      user.nome ||
      user.name ||
      "Usuário";

  }

  if ($("#balance")) {

    $("#balance").textContent =
      money(user.balance || 0);

  }

  render("generate");
}

/* =========================================
   RENDERIZAÇÃO DO PAINEL
========================================= */

function render(view) {

  const content = $("#content");

  if (!content) return;

  if (view === "generate") {

    content.innerHTML = `

      <h2>Gerar sensibilidade</h2>

      <p class="small">
        Gere uma configuração personalizada
        para sua experiência no Free Fire.
      </p>

      <label>
        Modelo do celular
      </label>

      <input
        id="device"
        placeholder="Ex.: Moto G84, Samsung A55..."
      >

      <button
        class="primary"
        id="gen"
      >
        Gerar agora
      </button>

      <div id="out"></div>

    `;
  }

  if (view === "vip") {

    content.innerHTML = `

      <h2>Sensibilidade VIP</h2>

      <p class="small">
        Configurações exclusivas para usuários VIP.
      </p>

      <label>
        Modelo do celular
      </label>

      <input
        id="device"
        placeholder="Ex.: iPhone, Samsung, Motorola..."
      >

      <button
        class="primary"
        id="genVip"
      >
        Gerar VIP
      </button>

      <div id="out"></div>

    `;
  }

  if (view === "history") {

    content.innerHTML = `

      <h2>Histórico</h2>

      <div id="historyList">
        <p class="small">
          Carregando...
        </p>
      </div>

    `;

  }

  if (view === "plans") {

    content.innerHTML = `

      <h2>Adicionar saldo</h2>

      <p class="small">
        Modo de teste.
      </p>

      <div class="row">

        <div class="price">

          <b>R$10</b>

          <p>
            Crédito para uma geração.
          </p>

          <button
            class="primary add"
            data-v="10"
          >
            Adicionar
          </button>

        </div>

        <div class="price">

          <b>R$20</b>

          <p>
            VIP por 3 meses.
          </p>

          <button
            class="primary addVip"
            data-v="20"
          >
            Ativar VIP
          </button>

        </div>

        <div class="price">

          <b>R$60</b>

          <p>
            VIP por 1 ano.
          </p>

          <button
            class="primary addVip"
            data-v="60"
          >
            Ativar VIP
          </button>

        </div>

      </div>

    `;

  }

  if (view === "admin") {

    content.innerHTML = `

      <h2>Administração</h2>

      <div id="adminPanel">

        <p class="small">
          Carregando...
        </p>

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

/* =========================================
   RESULTADO DA SENSIBILIDADE
========================================= */

function output(sensitivity, vip) {

  const labels = {

    geral: "Geral",

    redDot: "Red Dot",

    duasX: "2X",

    quatroX: "4X",

    awm: "AWM",

    olhadinha: "Olhadinha"

  };

  const values =
    sensitivity || {};

  const result =
    Object.entries(values)
      .map(([key, value]) => {

        return `

          <div class="stat">

            <span>
              ${labels[key] || key}
            </span>

            <b>
              ${value}
            </b>

          </div>

        `;

      })
      .join("");

  return `

    <div class="result">

      ${result}

    </div>

    ${
      vip
        ? `

          <div class="stat">

            <b>
              Configurações VIP
            </b>

            <p class="small">

              Velocidade do ponteiro:
              CS máximo · BR metade<br>

              Ponteiro grande do mouse:
              ativado<br>

              Remover animações:
              ativado<br>

              Acesso com interruptor:
              ativado<br>

              Atraso no primeiro item:
              0,01<br>

              Número de repetições:
              500<br>

              Leitura por ponto:
              38,00 / 30,00 / 6,9<br>

              Leitura vertical:
              baixo<br>

              Horizontal:
              direita

            </p>

          </div>

        `
        : ""
    }

  `;
}

/* =========================================
   BOTÕES DO PAINEL
========================================= */

function bind() {

  /* FREE */

  $("#gen")?.addEventListener(
    "click",
    async () => {

      try {

        const device =
          $("#device")?.value.trim();

        const result =
          await api(
            "/api/generate",
            {
              method: "POST",

              body: JSON.stringify({
                device,
                type: "free"
              })
            }
          );

        $("#out").innerHTML =
          output(
            result.sensitivity,
            false
          );

        toast(
          "Sensibilidade gerada!"
        );

      } catch (error) {

        toast(
          error.message ||
          "Erro ao gerar sensibilidade."
        );

      }

    }
  );

  /* VIP */

  $("#genVip")?.addEventListener(
    "click",
    async () => {

      try {

        const device =
          $("#device")?.value.trim();

        const result =
          await api(
            "/api/generate",
            {
              method: "POST",

              body: JSON.stringify({
                device,
                type: "vip"
              })
            }
          );

        $("#out").innerHTML =
          output(
            result.sensitivity,
            true
          );

        toast(
          "Configuração VIP gerada!"
        );

      } catch (error) {

        toast(
          error.message ||
          "Erro ao gerar configuração VIP."
        );

      }

    }
  );

  /* SALDO */

  document
    .querySelectorAll(".add")
    .forEach(button => {

      button.onclick = async () => {

        try {

          const result =
            await api(
              "/api/test/topup",
              {
                method: "POST",

                body: JSON.stringify({
                  amount:
                    Number(
                      button.dataset.v
                    )
                })
              }
            );

          toast(
            result.message ||
            "Saldo adicionado!"
          );

          await start();

        } catch (error) {

          toast(
            error.message
          );

        }

      };

    });

  /* VIP */

  document
    .querySelectorAll(".addVip")
    .forEach(button => {

      button.onclick = async () => {

        try {

          const value =
            Number(
              button.dataset.v
            );

          const months =
            value === 20
              ? 3
              : 12;

          const result =
            await api(
              "/api/test/vip",
              {
                method: "POST",

                body: JSON.stringify({
                  months
                })
              }
            );

          toast(
            result.message ||
            "VIP ativado!"
          );

          await start();

        } catch (error) {

          toast(
            error.message
          );

        }

      };

    });

}

/* =========================================
   HISTÓRICO
========================================= */

async function loadHistory() {

  try {

    const result =
      await api(
        "/api/history"
      );

    const history =
      result.history || [];

    if (!history.length) {

      $("#historyList").innerHTML = `

        <p class="small">
          Nenhuma sensibilidade
          gerada ainda.
        </p>

      `;

      return;
    }

    $("#historyList").innerHTML =
      history
        .map(item => {

          const type =
            item.type === "vip"
              ? "VIP"
              : "Grátis";

          const date =
            item.date
              ? new Date(
                  item.date
                ).toLocaleString(
                  "pt-BR"
                )
              : "";

          const sensitivity =
            Object.entries(
              item.sensitivity || {}
            )
              .map(
                ([key, value]) =>
                  `${key}: ${value}`
              )
              .join(" · ");

          return `

            <div
              class="stat"
              style="margin:8px 0"
            >

              <b>
                ${type}
              </b>

              <div class="small">
                ${date}
                ·
                ${
                  item.device ||
                  "Celular não informado"
                }
              </div>

              <div>
                ${sensitivity}
              </div>

            </div>

          `;

        })
        .join("");

  } catch (error) {

    $("#historyList").innerHTML = `

      <p class="small">
        ${error.message}
      </p>

    `;

  }
}

/* =========================================
   ADMIN
========================================= */

async function loadAdmin() {

  try {

    const result =
      await api(
        "/api/admin/users"
      );

    const users =
      result.users || [];

    let html = `

      <p class="small">
        Usuários: ${users.length}
      </p>

    `;

    if (!users.length) {

      html += `

        <p class="small">
          Nenhum usuário cadastrado.
        </p>

      `;

    } else {

      html += users
        .map(user => {

          let vip = "Não";

          if (user.vipUnlimited) {

            vip = "Ilimitado";

          } else if (user.vipUntil) {

            vip =
              new Date(
                user.vipUntil
              ).toLocaleDateString(
                "pt-BR"
              );

          }

          return `

            <div
              class="stat"
              style="margin:8px 0"
            >

              <b>
                ${user.name || user.nome || "Usuário"}
              </b>

              <div class="small">
                ${user.email}
              </div>

              <div>
                Saldo:
                R$ ${money(user.balance)}

                · VIP:
                ${vip}
              </div>

            </div>

          `;

        })
        .join("");

    }

    $("#adminPanel").innerHTML =
      html;

  } catch (error) {

    $("#adminPanel").innerHTML = `

      <p class="small">
        ${error.message}
      </p>

    `;

  }
}

/* =========================================
   NAVEGAÇÃO
========================================= */

document
  .querySelectorAll("[data-view]")
  .forEach(button => {

    button.onclick = () => {

      render(
        button.dataset.view
      );

    };

  });

/* =========================================
   INICIAR SITE
========================================= */

start();
