const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function sign(payload) {
  const privateKey = process.env.LICENSE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('LICENSE_PRIVATE_KEY missing');
  }

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(data);
  const signature = signer.sign(privateKey);
  const encodedSignature = signature
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${encodedSignature}`;
}

module.exports = { sign };
