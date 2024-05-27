import {
   getDatabase,
    ref,
    get,
    child
  } from "./firebaseConfig.js";

  

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
    
   

    const dbRef = ref(getDatabase());
    get(child(dbRef, 'books')).then((snapshot) => {
        const booksAdded = {}; 
        let htmlContent = ''; 
    
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const book = childSnapshot.val();
                if (!booksAdded[book.genre]) {
                    htmlContent += `
                    <div class="book" data-book-id="${childSnapshot.key}">
                    <div class="book-cover-container">      
                            <img src="${book.coverUrl}" alt="${book.title} Cover" class="book-cover">
                        <div class="genre-label">${book.genre}</div>
                    </div>
                </div>
                    `;
                    booksAdded[book.genre] = true; //marcam genul ca vazut
                    
                }
            });
            
            document.querySelector('.carousel-container').innerHTML = htmlContent;
            document.querySelector('.carousel-container').addEventListener('click', function(event) {
                if (event.target.classList.contains('book-cover')) {
                    const bookDiv = event.target.closest('.book');
                    const bookId = bookDiv.getAttribute('data-book-id');
                    console.log(`Selected book ID: ${bookId}`);
                   // window.location.href = `bookdetails.html?bookId=${pdfUrl}`;
                    window.location.href = `bookdetails.html?bookId=${encodeURIComponent(bookId)}`;
                    //window.open(pdfUrl, '_blank');
                }
            });
            
        } else {
            console.log("No data available");
            document.querySelector('.carousel-container').innerHTML = '<p>No books available.</p>';
        }
    }).catch((error) => {
        console.error("Failed to load books", error);
        document.querySelector('.carousel-container').innerHTML = `<p>Error loading books: ${error.message}</p>`;
    });

    let booksData = {};  // Store book data indexed by title

    get(child(dbRef, 'books')).then((snapshot) => {
        if (snapshot.exists()) {
            console.log("Fetched Data:", snapshot.val()); // Log the fetched data
            snapshot.forEach((childSnapshot) => {
                const book = childSnapshot.val();
                booksData[book.title] = book;  // Store each book's data
            });
        } else {
            console.log("No books available.");
        }
    }).catch(error => {
        console.error("Failed to load books", error);
    });

    
    document.querySelector('.prev').addEventListener('click', function() {
        document.querySelector('.carousel-container').scrollBy({
          left: -200, // Adjust scroll step size
          behavior: 'smooth'
        });
      });
      
      document.querySelector('.next').addEventListener('click', function() {
        document.querySelector('.carousel-container').scrollBy({
          left: 200, // Adjust scroll step size
          behavior: 'smooth'
        });
      });
      
     
});
