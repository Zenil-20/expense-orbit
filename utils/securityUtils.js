const crypto = require("crypto");

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtpCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

module.exports = {
  generateOtpCode,
  hashOtpCode
};
