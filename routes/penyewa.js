const express = require("express");
const { db } = require("../db");
const { aman } = require("../helper");

const router = express.Router();

router.get("/", aman(async (req, res) => {
  const [data] = await db.query(
    "SELECT p.nama_penyewa AS nama, COUNT(*) AS jumlah, " +
    "CAST(SUM(r.biaya_akhir) AS SIGNED) AS total, " +
    "CAST(SUM(r.biaya_akhir - r.sudah_dibayar) AS SIGNED) AS sisa " +
    "FROM penyewa p JOIN rental r ON r.id_penyewa = p.id_penyewa " +
    "WHERE (:nama IS NULL OR p.nama_penyewa LIKE CONCAT('%', :nama, '%')) " +
    "GROUP BY p.id_penyewa, p.nama_penyewa " +
    "HAVING (:bayar IS NULL OR (:bayar = 'Sudah bayar') = (SUM(r.biaya_akhir - r.sudah_dibayar) <= 0)) " +
    "ORDER BY LENGTH(p.id_penyewa), p.id_penyewa",
    { nama: req.query.nama || null, bayar: req.query.pembayaran || null }
  );
  res.json(data);
}));

router.post("/bayar", aman(async (req, res) => {
  const { penyewa, metode } = req.body;
  const uang = parseInt(req.body.uang) || 0;

  if (!penyewa || uang <= 0) {
    return res.status(400).json({ pesan: "Jumlah pembayaran tidak valid" });
  }
  if (metode !== "Cash" && metode !== "Transfer") {
    return res.status(400).json({ pesan: "Metode harus Cash atau Transfer" });
  }

  const [tagihan] = await db.query(
    "SELECT r.id_rental, r.biaya_akhir, r.sudah_dibayar FROM rental r " +
    "JOIN penyewa p ON p.id_penyewa = r.id_penyewa " +
    "WHERE p.nama_penyewa = :penyewa AND r.biaya_akhir > r.sudah_dibayar " +
    "ORDER BY LENGTH(r.id_rental), r.id_rental",
    { penyewa: penyewa }
  );
  if (tagihan.length === 0) {
    return res.status(404).json({ pesan: "Tidak ada tagihan untuk penyewa ini" });
  }
  const totalSisa = tagihan.reduce((jumlah, nota) => jumlah + nota.biaya_akhir - nota.sudah_dibayar, 0);
  if (metode === "Transfer" && uang > totalSisa) {
    return res.status(400).json({ pesan: "Transfer tidak boleh lebih dari sisa tagihan: Rp " + totalSisa.toLocaleString("id-ID") });
  }

  let sisaUang = uang;
  for (const nota of tagihan) {
    if (sisaUang === 0) {
      break;
    }
    const bayar = Math.min(sisaUang, nota.biaya_akhir - nota.sudah_dibayar);
    const total = nota.sudah_dibayar + bayar;
    await db.query(
      "UPDATE rental SET sudah_dibayar = :total, status_bayar = :status, metode_bayar = :metode WHERE id_rental = :id",
      { total: total, status: total >= nota.biaya_akhir ? "Lunas" : "Sebagian", metode: metode, id: nota.id_rental }
    );
    sisaUang -= bayar;
  }
  res.json({ kembalian: sisaUang });
}));

module.exports = router;