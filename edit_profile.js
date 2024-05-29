import {
    getDatabase,
     ref,
     get,
     child,
     auth, onAuthStateChanged, signOut
   } from "./firebaseConfig.js";
 

document.getElementById('editProfileForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const userRef = firebase.database().ref('users/' + firebase.auth().currentUser.uid);
    const updatedData = {
        username: document.getElementById('username').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        city: document.getElementById('city').value,
        gender: document.getElementById('gender').value,
        birthdate: document.getElementById('birthdate').value,
        about: document.getElementById('about').value,
        favoriteGenres: Array.from(document.getElementById('favoriteGenres').selectedOptions).map(option => option.value),
        showFavorites: document.getElementById('showFavorites').checked,
    };

    document.getElementById('profilePicture').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('preview');
                preview.style.backgroundImage = `url('${e.target.result}')`;
            };
            reader.readAsDataURL(file);
        }
    });
    

    userRef.update(updatedData)
    .then(() => {
        alert('Profilul a fost actualizat cu succes!');
        window.location.href = '/profile.html'; // Redirect to the profile page
    })
    .catch(error => {
        console.error('Eroare la actualizarea profilului:', error);
        alert('Eroare la actualizarea datelor. Verificați consola pentru detalii.');
    });
});
