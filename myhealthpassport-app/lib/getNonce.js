// lib/getNonce.js
import { headers } from "next/headers";

export async function getCspNonce() {
    const nonce = (await headers()).get("x-nonce");
    return nonce;
}
