import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/generated/prisma/client';

/**
 * Client Prisma unique, mis en cache sur l'objet global en développement
 * pour survivre au rechargement à chaud. Après toute modification du schéma :
 * régénérer le client puis relancer le serveur, sans quoi l'ancien client
 * reste en mémoire.
 */
const globalPrisma = globalThis as unknown as { prismaChalandise?: PrismaClient };

function creerClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL est absente : renseignez le fichier .env (voir .env.example).');
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const bd: PrismaClient = globalPrisma.prismaChalandise ?? creerClient();

if (process.env.NODE_ENV !== 'production') {
  globalPrisma.prismaChalandise = bd;
}
