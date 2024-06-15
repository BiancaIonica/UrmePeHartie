import {
  getDatabase,
  ref,
  storageRef,
  getAuth,
  update,
  getStorage,
  uploadBytes,
  getDownloadURL,
  onAuthStateChanged,
  get,
} from "../src/firebaseConfig.js";

document.addEventListener("DOMContentLoaded", async function () {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const database = getDatabase();
      const userRef = ref(database, `users/${user.uid}`);
      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            const imageUrl = userData.photoURL || ".. /src/default_user.png";
            document.getElementById(
              "preview"
            ).style.backgroundImage = `url(${imageUrl})`;
            document.getElementById("preview").style.display = "block";
          }
        })
        .catch((error) => {
          console.error("Eroare la încărcarea datelor utilizatorului:", error);
        });
    } else {
      console.error("Niciun utilizator conectat");
    }
  });
});

async function uploadProfilePicture() {
  const fileInput = document.getElementById("profilePicture");
  const file = fileInput.files[0]; // obține fișierul de la input

  if (!file) {
    alert("Te rog selectează o imagine.");
    return;
  }

  const auth = getAuth();
  const storage = getStorage();
  const database = getDatabase();

  const userId = auth.currentUser.uid;
  const storageReference = storageRef(storage, `profilepics/${userId}`);

  try {
    const snapshot = await uploadBytes(storageReference, file);
    const photoURL = await getDownloadURL(snapshot.ref);

    const userRef = ref(database, `users/${userId}`);
    await update(userRef, { photoURL: photoURL });

    document.getElementById(
      "preview"
    ).style.backgroundImage = `url(${photoURL})`;
    document.getElementById("preview").style.display = "block";

    showPopup("Imaginea de profil a fost actualizată cu succes!");
  } catch (error) {
    console.error("Eroare la încărcarea și actualizarea imaginii:", error);
    //alert('Eroare la încărcarea și actualizarea imaginii: ' + error.message);
    showPopup(
      "Eroare la încărcarea și actualizarea imaginii: " + error.message
    );
  }
  function showPopup(message) {
    const popup = document.getElementById("createPopup");
    document.getElementById("createMessage").textContent = message;
    popup.style.display = "block";
  }

  function closePopup() {
    document.getElementById("createPopup").style.display = "none";
  }

  const closeButton = document.querySelector(".close-button");
  closeButton.addEventListener("click", closePopup);
}

document
  .getElementById("profileForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.error("Niciun utilizator conectat");
      return;
    }

    const database = getDatabase();
    const userProfileRef = ref(database, "users/" + user.uid);

    const updateData = {};
    const fields = [
      { field: 'userName', id: 'userName' },
      { field: 'lastName', id: 'lastName' },
      { field: 'firstName', id: 'firstName' },
      { field: 'city', id: 'city' },
      { field: 'gender', id: 'gender' },
      { field: 'birthdate', id: 'birthdate' },
      { field: 'description', id: 'description' },
     
    ];

    fields.forEach(({ field, id }) => {
      const element = document.getElementById(id);
      if (element && element.value) { 
        updateData[field] = element.value;
      }
    });

    const genreElements = document.querySelectorAll('input[name="genres"]:checked');
    if (genreElements.length > 0) {
      updateData.genres = Array.from(genreElements).map(el => el.value);
    }

    if (Object.keys(updateData).length > 0) {
      update(userProfileRef, updateData)
        .then(() => {
          console.log("Profilul a fost actualizat cu succes!");
        })
        .catch((error) => {
          console.error("Eroare la actualizarea profilului:", error);
        });
    } else {
      console.log("Nicio modificare de făcut.");
    }
  });

document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("profilePicture");
  const previewContainer = document.getElementById("preview");

 
  fileInput.addEventListener("change", function () {
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        previewContainer.style.backgroundImage = `url(${e.target.result})`;
        previewContainer.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  const uploadButton = document.getElementById("uploadButton");
  if (uploadButton) {
    uploadButton.addEventListener("click", uploadProfilePicture);
  } else {
    console.error("Butonul de upload nu a fost găsit.");
  }
});
