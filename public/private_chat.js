// Private Chat JS - Complete rewrite
// This handles the chat functionality between two users

// Global variables
let currentUserId = null;
let otherUserId = null;
let adId = null;
let token = null;
let chatBox = null;
let chatForm = null;
let chatInput = null;
let agreementMessage = null;

// Initialize the chat
function initChat() {
  // Get auth token
  token = localStorage.getItem('token');
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  adId = urlParams.get('adId');
  otherUserId = urlParams.get('userId');
  
  // Make sure DOM is fully loaded before accessing elements
  document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    chatBox = document.getElementById('chatMessages');
    chatForm = document.getElementById('chatForm');
    chatInput = document.getElementById('chatInput');
    
    if (!chatBox) {
      console.error('Chat box element not found');
      return;
    }
    
    if (!token) {
      showError("You need to be logged in to use chat", "login.html", "Login");
      return;
    }
    
    // Validate parameters
    if (!adId || !otherUserId) {
      showError("Missing required parameters", "messages.html", "Back to Messages");
      return;
    }
    
    // Check if parameters are valid MongoDB ObjectIds (24 hex chars)
    if (!isValidObjectId(adId) || !isValidObjectId(otherUserId)) {
      showError("Invalid chat parameters", "messages.html", "Back to Messages");
      return;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Load user data and messages
    loadUserAndMessages();
  });
}

// Check if a string is a valid MongoDB ObjectId
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Show error message with link
function showError(message, linkUrl, linkText) {
  // Make sure chatBox exists
  if (!chatBox) {
    chatBox = document.getElementById('chatMessages');
    if (!chatBox) {
      console.error('Chat box element not found when showing error');
      return;
    }
  }
  
  chatBox.innerHTML = `
    <div class="error-message" style="padding: 20px; text-align: center; color: #d32f2f;">
      <strong>${message}</strong><br><br>
      <a href="${linkUrl}" style="color: #1976d2; text-decoration: underline;">${linkText}</a>
    </div>
  `;
  
  // Disable the form if it exists
  if (chatForm) {
    chatForm.style.display = 'none';
  }
  
  // Hide agreement section if it exists
  const agreementSection = document.getElementById('agreement-section');
  if (agreementSection) {
    agreementSection.style.display = 'none';
  }
}

// Set up event listeners
function setupEventListeners() {
  // Make sure elements exist before adding listeners
  if (!chatForm) {
    console.error('Chat form element not found');
    return;
  }
  
  // Chat form submission
  chatForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    await sendMessage();
  });
  
  // Agreement modal
  const openAgreementBtn = document.getElementById('openAgreementModalBtn');
  if (openAgreementBtn) {
    openAgreementBtn.addEventListener('click', function() {
      const modal = document.getElementById('agreement-modal');
      if (modal) {
        modal.style.display = 'flex';
      }
    });
  }
  
  // Agreement send button
  const agreeAndSendBtn = document.getElementById('agreeAndSendBtn');
  if (agreeAndSendBtn) {
    agreeAndSendBtn.addEventListener('click', async function() {
      await sendAgreement();
      closeAgreementModal();
    });
  }
}

// Close agreement modal
window.closeAgreementModal = function() {
  const modal = document.getElementById('agreement-modal');
  if (modal) {
    modal.style.display = 'none';
  }
};

// Load user data and messages
async function loadUserAndMessages() {
  try {
    // Get current user info
    const userRes = await fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!userRes.ok) {
      showError("Failed to load user profile", "login.html", "Login Again");
      return;
    }
    
    const userData = await userRes.json();
    currentUserId = userData._id || userData.id || userData.userId;
    
    if (!currentUserId) {
      showError("User ID not found", "login.html", "Login Again");
      return;
    }
    
    // Load messages
    await loadMessages();
    
  } catch (error) {
    console.error('Error initializing chat:', error);
    showError("Failed to initialize chat", "messages.html", "Back to Messages");
  }
}

// Load messages between the two users
async function loadMessages() {
  // Make sure chatBox exists
  if (!chatBox) {
    chatBox = document.getElementById('chatMessages');
    if (!chatBox) {
      console.error('Chat box element not found when loading messages');
      return;
    }
  }
  
  try {
    const res = await fetch(`/api/messages/chat?adId=${adId}&userId=${otherUserId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Server error');
    }
    
    const messages = await res.json();
    
    if (!Array.isArray(messages)) {
      throw new Error('Invalid response format');
    }
    
    // Clear the chat box
    chatBox.innerHTML = '';
    agreementMessage = null;
    
    // Display messages
    if (messages.length === 0) {
      chatBox.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #666;">
          No messages yet. Start the conversation!
        </div>`;
    } else {
      messages.forEach(msg => {
        if (msg.messageType === 'agreement') {
          agreementMessage = msg;
          chatBox.innerHTML += renderAgreementMessage(msg);
        } else {
          renderChatMessage(msg);
        }
      });
    }
    
    // Update agreement section
    updateAgreementSection();
    
    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
    
  } catch (error) {
    console.error('Error loading messages:', error);
    showError(`Failed to load messages: ${error.message}`, "messages.html", "Back to Messages");
  }
}

