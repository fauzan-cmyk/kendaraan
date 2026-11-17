const bcrypt = require("bcryptjs");
const { db } = require("./db");

async function main() {
  const [username, password, peran] = process.argv.slice(2);

  if (!username || !password || (peran !== "admin" && peran !== "user")) {
    console.log("Cara pakai: node buat-akun.js <username> <password> <admin|user>");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  await db.query(
    "INSERT INTO pengguna (username, password_hash, peran) VALUES (:u, :h, :p) " +
    "ON DUPLICATE KEY UPDATE password_hash = :h, peran = :p",
    { u: username, h: hash, p: peran }
  );
  console.log("Akun " + username + " (" + peran + ") tersimpan");
  process.exit(0);
}

main().catch((error) => {
  console.log("Gagal: " + error.message);
  process.exit(1);
});