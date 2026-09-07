import type { NextConfig } from 'next';

/**
 * En-têtes de sécurité appliqués à toutes les routes (exigence du brief,
 * Sécurité et qualité, p.8). Pas de Content-Security-Policy stricte pour le
 * MVP : aucun script tiers, aucun contenu externe intégré, le risque
 * principal (clickjacking, sniffing MIME, fuite du referrer) est couvert par
 * les en-têtes ci-dessous.
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
