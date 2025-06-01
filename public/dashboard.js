if (!localStorage.getItem('token')) {
  window.location.href = 'login.html';
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

function showPostAd() {
  document.getElementById('content').innerHTML = `
    <h2>Post an Ad</h2>
    <form id="postAdForm" enctype="multipart/form-data">
      <input type="text" name="title" placeholder="Title" required><br>
      <textarea name="description" placeholder="Description" required></textarea><br>
      <input type="text" name="location" placeholder="Location" required><br>
      <input type="file" name="images" multiple accept="image/*"><br>
      <button type="submit">Post Ad</button>
    </form>
    <div id="postAdMsg"></div>
  `;
  document.getElementById('postAdForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const images = form.images.files;
    for (let i = 0; i < images.length; i++) {
      formData.append('images', images[i]);
    }
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        document.getElementById('postAdMsg').innerText = 'Ad posted successfully!';
        form.reset();
      } else {
        document.getElementById('postAdMsg').innerText = data.message || 'Error posting ad.';
      }
    } catch (err) {
      document.getElementById('postAdMsg').innerText = 'Error posting ad.';
    }
  });
}

function showMyAds() {
  document.getElementById('content').innerHTML = '<h2>My Ads</h2><div id="myAdsList">Loading...</div>';
  fetch('/api/offers/my', {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
  })
    .then(res => res.json())
    .then(ads => {
      if (!ads.length) {
        document.getElementById('myAdsList').innerText = 'No ads posted yet.';
        return;
      }
      document.getElementById('myAdsList').innerHTML = ads.map(ad => `
        <div style="border:1px solid #ccc; margin:1em 0; padding:1em;">
          <h3>${ad.title}</h3>
          <p>${ad.description}</p>
          <p><b>Location:</b> ${ad.location}</p>
          <div>${(ad.images||[]).map(img => `<img src="${img}" style="max-width:100px;max-height:100px;">`).join(' ')}</div>
        </div>
      `).join('');
    });
}

function showAvailableAds() {
  document.getElementById('content').innerHTML = '<h2>Available Ads</h2><div id="availableAdsList">Loading...</div>';
  fetch('/api/offers')
    .then(res => res.json())
    .then(ads => {
      if (!ads.length) {
        document.getElementById('availableAdsList').innerText = 'No ads available.';
        return;
      }
      document.getElementById('availableAdsList').innerHTML = ads.map(ad => `
        <div style="border:1px solid #ccc; margin:1em 0; padding:1em;">
          <h3>${ad.title}</h3>
          <p>${ad.description}</p>
          <p><b>Location:</b> ${ad.location}</p>
          <div>${(ad.images||[]).map(img => `<img src="${img}" style="max-width:100px;max-height:100px;">`).join(' ')}</div>
          <button onclick="showRequestForm('${ad._id}')">Request Space</button>
        </div>
      `).join('');
    });
}

function showMyRequests() {
  document.getElementById('content').innerHTML = '<h2>My Requests</h2><div id="myRequestsList">Loading...</div>';
  fetch('/api/requests/my', {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
  })
    .then(res => res.json())
    .then(requests => {
      if (!requests.length) {
        document.getElementById('myRequestsList').innerText = 'No requests made yet.';
        return;
      }
      document.getElementById('myRequestsList').innerHTML = requests.map(req => `
        <div style="border:1px solid #ccc; margin:1em 0; padding:1em;">
          <h3>Ad: ${req.offer?.title || ''}</h3>
          <p>Status: ${req.status}</p>
          <button onclick="showRequestDetails('${req._id}')">View Details</button>
        </div>
      `).join('');
    });
}

function showReceivedRequests() {
  document.getElementById('content').innerHTML = '<h2>Received Requests</h2><div id="receivedRequestsList">Loading...</div>';
  fetch('/api/requests/received', {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
  })
    .then(res => res.json())
    .then(requests => {
      if (!requests.length) {
        document.getElementById('receivedRequestsList').innerText = 'No requests received yet.';
        return;
      }
      document.getElementById('receivedRequestsList').innerHTML = requests.map(req => `
        <div style="border:1px solid #ccc; margin:1em 0; padding:1em;">
          <h3>Ad: ${req.offer?.title || ''}</h3>
          <p>From: ${req.requester?.name || ''}</p>
          <p>Status: ${req.status}</p>
          <button onclick="showRequestDetails('${req._id}')">View Details</button>
        </div>
      `).join('');
    });
}

function showRequestForm(offerId) {
  document.getElementById('content').innerHTML = `
    <h2>Request Space</h2>
    <form id="requestForm" enctype="multipart/form-data">
      <input type="hidden" name="offer" value="${offerId}">
      <input type="text" name="name" placeholder="Your Name" required><br>
      <input type="text" name="phone" placeholder="Phone Number" required><br>
      <input type="text" name="aadhaar" placeholder="Aadhaar Number" required><br>
      <input type="email" name="email" placeholder="Email" required><br>
      <label>Luggage Images: <input type="file" name="luggageImages" multiple accept="image/*" required></label><br>
      <button type="submit">Send Request</button>
    </form>
    <div id="requestMsg"></div>
  `;
  document.getElementById('requestForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const images = form.luggageImages.files;
    for (let i = 0; i < images.length; i++) {
      formData.append('luggageImages', images[i]);
    }
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        document.getElementById('requestMsg').innerText = 'Request sent successfully! Check My Requests for status.';
        form.reset();
      } else {
        document.getElementById('requestMsg').innerText = data.message || 'Error sending request.';
      }
    } catch (err) {
      document.getElementById('requestMsg').innerText = 'Error sending request.';
    }
  });
}

