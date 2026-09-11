// Función serverless de Vercel (no se ejecuta en el navegador).
// Necesita una cuenta de servicio de Firebase configurada como variables de entorno
// en Vercel (ver README, sección "Borrar clientes de verdad"). Nunca se expone al cliente.

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    res.status(500).json({ error: 'Falta configurar la cuenta de servicio de Firebase en Vercel (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).' });
    return;
  }

  const { idToken, uidToDelete } = req.body || {};
  if (!idToken || !uidToDelete) {
    res.status(400).json({ error: 'Faltan datos' });
    return;
  }

  try {
    // Verifica que quien llama esté realmente logueado y sea administrador — nunca confía en el navegador.
    const decoded = await admin.auth().verifyIdToken(idToken);
    const adminDoc = await admin.firestore().collection('admins').doc(decoded.uid).get();
    if (!adminDoc.exists) {
      res.status(403).json({ error: 'No autorizado' });
      return;
    }

    await admin.auth().deleteUser(uidToDelete);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'No se pudo borrar el usuario', detail: String(e.message || e) });
  }
}
