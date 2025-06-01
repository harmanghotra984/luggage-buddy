// Authentication check
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return token;
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    };

    try {
        const response = await fetch(endpoint, { ...defaultOptions, ...options });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'An error occurred');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Show error message
function showError(message, elementId = 'error-message') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        alert(message);
    }
}

// Show success message
function showSuccess(message, elementId = 'success-message') {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
    } else {
        alert(message);
    }
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Image preview
function handleImagePreview(input, previewId) {
    const preview = document.getElementById(previewId);
    const file = input.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.classList.add('show');
        };
        reader.readAsDataURL(file);
    } else {
        preview.src = '';
        preview.classList.remove('show');
    }
}

// Validate form
function validateForm(formData, rules) {
    const errors = {};

    for (const [field, value] of formData.entries()) {
        const fieldRules = rules[field];
        if (!fieldRules) continue;

        if (fieldRules.required && !value) {
            errors[field] = 'This field is required';
        } else if (value) {
            if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
                errors[field] = fieldRules.message || 'Invalid format';
            }
            if (fieldRules.minLength && value.length < fieldRules.minLength) {
                errors[field] = `Minimum length is ${fieldRules.minLength} characters`;
            }
            if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
                errors[field] = `Maximum length is ${fieldRules.maxLength} characters`;
            }
        }
    }

    return Object.keys(errors).length === 0 ? null : errors;
}

// Show loading spinner
function showSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="spinner"></div>';
    }
}

// Hide loading spinner
function hideSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const spinner = container.querySelector('.spinner');
        if (spinner) {
            spinner.remove();
        }
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load user data
async function loadUserData() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            if (document.getElementById('userName')) {
                document.getElementById('userName').textContent = userData.name;
            }
        } else {
            throw new Error('Failed to load user data');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load user data. Please try again.');
    }
}

// Contact user functionality
async function contactUser(userId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/user/${userId}/contact`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            const contactInfo = `
                Name: ${userData.name}
                Email: ${userData.email}
                Phone: ${userData.phone}
            `;
            alert('Contact Information:\n' + contactInfo);
        } else {
            throw new Error('Failed to get contact information');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to get contact information. Please try again.');
    }
}

// Send message functionality
async function sendMessage(receiverId, adId) {
    const content = prompt('Enter your message:');
    if (!content) return;
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ receiverId, adId, content })
        });
        if (response.ok) {
            alert('Message sent successfully!');
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to send message.');
        }
    } catch (error) {
        alert('Failed to send message. Please try again.');
    }
}

// Helper to generate star rating HTML
function generateStarRating(rating, size = 'normal') {
    const starCount = Math.round(parseFloat(rating) || 0);
    const sizeClass = size === 'large' ? 'star-large' : (size === 'small' ? 'star-small' : '');
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${sizeClass} ${i <= starCount ? 'star-filled' : ''}">${i <= starCount ? '★' : '☆'}</span>`;
    }
    return `<div class="star-rating ${sizeClass}">${stars}</div>`;
}

// Format rating for display
function formatRating(rating, totalRatings) {
    const ratingValue = parseFloat(rating) || 0;
    const count = parseInt(totalRatings) || 0;
    return `${ratingValue.toFixed(1)} (${count})`;
}

// Fetch user rating
async function fetchUserRating(userId) {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/users/${userId}/rating-stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch rating');
        return await res.json();
    } catch (e) {
        console.error('Error fetching user rating:', e);
        return { averageRating: 0, totalRatings: 0 };
    }
}

// Export functions
window.app = {
    checkAuth,
    apiRequest,
    showError,
    showSuccess,
    formatDate,
    formatCurrency,
    handleLogout,
    handleImagePreview,
    validateForm,
    showSpinner,
    hideSpinner,
    debounce,
    loadUserData,
    contactUser,
    sendMessage,
    generateStarRating,
    formatRating,
    fetchUserRating
};

// Load user data on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
}); 