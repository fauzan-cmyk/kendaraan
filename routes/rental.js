const express = require("express");
const { db } = require("../db");
const { SQL_RENTAL, aman, idBerikutnya } = require("../helper");

const router = express.Router();

const JENIS_ID = ["KTP", "KK"];

function bukanAdmin(req) {
  return !req.session.pengguna || req.session.pengguna.peran !== "admin";
}

function semuaAngka(teksnya) {
  for (const huruf of teksnya) {
    if (huruf < "0" || huruf > "9") {
      return false;
    }
  }
  return true;
}

function hurufAngkaSaja(teksnya) {
  for (const huruf of teksnya) {
    const angka = huruf >= "0" && huruf <= "9";
    const kecil = huruf >= "a" && huruf <= "z";
    const besar = huruf >= "A" && huruf <= "Z";
    if (!angka && !kecil && !besar) {
      return false;
    }
  }
  return true;
}

router.get("/ringkasan", aman(async (req, res) => {
  const [hasil] = await db.query(
    "SELECT COUNT(*) AS jumlah, CAST(COALESCE(SUM(biaya_akhir), 0) AS SIGNED) AS total FROM rental"
  );
  res.json(hasil[0]);
}));

router.get("/", aman(async (req, res) => {
  const [data] = await db.query(
    SQL_RENTAL +
    "WHERE (:penyewa IS NULL OR p.nama_penyewa LIKE CONCAT('%', :penyewa, '%')) " +
    "AND (:kendaraan IS NULL OR k.nama_kendaraan LIKE CONCAT('%', :kendaraan, '%')) " +
    "AND (:mulai IS NULL OR r.tgl_mulai >= :mulai) " +
    "AND (:kembali IS NULL OR r.tgl_kembali <= :kembali) " +
    "ORDER BY LENGTH(r.id_rental), r.id_rental",
    {
      penyewa: req.query.penyewa || null,
      kendaraan: req.query.kendaraan || null,
      mulai: req.query.mulai || null,
      kembali: req.query.kembali || null
    }
  );
  res.json(data);
}));

