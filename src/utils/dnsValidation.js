import dns from "dns/promises";

export async function validateEmailDomain(email) {
  const domain = email.split("@")[1];

  try {
    const mx = await dns.resolveMx(domain);
    return mx && mx.length > 0; // valid domain if MX records exist
  } catch {
    return false;
  }
}