// Render a chat message
function renderChatMessage(msg) {
  if (!chatBox) return;
  
  const isSelf = msg.senderId === currentUserId;
  const initials = isSelf ? 'You' : (msg.senderName ? getInitials(msg.senderName) : 'U');
  const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  
  chatBox.innerHTML += `
    <div class="chat-row${isSelf ? ' self' : ''}">
      <div class="chat-avatar">${initials}</div>
      <div>
        <div class="chat-bubble">${msg.content}</div>
        <div class="chat-timestamp">${time}</div>
      </div>
    </div>
  `;
}

// Render agreement message
function renderAgreementMessage(msg) {
  let html = `<div class="agreement-message">
    <b>Agreement:</b><br>${msg.agreementText || ''}`;
    
  if (msg.agreementStatus === 'pending' && msg.receiverId === currentUserId) {
    html += `<div class="agreement-actions">
      <button onclick="acceptAgreement('${msg._id}')">Accept</button>
      <button onclick="declineAgreement('${msg._id}')">Decline</button>
    </div>`;
  }
  
  html += `<div class="agreement-status">Status: ${msg.agreementStatus.charAt(0).toUpperCase() + msg.agreementStatus.slice(1)}</div></div>`;
  return html;
}

// Update agreement section
function updateAgreementSection() {
  const section = document.getElementById('agreement-section');
  if (!section) return;
  
  if (!agreementMessage || agreementMessage.agreementStatus !== 'pending') {
    section.innerHTML = `<button class="send-agreement-btn" onclick="openAgreementModal()">Send Agreement</button>`;
  } else {
    section.innerHTML = '';
  }
}

// Get initials from name
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
}

// Send a message
async function sendMessage() {
  if (!chatInput) {
    chatInput = document.getElementById('chatInput');
    if (!chatInput) {
      console.error('Chat input element not found when sending message');
      alert('Error: Could not find message input field');
      return;
    }
  }
  
  const content = chatInput.value.trim();
  if (!content) return;
  
  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        receiverId: otherUserId, 
        adId, 
        content 
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }
    
    // Clear input and reload messages
    chatInput.value = '';
    await loadMessages();
    
  } catch (error) {
    console.error('Error sending message:', error);
    alert(`Failed to send message: ${error.message}`);
  }
}

// Send agreement
window.sendAgreement = async function() {
  try {
    const agreementText = `Luggage Transfer Agreement\n\nLuggage Details: The Sender agrees to provide the Carrier with specified luggage items, which the Carrier agrees to transport under the agreed conditions.\nCompensation: The Sender shall compensate the Carrier for the luggage transport service as agreed upon through the LuggageShare platform.\nLiability: The Carrier is responsible for the luggage only while it is in their possession. Luggage is to be returned in the same condition as received. The Sender confirms that the contents of the luggage comply with all airline regulations and do not contain prohibited items. If any illegal items are found in the luggage, the Sender (original owner of the luggage) shall bear full responsibility, and the Carrier (handler) shall not be held liable.\nConfidentiality: Both parties agree to keep personal information, including contact details and flight information, confidential and use it solely for the purpose of fulfilling this agreement.\nDispute Resolution: Any disputes arising from this agreement shall be resolved through the LuggageShare platform's mediation process.\nTermination: This Agreement is binding once the luggage is transferred to the Carrier and shall remain in effect until the luggage is delivered to the Sender's designated recipient.\nBy proceeding with the luggage transfer, both parties acknowledge and agree to the terms outlined above.\nEffective Date: Upon confirmation of luggage transfer through the LuggageShare platform.`;
    const content = "Agreement sent";
    
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receiverId: otherUserId,
        adId,
        type: 'agreement',
        agreementText,
        content
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send agreement');
    }
    
    await loadMessages();
  } catch (error) {
    console.error('Error sending agreement:', error);
    alert(`Failed to send agreement: ${error.message}`);
  }
}

// Accept agreement
window.acceptAgreement = async function(id) {
  try {
    const response = await fetch(`/api/messages/${id}/agreement`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ agreementStatus: 'accepted' })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to accept agreement');
    }
    
    await loadMessages();
  } catch (error) {
    console.error('Error accepting agreement:', error);
    alert(`Failed to accept agreement: ${error.message}`);
  }
}

// Decline agreement
window.declineAgreement = async function(id) {
  try {
    const response = await fetch(`/api/messages/${id}/agreement`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ agreementStatus: 'declined' })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to decline agreement');
    }
    
    await loadMessages();
  } catch (error) {
    console.error('Error declining agreement:', error);
    alert(`Failed to decline agreement: ${error.message}`);
  }
}

// Add this function to open the modal
window.openAgreementModal = async function() {
  try {
    // Get current user info for the sender
    const userRes = await fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!userRes.ok) {
      throw new Error("Failed to load user profile");
    }
    
    const currentUser = await userRes.json();
    
    // Get other user info for the carrier
    const otherUserRes = await fetch(`/api/user/${otherUserId}/contact`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!otherUserRes.ok) {
      throw new Error("Failed to load other user profile");
    }
    
    const otherUser = await otherUserRes.json();
    
    // Populate the sender and carrier fields
    document.getElementById('agreement-sender').textContent = currentUser.name || 'You';
    document.getElementById('agreement-carrier').textContent = otherUser.name || 'Other User';
    
    // Show the modal
  const modal = document.getElementById('agreement-modal');
  if (modal) {
    modal.style.display = 'flex';
    }
  } catch (error) {
    console.error('Error opening agreement modal:', error);
    alert(`Failed to open agreement: ${error.message}`);
  }
}

// Start initialization
initChat();