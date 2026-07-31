import { randomBytes } from "crypto";

/**
 * Per-table QR access token.
 *
 * A table's QR used to encode a permanent, guessable URL (…?table=1), so anyone
 * who scanned it once could keep placing orders on that table forever — from
 * home, days later. The token makes each link valid only for the current
 * sitting: it is rotated the moment the table is released after its bill is
 * settled, which silently invalidates every link handed out to the previous
 * guests. The printed QR sticker itself never changes.
 */
export function newTableToken(): string {
  return randomBytes(9).toString("base64url"); // 12 url-safe chars
}
