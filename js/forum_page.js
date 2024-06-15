import { getAuth, getDatabase, ref, set, push, onValue, get } from "../src/firebaseConfig.js";

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth();
    const database = getDatabase();

    function openTab(evt, tabName) {
        var tabcontent = document.getElementsByClassName("tab-content");
        var tablinks = document.getElementsByClassName("tab-link");
        for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
            tabcontent[i].classList.remove('active'); // Deactivate all tabs
        }
        for (let i = 0; i < tablinks.length; i++) {
            tablinks[i].classList.remove("active");
        }
        const activeTabContent = document.getElementById(tabName);
        activeTabContent.style.display = "block";
        setTimeout(() => activeTabContent.classList.add('active'), 10); 
        evt.currentTarget.classList.add("active");
    }

    function postContent(tabName) {
        const user = auth.currentUser;
    
        if (!user) {
            console.error('No user logged in');
            alert('You must be logged in to post!');
            return;
        }
    
        const userRef = ref(database, 'users/' + user.uid);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const username = userData.userName || 'Anonymous'; 
                createPost(tabName, username, user.uid); 
            } else {
                console.error('User data not found');
                alert('Your user details could not be found.');
            }
        }).catch((error) => {
            console.error('Error fetching user data:', error);
            alert('An error occurred while fetching user details.');
        });
    }
    
    function createPost(tabName, username, uid) {
        const input = document.getElementById(tabName + 'Input');
        const postsContainer = document.getElementById(tabName + 'Posts');
    
        if (input.value.trim() !== "") {
            const postData = {
                text: input.value,
                timestamp: new Date().toLocaleString(),
                user: username,
                uid: uid,
                likes: 0,
                likedBy: {} // Initialize an empty object for tracking likes by user
            };
    
            const newPostRef = push(ref(database, tabName.toLowerCase()));
            set(newPostRef, postData).then(() => {
                input.value = ""; 
                fetchPosts(tabName); 
            }).catch(error => {
                console.error('Error posting:', error);
                alert('An error occurred while posting!');
            });
        }
    }

    function fetchPosts(tabName) {
        const postsContainer = document.getElementById(tabName + 'Posts');
        const postsRef = ref(database, tabName.toLowerCase());
    
        onValue(postsRef, (snapshot) => {
            postsContainer.innerHTML = ''; // Clear the container
            const postsArray = [];
            snapshot.forEach((childSnapshot) => {
                const postData = childSnapshot.val();
                postData.id = childSnapshot.key; // Save key for reference
                postsArray.push(postData);
            });
            postsArray.reverse().forEach(postData => {
                const post = document.createElement('div');
                post.className = 'post';
                const isLiked = auth.currentUser && postData.likedBy && postData.likedBy[auth.currentUser.uid] ? 'liked' : '';
                post.innerHTML = `
                    <p>${postData.text}</p>
                    <small>Posted by ${postData.user} on ${postData.timestamp}</small>
                    <div class="like-container">
                        <button class="like-btn ${isLiked}" data-category="${tabName.toLowerCase()}" data-post-id="${postData.id}">👍</button>
                        <span class="like-count">${postData.likes}</span>
                    </div>
                `;
                postsContainer.appendChild(post); // Append each post to the container
            });
            bindLikeButtons(tabName.toLowerCase()); // Bind like buttons
        });
    }

    function bindLikeButtons(category) {
        const likeButtons = document.querySelectorAll(`.like-btn[data-category="${category}"]`);
        likeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const postId = this.getAttribute('data-post-id');
                handleLike(postId, category, this);
            });
        });
    }

    function handleLike(postId, category, btn) {
        const user = auth.currentUser;
        if (!user) {
            alert('You must be logged in to like!');
            return;
        }

        const postRef = ref(database, `${category}/${postId}`);
        get(postRef).then((snapshot) => {
            const postData = snapshot.val();
            if (!postData) {
                console.error('Post data not found');
                return;
            }
            if (postData.likedBy && postData.likedBy[user.uid]) {
                // User has already liked, so unlike
                postData.likes--;
                delete postData.likedBy[user.uid];
            } else {
                // User has not liked, so like
                postData.likes++;
                if (!postData.likedBy) {
                    postData.likedBy = {};
                }
                postData.likedBy[user.uid] = true;
            }
            set(postRef, postData).then(() => {
                btn.nextElementSibling.textContent = postData.likes; // Update like count text dynamically
                btn.classList.toggle('liked'); // Toggle liked class
            }).catch(error => {
                console.error('Error updating likes:', error);
            });
        }).catch(error => {
            console.error('Error reading post data:', error);
        });
    }
    
    const tabs = document.querySelectorAll('.tab-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(evt) {
            openTab(evt, tab.getAttribute('data-tab'));
        });
    });

    ['Literature', 'Poetry', 'Chat'].forEach(tab => {
        document.getElementById('post' + tab + 'Button').addEventListener('click', () => {
            postContent(tab);
        });
        fetchPosts(tab);
    });

    openTab({currentTarget: document.querySelector('.tab-link.active')}, 'Literature'); // Open the first tab by default
});
