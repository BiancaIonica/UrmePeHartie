import {
  getDatabase,
  ref,
  get,
  getAuth,
  onAuthStateChanged,
  remove,
  auth,
} from "../src/firebaseConfig.js";
document
  .getElementById("linkLogin")
  .addEventListener("click", function (event) {
    event.preventDefault();
    window.location.href = "../html/login.html";
  });
let favoritesArray = [];

document.addEventListener("DOMContentLoaded", function () {
  const userMenu = document.getElementById("userDropdown");
  const userIcon = document.getElementById("userPhoto");
  const searchButton = document.querySelector(".search-btn");
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
  const favoriteBooksContainer = document.getElementById(
    "favoriteBooksContainer"
  );
  const sortOptions = document.getElementById("sortOptions");

  const searchBox = document.getElementById("searchBox");

  function filterBooks() {
    const searchValue = searchBox.value.toLowerCase();
    const filteredBooks = favoritesArray.filter((book) => {
      return (
        book.title.toLowerCase().includes(searchValue) ||
        book.author.toLowerCase().includes(searchValue) ||
        book.genre.toLowerCase().includes(searchValue)
      );
    });
    displayBooks(filteredBooks);
  }

  if (searchBox) {
    searchBox.addEventListener("input", filterBooks);
  }

  onAuthStateChanged(getAuth(), (user) => {
    if (user) {
      const userId = user.uid;
      const favoritesRef = ref(getDatabase(), `users/${userId}/favorites`);
      get(favoritesRef)
        .then((favSnapshot) => {
          if (favSnapshot.exists()) {
            favoritesArray = [];
            Object.keys(favSnapshot.val()).forEach((key) => {
              const bookId = favSnapshot.val()[key].bookId;
              get(ref(getDatabase(), `books/${bookId}`)).then(
                (bookSnapshot) => {
                  if (bookSnapshot.exists()) {
                    let book = bookSnapshot.val();
                    book.bookId = bookId;
                    favoritesArray.push(book);
                  }

                  if (
                    favoritesArray.length ===
                    Object.keys(favSnapshot.val()).length
                  ) {
                    displayBooks(sortAndFilterBooks(favoritesArray));
                  }
                }
              );
            });
          } else {
            favoriteBooksContainer.innerHTML =
              "<p>Nu există cărți favorite.</p>";
          }
        })
        .catch((error) => {
          console.error("Failed to retrieve favorite books:", error);
          favoriteBooksContainer.innerHTML =
            "<p>Eroare la încărcarea cărților.</p>";
        });
    } else {
      favoriteBooksContainer.innerHTML =
        "<p>Autentifică-te pentru a vedea această pagină.</p>";
    }
  });

  sortOptions.addEventListener("change", () => {
    displayBooks(sortAndFilterBooks(favoritesArray));
  });

  function sortAndFilterBooks(books) {
    const sortBy = sortOptions.value;
    return books.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -1;
      if (a[sortBy] > b[sortBy]) return 1;
      return 0;
    });
  }

  function displayBooks(books) {
    favoriteBooksContainer.innerHTML = "";
    books.forEach((book) => {
      const bookElement = document.createElement("div");
      bookElement.className = "book";
      bookElement.innerHTML = `
                <a href="/bookdetails.html?bookId=${book.bookId}">
                    <img src="${book.coverUrl}" alt="${book.title}">
                    <h2>${book.title} - ${book.author}</h2>
                </a>
            `;
      const removeButton = document.createElement("button");
      removeButton.className = "button remove-button";
      removeButton.textContent = "Ștergeți din Favorite";
      removeButton.onclick = function () {
        confirmRemove(book.bookId);
      };

      bookElement.appendChild(removeButton);
      favoriteBooksContainer.appendChild(bookElement);
    });
  }

  function confirmRemove(bookId) {
    const overlay = document.querySelector(".overlay");
    const popup = document.querySelector(".popup");
    const okButton = popup.querySelector(".ok-button");
    const cancelButton = popup.querySelector(".cancel-button");

    overlay.classList.add("active");
    popup.classList.add("active");

    okButton.onclick = function () {
      removeFavorite(bookId);
      overlay.classList.remove("active");
      popup.classList.remove("active");
    };

    cancelButton.onclick = function () {
      overlay.classList.remove("active");
      popup.classList.remove("active");
    };
  }

  function removeFavorite(bookId) {
    const userId = getAuth().currentUser.uid;
    const favoritesRef = ref(getDatabase(), `users/${userId}/favorites`);
    get(favoritesRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const favorites = snapshot.val();
          let keyToRemove = Object.keys(favorites).find(
            (key) => favorites[key].bookId === bookId
          );
          if (keyToRemove) {
            const favoriteRef = ref(
              getDatabase(),
              `users/${userId}/favorites/${keyToRemove}`
            );
            remove(favoriteRef)
              .then(() => {
                console.log("Book removed from favorites successfully!");
                displayBooks(
                  favoritesArray.filter((book) => book.bookId !== bookId)
                );
                window.location.reload();
              })
              .catch((error) => {
                console.error("Failed to remove book from favorites", error);
              });
          } else {
            console.log("No matching favorite found to remove.");
          }
        } else {
          console.log("No favorites to search through.");
        }
      })
      .catch((error) => {
        console.error("Error retrieving favorites:", error);
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
