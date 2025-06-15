import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

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
const db = getDatabase(app);
const articlesRef = ref(db, 'articles/');
const articlesDiv = document.getElementById('articles');
const loadingIndicator = document.getElementById('loadingIndicator');
const searchInput = document.getElementById('searchInput');

// Master code that can delete any article
const MASTER_CODE = "bsnl222762";

// DOM elements for modal
const deleteModal = document.getElementById('deleteModal');
const closeBtn = document.querySelector('.close');
const deleteCodeInput = document.getElementById('deleteCodeInput');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const deleteError = document.getElementById('deleteError');

// Current article to delete
let currentArticleToDelete = null;

// Simple decryption function
function decryptCode(encrypted) {
  try {
    return decodeURIComponent(atob(encrypted));
  } catch (e) {
    return null;
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function processContent(text) {
  let processed = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
    language = language || 'text';
    return `<pre class="language-${language}"><code class="language-${language}">${code.trim()}</code></pre>`;
  });
  
  processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
  processed = processed.split('\n\n').map(paragraph => {
    return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
  }).join('');
  
  return processed;
}

// Modal functions
function openDeleteModal(article) {
  currentArticleToDelete = article;
  deleteCodeInput.value = '';
  deleteError.style.display = 'none';
  deleteModal.style.display = 'block';
}

function closeDeleteModal() {
  deleteModal.style.display = 'none';
  currentArticleToDelete = null;
}

// Close modal when clicking on X or outside
closeBtn.addEventListener('click', closeDeleteModal);
window.addEventListener('click', (e) => {
  if (e.target === deleteModal) {
    closeDeleteModal();
  }
});

// Handle delete confirmation
confirmDeleteBtn.addEventListener('click', () => {
  if (!currentArticleToDelete) return;
  
  const enteredCode = deleteCodeInput.value.trim();
  
  // Decrypt stored code
  const storedCode = decryptCode(currentArticleToDelete.deleteCode);
  
  // Check if entered code matches or is master code
  if (enteredCode === storedCode || enteredCode === MASTER_CODE) {
    deleteArticle(currentArticleToDelete.id);
  } else {
    deleteError.textContent = '❌ Invalid delete code. Please try again.';
    deleteError.style.display = 'block';
  }
});

function deleteArticle(articleId) {
  remove(ref(db, `articles/${articleId}`))
    .then(() => {
      closeDeleteModal();
      // Show success message
      const successAlert = document.createElement('div');
      successAlert.className = 'alert alert-success';
      successAlert.textContent = '✅ Article deleted successfully!';
      document.body.appendChild(successAlert);
      
      setTimeout(() => {
        successAlert.remove();
      }, 3000);
    })
    .catch(error => {
      console.error('Error deleting article:', error);
      deleteError.textContent = '❌ Failed to delete article. Please try again.';
      deleteError.style.display = 'block';
    });
}

function renderArticles(filter = '') {
  onValue(articlesRef, (snapshot) => {
    loadingIndicator.style.display = 'none';
    articlesDiv.innerHTML = '';
    
    if (!snapshot.exists()) {
      articlesDiv.innerHTML = '<div style="text-align: center; padding: 2rem; background: white; border-radius: 8px;">No articles found.</div>';
      return;
    }
    
    const articles = [];
    snapshot.forEach((child) => {
      articles.push({
        id: child.key,
        ...child.val()
      });
    });
    
    articles.sort((a, b) => b.timestamp - a.timestamp);
    
    const filteredArticles = filter 
      ? articles.filter(article => 
          article.title.toLowerCase().includes(filter.toLowerCase()) || 
          article.content.toLowerCase().includes(filter.toLowerCase()) ||
          (article.tags && article.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase())))
      : articles;
    
    if (filteredArticles.length === 0) {
      articlesDiv.innerHTML = '<div style="text-align: center; padding: 2rem; background: white; border-radius: 8px;">No articles match your search.</div>';
      return;
    }
    
    filteredArticles.forEach(article => {
      const articleEl = document.createElement('div');
      articleEl.className = 'card';
      articleEl.innerHTML = `
        <div class="card-header">
          <h3 style="margin: 0;">${article.title}</h3>
          <div class="text-small" style="color: rgba(255,255,255,0.8);">${formatDate(article.timestamp)}</div>
        </div>
        <div class="card-body">
          <div class="d-flex justify-between align-center">
            <div class="text-muted">By ${article.author}</div>
            <div class="text-muted text-small">${article.views || 0} views</div>
          </div>
          <div class="content mt-3">${processContent(article.content)}</div>
          ${article.tags && article.tags.length > 0 ? `
            <div class="tags mt-3">
              ${article.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
            </div>
          ` : ''}
          <div class="d-flex justify-between mt-3">
            <button class="btn btn-danger btn-sm delete-btn" data-id="${article.id}">Delete Article</button>
          </div>
        </div>
      `;
      
      articlesDiv.appendChild(articleEl);
      
      // Add event listener to delete button
      const deleteBtn = articleEl.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => {
        openDeleteModal(article);
      });
    });
  });
}

searchInput.addEventListener('input', (e) => {
  renderArticles(e.target.value);
});

renderArticles();
