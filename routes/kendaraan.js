const express = require("express");
const { db } = require("../db");
const { aman } = require("../helper");

const router = express.Router();

router.get("/", aman(async (req, res) => {
  const [data] = await db.query(
    "SELECT * FROM (" +
    "SELECT id_kendaraan AS plat, nama_kendaraan AS nama, jenis, tarif_per_hari AS tarif, status, " +
    "EXISTS (SELECT 1 FROM rental r WHERE r.id_kendaraan = kendaraan.id_kendaraan " +
    "AND CURDATE() >= r.tgl_mulai AND CURDATE() < r.tgl_kembali) AS dipakai " +
    "FROM kendaraan) x " +
    "WHERE (:nama IS NULL OR nama LIKE CONCAT('%', :nama, '%')) " +
    "AND (:jenis IS NULL OR jenis = :jenis) " +
    "AND (:ada IS NULL OR (:ada = 'Tersedia') = (status = 'Aktif' AND dipakai = 0)) " +
    "ORDER BY LENGTH(plat), plat",
    {
      nama: req.query.nama || null,
      jenis: req.query.jenis || null,
      ada: req.query.ketersediaan || null
    }
  );
  res.json(data);
}));

module.exports = router;