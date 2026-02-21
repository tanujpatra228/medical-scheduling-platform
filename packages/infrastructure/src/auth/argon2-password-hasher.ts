import argon2 from "argon2";
import { IPasswordHasherPort } from "@msp/application";

const ARGON2_MEMORY_COST = 65536;
const ARGON2_TIME_COST = 3;
const ARGON2_PARALLELISM = 4;

export class Argon2PasswordHasher implements IPasswordHasherPort {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: ARGON2_MEMORY_COST,
      timeCost: ARGON2_TIME_COST,
      parallelism: ARGON2_PARALLELISM,
    });
  }

  async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}
