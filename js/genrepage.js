import {
  getDatabase,
  database,
  ref,
  onValue,
  update,
} from "../src/firebaseConfig.js";

const booksRef = ref(database, "books");

document.addEventListener("DOMContentLoaded", () => {
  loadBooks();
});

function convertTextToHTML(text) {
    return text.replace(/\n/g, '<br>').replace(/  /g, ' &nbsp;');
}

function loadBooks(query = "") {
  onValue(booksRef, (snapshot) => {
    const booksContainer = document.getElementById("booksContainer");
    booksContainer.innerHTML = ""; 
    snapshot.forEach((childSnapshot) => {
      const book = childSnapshot.val();
      if (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      ) {
        const bookElement = document.createElement("div");
        bookElement.innerHTML = `
                <h3>${book.title}</h3>
                <h4>${book.author}</h4>
                    <p>Genre: <select id="genre-${childSnapshot.key}">
                        <option value="${book.genre}" selected>${
          book.genre
        }</option>
                        <option value="Acțiune și aventură">Acțiune și aventură</option>
                        <option value="Clasic">Clasic</option>
                        <option value="Bandă Desenată/Roman Grafic">Bandă Desenată/Roman Grafic</option>
                        <option value="Mister">Mister</option>
                        <option value="Basm">Basm</option>
                        <option value="Ficțiune istorică">Ficțiune istorică</option>
                        <option value="Groază">Groază</option>
                        <option value="Ficțiune literară">Ficțiune literară</option>
                        <option value="Romantism">Romantism</option>
                        <option value="Science Fiction">Science Fiction</option>
                        <option value="Nuvelă">Nuvelă</option>
                        <option value="Thriller">Thriller</option>
                        <option value="Biografie/Autobiografie">Biografie/Autobiografie</option>
                        <option value="Culinar">Culinar</option>
                        <option value="Istorie">Istorie</option>
                        <option value="Poezie">Poezie</option>
                    </select></p>
                    <p>Description: <textarea id="description-${
                      childSnapshot.key
                    }">${book.description || ""}</textarea></p>
                    <button class='save-details-btn' data-bookid='${
                      childSnapshot.key
                    }'>Save Changes</button>
                `;
        booksContainer.appendChild(bookElement);
      }
    });
    const saveButtons = booksContainer.querySelectorAll(".save-details-btn");
    saveButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const bookId = button.getAttribute("data-bookid");
        saveDetails(bookId);
      });
    });
  });
}

function saveDetails(bookId) {
  const genreSelect = document.getElementById(`genre-${bookId}`);
  const descriptionText = document.getElementById(`description-${bookId}`);
  const updates = {
    genre: genreSelect.value,
    description: convertTextToHTML(descriptionText.value),
  };
  const bookRef = ref(database, `books/${bookId}`);
  update(bookRef, updates)
    .then(() => {
      alert("Details updated successfully!");
    })
    .catch((error) => {
      console.error("Error updating details:", error);
      alert("Failed to update details. See console for errors.");
    });
}

document.getElementById("searchButton").addEventListener("click", function () {
  const searchQuery = document
    .getElementById("searchInput")
    .value.toLowerCase();
  if (searchQuery === "") {
    loadBooks();
  } else {
    loadBooks(searchQuery);
  }
});


document.getElementById("searchInput").addEventListener("input", function () {
  const searchQuery = document
    .getElementById("searchInput")
    .value.toLowerCase();
  if (searchQuery === "") {
    loadBooks();
  }
});
