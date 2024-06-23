import {
  database,
  ref,
  onValue,
  update,
  auth,
  onAuthStateChanged,
  push,
  set,
  get
} from "../src/firebaseConfig.js";

const booksRef = ref(database, "books");
const editRequestsRef = ref(database, "edit_requests");

let isAdmin = false;

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      checkUserRole(user.uid);
    } else {
      loadBooks(false);
    }
  });

  const popup = document.getElementById("popupMessage");
  const closeButton = document.querySelector(".close-button");

  if (closeButton) {
    closeButton.onclick = function() {
      popup.style.display = "none";
    }
  }

  window.onclick = function(event) {
    if (event.target == popup) {
      popup.style.display = "none";
    }
  }
});

function checkUserRole(userId) {
  const userRef = ref(database, `users/${userId}`);
  onValue(userRef, (snapshot) => {
    const userRole = snapshot.val().role;
    isAdmin = userRole === 'admin';
    loadBooks(isAdmin);
  });
}


function loadBooks(isAdmin = false, query = "") {
  onValue(booksRef, async (snapshot) => {
    const booksContainer = document.getElementById("booksContainer");
    booksContainer.innerHTML = ""; 
    const user = auth.currentUser;
    const userEmail = user ? user.email : null;

  
    if (!snapshot.exists()) {
      console.error("No data available");
      return;
    }

    const booksData = snapshot.val();
    if (!booksData) {
      console.error("Books data is null or undefined");
      return;
    }

    for (const bookId in booksData) {
      const book = booksData[bookId];
      if (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      ) {
        const bookElement = document.createElement("div");
        bookElement.classList.add("book-container");
        bookElement.innerHTML = `
          <h3>${book.title}</h3>
          <h4>${book.author}</h4>
          <p>Genre: <select id="genre-${bookId}" disabled>
            <option value="${book.genre || ""}" selected>${book.genre || "Select genre"}</option>
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
          <p>Description: <textarea id="description-${bookId}" disabled>${book.description || ""}</textarea></p>
          <button class='edit-details-btn' data-bookid='${bookId}' style='display: none;'>Edit</button>
          <button class='save-details-btn' data-bookid='${bookId}' style='display: none;'>Save Changes</button>
        `;
        booksContainer.appendChild(bookElement);

        if (isAdmin) {
          bookElement.querySelector(`#genre-${bookId}`).disabled = false;
          bookElement.querySelector(`#description-${bookId}`).disabled = false;
          bookElement.querySelector('.save-details-btn').style.display = 'block';
        } else if (userEmail) {
          const canEdit = await canUserEditBook(bookId, userEmail);
          if (canEdit) {
            bookElement.querySelector(`#genre-${bookId}`).disabled = false;
            bookElement.querySelector(`#description-${bookId}`).disabled = false;
            bookElement.querySelector('.save-details-btn').style.display = 'block';
          } else {
            const editButton = bookElement.querySelector('.edit-details-btn');
            editButton.style.display = 'block';
            editButton.addEventListener("click", () => {
              requestEdit(bookId);
            });
          }
        }
      }
    }

    const saveButtons = booksContainer.querySelectorAll(".save-details-btn");
    saveButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const bookId = button.getAttribute("data-bookid");
        saveDetails(bookId);
      });
    });
  });
}

async function canUserEditBook(bookId, userEmail) {
  
  const encodedEmail = encodeEmail(userEmail);

  const userEditRef = ref(database, `user_edit_flags/${encodedEmail}/${bookId}`);
  return get(userEditRef)
    .then((snapshot) => {
      const canEdit = snapshot.exists() && snapshot.val() === true;
      console.log(`canUserEditBook(${bookId}): ${canEdit}`);
      return canEdit;
    })
    .catch((error) => {
      console.error(`Error checking edit flag for book ${bookId}:`, error);
      return false;
    });
}

function encodeEmail(email) {
  return email.replace(/\./g, ','); 
}

function saveDetails(bookId) {
  const genreSelect = document.getElementById(`genre-${bookId}`);
  const descriptionTextArea = document.getElementById(`description-${bookId}`);
  const updates = {
    genre: genreSelect.value,
    description: descriptionTextArea.value,
  };
  const bookRef = ref(database, `books/${bookId}`);
  update(bookRef, updates)
    .then(async () => {
      showPopupMessage("Details updated successfully!");
      const user = auth.currentUser;
      const encodedEmail = encodeEmail(user.email);
      const userEditRef = ref(database, `user_edit_flags/${encodedEmail}/${bookId}`);
      await set(userEditRef, false);
      console.log(`Flag reset for book ${bookId}: false`);
      loadBooks(isAdmin);
    })
    .catch((error) => {
      console.error("Error updating details:", error);
      showPopupMessage("Failed to update details. See console for errors.");
    });
}

function requestEdit(bookId) {
  const user = auth.currentUser;
  const bookRef = ref(database, `books/${bookId}`);
  
  onValue(bookRef, (snapshot) => {
    const book = snapshot.val();
    const newRequestRef = push(editRequestsRef);
    const request = {
      bookId: bookId,
      bookTitle: book.title,
      bookAuthor: book.author,
      userEmail: user.email,
      timestamp: Date.now(),
      status: 'pending',
      type: 'edit'
    };
    set(newRequestRef, request)
      .then(() => {
        showPopupMessage("Edit request sent successfully!");
      })
      .catch((error) => {
        console.error("Error sending edit request:", error);
        showPopupMessage("Failed to send edit request. See console for errors.");
      });
  }, {
    onlyOnce: true 
  });
}

function showPopupMessage(message) {
  const popup = document.getElementById("popupMessage");
  const uploadMessage = document.getElementById("uploadMessage");
  uploadMessage.textContent = message;
  popup.style.display = "block";
}

document.getElementById("searchButton").addEventListener("click", function () {
  const searchQuery = document.getElementById("searchInput").value.toLowerCase();
  console.log(`Search query: ${searchQuery}`);
  loadBooks(isAdmin, searchQuery);
});

document.getElementById("searchInput").addEventListener("input", function () {
  const searchQuery = document.getElementById("searchInput").value.toLowerCase();
  console.log(`Search query: ${searchQuery}`);
  loadBooks(isAdmin, searchQuery);
});
