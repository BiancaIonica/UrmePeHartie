import {
  getDatabase,
  ref,
  get,
  child,
  remove,
  update,
  onAuthStateChanged,
  auth,
} from "../src/firebaseConfig.js";

document.addEventListener("DOMContentLoaded", function () {
  const dbRef = ref(getDatabase());
  const usersRef = child(dbRef, "users");
  const userMenu = document.getElementById("userDropdown");
  const userIcon = document.getElementById("userPhoto");
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
  function loadDataIntoTable(userType, data, userId) {
    const table = document
      .getElementById(userType === "admin" ? "adminsTable" : "usersTable")
      .getElementsByTagName("tbody")[0];
    const row = table.insertRow();
    row.insertCell(0).textContent = data.userName || "N/A";
    row.insertCell(1).textContent = data.email || "N/A";
    row.insertCell(2).textContent = data.role || "N/A";

    const actionsCell = row.insertCell(3);
    const editButton = document.createElement("button");
    editButton.textContent = "Editare Rol";
    editButton.onclick = function () {
      openEditRoleModal(userId, data.role);
    };
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Șterge";
    deleteButton.onclick = function () {
      deleteUser(userId);
    };
    actionsCell.appendChild(deleteButton);
  }

  get(usersRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const userId = childSnapshot.key;
          const userData = childSnapshot.val();
          const userType = userData.role === "admin" ? "admin" : "user";
          loadDataIntoTable(userType, userData, userId);
        });
      } else {
        console.log("No users found");
      }
    })
    .catch((error) => {
      console.error("Failed to load user data:", error);
    });

  // Modal controls
  const modal = document.getElementById("editRoleModal");
  const span = document.getElementsByClassName("close")[0];
  const form = document.getElementById("editRoleForm");

  span.onclick = function () {
    modal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  form.onsubmit = function (event) {
    event.preventDefault();
    const userId = document.getElementById("userIdForRoleChange").value;
    const newRole = document.getElementById("roleSelect").value;
    const userRef = ref(getDatabase(), "users/" + userId);

    update(userRef, { role: newRole })
      .then(() => {
        console.log("Rol actualizat cu succes!");
        modal.style.display = "none";
        location.reload(); // Reîncarcă pagina pentru a reflecta modificările
      })
      .catch((error) => {
        console.error("Eroare la actualizarea rolului:", error);
      });
  };

  function openEditRoleModal(userId, currentRole) {
    document.getElementById("userIdForRoleChange").value = userId;
    document.getElementById("roleSelect").value = currentRole;
    modal.style.display = "block";
  }

  function deleteUser(userId) {
    const userRef = ref(getDatabase(), "users/" + userId);
    remove(userRef)
      .then(() => {
        console.log("Utilizator șters cu succes.");
        window.location.reload();
      })
      .catch((error) => {
        console.error("Eroare la ștergerea utilizatorului:", error);
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
