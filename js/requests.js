import {
  auth,
  storage,
  storageRef,
  getDownloadURL,
  deleteObject,
  uploadBytes,
  database,
  ref,
  get,
  set,
  remove,
  update,
  onAuthStateChanged,
  getDatabase
} from "../src/firebaseConfig.js";

function encodeEmail(email) {
  return email.replace(/\./g, ','); // Replace dots with commas
}

async function displayApprovalRequests() {
  const requestsContainer = document.getElementById("requestsContainer");
  const approvalRequestsRef = ref(database, "approval_requests");

  try {
    const snapshot = await get(approvalRequestsRef);
    if (snapshot.exists()) {
      const requests = snapshot.val();
      requestsContainer.innerHTML = ""; // Curăță cererile existente
      for (const requestId in requests) {
        const request = requests[requestId];
        const requestElement = document.createElement("div");
        requestElement.className = "request";
        requestElement.innerHTML = `
        <div class="request-details">
          <h2>${request.title}</h2>
          <p><strong>Autor:</strong> ${request.author}</p>
          <p><strong>Email:</strong> ${request.email}</p>
          <p><strong>PDF:</strong> <a href="${request.pdfUrl}" target="_blank">Citește PDF</a></p>
          <p><strong>Copertă:</strong> <a href="${request.coverUrl}" target="_blank">Vizualizează Copertă</a></p>
          <p><strong>Timestamp:</strong> ${new Date(request.timestamp).toLocaleString()}</p>
        </div>
        <div class="buttons">
          <button class="approve-btn" onclick="approveRequest('${requestId}', '${request.title}', '${request.author}', '${request.pdfUrl}', '${request.coverUrl}', '${request.email}')">Acceptă</button>
          <button class="reject-btn" onclick="rejectRequest('${requestId}', '${request.pdfUrl}', '${request.coverUrl}', '${request.email}')">Respinge</button>
        </div>
      `;
        requestsContainer.appendChild(requestElement);
      }
    } else {
      requestsContainer.innerHTML = "<p>No approval requests found.</p>";
    }
  } catch (error) {
    console.error("Error fetching approval requests:", error);
    requestsContainer.innerHTML = "<p>Error loading approval requests. Please try again later.</p>";
  }
}

// Funcția pentru a afișa cererile de editare
async function displayEditRequests() {
  const editRequestsContainer = document.getElementById("editRequestsContainer");
  const editRequestsRef = ref(database, "edit_requests");

  try {
    const snapshot = await get(editRequestsRef);
    if (snapshot.exists()) {
      const requests = snapshot.val();
      editRequestsContainer.innerHTML = ""; // Curăță cererile existente
      
      // Convertește obiectul cererilor într-un array și sortează după timestamp
      const sortedRequests = Object.entries(requests).sort((a, b) => b[1].timestamp - a[1].timestamp);

      // Iterează peste cererile sortate și creează elemente
      sortedRequests.forEach(([requestId, request]) => {
        const requestElement = document.createElement("div");
        requestElement.className = "request";
        requestElement.innerHTML = `
          <div class="request-details">
            <h2>${request.bookTitle}</h2>
            <p><strong>Autor:</strong> ${request.bookAuthor}</p>
            <p><strong>Email:</strong> ${request.userEmail}</p>
            <p><strong>Timestamp:</strong> ${new Date(request.timestamp).toLocaleString()}</p>
          </div>
          <div class="buttons">
            <button class="approve-btn" onclick="approveEditRequest('${requestId}', '${request.bookId}', '${request.userEmail}')">Approve</button>
            <button class="reject-btn" onclick="rejectEditRequest('${requestId}', '${request.userEmail}')">Reject</button>
          </div>
        `;
        editRequestsContainer.appendChild(requestElement);
      });
    } else {
      editRequestsContainer.innerHTML = "<p>No edit requests found.</p>";
    }
  } catch (error) {
    console.error("Error fetching edit requests:", error);
    editRequestsContainer.innerHTML = "<p>Error loading edit requests. Please try again later.</p>";
  }
}

