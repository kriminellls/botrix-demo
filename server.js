require("dotenv").config();
const express = require("express");
const path = require("path");
const apiRoutes = require("./routes/api");
const { n8nEnabled } = require("./services/n8nService");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`Botrix dashboard http://localhost:${PORT} adresinde çalışıyor`);
  console.log(
    n8nEnabled
      ? `n8n bağlantısı aktif: ${process.env.N8N_BASE_URL}`
      : "n8n bağlantısı yapılandırılmadı, mock veriler kullanılıyor (.env dosyasına N8N_BASE_URL ekle)"
  );
});
