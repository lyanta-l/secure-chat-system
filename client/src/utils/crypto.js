/**
 * 加密工具函数
 * 使用Web Crypto API实现RSA+AES混合加密
 * 
 * 此文件在阶段3将实现完整的加密功能
 */

/**
 * 生成RSA密钥对
 * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
 */
export async function generateRSAKeyPair() {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true, // 可导出
      ['encrypt', 'decrypt']
    );
    
    return keyPair;
  } catch (error) {
    console.error('生成RSA密钥对失败:', error);
    throw error;
  }
}

/**
 * 导出公钥为PEM格式
 * @param {CryptoKey} publicKey 
 * @returns {Promise<string>}
 */
export async function exportPublicKey(publicKey) {
  try {
    const exported = await window.crypto.subtle.exportKey('spki', publicKey);
    const exportedAsBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    const pem = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
    return pem;
  } catch (error) {
    console.error('导出公钥失败:', error);
    throw error;
  }
}

/**
 * 导出私钥为JWK格式
 * @param {CryptoKey} privateKey 
 * @returns {Promise<object>}
 */
export async function exportPrivateKey(privateKey) {
  try {
    const jwk = await window.crypto.subtle.exportKey('jwk', privateKey);
    return jwk;
  } catch (error) {
    console.error('导出私钥失败:', error);
    throw error;
  }
}

/**
 * 从PEM格式导入公钥
 * @param {string} pem 
 * @returns {Promise<CryptoKey>}
 */
export async function importPublicKey(pem) {
  try {
    const pemContents = pem.replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '');
    const binaryDer = atob(pemContents);
    const binaryArray = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      binaryArray[i] = binaryDer.charCodeAt(i);
    }
    
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      binaryArray,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    );
    
    return publicKey;
  } catch (error) {
    console.error('导入公钥失败:', error);
    throw error;
  }
}

/**
 * 从JWK格式导入私钥
 * @param {object} jwk 
 * @returns {Promise<CryptoKey>}
 */
export async function importPrivateKey(jwk) {
  try {
    const privateKey = await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['decrypt']
    );
    
    return privateKey;
  } catch (error) {
    console.error('导入私钥失败:', error);
    throw error;
  }
}

/**
 * 生成AES密钥
 * @returns {Promise<CryptoKey>}
 */
export async function generateAESKey() {
  try {
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    return key;
  } catch (error) {
    console.error('生成AES密钥失败:', error);
    throw error;
  }
}

/**
 * 使用AES加密数据
 * @param {CryptoKey} key 
 * @param {string} plaintext 
 * @returns {Promise<{ciphertext: string, iv: string}>}
 */
export async function encryptWithAES(key, plaintext) {
  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );
    
    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
      iv: btoa(String.fromCharCode(...iv)),
    };
  } catch (error) {
    console.error('AES加密失败:', error);
    throw error;
  }
}

/**
 * 使用AES解密数据
 * @param {CryptoKey} key 
 * @param {string} ciphertext 
 * @param {string} iv 
 * @returns {Promise<string>}
 */
export async function decryptWithAES(key, ciphertext, iv) {
  try {
    const ivArray = new Uint8Array(
      atob(iv).split('').map((c) => c.charCodeAt(0))
    );
    const ciphertextArray = new Uint8Array(
      atob(ciphertext).split('').map((c) => c.charCodeAt(0))
    );
    
    const plaintext = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivArray,
      },
      key,
      ciphertextArray
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(plaintext);
  } catch (error) {
    console.error('AES解密失败:', error);
    throw error;
  }
}

/**
 * 使用RSA公钥加密数据
 * @param {CryptoKey} publicKey 
 * @param {ArrayBuffer} data 
 * @returns {Promise<string>}
 */
export async function encryptWithRSA(publicKey, data) {
  try {
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      data
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  } catch (error) {
    console.error('RSA加密失败:', error);
    throw error;
  }
}

/**
 * 使用RSA私钥解密数据
 * @param {CryptoKey} privateKey 
 * @param {string} encryptedData 
 * @returns {Promise<ArrayBuffer>}
 */
export async function decryptWithRSA(privateKey, encryptedData) {
  try {
    const encryptedArray = new Uint8Array(
      atob(encryptedData).split('').map((c) => c.charCodeAt(0))
    );
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      encryptedArray
    );
    
    return decrypted;
  } catch (error) {
    console.error('RSA解密失败:', error);
    throw error;
  }
}

/**
 * 导出AES密钥为JWK格式（用于localStorage存储）
 * @param {CryptoKey} key 
 * @returns {Promise<object>}
 */
export async function exportAESKey(key) {
  try {
    const jwk = await window.crypto.subtle.exportKey('jwk', key);
    return jwk;
  } catch (error) {
    console.error('导出AES密钥失败:', error);
    throw error;
  }
}

/**
 * 从JWK格式导入AES密钥
 * @param {object} jwk 
 * @returns {Promise<CryptoKey>}
 */
export async function importAESKey(jwk) {
  try {
    const key = await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'AES-GCM',
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    return key;
  } catch (error) {
    console.error('导入AES密钥失败:', error);
    throw error;
  }
}

