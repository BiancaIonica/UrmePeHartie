import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  database,
  ref,
  get,
  set,
  getAuth,
  sendPasswordResetEmail
} from "./src/firebaseConfig.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("#login");
  const registerForm = document.querySelector("#createAccount");
  const linkResetPassword = document.querySelector("#resetPassword");

  console.log(registerForm);
  console.log(loginForm);
  console.log(linkResetPassword);

  if (registerForm) {
    document
      .querySelector("#linkCreateAccount")
      .addEventListener("click", (e) => {
        e.preventDefault();
        loginForm.classList.add("form--hidden");
        registerForm.classList.remove("form--hidden");
      });
  }

  if (loginForm) {
    document.querySelector("#linkLogin").addEventListener("click", (e) => {
      e.preventDefault();
      loginForm.classList.remove("form--hidden");
      registerForm.classList.add("form--hidden");
    });
  }
 
  //const auth = getAuth();

  if (linkResetPassword) {
    linkResetPassword.addEventListener("submit", (e) => {
      e.preventDefault();
       const email = linkResetPassword.querySelector('input[type="email"]').value.trim();
       console.log(email);
       const closeButton = document.querySelector("#resetPasswordPopup .close-button");
       closeButton.addEventListener('click', closePopup);
      sendPasswordResetEmail(auth, email)
        .then(() => {
          console.log("Password reset email sent!");
          document.querySelector("#resetPasswordPopup").style.display = 'flex';
          document.querySelector("#resetPasswordMessage").textContent = "Email-ul de resetare a parolei a fost trimis. Verificați inbox-ul.";
        })
        .catch((error) => {
          console.error("Error on password reset:", error.message);
          document.querySelector("#resetPasswordPopup").style.display = 'flex';
          document.querySelector("#resetPasswordMessage").textContent = "Eroare la trimiterea email-ului de resetare a parolei. Încearcați din nou.";
        });
    });
  }
  function closePopup() {
    document.querySelector("#resetPasswordPopup").style.display = 'none';
  }

  //REGISTER

  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = registerForm
        .querySelector('input[type="email"]')
        .value.trim();
      const password = registerForm
        .querySelector('input[type="password"]')
        .value.trim();
      const userName = registerForm
        .querySelector('input[name="username"]')
        .value.trim();

      createUserWithEmailAndPassword(auth, email, password, userName)
        .then((userCredential) => {
          console.log("User created:", userCredential.user);

          set(ref(database, "users/" + userCredential.user.uid), {
            email: email,
            userName: userName,
          });
        })
        .catch((error) => {
          console.error("Error on user creation:", error.message);
        });
    });
  }

  //LOGIN

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const userInput = loginForm
        .querySelector('input[type="text"]')
        .value.trim();
      const password = loginForm
        .querySelector('input[type="password"]')
        .value.trim();

      //console.log(email, password);

      // Verify if the input is email
      function isEmail(input) {
        return input.includes("@");
      }

      function authenticateUser(email) {
        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            console.log("User logged in:", userCredential.user);
            window.location.href = '/index.html';
            const userRef = ref(database, `users/${userCredential.user.uid}`);
            get(userRef).then((snapshot) => {
              if (snapshot.exists()) {
                const userData = snapshot.val();
                if (userData.role === 'admin') {
                  localStorage.setItem('userRole', userData.role);
                  window.location.href = 'index.html'; 
                } else {
                  if(userData.role==='user')
                  {localStorage.setItem('userRole', userData.role);
                  window.location.href = 'index.html'; }
                  else {
                    console.log("Role is not set, setting default role to 'user'.");
                    set(ref(database, `users/${userCredential.user.uid}/role`), 'user');
                    localStorage.setItem('userRole', 'user');
                    window.location.href = 'index.html';
                  }
                }
              }
            });
          })
          .catch((error) => {
            console.error("Error on user login:", error.message);
          });
      }

      if (isEmail(userInput)) {
        authenticateUser(userInput);
      } else {
        // search for the relation between email adress and username in database
        //hard for optimization!!!!!!
        const usersRef = ref(database, "users");
        get(usersRef)
          .then((snapshot) => {
            let emailFound = null;
            snapshot.forEach((childSnapshot) => {
              const user = childSnapshot.val();
              if (user.userName === userInput) {
                emailFound = user.email;
              }
            });
            if (emailFound) {
              authenticateUser(emailFound);
            } else {
              console.error("Username not found");
            }
          })
          .catch((error) => {
            console.error("Error on user lookup:", error);
          });
      }
    });
  }
});
