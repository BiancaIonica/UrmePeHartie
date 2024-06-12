import { getAuth, getDatabase, ref, onValue, onAuthStateChanged, get } from "./src/firebaseConfig.js";

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].classList.remove('active'); // Deactivate all tabs
    }
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }
    const activeTabContent = document.getElementById(tabName);
    activeTabContent.style.display = "block";
    setTimeout(() => activeTabContent.classList.add('active'), 10);
    evt.currentTarget.classList.add("active");
}

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
                    document.getElementById('genres').textContent = userData.genres.join(", ");
                    document.getElementById('description').value = userData.description;

                    if (userData.photoURL) {
                        document.getElementById('profilePicture').src = userData.photoURL;
                    } else {
                        document.getElementById('profilePicture').src = './src/default_user.png';
                    }

                    loadFavorites(user.uid);
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

    const editButton = document.querySelector('.button');
    if (editButton) {
        editButton.addEventListener('click', function() {
            window.location.href = 'edit_profile.html';
        });
    }

    // Adăugare evenimente pentru tab-uri
    const tabs = document.querySelectorAll('.tab-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(evt) {
            openTab(evt, tab.getAttribute('data-tab'));
        });
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

function loadFavorites(userId) {
    const favoritesRef = ref(getDatabase(), `users/${userId}/favorites`);
    get(favoritesRef).then(snapshot => {
        if (snapshot.exists()) {
            const favoritesContainer = document.getElementById('FavoritesSlider');
            favoritesContainer.innerHTML = '';
            Object.values(snapshot.val()).forEach(fav => {
                const bookRef = ref(getDatabase(), `books/${fav.bookId}`);
                get(bookRef).then(bookSnap => {
                    if (bookSnap.exists()) {
                        const book = bookSnap.val();
                        const bookElement = document.createElement('div');
                        bookElement.className = 'favorite-book';
                        bookElement.innerHTML = `
                            <img src="${book.coverUrl}" alt="${book.title}" style="width: 100px; height: auto;">
                        `;
                        favoritesContainer.appendChild(bookElement);
                    }
                });
            });
        } else {
            document.getElementById('FavoritesSlider').innerHTML = '<p>Nu există cărți favorite.</p>';
        }
    });
}
