import AsyncStorage from '@react-native-async-storage/async-storage';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import {
  bytesToUtf8,
  concatBytes,
  randomBytes,
  utf8ToBytes,
} from '@noble/ciphers/utils.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';

const ENCRYPTION_PREFIX = 'xd-e2ee-v1.';
const MASTER_KEY_STORAGE_KEY = 'xderma.chatEncryption.masterKey.v1';
const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

let masterKeyPromise: Promise<Uint8Array> | null = null;

const bytesToBase64 = (bytes: Uint8Array) => {
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const chunk = (first << 16) | (second << 8) | third;

    output += BASE64_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_ALPHABET[(chunk >> 12) & 63];
    output +=
      index + 1 < bytes.length ? BASE64_ALPHABET[(chunk >> 6) & 63] : '=';
    output += index + 2 < bytes.length ? BASE64_ALPHABET[chunk & 63] : '=';
  }

  return output;
};

const base64ToBytes = (base64: string) => {
  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );
  const bytes: number[] = [];

  for (let index = 0; index < padded.length; index += 4) {
    const first = BASE64_ALPHABET.indexOf(padded[index]);
    const second = BASE64_ALPHABET.indexOf(padded[index + 1]);
    const third =
      padded[index + 2] === '=' ? -1 : BASE64_ALPHABET.indexOf(padded[index + 2]);
    const fourth =
      padded[index + 3] === '=' ? -1 : BASE64_ALPHABET.indexOf(padded[index + 3]);

    if (first < 0 || second < 0 || (third < 0 && padded[index + 2] !== '=') || (fourth < 0 && padded[index + 3] !== '=')) {
      throw new Error('Invalid encrypted payload encoding.');
    }

    const chunk =
      (first << 18) |
      (second << 12) |
      ((third < 0 ? 0 : third) << 6) |
      (fourth < 0 ? 0 : fourth);

    bytes.push((chunk >> 16) & 255);
    if (third >= 0) bytes.push((chunk >> 8) & 255);
    if (fourth >= 0) bytes.push(chunk & 255);
  }

  return Uint8Array.from(bytes);
};

const toBase64Url = (bytes: Uint8Array) =>
  bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const isEncryptedChatPayload = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith(ENCRYPTION_PREFIX);

const getMasterKey = async () => {
  if (!masterKeyPromise) {
    masterKeyPromise = (async () => {
      const stored = await AsyncStorage.getItem(MASTER_KEY_STORAGE_KEY);

      if (stored) {
        return base64ToBytes(stored);
      }

      const key = randomBytes(32);
      await AsyncStorage.setItem(MASTER_KEY_STORAGE_KEY, toBase64Url(key));
      return key;
    })();
  }

  return masterKeyPromise;
};

const deriveKey = async (purpose: string) => {
  const masterKey = await getMasterKey();
  return hkdf(
    sha256,
    masterKey,
    utf8ToBytes('xderma-chat-encryption-v1'),
    utf8ToBytes(purpose),
    32,
  );
};

const aadFor = (scope: string) => utf8ToBytes(`xderma:${scope}`);

export const encryptChatString = async (plaintext: string, scope: string) => {
  const key = await deriveKey(scope);
  const nonce = randomBytes(24);
  const cipher = xchacha20poly1305(key, nonce, aadFor(scope));
  const ciphertext = cipher.encrypt(utf8ToBytes(plaintext));

  return `${ENCRYPTION_PREFIX}${toBase64Url(concatBytes(nonce, ciphertext))}`;
};

export const decryptChatString = async (
  value: string,
  scope: string,
): Promise<string> => {
  if (!isEncryptedChatPayload(value)) {
    return value;
  }

  const encryptedBytes = base64ToBytes(value.slice(ENCRYPTION_PREFIX.length));
  const nonce = encryptedBytes.slice(0, 24);
  const ciphertext = encryptedBytes.slice(24);
  const key = await deriveKey(scope);
  const cipher = xchacha20poly1305(key, nonce, aadFor(scope));

  return bytesToUtf8(cipher.decrypt(ciphertext));
};

export const safeDecryptChatString = async (
  value: string,
  scope: string,
  fallback = 'This encrypted message could not be opened on this device.',
) => {
  try {
    return await decryptChatString(value, scope);
  } catch (error) {
    console.log('Chat message decryption failed', error);
    return fallback;
  }
};

export const encryptChatJson = async (value: unknown, scope: string) =>
  encryptChatString(JSON.stringify(value), scope);

export const decryptChatJson = async <T>(
  value: string,
  scope: string,
): Promise<T> => JSON.parse(await decryptChatString(value, scope)) as T;
