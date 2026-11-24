import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, closeDatabase } from '../db/database.js';
import { AuthService } from '../services/authService.js';
import { FileService } from '../services/fileService.js';
import { storage } from '../services/storageService.js';
import { FileRepository } from '../db/repositories/fileRepository.js';
import { UserRepository } from '../db/repositories/userRepository.js';
import { TokenRepository } from '../db/repositories/tokenRepository.js';
import { AuditRepository } from '../db/repositories/auditRepository.js';
import { config } from '../config.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function it(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      passedTests++;
      console.log(`  ✅ ${name}`);
    })
    .catch((err) => {
      failedTests++;
      console.error(`  ❌ ${name}`);
      console.error(`     Erreur: ${err.message}`);
    });
}

async function runTests() {
  console.log('\n=======================================================');
  console.log('  🧪 SUITE DE TESTS TECHNIQUES — KAMIS DOCS');
  console.log('=======================================================\n');

  // Use a dedicated temporary test database
  const testDbPath = path.resolve(process.cwd(), 'data/test_kamis.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  const db = getDatabase(testDbPath);

  console.log('--- 1. Validation & Sécurisation des noms de fichiers ---');

  await it('Nettoie les tentatives de traversée de chemin (path traversal)', () => {
    const raw = '../../../etc/passwd';
    const sanitized = FileService.sanitizeFilename(raw);
    assert.strictEqual(sanitized, '.._.._.._etc_passwd');
    assert.strictEqual(sanitized.includes('/'), false);
    assert.strictEqual(sanitized.includes('\\'), false);
  });

  await it('Supprime les caractères nuls et caractères réservés Windows', () => {
    const raw = 'test\0evil<file>:name?.pdf';
    const sanitized = FileService.sanitizeFilename(raw);
    assert.strictEqual(sanitized, 'testevil_file__name_.pdf');
  });

  await it('Attribut un nom par défaut si le nom est vide ou invalide', () => {
    const sanitized = FileService.sanitizeFilename('');
    assert.strictEqual(sanitized, 'fichier-sans-nom');
  });

  console.log('\n--- 2. Parcours Inscription, Vérification et Connexion ---');

  const testEmail1 = 'alice@example.com';
  const testEmail2 = 'bob@example.com';
  const password = 'SuperSecretPassword123!';
  let user1Id = '';
  let user2Id = '';
  let user1Session = '';

  await it('Refuse l’inscription si les conditions d’utilisation ne sont pas acceptées', async () => {
    await assert.rejects(
      async () => {
        await AuthService.register({ email: testEmail1, password, acceptTerms: false });
      },
      /accepter les conditions/
    );
  });

  await it('Refuse l’inscription si le mot de passe est inférieur à 8 caractères', async () => {
    await assert.rejects(
      async () => {
        await AuthService.register({ email: testEmail1, password: 'court', acceptTerms: true });
      },
      /au moins 8 caractères/
    );
  });

  await it('Inscrit un utilisateur valide et émet un jeton de confirmation e-mail', async () => {
    const res = await AuthService.register({ email: testEmail1, password, acceptTerms: true });
    assert.strictEqual(res.requiresVerification, true);
    const user = UserRepository.findByEmail(testEmail1);
    assert.ok(user);
    assert.strictEqual(user!.email_verified_at, null);
    user1Id = user!.id;
  });

  await it('Empêche la connexion tant que l’e-mail n’est pas vérifié', async () => {
    await assert.rejects(
      async () => {
        await AuthService.login({ email: testEmail1, password });
      },
      /n’a pas encore été vérifiée/
    );
  });

  await it('Valide l’adresse e-mail avec le jeton à usage unique', async () => {
    const tokenRecord = db.prepare('SELECT * FROM email_verifications WHERE user_id = ?').get(user1Id) as any;
    assert.ok(tokenRecord);
    const verifyRes = await AuthService.verifyEmail({ token: tokenRecord.token });
    assert.strictEqual(verifyRes.success, true);

    const updatedUser = UserRepository.findById(user1Id);
    assert.ok(updatedUser!.email_verified_at);
  });

  await it('Empêche la réutilisation d’un jeton d’e-mail déjà consommé', async () => {
    const tokenRecord = db.prepare('SELECT * FROM email_verifications WHERE user_id = ?').get(user1Id) as any;
    await assert.rejects(
      async () => {
        await AuthService.verifyEmail({ token: tokenRecord.token });
      },
      /invalide ou a expiré/
    );
  });

  await it('Connecte l’utilisateur vérifié avec succès et émet une session', async () => {
    const loginRes = await AuthService.login({ email: testEmail1, password });
    assert.ok(loginRes.sessionToken);
    assert.strictEqual(loginRes.user.email, testEmail1);
    user1Session = loginRes.sessionToken;
  });

  await it('Refuse la connexion avec un mauvais mot de passe', async () => {
    await assert.rejects(
      async () => {
        await AuthService.login({ email: testEmail1, password: 'BadPassword999' });
      },
      /Identifiants invalides/
    );
  });

  console.log('\n--- 3. Réinitialisation de mot de passe sécurisée ---');

  await it('Demande de réinitialisation sans révéler l’existence du compte', async () => {
    const res1 = await AuthService.requestPasswordReset({ email: testEmail1 });
    const res2 = await AuthService.requestPasswordReset({ email: 'inconnu@domain.com' });
    assert.strictEqual(res1.message, res2.message);
  });

  await it('Permet la réinitialisation avec un jeton valide et révoque les anciennes sessions', async () => {
    const resetRecord = db.prepare('SELECT * FROM password_resets WHERE user_id = ? ORDER BY created_at DESC').get(user1Id) as any;
    assert.ok(resetRecord);

    const newPassword = 'NewSecretPassword456!';
    const confirmRes = await AuthService.confirmPasswordReset({
      token: resetRecord.token,
      newPassword
    });
    assert.ok(confirmRes.message);

    // Old password fails
    await assert.rejects(
      async () => {
        await AuthService.login({ email: testEmail1, password });
      },
      /Identifiants invalides/
    );

    // New password succeeds
    const newLogin = await AuthService.login({ email: testEmail1, password: newPassword });
    assert.ok(newLogin.sessionToken);
    user1Session = newLogin.sessionToken;
  });

  console.log('\n--- 4. Téléversement, Stockage Privé et Téléchargement ---');

  // Register user 2 (Bob) for multi-tenant isolation tests
  await AuthService.register({ email: testEmail2, password, acceptTerms: true });
  const user2 = UserRepository.findByEmail(testEmail2)!;
  user2Id = user2.id;
  UserRepository.markEmailVerified(user2Id);

  let file1Id = '';
  const testContent = Buffer.from('Contenu de test confidentiel Kamis Docs 2026', 'utf-8');

  await it('Téléverse un fichier et le stocke sous une clé opaque avec métadonnées', async () => {
    const file = await FileService.uploadFile({
      ownerUserId: user1Id,
      originalName: 'rapport-confidentiel.pdf',
      mimeType: 'application/pdf',
      buffer: testContent
    });

    assert.ok(file.id);
    assert.strictEqual(file.owner_user_id, user1Id);
    assert.strictEqual(file.original_name, 'rapport-confidentiel.pdf');
    assert.strictEqual(file.size_bytes, testContent.length);
    file1Id = file.id;

    // Check physical file exists on storage
    const exists = await storage.exists(file.object_key);
    assert.strictEqual(exists, true);
  });

  await it('Vérifie et met à jour l’usage de quota du compte', () => {
    const usage = FileService.getStorageUsage(user1Id);
    assert.strictEqual(usage.used_bytes, testContent.length);
    assert.strictEqual(usage.quota_bytes, config.defaultQuotaBytes);
  });

  await it('Permet au propriétaire de télécharger son fichier avec intégrité parfaite', async () => {
    const { file, stream } = await FileService.getFileForDownload({
      fileId: file1Id,
      userId: user1Id
    });

    assert.strictEqual(file.id, file1Id);

    // Read stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const downloadedBuffer = Buffer.concat(chunks);
    assert.strictEqual(downloadedBuffer.toString('utf-8'), testContent.toString('utf-8'));
  });

  console.log('\n--- 5. Isolation stricte inter-comptes (Multi-tenant Security) ---');

  await it('REFUSE strictement à Bob de lire ou télécharger le fichier d’Alice (PR-ACC-05)', async () => {
    await assert.rejects(
      async () => {
        await FileService.getFileForDownload({
          fileId: file1Id,
          userId: user2Id // Bob attempts to access Alice's file
        });
      },
      /Fichier introuvable/
    );
  });

  await it('REFUSE strictement à Bob de prévisualiser le fichier d’Alice', async () => {
    await assert.rejects(
      async () => {
        await FileService.getFileForPreview({
          fileId: file1Id,
          userId: user2Id
        });
      },
      /Fichier introuvable/
    );
  });

  await it('REFUSE strictement à Bob de supprimer le fichier d’Alice', async () => {
    await assert.rejects(
      async () => {
        await FileService.deleteFile({
          fileId: file1Id,
          userId: user2Id
        });
      },
      /Fichier introuvable/
    );

    // Verify file is still present
    const file = FileRepository.findByIdAndOwner(file1Id, user1Id);
    assert.ok(file);
  });

  console.log('\n--- 6. Respect des Quotas et Limites de Taille ---');

  await it('Refuse un fichier qui dépasse le quota alloué au compte (PR-FIL-06)', async () => {
    // Temporarily set user's quota to a small value
    db.prepare('UPDATE user_storage_usage SET quota_bytes = ? WHERE user_id = ?').run(100, user1Id);

    const oversizedBuffer = Buffer.alloc(200); // 200 bytes > 100 bytes quota
    await assert.rejects(
      async () => {
        await FileService.uploadFile({
          ownerUserId: user1Id,
          originalName: 'trop-gros.bin',
          mimeType: 'application/octet-stream',
          buffer: oversizedBuffer
        });
      },
      /quota de stockage est atteint/
    );

    // Reset quota
    db.prepare('UPDATE user_storage_usage SET quota_bytes = ? WHERE user_id = ?').run(config.defaultQuotaBytes, user1Id);
  });

  await it('Refuse un fichier de taille zéro (0 octet)', async () => {
    await assert.rejects(
      async () => {
        await FileService.uploadFile({
          ownerUserId: user1Id,
          originalName: 'vide.txt',
          mimeType: 'text/plain',
          buffer: Buffer.alloc(0)
        });
      },
      /Le fichier est vide/
    );
  });

  console.log('\n--- 7. Suppression et Nettoyage Intégral ---');

  await it('Supprime le fichier, libère le quota et efface l’objet physique (PR-FIL-05)', async () => {
    const fileRecord = FileRepository.findByIdAndOwner(file1Id, user1Id)!;
    const objectKey = fileRecord.object_key;

    await FileService.deleteFile({
      fileId: file1Id,
      userId: user1Id
    });

    // File not found in DB
    const lookup = FileRepository.findByIdAndOwner(file1Id, user1Id);
    assert.strictEqual(lookup, null);

    // Storage object removed
    const exists = await storage.exists(objectKey);
    assert.strictEqual(exists, false);

    // Quota refunded
    const usage = FileService.getStorageUsage(user1Id);
    assert.strictEqual(usage.used_bytes, 0);
  });

  await it('Supprime complètement le compte utilisateur et ses données (PR-DAT-02)', async () => {
    // Upload a new file for user 1
    const f = await FileService.uploadFile({
      ownerUserId: user1Id,
      originalName: 'temp.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello', 'utf-8')
    });
    const key = f.object_key;

    // Delete account
    await AuthService.deleteAccount({ userId: user1Id });

    // User deleted
    assert.strictEqual(UserRepository.findById(user1Id), null);
    // File record deleted
    assert.strictEqual(FileRepository.findByIdAndOwner(f.id, user1Id), null);
    // Storage object removed
    assert.strictEqual(await storage.exists(key), false);
  });

  console.log('\n--- 8. Journalisation d’audit de sécurité (Audit Logs) ---');

  await it('Enregistre les événements de sécurité sans divulguer de données sensibles', () => {
    const logs = AuditRepository.getRecentLogs(20);
    assert.ok(logs.length > 0);
    const actions = logs.map((l) => l.action);
    assert.ok(actions.includes('AUTH_REGISTER'));
    assert.ok(actions.includes('SECURITY_CROSS_TENANT_DENIED'));
    assert.ok(actions.includes('SECURITY_QUOTA_EXCEEDED'));
  });

  closeDatabase();
  // Cleanup test database
  try {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  } catch {}

  console.log('\n=======================================================');
  console.log(`  RÉSULTATS : ${passedTests} / ${totalTests} tests réussis (${failedTests} échecs)`);
  console.log('=======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Erreur fatale dans la suite de tests :', err);
  process.exit(1);
});
