const express = require("express");
const session = require("express-session");
const path = require("path");
const { siapkanDatabase } = require("./db");

const app = express();
app.use(express.json());
app.use(session({ secret: "ganti-kalimat-rahasia-ini", resave: false, saveUninitialized: false }));

app.use("/api/auth", require("./routes/auth"));

app.use((req, res, next) => {
  if (req.path.endsWith(".html")) {
    return res.redirect(req.path.slice(0, -5));
  }
  next();
});

app.use((req, res, next) => {
  const user = req.session.pengguna;

  if (["/login", "/daftar", "/api.js", "/img/logo.jpg"].includes(req.path)) {
    return next();
  }
  if (!user) {
    if (req.path.startsWith("/api/")) {
      return res.status(401).json({ pesan: "Silakan login dulu" });
    }
    return res.redirect("/login");
  }
  const aksiUser = req.method === "POST" && ["/api/rental", "/api/penyewa/bayar"].includes(req.path);
  if (req.method !== "GET") {
    if (user.peran === "admin" && aksiUser) {
      return res.status(403).json({ pesan: "Menyewa dan membayar hanya bisa dilakukan oleh user" });
    }
    if (user.peran !== "admin" && !aksiUser) {
      return res.status(403).json({ pesan: "Hanya admin yang boleh melakukan ini" });
    }
  }
  next();
});

app.use(express.static(path.join(__dirname, "Public")));

// route perhalaman

app.get("/", (req, res) => {
  res.redirect("/rental");
});

app.get("/login", (req, res) => {
  const filePath = path.join(__dirname, "Public", "login.html");
  res.sendFile(filePath);
});

app.get("/daftar", (req, res) => {
  const filePath = path.join(__dirname, "Public", "daftar.html");
  res.sendFile(filePath);
});

app.get("/rental", (req, res) => {
  const filePath = path.join(__dirname, "Public", "rental.html");
  res.sendFile(filePath);
});

app.get("/kendaraan", (req, res) => {
  const filePath = path.join(__dirname, "Public", "kendaraan.html");
  res.sendFile(filePath);
});

app.get("/penyewa", (req, res) => {
  const filePath = path.join(__dirname, "Public", "penyewa.html");
  res.sendFile(filePath);
});

app.get("/transaksi", (req, res) => {
  const filePath = path.join(__dirname, "Public", "transaksi.html");
  res.sendFile(filePath);
});

app.get("/tambah-kendaraan", (req, res) => {
  const filePath = path.join(__dirname, "Public", "tambah-kendaraan.html");
  res.sendFile(filePath);
});

// API

app.use("/api/rental", require("./routes/rental"));
app.use("/api/kendaraan", require("./routes/kendaraan"));
app.use("/api/tambah-kendaraan", require("./routes/tambah-kendaraan"));
app.use("/api/penyewa", require("./routes/penyewa"));
app.use("/api/transaksi", require("./routes/transaksi"));

siapkanDatabase()
  .then(() => app.listen(3000, () => console.log("Server berjalan di http://localhost:3000")))
  .catch((error) => console.log("Gagal menyiapkan database. Pastikan MySQL menyala.\n" + error.message));