import { hash as argon2Hash, verify as argon2Verify } from "@felix/argon2";

export const hash = (password, options = {}) => argon2Hash(password, options);

export const verify = (hash, password) => argon2Verify(hash, password);
