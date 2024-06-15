import {
  getAuth,
  updateProfile,
  deleteUser,
  getDatabase,
  ref,
  remove,
  updatePassword,
  update,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
} from "../src/firebaseConfig.js";

document.addEventListener("DOMContentLoaded", function () {
  const settingsForm = document.getElementById("settingsForm");
  const auth = getAuth();
  const database = getDatabase();

  function reauthenticate(currentPassword) {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    return reauthenticateWithCredential(user, credential);
  }

  settingsForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const userName = document.getElementById("userName").value;
    const email = document.getElementById("email").value;
    const newPassword = document.getElementById("newPassword").value;

    const user = auth.currentUser;

    if (userName) {
      updateProfile(user, {
        userName: userName,
      })
        .then(() => {
          console.log("Numele afișat actualizat cu succes.");
          return update(ref(database, "users/" + user.uid), {
            userName: userName,
          });
        })
        .then(() => {
          console.log("Numele utilizatorului actualizat și în baza de date.");
        })
        .catch((error) => {
          console.error("Eroare la actualizarea numelui afișat:", error);
        });
    }

    if (email || newPassword) {
      const currentPassword = prompt(
        "Please enter your current password for verification:"
      );

      reauthenticate(currentPassword)
        .then(() => {
          // Update email if specified
          if (email) {
            verifyBeforeUpdateEmail(user, email)
              .then(() => {
                console.log("Verification email sent to " + email);
              })
              .catch((error) => {
                console.error("Error updating email:", error);
              });
          }

          if (newPassword) {
            updatePassword(user, newPassword)
              .then(() => {
                console.log("Password updated successfully.");
              })
              .catch((error) => {
                console.error("Error updating password:", error);
              });
          }
        })
        .catch((error) => {
          console.error("Reauthentication failed:", error);
        });
    }
  });

  document
    .getElementById("deleteAccount")
    .addEventListener("click", function () {
      const user = auth.currentUser;
      const userId = user.uid;

      deleteUser(user)
        .then(() => {
          console.log("Contul de autentificare a fost șters cu succes.");

          const userRef = ref(database, "users/" + userId);
          remove(userRef)
            .then(() => {
              console.log(
                "Datele utilizatorului din baza de date au fost șterse cu succes."
              );
              window.location.href = "/index.html";
            })
            .catch((error) => {
              console.error(
                "Eroare la ștergerea datelor utilizatorului din baza de date:",
                error
              );
            });
        })
        .catch((error) => {
          console.error(
            "Eroare la ștergerea contului de autentificare:",
            error
          );
          alert("Nu s-a putut șterge contul: " + error.message);
        });
    });
});
