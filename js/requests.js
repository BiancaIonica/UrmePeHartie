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
  onAuthStateChanged
} from "../src/firebaseConfig.js";

// Function to display approval requests
async function displayApprovalRequests() {
  const requestsContainer = document.getElementById("requestsContainer");
  const approvalRequestsRef = ref(database, "approval_requests");

  try {
    const snapshot = await get(approvalRequestsRef);
    if (snapshot.exists()) {
      const requests = snapshot.val();
      requestsContainer.innerHTML = ''; // Clear existing requests
      for (const requestId in requests) {
        const request = requests[requestId];
        const requestElement = document.createElement("div");
        requestElement.className = "request";
        requestElement.innerHTML = `
        <div class="request-details">
        <h2>${request.title}</h2>
        <p><strong>Author:</strong> ${request.author}</p>
        <p><strong>Email:</strong> ${request.email}</p>
        <p><strong>PDF:</strong> <a href="${request.pdfUrl}" target="_blank">View PDF</a></p>
        <p><strong>Cover:</strong> <a href="${request.coverUrl}" target="_blank">View Cover</a></p>
        <p><strong>Timestamp:</strong> ${new Date(request.timestamp).toLocaleString()}</p>
      </div>
      <div class="buttons">
        <button class="approve-btn" onclick="approveRequest('${requestId}', '${request.title}', '${request.author}', '${request.pdfUrl}', '${request.coverUrl}', '${request.email}')">Approve</button>
        <button class="reject-btn" onclick="rejectRequest('${requestId}', '${request.pdfUrl}', '${request.coverUrl}', '${request.email}')">Reject</button>
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

// Function to approve a request
async function approveRequest(requestId, title, author, pdfUrl, coverUrl, userEmail) {
  try {
    const formattedTitle = `${title}`.replace(/\s+/g, '_').toLowerCase();

    // Get the storage refs for pending files
    const pdfRefPending = storageRef(storage, pdfUrl);
    const coverRefPending = storageRef(storage, coverUrl);

    // Get the storage refs for final locations
    const pdfRef = storageRef(storage, `pdf/${formattedTitle}.pdf`);
    const coverRef = storageRef(storage, `covers/${formattedTitle}.jpg`);

    // Fetch PDF and cover blobs from pending locations
    const pdfBlob = await fetch(pdfUrl).then(res => res.blob());
    const coverBlob = await fetch(coverUrl).then(res => res.blob());

    // Move PDF file to final location
    await uploadBytes(pdfRef, pdfBlob);
    const newPdfUrl = await getDownloadURL(pdfRef);
    await deleteObject(pdfRefPending);

    // Move cover file to final location
    await uploadBytes(coverRef, coverBlob);
    const newCoverUrl = await getDownloadURL(coverRef);
    await deleteObject(coverRefPending);

    // Update database
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
    await set(requestRef, { status: 'approved', email: userEmail, title, author });
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
    await set(requestRef, { status: 'rejected', email: userEmail, title, author });
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
  if (user) {
    console.log(`User logged in: ${user.uid}`);
    displayApprovalRequests();
  } else {
    document.body.innerHTML = "<h1>Access Denied</h1><p>You must be logged in to view this page.</p>";
  }
});

// Display approval requests on page load if the user is already logged in
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  const currentUser = auth.currentUser;
  if (currentUser) {
    displayApprovalRequests();
  } else {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        displayApprovalRequests();
      } else {
        document.body.innerHTML = "<h1>Access Denied</h1><p>You must be logged in to view this page.</p>";
      }
    });
  }
});

// Expose the approveRequest and rejectRequest functions to the global scope so they can be used in the onclick handlers
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
