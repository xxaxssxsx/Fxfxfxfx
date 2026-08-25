const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "teste-local";

const users = [];
const history = [];

// ===============================
// ADMIN DE TESTE
// ===============================

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "admin@ffsensibilidade.local";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "Admin@123456";

const admin = {
  id: "admin-001",
  name: "Administrador",
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  role: "admin",
  vip: true,
  vipType: "ilimitado",
  balance: 999999,
  createdAt: new Date().toISOString()
};

users.push(admin);

// ===============================
// BASE DE SENSIBILIDADE
// ===============================

const BASE = {
  geral: 199,
  redDot: 199,
  duasX: 198,
  quatroX: 193,
  awm: 17
};

// ===============================
// FUNÇÕES
// ===============================

function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token não informado."
      });
    }

    const token = header.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = users.find((u) => u.id === decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não encontrado."
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Token inválido ou expirado."
    });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Acesso restrito à administração."
    });
  }

  next();
}

// ===============================
// GERAÇÃO DE SENSIBILIDADE
// ===============================

function gerarSensibilidade(celular, modoJogo = "BR") {
  const variacao = () => Math.floor(Math.random() * 5) - 2;

  let geral = BASE.geral + variacao();
  let redDot = BASE.redDot + variacao();
  let duasX = BASE.duasX + variacao();
  let quatroX = BASE.quatroX + variacao();

  let awm = BASE.awm + Math.floor(Math.random() * 5) - 2;

  geral = Math.max(0, Math.min(200, geral));
  redDot = Math.max(0, Math.min(200, redDot));
  duasX = Math.max(0, Math.min(200, duasX));
  quatroX = Math.max(0, Math.min(200, quatroX));
  awm = Math.max(0, Math.min(200, awm));

  return {
    celular,
    modoJogo,

    sensibilidade: {
      geral,
      redDot,
      duasX,
      quatroX,
      awm
    }
  };
}

// ===============================
// CONFIGURAÇÕES VIP
// ===============================

function gerarConfiguracoes(celular) {
  return {
    celular,

    velocidadePonteiro: {
      cs: "máximo",
      br: "metade"
    },

    acessibilidade: {
      ponteiroGrandeMouse: true,
      removerAnimacoes: true,
      acessoComInterruptor: true,

      atrasoPrimeiroItem: "0,01",
      numeroRepeticoes: 500,

      leituraPorPonto: [
        "38,00",
        "30,00",
        "6,9"
      ],

      leituraVerticais: "baixo",
      leiturasHorizontais: "direita",

      tipoDestaqueLeitura: [
        "fino",
        "médio"
      ],

      ignorarPressionamento: "0,01"
    }
  };
}

// ===============================
// ROTA PRINCIPAL
// ===============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "FF Sensibilidade API",
    status: "online"
  });
});

// ===============================
// HEALTH CHECK
// ===============================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    timestamp: new Date().toISOString()
  });
});

// ===============================
// CADASTRO
// ===============================

app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Nome, e-mail e senha são obrigatórios."
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email === normalizedEmail)) {
    return res.status(409).json({
      success: false,
      message: "Este e-mail já está cadastrado."
    });
  }

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: "user",
    vip: false,
    vipType: null,
    balance: 0,
    createdAt: new Date().toISOString()
  };

  users.push(user);

  const token = createToken(user);

  res.status(201).json({
    success: true,
    message: "Cadastro realizado com sucesso.",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      vip: user.vip,
      balance: user.balance
    }
  });
});

// ===============================
// LOGIN
// ===============================

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "E-mail e senha são obrigatórios."
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find(
    (u) => u.email === normalizedEmail
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "E-mail ou senha incorretos."
    });
  }

  const passwordValid =
    user.role === "admin"
      ? password === user.password
      : user.passwordHash === hashPassword(password);

  if (!passwordValid) {
    return res.status(401).json({
      success: false,
      message: "E-mail ou senha incorretos."
    });
  }

  const token = createToken(user);

  res.json({
    success: true,
    message: "Login realizado com sucesso.",
    token,

    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      vip: user.vip,
      vipType: user.vipType,
      balance: user.balance
    }
  });
});

// ===============================
// MEU PERFIL
// ===============================

app.get("/api/me", authenticate, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      vip: req.user.vip,
      vipType: req.user.vipType,
      balance: req.user.balance
    }
  });
});

// ===============================
// GERAR SENSIBILIDADE
// ===============================

app.post("/api/generate", authenticate, (req, res) => {
  const { celular, tipo, modoJogo } = req.body;

  if (!celular) {
    return res.status(400).json({
      success: false,
      message: "Informe o modelo do celular."
    });
  }

  const isVip = tipo === "vip";

  if (isVip && !req.user.vip) {
    return res.status(403).json({
      success: false,
      message: "Esta geração exige VIP."
    });
  }

  if (!isVip) {
    if (req.user.balance < 10) {
      return res.status(402).json({
        success: false,
        message: "Saldo insuficiente. Cada sensibilidade custa R$ 10."
      });
    }

    req.user.balance -= 10;
  }

  const resultado = gerarSensibilidade(
    celular,
    modoJogo || "BR"
  );

  if (isVip) {
    resultado.configuracoes =
      gerarConfiguracoes(celular);
  }

  const registro = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    tipo: isVip ? "VIP" : "NORMAL",
    celular,
    resultado,
    createdAt: new Date().toISOString()
  };

  history.push(registro);

  res.json({
    success: true,
    message: "Configuração gerada com sucesso.",
    saldo: req.user.balance,
    resultado
  });
});

// ===============================
// HISTÓRICO
// ===============================

app.get("/api/history", authenticate, (req, res) => {
  const userHistory = history
    .filter((item) => item.userId === req.user.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

  res.json({
    success: true,
    history: userHistory
  });
});

// ===============================
// PLANOS
// ===============================

app.get("/api/plans", (req, res) => {
  res.json({
    success: true,
    plans: {
      sensibilidade: {
        name: "Sensibilidade",
        price: 10,
        description: "Uma sensibilidade personalizada."
      },

      vip3Meses: {
        name: "VIP 3 meses",
        price: 20,
        duration: "3 meses",
        description:
          "Sensibilidade + configurações do celular."
      },

      vitalicio: {
        name: "Promoção 1 ano",
        price: 60,
        duration: "1 ano",
        description:
          "Sensibilidade + configurações durante 1 ano."
      }
    }
  });
});

// ===============================
// ADMIN
// ===============================

app.get(
  "/api/admin/users",
  authenticate,
  adminOnly,
  (req, res) => {
    const list = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      vip: user.vip,
      vipType: user.vipType,
      balance: user.balance,
      createdAt: user.createdAt
    }));

    res.json({
      success: true,
      users: list
    });
  }
);

app.get(
  "/api/admin/history",
  authenticate,
  adminOnly,
  (req, res) => {
    res.json({
      success: true,
      history
    });
  }
);

// ===============================
// ATIVAR VIP PARA TESTE
// ===============================

app.post(
  "/api/admin/grant-vip",
  authenticate,
  adminOnly,
  (req, res) => {
    const { userId, tipo } = req.body;

    const user = users.find(
      (u) => u.id === userId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado."
      });
    }

    user.vip = true;
    user.vipType = tipo || "3 meses";

    res.json({
      success: true,
      message: "VIP ativado com sucesso.",
      user: {
        id: user.id,
        name: user.name,
        vip: user.vip,
        vipType: user.vipType
      }
    });
  }
);

// ===============================
// INICIAR SERVIDOR
// ===============================

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `FF Sensibilidade API online na porta ${PORT}`
  );
});
