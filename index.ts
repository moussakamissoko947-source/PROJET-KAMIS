import { createApp } from './app.js';
import { config } from './config.js';
import { getDatabase, closeDatabase } from './db/database.js';

async function bootstrap() {
  // 1. Initialize SQLite database and tables
  console.log('[Kamis Docs] Initialisation de la base de données SQLite...');
  getDatabase();
  console.log(`[Kamis Docs] Base prête : ${config.dbPath}`);
  console.log(`[Kamis Docs] Répertoire de stockage sécurisé : ${config.storageDir}`);

  // 2. Create and start express app
  const app = createApp();

  const server = app.listen(config.port, () => {
    const activeDomain = config.clientUrl || `Port ${config.port} (écoute sur toutes les interfaces)`;
    console.log(`=======================================================`);
    console.log(`  🚀 Kamis Docs — Serveur en ligne et opérationnel`);
    console.log(`  📡 Port d'écoute : ${config.port}`);
    console.log(`  🩺 Statut santé  : /api/health`);
    console.log(`  📫 Courriels     : /api/dev/mailbox`);
    console.log(`  💻 Domaine actif : ${activeDomain}`);
    console.log(`=======================================================`);
  });

  const shutdown = () => {
    console.log('\n[Kamis Docs] Arrêt du serveur...');
    server.close(() => {
      closeDatabase();
      console.log('[Kamis Docs] Serveur et base de données fermés proprement.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('[Kamis Docs] Erreur critique au démarrage :', err);
  process.exit(1);
});
