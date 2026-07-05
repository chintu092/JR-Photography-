const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateSecret(length = 16): string {
  let secret = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * BASE32_ALPHABET.length);
    secret += BASE32_ALPHABET[idx];
  }
  return secret;
}

export function decodeBase32(charStr: string): Uint8Array {
  const cleaned = charStr.toUpperCase().replace(/[\s-]/g, "").replace(/=+$/, "");
  const len = cleaned.length;
  let val = 0;
  let bits = 0;
  const bytes: number[] = [];

  for (let i = 0; i < len; i++) {
    const char = cleaned[i];
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error("Invalid base32 character: " + char);
    }
    val = (val << 5) | index;
    bits += 5;
    while (bits >= 8) {
      bytes.push((val >> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

// Convert an integer into an 8-byte big-endian Uint8Array
function intToBytes(num: number): Uint8Array {
  const bytes = new Uint8Array(8);
  let temp = num;
  for (let i = 7; i >= 0; i--) {
    bytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }
  return bytes;
}

export async function generateTOTP(secret: string, timeOffsetSeconds = 0): Promise<string> {
  const keyBytes = decodeBase32(secret);
  const epoch = Math.floor(Date.now() / 1000) + timeOffsetSeconds;
  const counter = Math.floor(epoch / 30);
  const counterBytes = intToBytes(counter);

  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error("Web Cryptography API is not available in this environment.");
  }

  const importedKey = await cryptoObj.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await cryptoObj.subtle.sign("HMAC", importedKey, counterBytes);
  const hash = new Uint8Array(signature);

  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

export async function verifyTOTP(secret: string, token: string, window = 1): Promise<boolean> {
  const cleanToken = token.trim().replace(/\s/g, "");
  if (cleanToken.length !== 6 || isNaN(Number(cleanToken))) {
    return false;
  }

  for (let i = -window; i <= window; i++) {
    const computed = await generateTOTP(secret, i * 30);
    if (computed === cleanToken) {
      return true;
    }
  }
  return false;
}

export function getQRCodeUrl(email: string, secret: string, issuer = "JRPhotography"): string {
  const encodedEmail = encodeURIComponent(email);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

export function getQRCodeImageUrl(email: string, secret: string, issuer = "JRPhotography"): string {
  const otpauth = getQRCodeUrl(email, secret, issuer);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
}
