import crypto from "crypto";

const ALGORITHM = "aes-256-ctr";
const IV_LENGTH = 16;

function getSecretKey() {
  const key = process.env.EMAIL_SECRET_KEY;

  if (!key) {
    throw new Error("❌ EMAIL_SECRET_KEY is missing in environment variables.");
  }

  if (key.length !== 32) {
    throw new Error(
      `❌ EMAIL_SECRET_KEY must be 32 chars. Current = ${key.length}`
    );
  }

  return key;
}

export const encrypt = (text) => {
  const SECRET_KEY = getSecretKey();

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

export const decrypt = (encryptedText) => {
  const SECRET_KEY = getSecretKey();

  const [ivHex, contentHex] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const content = Buffer.from(contentHex, "hex");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(SECRET_KEY),
    iv
  );
  const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
  return decrypted.toString();
};
