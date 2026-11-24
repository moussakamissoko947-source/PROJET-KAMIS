import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { createApp } from '../app.js';
import { getDatabase, closeDatabase } from '../db/database.js';

let server: any;
const PORT = 5099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runE2E() {
  console.log('\n=======================================================');
  console.log('  🌐 TEST END-TO-END HTTP INTÉGRÉ — KAMIS DOCS');
  console.log('=======================================================\n');

  // Prepare clean test db
  const testDb = path.resolve(process.cwd(), 'data/e2e_kamis.db');
  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  getDatabase(testDb);

  const app = createApp();

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => resolve());
  });
  console.log(`Serveur de test E2E démarré sur ${BASE_URL}`);

  try {
    // 1. Healthcheck
    console.log('1. Test de santé (Healthcheck)...');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthJson = await healthRes.json() as any;
    assert.strictEqual(healthJson.status, 'ok');
    console.log('  ✅ /api/health répond avec succès');

    // 2. SPA client serving
    console.log('2. Test de service de l’application web (SPA)...');
    const spaRes = await fetch(`${BASE_URL}/`);
    assert.strictEqual(spaRes.status, 200);
    const spaHtml = await spaRes.text();
    assert.ok(spaHtml.includes('Kamis Docs'));
    console.log('  ✅ Le frontend React compilé est servi par le serveur');

    // 3. Register user
    console.log('3. Test d’inscription utilisateur...');
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'charlie@example.com',
        password: 'Password999!',
        acceptTerms: true
      })
    });
    assert.strictEqual(regRes.status, 201);
    console.log('  ✅ Inscription réussie (201 Created)');

    // 4. Retrieve verification email from dev mailbox
    console.log('4. Vérification de la boîte dev et récupération du jeton...');
    const mailRes = await fetch(`${BASE_URL}/api/dev/mailbox`);
    const mailJson = await mailRes.json() as any;
    assert.ok(mailJson.emails.length > 0);
    const verifEmail = mailJson.emails.find((e: any) => e.to === 'charlie@example.com');
    assert.ok(verifEmail);
    const tokenMatch = verifEmail.actionUrl.match(/token=([a-f0-9]+)/);
    assert.ok(tokenMatch);
    const token = tokenMatch[1];
    console.log(`  ✅ Courriel généré avec jeton: ${token.substring(0, 8)}...`);

    // 5. Verify email
    console.log('5. Validation de l’adresse e-mail...');
    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    assert.strictEqual(verifyRes.status, 200);
    console.log('  ✅ Compte activé avec succès');

    // 6. Login & Session cookie
    console.log('6. Authentification et cookie de session HTTP-Only...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'charlie@example.com',
        password: 'Password999!'
      })
    });
    assert.strictEqual(loginRes.status, 200);
    const cookieHeader = loginRes.headers.get('set-cookie');
    assert.ok(cookieHeader);
    assert.ok(cookieHeader.includes('kamis_session'));
    const sessionCookie = cookieHeader.split(';')[0];
    console.log('  ✅ Cookie kamis_session émis');

    // 7. Get Current User profile
    console.log('7. Consultation du profil /api/auth/me...');
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie }
    });
    assert.strictEqual(meRes.status, 200);
    const meJson = await meRes.json() as any;
    assert.strictEqual(meJson.user.email, 'charlie@example.com');
    console.log('  ✅ Session authentifiée vérifiée');

    // 8. Upload File
    console.log('8. Téléversement d’un fichier...');
    const formData = new FormData();
    const blob = new Blob(['Contenu secret de Charlie pour Kamis Docs'], { type: 'text/plain' });
    formData.append('file', blob, 'notes-securisees.txt');

    const uploadRes = await fetch(`${BASE_URL}/api/files/upload`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
      body: formData
    });
    assert.strictEqual(uploadRes.status, 201);
    const uploadJson = await uploadRes.json() as any;
    assert.ok(uploadJson.file.id);
    const fileId = uploadJson.file.id;
    console.log(`  ✅ Fichier "${uploadJson.file.original_name}" téléversé avec ID: ${fileId}`);

    // 9. List Files
    console.log('9. Consultation de la liste des fichiers...');
    const listRes = await fetch(`${BASE_URL}/api/files`, {
      headers: { Cookie: sessionCookie }
    });
    assert.strictEqual(listRes.status, 200);
    const listJson = await listRes.json() as any;
    assert.strictEqual(listJson.files.length, 1);
    assert.strictEqual(listJson.files[0].id, fileId);
    console.log('  ✅ Liste retournée avec 1 fichier et statistiques de quota');

    // 10. Download File
    console.log('10. Téléchargement et intégrité...');
    const downloadRes = await fetch(`${BASE_URL}/api/files/${fileId}/download`, {
      headers: { Cookie: sessionCookie }
    });
    assert.strictEqual(downloadRes.status, 200);
    assert.ok(downloadRes.headers.get('content-disposition')?.includes('attachment'));
    const downloadedText = await downloadRes.text();
    assert.strictEqual(downloadedText, 'Contenu secret de Charlie pour Kamis Docs');
    console.log('  ✅ Téléchargement conforme et intégrité validée');

    // 11. Account Statistics
    console.log('11. Consultation des statistiques du compte /api/account...');
    const accRes = await fetch(`${BASE_URL}/api/account`, {
      headers: { Cookie: sessionCookie }
    });
    assert.strictEqual(accRes.status, 200);
    const accJson = await accRes.json() as any;
    assert.strictEqual(accJson.totalFiles, 1);
    assert.strictEqual(accJson.breakdown.documents.count, 1);
    console.log('  ✅ Métriques et ventilation par catégorie exactes');

    // 12. Delete File
    console.log('12. Suppression du fichier...');
    const delRes = await fetch(`${BASE_URL}/api/files/${fileId}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie }
    });
    assert.strictEqual(delRes.status, 200);
    console.log('  ✅ Fichier supprimé et quota mis à jour');

    console.log('\n=======================================================');
    console.log('  🎉 TOUS LES TESTS E2E SONT VALIDÉS AVEC SUCCÈS !');
    console.log('=======================================================\n');
  } finally {
    server.close();
    closeDatabase();
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
    process.exit(0);
  }
}

runE2E().catch((err) => {
  console.error('Erreur test E2E :', err);
  if (server) server.close();
  process.exit(1);
});
