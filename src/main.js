

document.getElementById('linkLogin').addEventListener('click', function(event) {
    event.preventDefault(); 
   
    window.location.href = 'login.html';
});

document.addEventListener('DOMContentLoaded', (event) => {
    const userDropdown = document.getElementById('userDropdown');
    const userButton = document.querySelector('.user-btn');
    const searchButton = document.querySelector('.search-btn');
    
    // Functia pentru afisarea/ascunderea meniului dropdown la click
    userButton.addEventListener('click', () => {
        userDropdown.classList.toggle('show');
    });

    window.addEventListener('click', (event) => {
        if (!event.target.matches('.user-btn')) {
            if (userDropdown.classList.contains('show')) {
                userDropdown.classList.remove('show');
            }
        }
    });

   
    searchButton.addEventListener('click', () => {
        // Obtine valoarea din inputul de cautare
        const searchInput = document.querySelector('.search-input').value;
        
        //  cautare sau redirectionare catre o pagina cu cartile
        console.log(`Cautare pentru: ${searchInput}`);
        // window.location.href = `/search?query=${encodeURIComponent(searchInput)}`;
    });
    
 


});
