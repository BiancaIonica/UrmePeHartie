import { getAuth, getDatabase, ref, onValue, onAuthStateChanged, database } from "./src/firebaseConfig.js";

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth();
    const database = getDatabase();

    onAuthStateChanged(auth, user => {
        if (user) {
            console.log('Utilizator conectat:', user);
            const userRef = ref(database, 'users/' + user.uid);

            onValue(userRef, (snapshot) => {
                const userData = snapshot.val();
                if (userData) {
                    document.getElementById('username').textContent = userData.userName;
                    document.getElementById('firstName').textContent = userData.firstName;
                    document.getElementById('lastName').textContent = userData.lastName;
                    document.getElementById('email').textContent = userData.email;
                    document.getElementById('address').textContent = userData.city;
                    document.getElementById('birthdate').textContent = userData.birthdate;
                    updateGenderIcon(userData.gender);
                    document.getElementById('genres').textContent = userData.genres;
                    document.getElementById('description').textContent = userData.description;

                    if (userData.photoURL) {
                        document.getElementById('profilePicture').src = userData.photoURL;
                    } else {
                        document.getElementById('profilePicture').src = './src/default_user.png';
                    }
                } else {
                    console.log('Nu există date disponibile pentru utilizator.');
                }
            }, {
                onlyOnce: true
            });
        } else {
            console.log('Niciun utilizator conectat');
        }
    });
});
function updateGenderIcon(gender) {
    const genderIcon = document.getElementById('genderIcon');
    if (gender === 'male') {
        genderIcon.src = './src/gender_male.png';  
        genderIcon.alt = 'Masculin';
    } else if (gender === 'female') {
        genderIcon.src = './src/gender_female.png';  
        genderIcon.alt = 'Feminin';
    } else {
        genderIcon.src = ''; 
        genderIcon.alt = 'Nespecificat';
    }
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

document.addEventListener('DOMContentLoaded', function() {
    const editButton = document.querySelector('.button');

    if (editButton) {
        editButton.addEventListener('click', function() {
            window.location.href = 'edit_profile.html';
        });
    }
});