function showRequestDetails(requestId) {
  document.getElementById('content').innerHTML = '<h2>Request Details</h2><div id="requestDetails">Loading...</div>';
  fetch(`/api/requests/${requestId}`, {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
  })
    .then(res => res.json())
    .then(req => {
      if (!req || req.message) {
        document.getElementById('requestDetails').innerText = req.message || 'Request not found.';
        return;
      }
      let actions = '';
      const user = JSON.parse(localStorage.getItem('user'));
      // If user is offer owner and request is pending, show accept/reject
      if (req.offer && req.offer.user === user.id && req.status === 'pending') {
        actions = `
          <button onclick="handleRequestAction('${requestId}','accept')">Accept</button>
          <button onclick="handleRequestAction('${requestId}','reject')">Reject</button>
        `;
      }
      // If user is offer owner and request is accepted, show complete
      if (req.offer && req.offer.user === user.id && req.status === 'accepted') {
        actions = `<button onclick="handleRequestAction('${requestId}','complete')">Mark as Completed</button>`;
      }
      // If accepted or completed, show chat and survey
      let chatBtn = '';
      if (req.status === 'accepted' || req.status === 'completed') {
        chatBtn = `<button onclick="showChat('${requestId}')">Open Chat</button>`;
      }
      let surveyBtn = '';
      if (req.status === 'completed') {
        surveyBtn = `<button onclick="showSurvey('${requestId}')">Fill Survey</button>`;
      }
      document.getElementById('requestDetails').innerHTML = `
        <p><b>Status:</b> ${req.status}</p>
        <p><b>Name:</b> ${req.name}</p>
        <p><b>Phone:</b> ${req.phone}</p>
        <p><b>Aadhaar:</b> ${req.aadhaar}</p>
        <p><b>Email:</b> ${req.email}</p>
        <div><b>Luggage Images:</b><br>${(req.luggageImages||[]).map(img => `<img src="${img}" style="max-width:100px;max-height:100px;">`).join(' ')}</div>
        <div style="margin-top:1em;">${actions} ${chatBtn} ${surveyBtn}</div>
      `;
    });
}

async function handleRequestAction(requestId, action) {
  let url = `/api/approval/${requestId}/${action}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
  });
  if (res.ok) {
    alert('Action successful!');
    showRequestDetails(requestId);
  } else {
    const data = await res.json();
    alert(data.message || 'Action failed');
  }
}

function showChat(requestId) {
  document.getElementById('content').innerHTML = `
    <h2>Chat</h2>
    <div id="chat_message" style="border:1px solid #ccc; height:200px; overflow-y:auto; margin-bottom:1em; padding:1em;"></div>
    <form id="chatForm">
      <input type="text" name="message" placeholder="Type your message..." required style="width:70%;">
      <button type="submit">Send</button>
    </form>
    <button onclick="showRequestDetails('${requestId}')">Back to Request</button>
  `;
  async function loadMessages() {
    const res = await fetch(`/api/chat/${requestId}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const messages = await res.json();
    document.getElementById('chat_message').innerHTML = messages.map(m => `<div><b>${m.sender?.name || 'User'}:</b> ${m.message}</div>`).join('');
    document.getElementById('chat_message').scrollTop = document.getElementById('chat_message').scrollHeight;
  }
  loadMessages();
  document.getElementById('chatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = e.target.message.value;
    await fetch(`/api/chat/${requestId}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: msg })
    });
    e.target.reset();
    loadMessages();
  });
}

function showSurvey(requestId) {
  document.getElementById('content').innerHTML = `
    <h2>Survey</h2>
    <form id="surveyForm">
      <label>Rating:
        <select name="rating" required>
          <option value="">Select</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </label><br>
      <textarea name="feedback" placeholder="Feedback (optional)"></textarea><br>
      <input type="hidden" name="request" value="${requestId}">
      <button type="submit">Submit Survey</button>
    </form>
    <div id="surveyMsg"></div>
    <button onclick="showRequestDetails('${requestId}')">Back to Request</button>
  `;
  document.getElementById('surveyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const rating = form.rating.value;
    const feedback = form.feedback.value;
    const request = form.request.value;
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request, rating, feedback })
      });
      const data = await res.json();
      if (res.ok) {
        document.getElementById('surveyMsg').innerText = 'Survey submitted! Thank you for your feedback.';
        form.reset();
      } else {
        document.getElementById('surveyMsg').innerText = data.message || 'Error submitting survey.';
      }
    } catch (err) {
      document.getElementById('surveyMsg').innerText = 'Error submitting survey.';
    }
  });
} 