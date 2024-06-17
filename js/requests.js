import {
  auth,
  storage,
  storageRef,
  getDownloadURL,
  deleteObject,
  uploadBytes,
  database,
  getDatabase,
  ref,
  get,
  set,
  remove,
  onAuthStateChanged,
} from "../src/firebaseConfig.js";

document
  .getElementById("linkLogin")
  .addEventListener("click", function (event) {
    event.preventDefault();
    window.location.href = "../html/login.html";
  });

async function displayApprovalRequests() {
  const requestsContainer = document.getElementById("requestsContainer");
  const approvalRequestsRef = ref(database, "approval_requests");

  try {
    const snapshot = await get(approvalRequestsRef);
    if (snapshot.exists()) {
      const requests = snapshot.val();
      requestsContainer.innerHTML = ""; // Clear existing requests
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

    // Update status to approved before removal
    const requestRef = ref(database, `approval_requests/${requestId}`);
    await set(requestRef, {
      status: "approved",
      email: userEmail,
      title,
      author,
    });
    await remove(requestRef);

    // Refresh the request list
    displayApprovalRequests();
  } catch (error) {
    console.error("Error approving request:", error);
    alert("Error approving request. Please try again later.");
  }
}

// Function to reject a request
async function rejectRequest(requestId, pdfUrl, coverUrl, userEmail) {
  try {
    // Get the storage refs
    const pdfRefPending = storageRef(storage, pdfUrl);
    const coverRefPending = storageRef(storage, coverUrl);

    // Delete PDF and cover files
    await deleteObject(pdfRefPending);
    await deleteObject(coverRefPending);

    // Update status to rejected before removal
    const requestRef = ref(database, `approval_requests/${requestId}`);
    await set(requestRef, {
      status: "rejected",
      email: userEmail,
      title,
      author,
    });
    await remove(requestRef);

    // Refresh the request list
    displayApprovalRequests();
  } catch (error) {
    console.error("Error rejecting request:", error);
    alert("Error rejecting request. Please try again later.");
  }
}

// Check if a user is logged in and display approval requests
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
    displayApprovalRequests();
  } else {
    document.body.innerHTML =
      "<h1>Access Denied</h1><p>You must be logged in to view this page.</p>";
    document.getElementById("username").textContent = "Guest";
    document.getElementById("adminPanel").style.display = "none";
  }
});

// Display approval requests on page load if the user is already logged in
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");
  const userMenu = document.getElementById("userDropdown");
  const userIcon = document.getElementById("userPhoto");
  const linkLogout = document.getElementById("linkLogout");

  userIcon.addEventListener("click", () => {
    userMenu.style.display =
      userMenu.style.display === "flex" ? "none" : "flex";
  });

  const currentUser = auth.currentUser;
  if (currentUser) {
    displayApprovalRequests();
  } else {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        displayApprovalRequests();
      } else {
        document.body.innerHTML =
          "<h1>Access Denied</h1><p>You must be logged in to view this page.</p>";
      }
    });
  }
});

// Expose the approveRequest and rejectRequest functions to the global scope so they can be used in the onclick handlers
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
