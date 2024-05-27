import {  getDatabase, ref, get} from "./src/firebaseConfig.js";

function normalizeDiacritics(text) {
    return text
        .replace(/ă/g, 'a')
        .replace(/î/g, 'i')
        .replace(/â/g, 'a')
        .replace(/ș/g, 's')
        .replace(/ț/g, 't');
}

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const genre = params.get('genre'); // Obținerea genului din URL
    console.log("Genre from URL:", genre);

    const booksContainer = document.getElementById('booksContainer');
    const dbRef = ref(getDatabase(), 'books'); 
    const formattedGenre = genre.charAt(0).toUpperCase() + genre.slice(1).replace(/-/g, ' ');
    const pageTitle = document.getElementById('page-title');
    pageTitle.textContent = `Explorați colecția noastră de cărți de ${formattedGenre}`;
    
    

    get(dbRef).then((snapshot) => { 
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const book = childSnapshot.val();
               // console.log(book);
               console.log(normalizeDiacritics(book.genre).toLowerCase().replace(/\s+/g, '-'));
                if (normalizeDiacritics(book.genre) && normalizeDiacritics(book.genre).toLowerCase().replace(/\s+/g, '-') === genre) {
                    
                    const bookElement = document.createElement('div');
                    bookElement.className = 'book';
                    bookElement.innerHTML = `
                        <img src="${book.coverUrl}" alt="${book.title} Cover" class="book-cover">
                        <h3>${book.title}</h3>
                        <p>${book.author}</p>
                        <a href="${book.url}" target="_blank">Read More</a>
                    `;
                    booksContainer.appendChild(bookElement);
                }
            });
        } else {
            booksContainer.innerHTML = '<p>No books found for this genre.</p>';
        }
    }).catch(error => {
        console.error('Error loading books:', error);
        booksContainer.innerHTML = `<p>Error loading books: ${error.message}</p>`;
    });

    document.querySelectorAll('.book h3, .book p').forEach(element => {
        if (element.innerText.length > 16) { 
            element.style.fontSize = '14px'; 
        } else {
            element.style.fontSize = '16px'; 
        }
    });
});