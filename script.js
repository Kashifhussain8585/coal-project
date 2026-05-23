/*
  Assembly Auth System — script.js
  COAL Project | SCIT | Sir Uzair Bashir
  Team: Asjad Ali Siddiqi, Mujtaba Ali, Kashif Hussain, Sameer Aziz

  Authentication Logic:
  - Validates empty fields
  - Validates password matching (signup)
  - 3 login attempts then lockout (mirrors ASM behaviour)
  - localStorage used to simulate users.txt storage
*/

const USERS_KEY    = 'coal_auth_users';
const MAX_ATTEMPTS = 3;

/* ── Simple hash (mirrors FNV-1a used in ASM module) ── */
function hashPassword(str) {
  let h = 0x811C9DC5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/* ── User storage helpers ── */
function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
  catch { return {}; }
}

function saveUser(username, password) {
  const users = getUsers();
  users[username.toLowerCase()] = hashPassword(password);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function userExists(username) {
  return username.toLowerCase() in getUsers();
}

function verifyUser(username, password) {
  const users = getUsers();
  const stored = users[username.toLowerCase()];
  return stored && stored === hashPassword(password);
}

/* ── Show / hide helpers ── */
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function hideError(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function showAlert(boxId, msg) {
  const el = document.getElementById(boxId);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function setInputState(inputEl, state) {
  inputEl.classList.remove('error', 'success');
  if (state) inputEl.classList.add(state);
}

/* ════════════════════════
   LOGIN PAGE
════════════════════════ */
function initLogin() {
  const form        = document.getElementById('loginForm');
  if (!form) return;

  const usernameEl  = document.getElementById('username');
  const passwordEl  = document.getElementById('password');
  const loginBtn    = document.getElementById('loginBtn');
  const attemptBar  = document.querySelector('.attempt-bar');
  const lockoutBox  = document.getElementById('lockoutBox');

  let attempts = 0;

  function updateAttemptBar() {
    const counter = document.getElementById('attemptCount');
    if (counter) counter.textContent = attempts + ' / ' + MAX_ATTEMPTS;

    if (attemptBar) {
      attemptBar.classList.remove('warning', 'danger');
      if (attempts === 2) attemptBar.classList.add('warning');
      if (attempts >= 3) attemptBar.classList.add('danger');
    }
  }

  function lockout() {
    form.style.display = 'none';
    if (lockoutBox) lockoutBox.style.display = 'block';
    hideAlert('alertBox');
    hideAlert('successBox');
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    hideAlert('alertBox');
    hideAlert('successBox');
    hideError('usernameErr');
    hideError('passwordErr');

    const username = usernameEl.value.trim();
    const password = passwordEl.value;

    // Validate empty fields
    let valid = true;

    if (!username) {
      showError('usernameErr', 'Please enter your username.');
      setInputState(usernameEl, 'error');
      valid = false;
    } else {
      setInputState(usernameEl, '');
    }

    if (!password) {
      showError('passwordErr', 'Please enter your password.');
      setInputState(passwordEl, 'error');
      valid = false;
    } else {
      setInputState(passwordEl, '');
    }

    if (!valid) return;

    // Check credentials
    if (!userExists(username)) {
      attempts++;
      updateAttemptBar();
      showAlert('alertBox', 'Username not found. Please sign up first.');
      setInputState(usernameEl, 'error');
      if (attempts >= MAX_ATTEMPTS) lockout();
      return;
    }

    if (!verifyUser(username, password)) {
      attempts++;
      updateAttemptBar();
      const remaining = MAX_ATTEMPTS - attempts;
      if (remaining > 0) {
        showAlert('alertBox', 'Incorrect password. ' + remaining + ' attempt(s) remaining.');
      }
      setInputState(passwordEl, 'error');
      if (attempts >= MAX_ATTEMPTS) lockout();
      return;
    }

    // Success
    setInputState(usernameEl, 'success');
    setInputState(passwordEl, 'success');
    showAlert('successBox', '✔ Authentication successful! Welcome, ' + username + '.');
    loginBtn.disabled = true;

    setTimeout(function() {
      window.location.href = 'index.html';
    }, 1500);
  });
}

/* ════════════════════════
   SIGNUP PAGE
════════════════════════ */
function initSignup() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  const usernameEl = document.getElementById('username');
  const passwordEl = document.getElementById('password');
  const confirmEl  = document.getElementById('confirm');
  const signupBtn  = document.getElementById('signupBtn');

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    hideAlert('alertBox');
    hideAlert('successBox');
    hideError('usernameErr');
    hideError('passwordErr');
    hideError('confirmErr');

    const username = usernameEl.value.trim();
    const password = passwordEl.value;
    const confirm  = confirmEl.value;

    let valid = true;

    // Validate username
    if (!username || username.length < 3) {
      showError('usernameErr', 'Username must be at least 3 characters.');
      setInputState(usernameEl, 'error');
      valid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showError('usernameErr', 'Only letters, numbers and underscores allowed.');
      setInputState(usernameEl, 'error');
      valid = false;
    } else {
      setInputState(usernameEl, '');
    }

    // Validate password
    if (!password || password.length < 6) {
      showError('passwordErr', 'Password must be at least 6 characters.');
      setInputState(passwordEl, 'error');
      valid = false;
    } else {
      setInputState(passwordEl, '');
    }

    // Validate confirm
    if (!confirm) {
      showError('confirmErr', 'Please confirm your password.');
      setInputState(confirmEl, 'error');
      valid = false;
    } else if (confirm !== password) {
      showError('confirmErr', 'Passwords do not match.');
      setInputState(confirmEl, 'error');
      valid = false;
    } else {
      setInputState(confirmEl, '');
    }

    if (!valid) return;

    // Check duplicate
    if (userExists(username)) {
      showAlert('alertBox', 'Username "' + username + '" is already taken. Please choose another.');
      setInputState(usernameEl, 'error');
      return;
    }

    // Save user
    saveUser(username, password);

    setInputState(usernameEl, 'success');
    setInputState(passwordEl, 'success');
    setInputState(confirmEl, 'success');
    showAlert('successBox', '✔ Account created successfully! Redirecting to login...');
    signupBtn.disabled = true;

    setTimeout(function() {
      window.location.href = 'login.html';
    }, 1500);
  });
}

/* ── Init on page load ── */
document.addEventListener('DOMContentLoaded', function() {
  initLogin();
  initSignup();
});
