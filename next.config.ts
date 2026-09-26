import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança em todas as respostas. O HTTPS obrigatório
 * (Strict-Transport-Security) já vem da Vercel.
 */
const SECURITY_HEADERS = [
  // Impede que o sistema seja aberto dentro de outro site (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // O navegador não "adivinha" tipo de arquivo.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Ao sair para outro site, envia só o domínio — nunca o caminho interno.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // O sistema não usa câmera, microfone nem localização.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
