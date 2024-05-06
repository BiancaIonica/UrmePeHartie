import { storage, uploadBytes, getStorage, getDownloadURL, storageRef, getDatabase, listAll, set, ref, database } from "./src/firebaseConfig.js";


//const pdfRef = storageRef(storage, 'pdf/');  // Reference to the directory where PDFs are stored

//funtie pentru adaugarea in baza de date a cartilor manuak incarcate in storage
/*listAll(pdfRef)
  .then((res) => {
    res.items.forEach((itemRef) => {
      getDownloadURL(itemRef).then((url) => {
        const fileInfo = parseFilename(itemRef.name);
        console.log(`Found file: ${itemRef.name}, URL: ${url}`);
        addBookToDatabase(fileInfo.title, fileInfo.author, url);
      }).catch((error) => {
        console.error(`Error getting download URL for ${itemRef.name}`, error);
      });
    });
  })
  .catch((error) => {
    console.error("Error listing PDF files", error);
  });

  function parseFilename(filename) {
    const parts = filename.replace('.pdf', '').split(' - ');
    return { author: parts[0], title: parts[1] };
  }
  
  function addBookToDatabase(title, author, pdfUrl) {
    const bookRef = ref(database, 'books/' + title.replace(/\s+/g, '_').toLowerCase());
    set(bookRef, {
      title,
      author,
      pdfUrl
    }).then(() => {
      console.log(`Book ${title} added successfully with author ${author}!`);
    }).catch((error) => {
      console.error(`Failed to add book ${title}`, error);
    });
  }*/
  function parseFilename(filename) {
    // Remove the file extension first
    const cleanedFilename = filename.replace('.pdf', '');
  
    // Find the first dash position to split author and title
    const dashIndex = cleanedFilename.indexOf(' - ');
  
    if (dashIndex === -1) {
        console.error('Filename format incorrect, should be "Author - Title.pdf"');
        return { author: '', title: '' };
    }
  
    const author = cleanedFilename.substring(0, dashIndex);
    const title = cleanedFilename.substring(dashIndex + 3); // +3 to remove ' - ' part
  
    return { author, title };
  }
  

  function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        alert('Please select a file.');
        return;
    }
    const file = fileInput.files[0];
    const fileRef = storageRef(storage, `pdf/${file.name}`);
    uploadBytes(fileRef, file).then((snapshot) => {
        return getDownloadURL(snapshot.ref);
    }).then((url) => {
        const fileInfo = parseFilename(file.name);
        const bookRef = ref(database, 'books/' + fileInfo.title.replace(/\s+/g, '_').toLowerCase());
        return set(bookRef, {
            author: fileInfo.author,
            title: fileInfo.title,
            url: url
        });
    }).then(() => {
        showPopup('File uploaded successfully!');
    }).catch((error) => {
        showPopup('Error uploading file: ' + error.message);
    });
}


// Function to show a popup with a message
function showPopup(message) {
    const popup = document.getElementById('uploadPopup');
    document.getElementById('uploadMessage').textContent = message;
    popup.style.display = 'block';
}

// Function to close the popup
function closePopup() {
    document.getElementById('uploadPopup').style.display = 'none';
}

// Adding event listeners after the DOM has fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('uploadButton');
    uploadBtn.addEventListener('click', uploadFile);

    const closeButton = document.querySelector('.close-button');
    closeButton.addEventListener('click', closePopup);
});