const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const PORT = process.env.PORT || 3000;

const JWT_SECRET =
  process.env.JWT_SECRET || "ff-sensibilidade-chave-secreta-2026";

/*
  Banco temporário em memória.
  IMPORTANTE:
  Em produção, depois podemos trocar por MongoDB/Firebase.
*/
const usuarios = [];

/* =========================================================
   ADMIN
========================================================= */

const ADMIN_EMAIL = "admin@ffsensibilidade.local";
const ADMIN_PASSWORD = "Admin@12345";

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function criarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      plano: usuario.plano,
      role: usuario.role
    },
    JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
}

function autenticar(req, res, next) {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({
        sucesso: false,
        message: "Token não informado."
      });
    }

    const token = auth.split(" ")[1];

    const usuario = jwt.verify(token, JWT_SECRET);

    req.usuario = usuario;

    next();
  } catch (error) {
    return res.status(401).json({
      sucesso: false,
      message: "Token inválido ou expirado."
    });
  }
}

/* =========================================================
   SENSIBILIDADE FREE FIRE
========================================================= */

function gerarConfiguracaoFreeFire(modoJogo, planoUsuario) {
  const isCS = modoJogo === "CS";

  const sensibilidade = {
    geral: Math.floor(Math.random() * 6) + 195,
    redDot: Math.floor(Math.random() * 9) + 192,
    duaX: Math.floor(Math.random() * 9) + 190,
    quatroX: Math.floor(Math.random() * 11) + 185,
    awm: Math.floor(Math.random() * 11) + 180,
    olhadinha: Math.floor(Math.random() * 11) + 185
  };

  if (isCS) {
    sensibilidade.geral = Math.min(
      200,
      sensibilidade.geral
    );

    sensibilidade.redDot = Math.min(
      200,
      sensibilidade.redDot
    );
  }

  return {
    sucesso: true,
    plano: planoUsuario || "FREE",
    modo: modoJogo || "BR",
    sensibilidade
  };
}

/* =========================================================
   ROTA PRINCIPAL
========================================================= */

app.get("/", (req, res) => {
  res.json({
    sucesso: true,
    success: true,
    name: "FF Sensibilidade API",
    status: "online",
    version: "1.0.0"
  });
});

/* =========================================================
   CADASTRO
========================================================= */

app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      name,
      nome,
      email,
      password,
      senha
    } = req.body;

    const nomeFinal = (name || nome || "").trim();
    const emailFinal = (email || "").trim().toLowerCase();
    const senhaFinal = password || senha || "";

    if (!nomeFinal || !emailFinal || !senhaFinal) {
      return res.status(400).json({
        sucesso: false,
        message: "Preencha nome, e-mail e senha."
      });
    }

    if (senhaFinal.length < 6) {
      return res.status(400).json({
        sucesso: false,
        message: "A senha precisa ter pelo menos 6 caracteres."
      });
    }

    /*
      Não permite criar conta usando o e-mail do administrador.
    */
    if (emailFinal === ADMIN_EMAIL) {
      return res.status(400).json({
        sucesso: false,
        message: "Este e-mail não pode ser utilizado no cadastro."
      });
    }

    const existente = usuarios.find(
      usuario => usuario.email === emailFinal
    );

    if (existente) {
      return res.status(409).json({
        sucesso: false,
        message: "Este e-mail já está cadastrado."
      });
    }

    const senhaHash = await bcrypt.hash(
      senhaFinal,
      10
    );

    const usuario = {
      id: Date.now().toString(),
      nome: nomeFinal,
      email: emailFinal,
      senha: senhaHash,
      plano: "FREE",
      role: "user",
      criadoEm: new Date().toISOString()
    };

    usuarios.push(usuario);

    const token = criarToken(usuario);

    return res.status(201).json({
      sucesso: true,
      message: "Conta criada com sucesso!",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        plano: usuario.plano,
        role: usuario.role
      }
    });

  } catch (error) {
    console.error("ERRO REGISTER:", error);

    return res.status(500).json({
      sucesso: false,
      message: "Erro interno ao criar a conta."
    });
  }
});

/* =========================================================
   LOGIN
========================================================= */

app.post("/api/auth/login", async (req, res) => {
  try {
    const {
      email,
      password,
      senha
    } = req.body;

    const emailFinal = (email || "").trim().toLowerCase();
    const senhaFinal = password || senha || "";

    if (!emailFinal || !senhaFinal) {
      return res.status(400).json({
        sucesso: false,
        message: "Informe e-mail e senha."
      });
    }

    /*
      LOGIN DO ADMIN
    */
    if (
      emailFinal === ADMIN_EMAIL &&
      senhaFinal === ADMIN_PASSWORD
    ) {
      const admin = {
        id: "admin",
        nome: "Administrador",
        email: ADMIN_EMAIL,
        plano: "VIP",
        role: "admin"
      };

      const token = criarToken(admin);

      return res.json({
        sucesso: true,
        message: "Login de administrador realizado.",
        token,
        usuario: admin
      });
    }

    /*
      LOGIN DE USUÁRIO NORMAL
    */
    const usuario = usuarios.find(
      user => user.email === emailFinal
    );

    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        message: "E-mail ou senha incorretos."
      });
    }

    const senhaCorreta = await bcrypt.compare(
      senhaFinal,
      usuario.senha
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        sucesso: false,
        message: "E-mail ou senha incorretos."
      });
    }

    const token = criarToken(usuario);

    return res.json({
      sucesso: true,
      message: "Login realizado com sucesso!",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        plano: usuario.plano,
        role: usuario.role
      }
    });

  } catch (error) {
    console.error("ERRO LOGIN:", error);

    return res.status(500).json({
      sucesso: false,
      message: "Erro interno ao realizar login."
    });
  }
});

/* =========================================================
   VERIFICAR USUÁRIO LOGADO
========================================================= */

app.get("/api/auth/me", autenticar, (req, res) => {
  res.json({
    sucesso: true,
    usuario: req.usuario
  });
});

/* =========================================================
   SENSIBILIDADE
========================================================= */

app.get("/api/sensibilidade", (req, res) => {
  const modoJogo = req.query.modo || "BR";
  const planoUsuario = req.query.plano || "FREE";

  const configuracao =
    gerarConfiguracaoFreeFire(
      modoJogo,
      planoUsuario
    );

  res.json(configuracao);
});

/* =========================================================
   TESTE DA API
========================================================= */

app.get("/api/status", (req, res) => {
  res.json({
    sucesso: true,
    api: "online",
    servidor: "FF Sensibilidade API",
    timestamp: new Date().toISOString()
  });
});

/* =========================================================
   ERRO 404
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    sucesso: false,
    message: "Rota não encontrada.",
    rota: req.originalUrl
  });
});

/* =========================================================
   SERVIDOR
========================================================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Servidor FF Sensibilidade rodando na porta ${PORT}`
  );
});
