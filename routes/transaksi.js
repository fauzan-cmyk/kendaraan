const express = require("express");
const { db } = require("../db");
const { SQL_RENTAL, aman } = require("../helper");

const router = express.Router();

router.get("/", aman(async (req, res) => {
  const [data] = await db.query(
    SQL_RENTAL +
    "WHERE (:penyewa IS NULL OR p.nama_penyewa LIKE CONCAT('%', :penyewa, '%')) " +
    "AND (:kendaraan IS NULL OR k.nama_kendaraan LIKE CONCAT('%', :kendaraan, '%')) " +
    "AND (:masa IS NULL OR s.nama_status = :masa) " +
    "ORDER BY LENGTH(r.id_rental), r.id_rental",
    {
      penyewa: req.query.penyewa || null,
      kendaraan: req.query.kendaraan || null,
      masa: req.query.masa || null
    }
  );
  res.json(data);
}));

module.exports = router;