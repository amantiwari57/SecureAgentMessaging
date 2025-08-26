import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;

export class Encryption {
  private secretKey: Buffer;

  constructor(secret: string, salt: string) {
    this.secretKey = crypto.scryptSync(secret, salt, KEY_LENGTH);
  }

  encrypt(plainText: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.secretKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, encrypted, tag]).toString("hex");
  }

  decrypt(cipherText: string): string {
    const cipherTextBuffer = Buffer.from(cipherText, "hex");
    const iv = cipherTextBuffer.slice(0, IV_LENGTH);
    const encrypted = cipherTextBuffer.slice(
      IV_LENGTH,
      cipherTextBuffer.length - TAG_LENGTH
    );
    const tag = cipherTextBuffer.slice(cipherTextBuffer.length - TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, this.secretKey, iv);
    decipher.setAuthTag(tag);
    const decrypted =
      decipher.update(encrypted.toString("hex"), "hex", "utf8") +
      decipher.final("utf8");
    return decrypted;
  }
}
