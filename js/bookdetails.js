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
  remove,
  onAuthStateChanged,
  auth,
} from "../src/firebaseConfig.js";

document
  .getElementById("linkLogin")
  .addEventListener("click", function (event) {
    event.preventDefault();
    window.location.href = "../html/login.html";
  });

document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get("bookId");
  const addToFavoritesButton = document.getElementById("addToFavorites");
  const favoriteIcon = document.querySelector("#addToFavorites img");
  const userMenu = document.getElementById("userDropdown");
  const userIcon = document.getElementById("userPhoto");
  const linkLogout = document.getElementById("linkLogout");

  userIcon.addEventListener("click", () => {
    userMenu.style.display =
      userMenu.style.display === "flex" ? "none" : "flex";
  });
  onAuthStateChanged(auth, (user) => {
    toggleAuthButtons(user);
    if (user) {
      const userId = user.uid;
      const userRef = ref(getDatabase(), "users/" + userId);
      document.getElementById("forum").style.display = "block";
      document.getElementById("menuBiblioteca").style.display = "block";
      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log("User Data:", userData);
            if (userData.role === "admin") {
              document.getElementById("adminPanel").style.display = "block";
            } else {
              document.getElementById("adminPanel").style.display = "none";
            }
            if (userData.userName) {
              document.getElementById("username").textContent =
                userData.userName;
            }
            if (userData.photoURL) {
              document.getElementById("userPhoto").src = userData.photoURL;
            }
          } else {
            console.log("No user data available");
          }
        })
        .catch((error) => {
          console.error("Error retrieving user data:", error);
        });
    } else {
      document.getElementById("username").textContent = "Guest";
      document.getElementById("adminPanel").style.display = "none";
    }
  });

  linkLogout.addEventListener("click", (event) => {
    event.preventDefault();
    signOut(auth)
      .then(() => {
        console.log("User logged out");
        toggleAuthButtons(null);
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Logout error", error);
      });
  });

  const dbRef = ref(getDatabase(), `books/${bookId}`);
  get(dbRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const book = snapshot.val();
        document.getElementById("title").textContent = book.title;
        document.getElementById("author").textContent = book.author;
        document.getElementById("description").innerHTML = book.description;
        document.getElementById("coverImage").src = book.coverUrl;
        document.getElementById("readPdf").href = book.pdfUrl;

        
        const downloadLink = document.getElementById("downloadLink");
        downloadLink.addEventListener("click", async () => {
          try {
            const pdfStorageRef = storageRef(storage, book.pdfUrl);
            const url = await getDownloadURL(pdfStorageRef);
            const response = await fetch(url);
            const blob = await response.blob();
            const a = document.createElement("a");
            const objectUrl = URL.createObjectURL(blob);
            a.href = objectUrl;
            a.download = `${book.title}.pdf`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(objectUrl);
            document.body.removeChild(a);
          } catch (error) {
            console.error("Failed to download PDF", error);
          }
        });

        updateFavoriteIcon();
      } else {
        console.log("Book details not found.");
        document.getElementById("details").textContent =
          "Details not found for this book.";
      }
    })
    .catch((error) => {
      console.error("Failed to load book details", error);
    });

  function updateFavoriteIcon() {
    const userId = getAuth().currentUser.uid;
    const favoritesRef = ref(getDatabase(), `users/${userId}/favorites`);
    get(favoritesRef)
      .then((favSnapshot) => {
        if (
          favSnapshot.exists() &&
          Object.values(favSnapshot.val()).some((fav) => fav.bookId === bookId)
        ) {
          favoriteIcon.src = "../src/add_to_favorites_black.png";
        } else {
          favoriteIcon.src = "../src/add_to_favorites.png";
        }
      })
      .catch((error) => {
        console.error("Failed to check favorites", error);
      });
  }

  addToFavoritesButton.addEventListener("click", function () {
    const userId = getAuth().currentUser.uid;
    if (!userId) {
      console.log("User not authenticated");
      return;
    }
    const favoritesRef = ref(getDatabase(), `users/${userId}/favorites`);
    get(favoritesRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const favorites = snapshot.val();
          const favoriteKey = Object.keys(favorites).find(
            (key) => favorites[key].bookId === bookId
          );
          if (favoriteKey) {
            remove(
              ref(getDatabase(), `users/${userId}/favorites/${favoriteKey}`)
            )
              .then(() => {
                console.log("Book removed from favorites");
                favoriteIcon.src = "../src/add_to_favorites.png";
                updateFavoriteIcon();
              })
              .catch((error) => {
                console.error("Failed to remove book from favorites", error);
              });
          } else {
            addBookToFavorites(userId, favoritesRef);
          }
        } else {
          addBookToFavorites(userId, favoritesRef);
        }
      })
      .catch((error) => {
        console.error("Failed to check favorites", error);
      });
  });

  function addBookToFavorites(userId, favoritesRef) {
    const newFavoriteRef = push(favoritesRef);
    set(newFavoriteRef, {
      bookId: bookId,
      title: document.getElementById("title").textContent,
    })
      .then(() => {
        console.log("Book added to favorites!");
        favoriteIcon.src = "../src/add_to_favorites_black.png";
        updateFavoriteIcon();
      })
      .catch((error) => {
        console.error("Failed to add book to favorites", error);
      });
  }
});
function toggleAuthButtons(user) {
  const loginLink = document.getElementById("linkLogin");
  const logoutLink = document.getElementById("linkLogout");

  if (user) {
    loginLink.style.display = "none";
    logoutLink.style.display = "block";
  } else {
    loginLink.style.display = "block";
    logoutLink.style.display = "none";
  }
}