router.post("/", aman(async (req, res) => {
  const namaPenyewa = String(req.body.penyewa || "").trim();
  const { plat, tanggalMulai, tanggalKembali, jenisIdentitas } = req.body;
  const noIdentitas = String(req.body.noIdentitas || "").trim();

  if (!namaPenyewa || !plat || !tanggalMulai || !tanggalKembali) {
    return res.status(400).json({ pesan: "Isi semua kolom" });
  }
  if (!JENIS_ID.includes(jenisIdentitas)) {
    return res.status(400).json({ pesan: "Jenis kartu identitas harus KTP atau KK" });
  }
  if (!noIdentitas) {
    return res.status(400).json({ pesan: "Nomor identitas wajib diisi" });
  }
  if (jenisIdentitas === "KTP" && (noIdentitas.length !== 16 || !semuaAngka(noIdentitas))) {
    return res.status(400).json({ pesan: "Nomor KTP harus 16 digit angka" });
  }
  if (jenisIdentitas !== "KTP" && (noIdentitas.length < 5 || noIdentitas.length > 30 || !hurufAngkaSaja(noIdentitas))) {
    return res.status(400).json({ pesan: "Nomor identitas 5-30 karakter, hanya huruf dan angka" });
  }

  const [selisih] = await db.query(
    "SELECT DATEDIFF(:kembali, :mulai) AS hari", { kembali: tanggalKembali, mulai: tanggalMulai }
  );
  const hari = selisih[0].hari;
  if (!(hari > 0)) {
    return res.status(400).json({ pesan: "Tanggal kembali harus setelah tanggal mulai" });
  }

  const [kendaraan] = await db.query(
    "SELECT tarif_per_hari, status FROM kendaraan WHERE id_kendaraan = :plat", { plat: plat }
  );
  if (kendaraan.length === 0) {
    return res.status(404).json({ pesan: "Kendaraan tidak ditemukan" });
  }
  if (kendaraan[0].status !== "Aktif") {
    return res.status(400).json({ pesan: "Kendaraan tidak aktif" });
  }

  const [bentrok] = await db.query(
    "SELECT id_rental FROM rental WHERE id_kendaraan = :plat AND tgl_mulai < :kembali AND tgl_kembali > :mulai",
    { plat: plat, kembali: tanggalKembali, mulai: tanggalMulai }
  );
  if (bentrok.length > 0) {
    return res.status(409).json({ pesan: "Kendaraan sudah disewa pada tanggal tersebut" });
  }

  const [ada] = await db.query("SELECT id_penyewa FROM penyewa WHERE nama_penyewa = :nama", { nama: namaPenyewa });
  let idPenyewa = ada.length > 0 ? ada[0].id_penyewa : null;
  if (!idPenyewa) {
    idPenyewa = await idBerikutnya("penyewa", "id_penyewa", "P-");
    await db.query("INSERT INTO penyewa (id_penyewa, nama_penyewa) VALUES (:id, :nama)", { id: idPenyewa, nama: namaPenyewa });
  }

  const masa = hari >= 7 ? "LONG" : hari >= 3 ? "MEDIUM" : "SHORT";
  const [status] = await db.query(
    "SELECT id_status, persen_diskon FROM status_diskon WHERE nama_status = :masa", { masa: masa }
  );
  const normal = kendaraan[0].tarif_per_hari * hari;
  const diskon = Math.round(normal * status[0].persen_diskon / 100);

  const id = await idBerikutnya("rental", "id_rental", "R-");
  await db.query(
    "INSERT INTO rental (id_rental, id_kendaraan, id_penyewa, id_status, tgl_mulai, tgl_kembali, " +
    "lama_rental, biaya_sebelum_diskon, nominal_diskon, biaya_akhir, jenis_identitas, no_identitas) " +
    "VALUES (:id, :plat, :idPenyewa, :status, :mulai, :kembali, :hari, :normal, :diskon, :akhir, :jenisId, :noId)",
    {
      id: id, plat: plat, idPenyewa: idPenyewa, status: status[0].id_status,
      mulai: tanggalMulai, kembali: tanggalKembali, hari: hari,
      normal: normal, diskon: diskon, akhir: normal - diskon,
      jenisId: jenisIdentitas, noId: noIdentitas
    }
  );
  res.status(201).json({ id: id });
}));

router.post("/:id/kembalikan-kartu", aman(async (req, res) => {
  if (bukanAdmin(req)) {
    return res.status(403).json({ pesan: "Hanya admin yang boleh mengembalikan kartu identitas" });
  }

  const [hasil] = await db.query(
    "SELECT no_identitas, identitas_kembali, status_bayar FROM rental WHERE id_rental = :id",
    { id: req.params.id }
  );
  if (hasil.length === 0) {
    return res.status(404).json({ pesan: "Data tidak ditemukan" });
  }
  const r = hasil[0];
  if (!r.no_identitas) {
    return res.status(400).json({ pesan: "Rental ini tidak menahan kartu identitas" });
  }
  if (r.identitas_kembali) {
    return res.status(400).json({ pesan: "Kartu identitas sudah dikembalikan" });
  }
  if (r.status_bayar !== "Lunas") {
    return res.status(400).json({ pesan: "Kartu identitas baru bisa dikembalikan setelah pembayaran lunas" });
  }

  await db.query("UPDATE rental SET identitas_kembali = NOW() WHERE id_rental = :id", { id: req.params.id });
  res.json({ pesan: "Kartu identitas dikembalikan" });
}));

router.delete("/:id", aman(async (req, res) => {
  if (bukanAdmin(req)) {
    return res.status(403).json({ pesan: "Hanya admin yang boleh menghapus rental" });
  }

  const [hasil] = await db.query("DELETE FROM rental WHERE id_rental = :id", { id: req.params.id });
  if (hasil.affectedRows === 0) {
    return res.status(404).json({ pesan: "Data tidak ditemukan" });
  }
  res.json({ pesan: "Terhapus" });
}));

module.exports = router;