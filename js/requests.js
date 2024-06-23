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
  getDatabase,
  getAuth,
  signOut
} from "../src/firebaseConfig.js";

function encodeEmail(email) {
  return email.replace(/\./g, ","); 
}

function toggleAuthButtons(user) {
  const loginLink = document.getElementById("linkLogin");
  const logoutLink = document.getElementById("linkLogout");

  if (user) {
    if (loginLink) loginLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "block";
  } else {
    if (loginLink) loginLink.style.display = "block";
    if (logoutLink) logoutLink.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const userMenu = document.getElementById("userDropdown");
  const userIcon = document.getElementById("userPhoto");
  const linkLogout = document.getElementById("linkLogout");

  if (userIcon) {
    userIcon.addEventListener("click", () => {
      userMenu.style.display =
        userMenu.style.display === "flex" ? "none" : "flex";
    });
  }

  if (linkLogout) {
    linkLogout.addEventListener("click", (event) => {
      event.preventDefault();
      const auth = getAuth();
      signOut(auth)
        .then(() => {
          console.log("User logged out");
          toggleAuthButtons(null);
          console.log("Redirecting to ../index.html");
          window.location.href = "../index.html";
        })
        .catch((error) => {
          console.error("Logout error", error);
        });
    });
  }
});

async function displayApprovalRequests() {
  const requestsContainer = document.getElementById("requestsContainer");
  const approvalRequestsRef = ref(database, "approval_requests");

  try {
    const snapshot = await get(approvalRequestsRef);
    if (snapshot.exists()) {
      const requests = snapshot.val();
      requestsContainer.innerHTML = ""; 
      for (const requestId in requests) {
        const request = requests[requestId];
        const requestElement = document.createElement("div");
        requestElement.className = "request";
        requestElement.innerHTML = `
        <div class="request-details">
          <h2>${request.title}</h2>
          <p><strong>Autor:</strong> ${request.author}</p>
          <p><strong>Email:</strong> ${request.email}</p>
          <p><strong>PDF:</strong> <a href="${
            request.pdfUrl
          }" target="_blank">Citește PDF</a></p>
          <p><strong>Copertă:</strong> <a href="${
            request.coverUrl
          }" target="_blank">Vizualizează Copertă</a></p>
          <p><strong>Timestamp:</strong> ${new Date(
            request.timestamp
          ).toLocaleString()}</p>
        </div>
        <div class="buttons">
          <button class="approve-btn" onclick="approveRequest('${requestId}', '${
          request.title
        }', '${request.author}', '${request.pdfUrl}', '${request.coverUrl}', '${
          request.email
        }')">Acceptă</button>
          <button class="reject-btn" onclick="rejectRequest('${requestId}', '${
          request.pdfUrl
        }', '${request.coverUrl}', '${request.email}')">Respinge</button>
        </div>
      `;
        requestsContainer.appendChild(requestElement);
      }
    } else {
      requestsContainer.innerHTML = "<p>No approval requests found.</p>";
    }
  } catch (error) {
    console.error("Error fetching approval requests:", error);
    requestsContainer.innerHTML =
      "<p>Error loading approval requests. Please try again later.</p>";
  }
}

async function displayEditRequests() {
  const editRequestsContainer = document.getElementById("editRequestsContainer");
  const editRequestsRef = ref(database, "edit_requests");

  try {
    const snapshot = await get(editRequestsRef);
    if (snapshot.exists()) {
      const requests = snapshot.val();
      editRequestsContainer.innerHTML = ""; 

      const sortedRequests = Object.entries(requests).sort(
        (a, b) => b[1].timestamp - a[1].timestamp
      );

      sortedRequests.forEach(([requestId, request]) => {
        const requestElement = document.createElement("div");
        requestElement.className = "request";
        requestElement.innerHTML = `
          <div class="request-details">
            <h2>${request.bookTitle}</h2>
            <p><strong>Autor:</strong> ${request.bookAuthor}</p>
            <p><strong>Email:</strong> ${request.userEmail}</p>
            <p><strong>Timestamp:</strong> ${new Date(
              request.timestamp
            ).toLocaleString()}</p>
          </div>
          <div class="buttons">
            <button class="approve-btn" onclick="approveEditRequest('${requestId}', '${
          request.bookId
        }', '${request.userEmail}')">Acceptă</button>
            <button class="reject-btn" onclick="rejectEditRequest('${requestId}', '${
          request.userEmail
        }')">Respinge</button>
          </div>
        `;
        editRequestsContainer.appendChild(requestElement);
      });
    } else {
      editRequestsContainer.innerHTML =
        "<p>Nu există cereri de editare momentan.</p>";
    }
  } catch (error) {
    console.error("Error fetching edit requests:", error);
    editRequestsContainer.innerHTML =
      "<p>Eroare la încărcarea cererilor. Încercați mai târziu.</p>";
  }
}

