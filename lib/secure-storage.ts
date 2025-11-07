// This ensures that PIN codes and sensitive data cannot be read directly from localStorage

const ENCRYPTION_KEY_NAME = "app_encryption_key"
const ENCRYPTION_VERSION = "v1"

// Generate or retrieve the encryption key
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyStorage = localStorage.getItem(ENCRYPTION_KEY_NAME)

  if (keyStorage) {
    try {
      const keyData = JSON.parse(keyStorage)
      return await crypto.subtle.importKey("jwk", keyData, "AES-GCM", true, ["encrypt", "decrypt"])
    } catch {
      localStorage.removeItem(ENCRYPTION_KEY_NAME)
    }
  }

  // Generate new key if doesn't exist
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])

  // Store the key for future use
  const exported = await crypto.subtle.exportKey("jwk", key)
  localStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exported))

  return key
}

export async function secureSetItem(key: string, value: string): Promise<void> {
  try {
    const encryptionKey = await getEncryptionKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(value)

    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, encryptionKey, encoded)

    const data = {
      v: ENCRYPTION_VERSION,
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
    }

    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error("[v0] Encryption failed, storing unencrypted:", error)
    localStorage.setItem(key, value)
  }
}

export async function secureGetItem(key: string): Promise<string | null> {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return null

    const data = JSON.parse(stored)

    // If it's not encrypted data, return as-is for backward compatibility
    if (!data.v || !data.iv || !data.data) {
      return stored
    }

    const encryptionKey = await getEncryptionKey()
    const iv = new Uint8Array(data.iv)
    const encrypted = new Uint8Array(data.data)

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, encryptionKey, encrypted)

    return new TextDecoder().decode(decrypted)
  } catch (error) {
    console.error("[v0] Decryption failed:", error)
    return null
  }
}

export function secureRemoveItem(key: string): void {
  localStorage.removeItem(key)
}
