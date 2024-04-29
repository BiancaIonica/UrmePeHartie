// uploadPDF.js
const firebase = require('firebase/app');
require('firebase/storage');

// Inițializează Firebase aici dacă nu este deja inițializat

function uploadPDF(file) {
    const storageRef = firebase.storage().ref();
    const fileRef = storageRef.child(`pdfs/${file.name}`);
    return fileRef.put(file).then(() => fileRef.getDownloadURL());
}

module.exports = uploadPDF;
