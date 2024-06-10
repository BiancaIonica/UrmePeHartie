/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.deleteUserAndData = functions.https.onCall((data, context) => {
  // Verifică dacă cererea este autentificată
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Only authenticated users can initiate this function.');
  }

  const uid = data.uid;

 
  const deleteUser = admin.auth().deleteUser(uid);
  const deleteUserData = admin.database().ref(`/users/${uid}`).remove();

  return Promise.all([deleteUser, deleteUserData])
    .then(() => {
      return { success: true };
    })
    .catch(error => {
      throw new functions.https.HttpsError('unknown', error.message);
    });
});
