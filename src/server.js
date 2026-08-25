const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

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
    sensibilidade.geral = Math.min(200, sensibilidade.geral);
    sensibilidade.redDot = Math.min(200, sensibilidade.redDot);
  }

  return {
    sucesso: true,
    plano: planoUsuario || "FREE",
    modo: modoJogo || "BR",
    sensibilidade
  };
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "FF Sensibilidade API",
    status: "online"
  });
});

app.get("/api/sensibilidade", (req, res) => {
  const modoJogo = req.query.modo || "BR";
  const planoUsuario = req.query.plano || "FREE";

  const configuracao = gerarConfiguracaoFreeFire(
    modoJogo,
    planoUsuario
  );

  res.json(configuracao);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
