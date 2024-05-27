import {
    getDatabase,
     ref,
     get,
   } from "./src/firebaseConfig.js";
 

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('bookId'); // Use the proper Firebase key

    console.log('Book ID on details page:', bookId);
    const dbRef = ref(getDatabase(), `books/${bookId}`);
    get(dbRef).then((snapshot) => {
        if (snapshot.exists()) {
            const book = snapshot.val();
            // Display book details
            document.getElementById('title').textContent = book.title;
            document.getElementById('author').textContent = book.author;
            document.getElementById('description').innerHTML = book.description;
            document.getElementById('coverImage').src = book.coverUrl;
        } else {
            console.log("Book details not found.");
            document.getElementById('details').textContent = 'Details not found for this book.';
        }
    }).catch((error) => {
        console.error("Failed to load book details", error);
        document.getElementById('details').textContent = 'Failed to load details.';
    });
});
