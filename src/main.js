import {
  getDatabase,
  ref,
  get,
  child,
  auth,
  onAuthStateChanged,
  signOut,
  onValue
} from "./firebaseConfig.js";

document.getElementById("linkLogin").addEventListener("click", function (event) {
  event.preventDefault();
  window.location.href = "../html/login.html";
});

document.addEventListener("DOMContentLoaded", (event) => {
  const userMenu = document.getElementById('userDropdown');
  const userIcon = document.getElementById('userPhoto');
  const searchButton = document.querySelector(".search-btn");
  const linkLogout = document.getElementById("linkLogout");

  userIcon.addEventListener("click", () => {
    userMenu.style.display = (userMenu.style.display === 'flex') ? 'none' : 'flex';
  });

  const prevButton = document.querySelector('.carousel-button.prev');
  const nextButton = document.querySelector('.carousel-button.next');
  const carousel = document.querySelector('.carousel-container');

  prevButton.addEventListener('click', () => {
    carousel.scrollBy({
      left: -1000, // Adjust scroll amount to fit five items
      behavior: 'smooth'
    });
  });

  nextButton.addEventListener('click', () => {
    carousel.scrollBy({
      left: 1000, // Adjust scroll amount to fit five items
      behavior: 'smooth'
    });
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

  searchButton.addEventListener("click", () => {
    const searchInput = document.querySelector(".search-input").value;
    console.log(`Search for: ${searchInput}`);
    // window.location.href = `/search?query=${encodeURIComponent(searchInput)}`;
  });

  loadBooks();

  fetchBooks();
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

function loadBooks() {
  const dbRef = ref(getDatabase());
  get(child(dbRef, "books"))
    .then((snapshot) => {
      const booksAdded = {};
      let htmlContent = "";

      if (snapshot.exists()) {
        const books = [];

        // Gather all books into an array with their genre and timestamp
        snapshot.forEach((childSnapshot) => {
          const book = childSnapshot.val();
          book.id = childSnapshot.key;
          books.push(book);
        });

        // Sort books by timestamp to get the latest ones first
        books.sort((a, b) => b.timestamp - a.timestamp);

        books.forEach((book) => {
          if (!booksAdded[book.genre]) {
            htmlContent += `
              <div class="carousel-item book" data-book-id="${book.id}">
                <div class="book-cover-container">      
                  <img src="${book.coverUrl}" alt="${book.title} Cover" class="book-cover">
                  <div class="genre-label">${book.genre}</div>
                </div>
              </div>
            `;
            booksAdded[book.genre] = true;
          }
        });

        document.querySelector(".carousel-track").innerHTML = htmlContent;
        document.querySelector(".carousel-container").scrollLeft = 0;
        document.querySelector(".carousel-container").addEventListener("click", function (event) {
          if (event.target.classList.contains("book-cover")) {
            const bookDiv = event.target.closest(".book");
            const bookId = bookDiv.getAttribute("data-book-id");
            console.log(`Selected book ID: ${bookId}`);
            window.location.href = `../html/bookdetails.html?bookId=${encodeURIComponent(bookId)}`;
          }
        });
      } else {
        console.log("No data available");
        document.querySelector(".carousel-track").innerHTML = "<p>No books available.</p>";
      }
    })
    .catch((error) => {
      console.error("Failed to load books", error);
      document.querySelector(".carousel-track").innerHTML = `<p>Error loading books: ${error.message}</p>`;
    });
}

function fetchBooks() {
  const booksRef = ref(getDatabase(), 'books');
  onValue(booksRef, (snapshot) => {
    const booksData = [];
    snapshot.forEach((childSnapshot) => {
      const book = childSnapshot.val();
      book.id = childSnapshot.key;
      booksData.push(book);
    });
    console.log("Books data:", booksData);
    displayPopularCategories(booksData);
  });
}

function displayPopularCategories(booksData) {
  const favoriteGenres = new Map();

  booksData.forEach((book) => {
    const genre = book.genre;
    favoriteGenres.set(genre, (favoriteGenres.get(genre) || 0) + 1);
  });

  const sortedGenres = [...favoriteGenres.entries()].sort((a, b) => b[1] - a[1]);
  const displayedGenres = new Set();

  const popularCategoriesContainer = document.querySelector('.popular-categories-list');

  popularCategoriesContainer.innerHTML = '';

  sortedGenres.forEach(([genre, count], index) => {
    if (displayedGenres.size < 3 && !displayedGenres.has(genre)) {
      const book = booksData.find(b => b.genre === genre);
      const bookElement = document.createElement('div');
      bookElement.classList.add('popular-book-display');
      bookElement.innerHTML = `
        <div class="popular-book-cover-container" onclick="window.location.href='../html/booksbygenre.html?genre=${genre}'">
          <img src="${book.coverUrl}" alt="${book.title}" class="popular-book-cover">
          <p class="genre-label">${book.genre}</p>
          <div class="podium-position">${index + 1}</div>
        </div>
      `;
      popularCategoriesContainer.appendChild(bookElement);
      displayedGenres.add(genre);
    }
  });

  console.log("Displayed genres:", displayedGenres);
}
