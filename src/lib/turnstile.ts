import { readEnv } from "@/lib/email";

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export function isTurnstileConfigured(): boolean {
  return Boolean(readEnv("TURNSTILE_SECRET_KEY"));
}

export function getTurnstileSiteKey(): string | undefined {
  return readEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
}

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp?: string,
): Promise<boolean> {
  const secret = readEnv("TURNSTILE_SECRET_KEY");
  if (!secret) {
    return true;
  }

  if (!token?.trim()) {
    return false;
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as TurnstileVerifyResponse;
  return data.success === true;
}
