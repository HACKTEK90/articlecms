import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAp9kCBsDLnQEmR7wWHXwt3FB2T1zDtiqU",
  authDomain: "h-90-8a7c5.firebaseapp.com",
  databaseURL: "https://h-90-8a7c5-default-rtdb.firebaseio.com",
  projectId: "h-90-8a7c5",
  storageBucket: "h-90-8a7c5.appspot.com",
  messagingSenderId: "367196609301",
  appId: "1:367196609301:web:156e24c1b4532c26af671c",
  measurementId: "G-W5K7F4VQGP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const uploadForm = document.getElementById('uploadForm');
const alertContainer = document.getElementById('alertContainer');
const submitBtn = document.getElementById('submitBtn');

// Simple encryption function (for basic obfuscation)
function encryptCode(code) {
  return btoa(encodeURIComponent(code));
}

function showAlert(message, type = 'success') {
  const alertEl = document.createElement('div');
  alertEl.className = `alert alert-${type === 'success' ? 'success' : 'error'}`;
  alertEl.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
      <path d="${type === 'success' ? 'M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z' : 'M12 8V12V8ZM12 16H12.01H12ZM21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z'}" 
            stroke="${type === 'success' ? '#28a745' : '#dc3545'}" stroke-width="2" stroke-linecap="round"/>
    </svg>
    ${message}
  `;
  
  alertContainer.innerHTML = '';
  alertContainer.appendChild(alertEl);
  
  setTimeout(() => {
    alertEl.style.opacity = '0';
    setTimeout(() => alertEl.remove(), 300);
  }, 5000);
}

// Authenticate anonymously
signInAnonymously(auth)
  .then(() => {
    console.log("Authenticated anonymously");
  })
  .catch((error) => {
    console.error("Authentication error:", error);
    showAlert('Authentication failed. Please refresh the page.', 'error');
  });

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const tags = document.getElementById('tags').value.trim();
  const content = document.getElementById('content').value.trim();
  const deleteCode = document.getElementById('deleteCode').value.trim();
  
  if (!title || !author || !content || !deleteCode) {
    showAlert('Please fill in all required fields', 'error');
    return;
  }
  
  if (deleteCode.length < 6) {
    showAlert('Delete code must be at least 6 characters', 'error');
    return;
  }
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing...';
    
    // Encrypt the delete code before storing
    const encryptedCode = encryptCode(deleteCode);
    
    const articleData = {
      title,
      author,
      content,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      timestamp: Date.now(),
      views: 0,
      deleteCode: encryptedCode  // Store encrypted code
    };
    
    await push(ref(db, 'articles/'), articleData);
    
    showAlert('✅ Article published successfully! Remember your delete code!');
    uploadForm.reset();
  } catch (error) {
    console.error('Error publishing article:', error);
    showAlert('❌ Failed to publish article. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Publish Article';
  }
});
