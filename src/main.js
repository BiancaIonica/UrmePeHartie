document.addEventListener("DOMContentLoaded", () => {
    // Grab the form elements by their IDs
    const loginForm = document.querySelector("#login");
    const createAccountForm = document.querySelector("#createAccount");

    // Listen for clicks on the "Create account" link
    document.querySelector("#linkCreateAccount").addEventListener("click", (e) => {
        e.preventDefault(); // Prevent the default anchor action
        loginForm.classList.add("form--hidden"); // Hide the login form
        createAccountForm.classList.remove("form--hidden"); // Show the create account form
    });

  
    document.querySelector("#linkLogin").addEventListener("click", (e) => {
        e.preventDefault(); 
        loginForm.classList.remove("form--hidden"); 
        createAccountForm.classList.add("form--hidden"); 
    });

    loginForm.addEventListener("submit", e=>{
        e.preventDefault();

        //perform ajax/fetch login

        setFormMessage(loginForm, "error", "Invalid username/passw combination");
    });

});