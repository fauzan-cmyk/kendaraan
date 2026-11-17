const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const KONFIG = {
  host: "localhost",
  user: "root",
  password: ""
};
const NAMA_DB = "rental_kendaraan_node";

const db = mysql.createPool({
  host: KONFIG.host,
  user: KONFIG.user,
  password: KONFIG.password,
  database: NAMA_DB,
  dateStrings: true,
  namedPlaceholders: true
});

const OPSI_TABEL = "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

const BUAT_TABEL = [
  `CREATE TABLE IF NOT EXISTS kendaraan (
    id_kendaraan VARCHAR(10) NOT NULL PRIMARY KEY,
    nama_kendaraan VARCHAR(100) NOT NULL,
    jenis VARCHAR(10) NOT NULL,
    tarif_per_hari INT NOT NULL,
    \`status\` VARCHAR(20) NOT NULL DEFAULT 'Aktif'
  ) ${OPSI_TABEL}`,

  `CREATE TABLE IF NOT EXISTS penyewa (
    id_penyewa VARCHAR(10) NOT NULL PRIMARY KEY,
    nama_penyewa VARCHAR(100) NOT NULL
  ) ${OPSI_TABEL}`,

  `CREATE TABLE IF NOT EXISTS status_diskon (
    id_status VARCHAR(10) NOT NULL PRIMARY KEY,
    nama_status VARCHAR(20) NOT NULL,
    persen_diskon DECIMAL(5,2) NOT NULL
  ) ${OPSI_TABEL}`,

  `CREATE TABLE IF NOT EXISTS rental (
    id_rental VARCHAR(10) NOT NULL PRIMARY KEY,
    id_kendaraan VARCHAR(10) NOT NULL,
    id_penyewa VARCHAR(10) NOT NULL,
    id_status VARCHAR(10) NOT NULL,
    tgl_mulai DATE NOT NULL,
    tgl_kembali DATE NOT NULL,
    lama_rental INT NOT NULL,
    biaya_sebelum_diskon INT NOT NULL,
    nominal_diskon INT NOT NULL,
    biaya_akhir INT NOT NULL,
    sudah_dibayar INT NOT NULL DEFAULT 0,
    status_bayar VARCHAR(20) NOT NULL DEFAULT 'Pending',
    metode_bayar VARCHAR(20) NOT NULL DEFAULT '',
    FOREIGN KEY (id_kendaraan) REFERENCES kendaraan(id_kendaraan),
    FOREIGN KEY (id_penyewa) REFERENCES penyewa(id_penyewa),
    FOREIGN KEY (id_status) REFERENCES status_diskon(id_status)
  ) ${OPSI_TABEL}`,

  `CREATE TABLE IF NOT EXISTS pengguna (
    id_pengguna INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    peran VARCHAR(10) NOT NULL DEFAULT 'user'
  ) ${OPSI_TABEL}`
];

async function isiDataAwal() {
  const tabel = ["kendaraan", "penyewa", "status_diskon", "rental"];
  for (let i = 0; i < tabel.length; i++) {
    const [hasil] = await db.query("SELECT COUNT(*) AS jumlah FROM " + tabel[i]);
    if (hasil[0].jumlah > 0) {
      return;
    }
  }

  await db.query(
    "INSERT INTO kendaraan (id_kendaraan, nama_kendaraan, jenis, tarif_per_hari, `status`) VALUES " +
    "('ABC-01', 'Toyota Avanza', 'Mobil', 30000, 'Aktif'), " +
    "('ABC-02', 'Honda Beat', 'Motor', 25000, 'Aktif')"
  );
  await db.query(
    "INSERT INTO penyewa (id_penyewa, nama_penyewa) VALUES ('P-01', 'Zidan'), ('P-02', 'Zumi')"
  );
  await db.query(
    "INSERT INTO status_diskon (id_status, nama_status, persen_diskon) VALUES " +
    "('S-01', 'SHORT', 1), ('S-02', 'LONG', 5)"
  );
  await db.query(
    "INSERT INTO rental (id_rental, id_kendaraan, id_penyewa, id_status, tgl_mulai, tgl_kembali, " +
    "lama_rental, biaya_sebelum_diskon, nominal_diskon, biaya_akhir) VALUES " +
    "('R-01', 'ABC-01', 'P-01', 'S-02', '2026-10-01', '2026-10-10', 9, 270000, 13500, 256500), " +
    "('R-02', 'ABC-02', 'P-02', 'S-01', '2026-10-02', '2026-10-04', 2, 50000, 500, 49500)"
  );
}

async function pastikanKolom(nama, definisi) {
  const [ada] = await db.query(
    "SELECT COUNT(*) AS jumlah FROM information_schema.COLUMNS " +
    "WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'rental' AND COLUMN_NAME = :nama",
    { db: NAMA_DB, nama: nama }
  );
  if (ada[0].jumlah === 0) {
    await db.query("ALTER TABLE rental ADD COLUMN " + nama + " " + definisi);
  }
}

async function pastikanStatusMedium() {
  await db.query(
    "INSERT INTO status_diskon (id_status, nama_status, persen_diskon) " +
    "SELECT 'S-03', 'MEDIUM', 3 FROM DUAL " +
    "WHERE NOT EXISTS (SELECT 1 FROM status_diskon WHERE UPPER(nama_status) = 'MEDIUM')"
  );
}

async function pastikanAkunAwal() {
  const [hasil] = await db.query("SELECT COUNT(*) AS jumlah FROM pengguna");
  if (hasil[0].jumlah > 0) {
    return;
  }
  const akun = [
    ["admin", "admin123", "Administrator", "admin"],
    ["user", "user123", "Pengguna", "user"]
  ];
  for (let i = 0; i < akun.length; i++) {
    const hash = await bcrypt.hash(akun[i][1], 10);
    await db.query(
      "INSERT INTO pengguna (username, password_hash, nama_lengkap, peran) VALUES (:u, :h, :n, :p)",
      { u: akun[i][0], h: hash, n: akun[i][2], p: akun[i][3] }
    );
  }
}

async function pastikanKolom(nama, definisi) {
  const [ada] = await db.query(
    "SELECT COUNT(*) AS jumlah FROM information_schema.COLUMNS " +
    "WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'rental' AND COLUMN_NAME = :nama",
    { db: NAMA_DB, nama: nama }
  );
  if (ada[0].jumlah === 0) {
    await db.query("ALTER TABLE rental ADD COLUMN " + nama + " " + definisi);
  }
}

async function siapkanDatabase() {
  const sementara = await mysql.createConnection(KONFIG);
  await sementara.query(
    "CREATE DATABASE IF NOT EXISTS `" + NAMA_DB + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"
  );
  await sementara.end();

  for (let i = 0; i < BUAT_TABEL.length; i++) {
    await db.query(BUAT_TABEL[i]);
  }

  await pastikanKolom("jenis_identitas", "VARCHAR(10) NULL");
  await pastikanKolom("no_identitas", "VARCHAR(30) NULL");
  await pastikanKolom("identitas_kembali", "DATETIME NULL");
  await pastikanKolom("tgl_dikembalikan", "DATE NULL DEFAULT NULL");
  await pastikanKolom("tgl_lapor_polisi", "DATETIME NULL DEFAULT NULL");
  await isiDataAwal();
  await pastikanStatusMedium();
  await pastikanAkunAwal();
}

module.exports = { db, siapkanDatabase };