const express = require("express");
const { db } = require("../db");
const { aman, idBerikutnya } = require("../helper");

const router = express.Router();

router.post("/", aman(async (req, res) => {
  const nama = String(req.body.nama || "").trim();
  const tarif = parseInt(req.body.tarif) || 0;
  const jenis = req.body.jenis;

  if (!nama || tarif <= 0) {
    return res.status(400).json({ pesan: "Nama dan tarif harus diisi" });
  }
  if (jenis !== "Mobil" && jenis !== "Motor") {
    return res.status(400).json({ pesan: "Jenis harus Mobil atau Motor" });
  }

  const plat = await idBerikutnya("kendaraan", "id_kendaraan", "ABC-");
  await db.query(
    "INSERT INTO kendaraan (id_kendaraan, nama_kendaraan, jenis, tarif_per_hari, status) " +
    "VALUES (:plat, :nama, :jenis, :tarif, 'Aktif')",
    { plat: plat, nama: nama, jenis: jenis, tarif: tarif }
  );
  res.status(201).json({ plat: plat });
}));

module.exports = router;