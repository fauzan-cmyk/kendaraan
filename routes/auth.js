const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../db");
const { aman } = require("../helper");

const router = express.Router();

function usernameBenar(username) {
  if (username.length < 3 || username.length > 30) {
    return false;
  }
  for (const huruf of username) {
    const angka = huruf >= "0" && huruf <= "9";
    const kecil = huruf >= "a" && huruf <= "z";
    const besar = huruf >= "A" && huruf <= "Z";
    if (!angka && !kecil && !besar && huruf !== "_") {
      return false;
    }
  }
  return true;
}

router.post("/login", aman(async (req, res) => {
  const [hasil] = await db.query(
    "SELECT username, password_hash, peran FROM pengguna WHERE username = :u",
    { u: String(req.body.username || "").trim() }
  );
  const akun = hasil[0];

  if (!akun || !(await bcrypt.compare(String(req.body.password || ""), akun.password_hash))) {
    return res.status(401).json({ pesan: "Username atau password salah" });
  }
  req.session.pengguna = { username: akun.username, peran: akun.peran };
  res.json({ pesan: "Berhasil masuk" });
}));

router.post("/daftar", aman(async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (!usernameBenar(username)) {
    return res.status(400).json({ pesan: "Username 3-30 karakter, hanya huruf, angka, dan _" });
  }
  if (password.length < 6) {
    return res.status(400).json({ pesan: "Password minimal 6 karakter" });
  }
  if (password !== req.body.ulangi) {
    return res.status(400).json({ pesan: "Konfirmasi password tidak sama" });
  }

  const [ada] = await db.query("SELECT id_pengguna FROM pengguna WHERE username = :u", { u: username });
  if (ada.length > 0) {
    return res.status(409).json({ pesan: "Username sudah dipakai" });
  }

  await db.query(
    "INSERT INTO pengguna (username, password_hash, peran) VALUES (:u, :h, 'user')",
    { u: username, h: await bcrypt.hash(password, 10) }
  );
  res.status(201).json({ pesan: "Akun berhasil dibuat" });
}));

router.get("/saya", (req, res) => {
  if (!req.session.pengguna) {
    return res.status(401).json({ pesan: "Belum login" });
  }
  res.json(req.session.pengguna);
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ pesan: "Sudah keluar" }));
});

module.exports = router;