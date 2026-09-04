export type TokenResponse = { token: string; url: string };

export async function fetchJoinToken(
  tokenSvcBase: string,
  identity: string,
  room = "spike-room",
): Promise<TokenResponse> {
  const endpoint = `${tokenSvcBase.replace(/\/$/, "")}/token`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identity, room }),
    });
  } catch (err) {
    const hint = tokenSvcBase.includes("127.0.0.1") || tokenSvcBase.includes("localhost")
      ? " no celular 127.0.0.1 é o telefone — abra https://<IP-do-PC>:1420 (aceite o certificado)"
      : " confira Vite/token no ar e firewall (1420/tcp; 8080 só se chamar o token direto)";
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`POST ${endpoint} falhou (${detail}).${hint}`);
  }
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`POST /token ${res.status}: ${text}`);
  }
  const data = JSON.parse(text) as Record<string, unknown>;
  for (const key of Object.keys(data)) {
    if (/secret/i.test(key)) {
      throw new Error("token service leaked a secret field");
    }
  }
  const token = data.token;
  const url = data.url;
  if (typeof token !== "string" || typeof url !== "string") {
    throw new Error("token response missing token or url");
  }
  return { token, url };
}