// Funcția pentru aprobarea cererilor de editare
async function approveEditRequest(requestId, bookId, userEmail) {
  try {
    // Set the status of the request to approved
    const editRequestRef = ref(database, `edit_requests/${requestId}`);
    await update(editRequestRef, { status: 'approved' });

    // Encode the email to use it in the Firebase path
    const encodedEmail = encodeEmail(userEmail);

    // Mark the book as editable for the user in Firebase
    const userEditRef = ref(database, `user_edit_flags/${encodedEmail}/${bookId}`);
    await set(userEditRef, true);

    // Verify the flag is set correctly
    const canEditFlag = await get(userEditRef);
    console.log(`Verification in approval page: canEdit_${bookId} = ${canEditFlag.val()}`);

    await remove(editRequestRef); // Delete the request after approval

    // Redisplay requests after update
    displayEditRequests();
  } catch (error) {
    console.error("Error approving edit request:", error);
    alert("Error approving edit request. Please try again later.");
  }
}



// Funcția pentru respingerea cererilor de editare
async function rejectEditRequest(requestId, userEmail) {
  try {
    // Setează statusul cererii ca respins
    const editRequestRef = ref(database, `edit_requests/${requestId}`);
    await update(editRequestRef, { status: 'rejected' });

    await remove(editRequestRef); // Șterge cererea

    displayEditRequests();
  } catch (error) {
    console.error("Error rejecting edit request:", error);
    alert("Error rejecting edit request. Please try again later.");
  }
}

// Funcția pentru aprobarea cererilor de încărcare
async function approveRequest(requestId, title, author, pdfUrl, coverUrl, userEmail) {
  try {
    const formattedTitle = `${title}`.replace(/\s+/g, "_").toLowerCase();
    const pdfRefPending = storageRef(storage, pdfUrl);
    const coverRefPending = storageRef(storage, coverUrl);
    const pdfRef = storageRef(storage, `pdf/${formattedTitle}.pdf`);
    const coverRef = storageRef(storage, `covers/${formattedTitle}.jpg`);

    const pdfBlob = await fetch(pdfUrl).then((res) => res.blob());
    const coverBlob = await fetch(coverUrl).then((res) => res.blob());

    await uploadBytes(pdfRef, pdfBlob);
    const newPdfUrl = await getDownloadURL(pdfRef);
    await deleteObject(pdfRefPending);

    await uploadBytes(coverRef, coverBlob);
    const newCoverUrl = await getDownloadURL(coverRef);
    await deleteObject(coverRefPending);

    const bookId = formattedTitle;
    const booksRef = ref(database, `books/${bookId}`);
    await set(booksRef, {
      author: author,
      title: title,
      pdfUrl: newPdfUrl,
      coverUrl: newCoverUrl,
    });

    // Update status to approved before removal
    const requestRef = ref(database, `approval_requests/${requestId}`);
    await update(requestRef, { status: "approved" });
    await remove(requestRef);

    // Reafișează cererile
    displayApprovalRequests();
  } catch (error) {
    console.error("Error approving request:", error);
    alert("Error approving request. Please try again later.");
  }
}

// Funcția pentru respingerea cererilor de încărcare
async function rejectRequest(requestId, pdfUrl, coverUrl, userEmail) {
  try {
    // Obține referințele de stocare
    const pdfRefPending = storageRef(storage, pdfUrl);
    const coverRefPending = storageRef(storage, coverUrl);

    // Șterge fișierele PDF și coperta
    await deleteObject(pdfRefPending);
    await deleteObject(coverRefPending);

    // Actualizează statusul la rejected înainte de ștergere
    const requestRef = ref(database, `approval_requests/${requestId}`);
    await update(requestRef, { status: "rejected" });
    await remove(requestRef);

    // Reafișează cererile
    displayApprovalRequests();
  } catch (error) {
    console.error("Error rejecting request:", error);
    alert("Error rejecting request. Please try again later.");
  }
}

// Verifică dacă un utilizator este conectat și afișează cererile de aprobare și cererile de editare
onAuthStateChanged(auth, async (user) => {
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
            displayApprovalRequests();
            displayEditRequests();
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
    console.log(`User logged in: ${user.uid}`);
  } else {
    document.body.innerHTML =
      "<h1>Access Denied</h1><p>You must be logged in to view this page.</p>";
    document.getElementById("username").textContent = "Guest";
    document.getElementById("adminPanel").style.display = "none";
  }
});

// Expose the approveEditRequest and rejectEditRequest functions to the global scope so they can be used in the onclick handlers
window.approveEditRequest = approveEditRequest;
window.rejectEditRequest = rejectEditRequest;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;

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
