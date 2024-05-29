function editProfile() {
    // Add functionality to edit profile details
    alert('Edit profile clicked!');
}

function logOut() {
    // Add functionality to handle user logout
    alert('Log out clicked!');
}
document.addEventListener('DOMContentLoaded', function() {
    const books = [
        'Cartea 1',
        'Cartea 2',
        'Cartea 3',
        'Cartea 4',
        'Cartea 5'
    ];

    const bookList = document.getElementById('book-list');

    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.classList.add('book-card');
        bookCard.textContent = book;
        bookList.appendChild(bookCard);
    });

   

    document.getElementById('edit-profile-btn').addEventListener('click', function() {
        window.location.href = 'edit_profile.html'; 
    });
    
});