async function approveEditRequest(requestId, bookId, userEmail) {
  try {
    const editRequestRef = ref(database, `edit_requests/${requestId}`);
    await update(editRequestRef, { status: "approved" });

    const encodedEmail = encodeEmail(userEmail);

    const userEditRef = ref(
      database,
      `user_edit_flags/${encodedEmail}/${bookId}`
    );
    await set(userEditRef, true);

    const canEditFlag = await get(userEditRef);
    console.log(
      `Verification in approval page: canEdit_${bookId} = ${canEditFlag.val()}`
    );

    await remove(editRequestRef);

    displayEditRequests();
  } catch (error) {
    console.error("Error approving edit request:", error);
    alert("Error approving edit request. Please try again later.");
  }
}

async function rejectEditRequest(requestId, userEmail) {
  try {
    const editRequestRef = ref(database, `edit_requests/${requestId}`);
    await update(editRequestRef, { status: "rejected" });

    await remove(editRequestRef);
    displayEditRequests();
  } catch (error) {
    console.error("Error rejecting edit request:", error);
    alert("Error rejecting edit request. Please try again later.");
  }
}

async function approveRequest(
  requestId,
  title,
  author,
  pdfUrl,
  coverUrl,
  userEmail
) {
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

    const requestRef = ref(database, `approval_requests/${requestId}`);
    await update(requestRef, { status: "approved" });
    await remove(requestRef);
    showPopup("Cerere aprobată! Mesaj trimis către utilizator.");
    displayApprovalRequests();
  } catch (error) {
    showPopup("Eroare la aprobare cerere: " + error.message);
  }
}

async function rejectRequest(requestId, pdfUrl, coverUrl, userEmail) {
  try {
    const pdfRefPending = storageRef(storage, pdfUrl);
    const coverRefPending = storageRef(storage, coverUrl);

    await deleteObject(pdfRefPending);
    await deleteObject(coverRefPending);

    const requestRef = ref(database, `approval_requests/${requestId}`);
    await update(requestRef, { status: "rejected" });
    await remove(requestRef);

    displayApprovalRequests();
  } catch (error) {
    console.error("Error rejecting request:", error);
    alert("Error rejecting request. Please try again later.");
  }
}

onAuthStateChanged(auth, async (user) => {
  toggleAuthButtons(user);
  const loginLink = document.getElementById("linkLogin");
  const logoutLink = document.getElementById("linkLogout");
  if (user) {
    const userId = user.uid;
    const userRef = ref(getDatabase(), "users/" + userId);
    document.getElementById("forum").style.display = "block";
    document.getElementById("menuBiblioteca").style.display = "block";
    
    if (loginLink) loginLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "block";

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
    if (loginLink) loginLink.style.display = "block";
    if (logoutLink) logoutLink.style.display = "none";
    document.body.innerHTML =
      "<h1>Access Denied</h1><p>You must be logged in to view this page.</p>";
    document.getElementById("username").textContent = "Guest";
    document.getElementById("adminPanel").style.display = "none";
  }
});

window.approveEditRequest = approveEditRequest;
window.rejectEditRequest = rejectEditRequest;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;

function showPopup(message) {
  const popup = document.getElementById("uploadPopup");
  const overlay = document.getElementById("overlay");
  document.getElementById("uploadMessage").textContent = message;
  popup.style.display = "block";
  overlay.style.display = "block";
}

function closePopup() {
  document.getElementById("uploadPopup").style.display = "none";
  document.getElementById("overlay").style.display = "none";
}
