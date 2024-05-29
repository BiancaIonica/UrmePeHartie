import {
    getDatabase,
     ref,
     get,
     getDownloadURL,
     storage,
     storageRef,
   } from "./src/firebaseConfig.js";
 

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('bookId'); 

    console.log('Book ID on details page:', bookId);
    const dbRef = ref(getDatabase(), `books/${bookId}`);
    get(dbRef).then((snapshot) => {
        if (snapshot.exists()) {
            const book = snapshot.val();
            document.getElementById('title').textContent = book.title;
            document.getElementById('author').textContent = book.author;
            document.getElementById('description').innerHTML = book.description;
            document.getElementById('coverImage').src = book.coverUrl;
            document.getElementById('readPdf').href = book.pdfUrl;
            const pdfStorageRef = storageRef(storage, book.pdfUrl);
            getDownloadURL(pdfStorageRef)
                .then((url) => {
                    const downloadLink = document.getElementById('downloadLink');
                    downloadLink.href = url;
                    downloadLink.download = `${book.title}.pdf`; // Gives a name to the downloaded file
                })
                .catch((error) => {
                    console.error('Failed to get download URL', error);
                });
        } else {
            console.log("Book details not found.");
            document.getElementById('details').textContent = 'Details not found for this book.';
        }
    }).catch((error) => {
        console.error("Failed to load book details", error);
        
    });

    
});
