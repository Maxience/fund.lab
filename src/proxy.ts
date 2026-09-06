import { NextResponse, type NextRequest } from 'next/server';

import { CHEMIN_CONNEXION, NOM_COOKIE_SESSION, PREFIXE_ESPACE_EXPERT } from '@/lib/auth/constantes';

/**
 * Garde de routage de l'espace Expert : sans cookie de session, redirection
 * vers la connexion. C'est un contrôle optimiste ; la vérification réelle de
 * la session (validité, expiration, état du compte) a lieu côté serveur dans
 * chaque page et chaque action via exigerExpert().
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith(PREFIXE_ESPACE_EXPERT) && !request.cookies.has(NOM_COOKIE_SESSION)) {
    const destination = new URL(CHEMIN_CONNEXION, request.url);
    destination.searchParams.set('suite', pathname);
    return NextResponse.redirect(destination);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/expert/:path*'],
};
