import { getDatabase, ref, get, onAuthStateChanged, auth } from "../src/firebaseConfig.js";

function normalizeDiacritics(text) {
  return text
    .replace(/ă/g, "a")
    .replace(/î/g, "i")
    .replace(/â/g, "a")
    .replace(/ș/g, "s")
    .replace(/ț/g, "t");
}
document.getElementById("linkLogin").addEventListener("click", function (event) {
  event.preventDefault();
  window.location.href = "../html/login.html";
});
document.addEventListener("DOMContentLoaded", function () {
  const userMenu = document.getElementById('userDropdown');
  const userIcon = document.getElementById('userPhoto');
  const searchButton = document.querySelector(".search-btn");
  const linkLogout = document.getElementById("linkLogout");

  userIcon.addEventListener("click", () => {
    userMenu.style.display = (userMenu.style.display === 'flex') ? 'none' : 'flex';
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
              document.getElementById("username").textContent = userData.userName;
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
  
  const params = new URLSearchParams(window.location.search);
  const genre = params.get("genre"); // Obținerea genului din URL
  console.log("Genre from URL:", genre);

  const booksContainer = document.getElementById("booksContainer");
  const dbRef = ref(getDatabase(), "books");
  const formattedGenre =
    genre.charAt(0).toUpperCase() + genre.slice(1).replace(/-/g, " ");
  const pageTitle = document.getElementById("page-title");
  pageTitle.textContent = `Explorați colecția noastră de cărți pentru genul ${formattedGenre}`;

  get(dbRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const book = childSnapshot.val();
          // console.log(book);
          console.log(
            normalizeDiacritics(book.genre).toLowerCase().replace(/\s+/g, "-")
          );
          if (
            normalizeDiacritics(book.genre) &&
            normalizeDiacritics(book.genre)
              .toLowerCase()
              .replace(/\s+/g, "-") === genre
          ) {
            const bookElement = document.createElement("div");
            bookElement.className = "book";
            bookElement.innerHTML = `
                        <img src="${book.coverUrl}" alt="${book.title} Cover" class="book-cover">
                        <h3>${book.title}</h3>
                        <p>${book.author}</p>
                        <a href="bookdetails.html?bookId=${childSnapshot.key}" class="read-more-button">Detalii carte</a>
                    `;
            booksContainer.appendChild(bookElement);
          }
        });
      } else {
        booksContainer.innerHTML = "<p>No books found for this genre.</p>";
      }
    })
    .catch((error) => {
      console.error("Error loading books:", error);
      booksContainer.innerHTML = `<p>Error loading books: ${error.message}</p>`;
    });

  document.querySelectorAll(".book h3, .book p").forEach((element) => {
    if (element.innerText.length > 16) {
      element.style.fontSize = "14px";
    } else {
      element.style.fontSize = "16px";
    }
  });
});
