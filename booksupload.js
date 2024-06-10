import { storage, uploadBytes, getStorage, getDownloadURL, storageRef, getDatabase, listAll, set, ref, database, push } from "./src/firebaseConfig.js";


//const pdfRef = storageRef(storage, 'pdf/');  // Reference to the directory where PDFs are stored

//funtie pentru adaugarea in baza de date a cartilor manuak incarcate in storage
/*listAll(pdfRef)
  .then((res) => {
    res.items.forEach((itemRef) => {
      getDownloadURL(itemRef).then((url) => {
        const fileInfo = parseFilename(itemRef.name);
        console.log(`Found file: ${itemRef.name}, URL: ${url}`);
        addatabaseookToDatabase(fileInfo.title, fileInfo.author, url);
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
  
  function addatabaseookToDatabase(title, author, pdfUrl) {
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
    const cleanedFilename = filename.replace('.pdf', '');
    const dashIndex = cleanedFilename.indexOf(' - ');

    if (dashIndex === -1) {
        console.error('Filename format incorrect, should be "Author - Title.pdf"');
        return { author: 'Unknown', title: 'Untitled' };
    }

    const author = cleanedFilename.substring(0, dashIndex);
    const title = cleanedFilename.substring(dashIndex + 3); // +3 to remove ' - ' part
    return { author, title };
}

// Funcție pentru încărcarea fișierului PDF și a copertei
function uploadatabaseookAndCover(pdfFile, coverFile) {
  const pdfRef = storageRef(storage, `pdf/${pdfFile.name}`);
  const coverRef = storageRef(storage, `covers/${coverFile.name}`);

  uploadBytes(pdfRef, pdfFile).then((pdfSnapshot) => {
    return getDownloadURL(pdfSnapshot.ref);
}).then((pdfUrl) => {
    // Upload cover file
    uploadBytes(coverRef, coverFile).then((coverSnapshot) => {
        return getDownloadURL(coverSnapshot.ref).then((coverUrl) => {
            
            const booksRef = ref(database, 'books');
            const newBookRef = push(booksRef);
            return set(newBookRef, {
                author: pdfFile.name.split(' - ')[0], // Assuming filename format "Author - Title.pdf"
                title: pdfFile.name.split(' - ')[1].replace('.pdf', ''),
                pdfUrl: pdfUrl,
                coverUrl: coverUrl
            });
        });
    });
}).then(() => {
    showPopup('Book and cover uploaded successfully!');
    clearInputs();
}).catch((error) => {
    showPopup('Error uploading files: ' + error.message);
    clearInputs();
});
}

function handleFiles() {
  const pdfInput = document.getElementById('fileInput');
  const coverInput = document.getElementById('coverInput');
  if (pdfInput.files.length > 0 && coverInput.files.length > 0) {
      uploadatabaseookAndCover(pdfInput.files[0], coverInput.files[0]);
  } else {
      alert('Please select both a PDF and a cover image.');
  }
}


function showPopup(message) {
    const popup = document.getElementById('uploadPopup');
    document.getElementById('uploadMessage').textContent = message;
    popup.style.display = 'block';
}

function closePopup() {
    document.getElementById('uploadPopup').style.display = 'none';
}

function clearInputs() {
  const pdfInput = document.getElementById('fileInput');
  const coverInput = document.getElementById('coverInput');
  pdfInput.value = '';  // Clear the PDF input
  coverInput.value = '';  // Clear the cover input
}


// Adding event listeners after the DOM has fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const fileDragArea = document.getElementById('fileDragArea');
  const uploadButton = document.getElementById('uploadButton');


  // Drag over handler
  fileDragArea.addEventListener('dragover', (event) => {
      event.preventDefault(); // Prevent default behavior (Prevent file from being opened)
      fileDragArea.classList.add('drag-over');
  });

  // Drag leave handler
  fileDragArea.addEventListener('dragleave', () => {
      fileDragArea.classList.remove('drag-over');
  });

  // Drop handler
  fileDragArea.addEventListener('drop', (event) => {
      event.preventDefault();
      fileDragArea.classList.remove('drag-over');
      const files = event.dataTransfer.files; // Get files from the event
      if (files.length > 0) {
          fileInput.files = files; // Assign files to file input
      }
  });

  fileInput.addEventListener('change', () => handleFiles(fileInput.files));

  uploadButton.addEventListener('click', () => {
    if (fileInput.files.length > 0) {
        handleFiles(fileInput.files);
    } else {
        alert('Please select a file.');
    }
});


  const closeButton = document.querySelector('.close-button');
  closeButton.addEventListener('click', closePopup);
  
});