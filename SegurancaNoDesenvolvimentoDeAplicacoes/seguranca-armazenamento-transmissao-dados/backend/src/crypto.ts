import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  generateKeyPairSync,
  privateDecrypt,
} from "crypto";
import { config } from "./config.js";

const DATA_KEY = Buffer.from(config.dataEncKeyHex, "hex");

export type AesPayload = { iv: string; data: string };
export type HybridIn = { key: string; iv: string; data: string };

// --- Criptografia em repouso (AES-256-CBC) ---
export function encryptAtRest(plain: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", DATA_KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${iv.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptAtRest(stored: string): string {
  const [ivB64, dataB64] = stored.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv("aes-256-cbc", DATA_KEY, iv);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

// --- Par de chaves RSA do servidor (em memória) ---
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

// Exporta a chave pública no formato SPKI (aceito pelo Web Crypto API do browser)
export function getPublicKeyPem(): string {
  return publicKey.export({ type: "spki", format: "pem" }).toString();
}

// Decripta a chave AES enviada pelo cliente (RSA-OAEP-SHA256)
export function decryptClientAesKey(encryptedKeyB64: string): Buffer {
  const enc = Buffer.from(encryptedKeyB64, "base64");
  return privateDecrypt({ key: privateKey, oaepHash: "sha256" }, enc);
}

// Decripta payload AES-CBC vindo do cliente
export function decryptHybrid({ key, iv, data }: HybridIn): Buffer {
  const aesKeyRaw = decryptClientAesKey(key); // 32 bytes
  const ivBuf = Buffer.from(iv, "base64");
  const dataBuf = Buffer.from(data, "base64");

  const decipher = createDecipheriv("aes-256-cbc", aesKeyRaw, ivBuf);
  const dec = Buffer.concat([decipher.update(dataBuf), decipher.final()]);
  return dec; // bytes do JSON
}

// Encripta resposta com a mesma AES que o cliente gerou
export function encryptWithClientAes(
  aesKeyRaw: Buffer,
  plainObj: unknown
): AesPayload {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", aesKeyRaw, iv);
  const data = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(plainObj), "utf8")),
    cipher.final(),
  ]);
  return { iv: iv.toString("base64"), data: data.toString("base64") };
}

// Atalho quando o servidor já recebeu o par (key, iv) do cliente
export function encryptHybridEcho(
  clientKeyB64: string,
  obj: unknown
): AesPayload {
  const aesKeyRaw = decryptClientAesKey(clientKeyB64);
  return encryptWithClientAes(aesKeyRaw, obj);
}
