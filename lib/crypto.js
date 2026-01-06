const CryptoJS = require('crypto-js');

// Secret key for encryption/decryption
// This must be the same in the SMM Panel (Client) and this License Server
const SECRET_KEY = process.env.LICENSE_SECRET_KEY || 'default-secret-key-change-this';

const encrypt = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

module.exports = { encrypt, decrypt };