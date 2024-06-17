import {
  storage,
  uploadBytes,
  getDownloadURL,
  storageRef,
  set,
  ref as databaseRef,
  getAuth,
  database,
  get,
  push
} from "../src/firebaseConfig.js";

// Function to parse the filename
function parseFilename(filename) {
  const cleanedFilename = filename.replace(".pdf", "");
  const dashIndex = cleanedFilename.indexOf(" - ");

  if (dashIndex === -1) {
    console.error('Filename format incorrect, should be "Author - Title.pdf"');
    return { author: "Unknown", title: "Untitled", valid: false };
  }

  const author = cleanedFilename.substring(0, dashIndex);
  const title = cleanedFilename.substring(dashIndex + 3); // +3 to remove ' - ' part
  return { author, title, valid: true };
}

// Function to upload the book and cover
async function uploadBookAndCover(pdfFile, coverFile, userRole, userEmail) {
  const fileInfo = parseFilename(pdfFile.name);
  if (!fileInfo.valid) {
    showPopup('Formatul fișierului nu este corect! Ar trebui: "Autor - Titlul cărții.pdf"');
    clearInputs();
    return;
  }

  const storageLocation = userRole === "admin" ? "pdf" : "pending/pdf";
  const coverLocation = userRole === "admin" ? "covers" : "pending/covers";
  const pdfRef = storageRef(storage, `${storageLocation}/${pdfFile.name}`);
  const coverRef = storageRef(storage, `${coverLocation}/${coverFile.name}`);

  try {
    const pdfSnapshot = await uploadBytes(pdfRef, pdfFile);
    const pdfUrl = await getDownloadURL(pdfSnapshot.ref);
    const coverSnapshot = await uploadBytes(coverRef, coverFile);
    const coverUrl = await getDownloadURL(coverSnapshot.ref);
    const bookId = fileInfo.title.replace(/\s+/g, '_').toLowerCase();
    const booksRef = databaseRef(database, userRole === "admin" ? `books/${bookId}` : `pending_books/${bookId}`);
    await set(booksRef, {
      author: fileInfo.author,
      title: fileInfo.title,
      pdfUrl: pdfUrl,
      coverUrl: coverUrl,
    });
    console.log(`O nouă modificare în baza de date pentru ${bookId}`);
    if (userRole !== "admin") {
      await sendApprovalRequest(fileInfo.title, fileInfo.author, pdfUrl, coverUrl, userEmail);
      showPopup("Cerere trimisă către un administrator.");
    } else {
      showPopup("Carte încărcată cu succes!");
    }
    clearInputs();
  } catch (error) {
    showPopup("Eroare la încărcare: " + error.message);
    clearInputs();
  }
}

function handleFiles(userRole, userEmail) {
  const pdfInput = document.getElementById("fileInput");
  const coverInput = document.getElementById("coverInput");
  if (pdfInput.files.length > 0 && coverInput.files.length > 0) {
    uploadBookAndCover(pdfInput.files[0], coverInput.files[0], userRole, userEmail);
  } else {
    showPopup("Încărcați atât un fișier PDF, cât și o imagine de copertă!");
  }
}

function showPopup(message) {
  const popup = document.getElementById("uploadPopup");
  document.getElementById("uploadMessage").textContent = message;
  popup.style.display = "block";
}

function closePopup() {
  document.getElementById("uploadPopup").style.display = "none";
}

function clearInputs() {
  const pdfInput = document.getElementById("fileInput");
  const coverInput = document.getElementById("coverInput");
  pdfInput.value = ""; 
  coverInput.value = ""; 
}

// Function to send an approval request to the admin
async function sendApprovalRequest(title, author, pdfUrl, coverUrl, userEmail) {
  const approvalRequestsRef = databaseRef(database, "approval_requests");
  const newRequestRef = push(approvalRequestsRef);
  try {
    await set(newRequestRef, {
      title: title,
      author: author,
      pdfUrl: pdfUrl,
      coverUrl: coverUrl,
      email: userEmail, // Save user's email
      timestamp: Date.now()
    });
    console.log("Approval request sent.");
  } catch (error) {
    console.error("Error sending approval request:", error);
  }
}

// Function to check user's role from the database
async function checkUserRole(user) {
  const userRef = databaseRef(database, `users/${user.uid}`);
  try {
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      console.log(`User role found: ${userData.role}`);
      return { role: userData.role || "user", email: user.email }; // Include user's email
    } else {
      throw new Error("User data not found");
    }
  } catch (error) {
    console.error("Error checking user role:", error);
    throw error; 
  }
}

// Adding event listeners after the DOM has fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  const fileInput = document.getElementById("fileInput");
  const coverInput = document.getElementById("coverInput");
  const fileDragArea = document.getElementById("fileDragArea");
  const uploadButton = document.getElementById("uploadButton");

  fileDragArea.addEventListener("dragover", (event) => {
    event.preventDefault(); 
    fileDragArea.classList.add("drag-over");
  });

  fileDragArea.addEventListener("dragleave", () => {
    fileDragArea.classList.remove("drag-over");
  });

  fileDragArea.addEventListener("drop", (event) => {
    event.preventDefault();
    fileDragArea.classList.remove("drag-over");
    const files = event.dataTransfer.files; 
    if (files.length > 0) {
      fileInput.files = files; 
    }
  });

  fileInput.addEventListener("change", () => {
    console.log("File input change detected");
    getAuth().onAuthStateChanged(async (user) => {
      if (user) {
        console.log(`User logged in: ${user.uid}`);
        try {
          const { role, email } = await checkUserRole(user);
          console.log(`User role: ${role}`);
          handleFiles(role, email);
        } catch (error) {
          console.error("Error in file change event:", error);
          alert(error.message);
        }
      } else {
        alert("You must be logged in to upload files.");
      }
    });
  });

  uploadButton.addEventListener("click", () => {
    console.log("Upload button clicked");
    getAuth().onAuthStateChanged(async (user) => {
      if (user) {
        console.log(`User logged in: ${user.uid}`);
        try {
          const { role, email } = await checkUserRole(user);
          console.log(`User role: ${role}`);
          handleFiles(role, email);
        } catch (error) {
          console.error("Error in upload button click event:", error);
          alert(error.message);
        }
      } else {
        alert("You must be logged in to upload files.");
      }
    });
  });

  const closeButton = document.querySelector(".close-button");
  closeButton.addEventListener("click", closePopup);
});
