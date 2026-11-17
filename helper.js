const { db } = require("./db");

const SQL_RENTAL =
  "SELECT r.id_rental AS id, p.nama_penyewa AS penyewa, k.nama_kendaraan AS kendaraan, k.id_kendaraan AS plat, " +
  "DATE_FORMAT(r.tgl_mulai, '%d/%m/%Y') AS mulai, DATE_FORMAT(r.tgl_kembali, '%d/%m/%Y') AS kembali, " +
  "r.lama_rental AS lama, UPPER(s.nama_status) AS masa, s.persen_diskon AS diskon, " +
  "r.biaya_sebelum_diskon AS normal, r.biaya_akhir AS biaya, r.status_bayar AS statusBayar, r.metode_bayar AS metode, " +
  "r.jenis_identitas AS jenisId, " +
  "CONCAT(REPEAT('*', GREATEST(CHAR_LENGTH(r.no_identitas) - 4, 0)), RIGHT(r.no_identitas, 4)) AS noId, " +
  "CASE WHEN r.no_identitas IS NULL THEN '-' WHEN r.identitas_kembali IS NULL THEN 'Ditahan' ELSE 'Dikembalikan' END AS statusId " +
  "FROM rental r " +
  "JOIN kendaraan k ON k.id_kendaraan = r.id_kendaraan " +
  "JOIN penyewa p ON p.id_penyewa = r.id_penyewa " +
  "JOIN status_diskon s ON s.id_status = r.id_status ";

const aman = (fungsi) => (req, res) =>
  fungsi(req, res).catch((error) => {
    console.log(error);
    res.status(500).json({ pesan: "Kesalahan server: " + error.message });
  });

async function idBerikutnya(tabel, kolom, awalan) {
  const [hasil] = await db.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(${kolom}, ${awalan.length + 1}) AS UNSIGNED)), 0) + 1 AS n FROM ${tabel}`
  );
  return awalan + String(hasil[0].n).padStart(2, "0");
}

module.exports = { SQL_RENTAL, aman, idBerikutnya };