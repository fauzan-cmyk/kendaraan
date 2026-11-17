function wajibLogin(req, res, next) {
  if (!req.session.pengguna) {
    return res.status(401).json({ pesan: "Silakan login terlebih dahulu" });
  }
  next();
}

function wajibAdmin(req, res, next) {
  if (!req.session.pengguna) {
    return res.status(401).json({ pesan: "Silakan login terlebih dahulu" });
  }
  if (req.session.pengguna.peran !== "admin") {
    return res.status(403).json({ pesan: "Hanya admin yang boleh melakukan ini" });
  }
  next();
}

module.exports = { wajibLogin, wajibAdmin };