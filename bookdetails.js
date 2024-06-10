import {
  getDatabase,
  ref,
  get,
  getDownloadURL,
  storage,
  storageRef,
  getAuth,
  set,
  push,
  remove
} from "./src/firebaseConfig.js";

document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get("bookId");
  const addToFavoritesButton = document.getElementById("addToFavorites");
  const favoriteIcon = document.querySelector("#addToFavorites img");

  const dbRef = ref(getDatabase(), `books/${bookId}`);
  get(dbRef).then((snapshot) => {
    if (snapshot.exists()) {
      const book = snapshot.val();
      document.getElementById("title").textContent = book.title;
      document.getElementById("author").textContent = book.author;
      document.getElementById("description").innerHTML = book.description;
      document.getElementById("coverImage").src = book.coverUrl;
      document.getElementById("readPdf").href = book.pdfUrl;
      const pdfStorageRef = storageRef(storage, book.pdfUrl);
      getDownloadURL(pdfStorageRef).then((url) => {
        const downloadLink = document.getElementById("downloadLink");
        downloadLink.href = url;
        downloadLink.download = `${book.title}.pdf`;
      }).catch((error) => {
        console.error("Failed to get download URL", error);
      });

      updateFavoriteIcon();
    } else {
      console.log("Book details not found.");
      document.getElementById("details").textContent = "Details not found for this book.";
    }
  }).catch((error) => {
    console.error("Failed to load book details", error);
  });

  function updateFavoriteIcon() {
    const userId = getAuth().currentUser.uid;
    const favoritesRef = ref(getDatabase(), `users/${userId}/favorites`);
    get(favoritesRef).then((favSnapshot) => {
      if (favSnapshot.exists() && Object.values(favSnapshot.val()).some(fav => fav.bookId === bookId)) {
        favoriteIcon.src = './src/add_to_favorites_black.png';
      } else {
        favoriteIcon.src = './src/add_to_favorites.png';
      }
    }).catch((error) => {
      console.error("Failed to check favorites", error);
    });
  }

  addToFavoritesButton.addEventListener('click', function() {
    const userId = getAuth().currentUser.uid;
    if (!userId) {
      console.log("User not authenticated");
      return;
    }
    const favoritesRef = ref(getDatabase(), `users/${userId}/favorites`);
    get(favoritesRef).then((snapshot) => {
      if (snapshot.exists()) {
        const favorites = snapshot.val();
        const favoriteKey = Object.keys(favorites).find(key => favorites[key].bookId === bookId);
        if (favoriteKey) {
          remove(ref(getDatabase(), `users/${userId}/favorites/${favoriteKey}`)).then(() => {
            console.log("Book removed from favorites");
            favoriteIcon.src = './src/add_to_favorites.png';
            updateFavoriteIcon(); // refresh icon state
          }).catch((error) => {
            console.error("Failed to remove book from favorites", error);
          });
        } else {
          addBookToFavorites(userId, favoritesRef);
        }
      } else {
        addBookToFavorites(userId, favoritesRef);
      }
    }).catch((error) => {
      console.error("Failed to check favorites", error);
    });
  });

  function addBookToFavorites(userId, favoritesRef) {
    const newFavoriteRef = push(favoritesRef);
    set(newFavoriteRef, { bookId: bookId, title: document.getElementById("title").textContent })
      .then(() => {
        console.log("Book added to favorites!");
        favoriteIcon.src = './src/add_to_favorites_black.png';
        updateFavoriteIcon(); // refresh icon state
      }).catch((error) => {
        console.error("Failed to add book to favorites", error);
      });
  }
});
