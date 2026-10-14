import * as Crypto from "expo-crypto";

/**
 * Generate a cryptographically secure random code verifier
 * @returns {string} Base64URL encoded random string (43-128 characters)
 */
export const generateCodeVerifier = async () => {
    // Generate 32 random bytes
    const randomBytes = await Crypto.getRandomBytesAsync(32);

    // Convert to base64url format
    return base64URLEncode(randomBytes);
};

/**
 * Generate code challenge from verifier using SHA256
 * @param {string} verifier - The code verifier
 * @returns {string} Base64URL encoded SHA256 hash
 */
export const generateCodeChallenge = async (verifier) => {
    // Hash the verifier using SHA256
    const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        verifier,
        { encoding: Crypto.CryptoEncoding.BASE64 }
    );

    // Convert to base64url format
    return base64URLEncode(hash);
};

/**
 * Convert base64 to base64url format
 * @param {string|Uint8Array} input - Base64 string or byte array
 * @returns {string} Base64URL encoded string
 */
const base64URLEncode = (input) => {
    let base64;

    if (typeof input === "string") {
        base64 = input;
    } else {
        // Convert Uint8Array to base64
        base64 = btoa(String.fromCharCode.apply(null, input));
    }

    // Make it URL safe
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};