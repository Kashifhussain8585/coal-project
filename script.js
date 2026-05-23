'use strict';

/* =========================
   STORAGE KEYS
========================= */
const USERS_KEY = 'users';
const SESSION_KEY = 'session';

/* =========================
   LOCAL STORAGE USERS
========================= */
const UserStore = {
  getAll() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  },

  save(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  exists(username) {
    const users = this.getAll();
    return users[username.toLowerCase()] !== undefined;
  },

  add(username, password) {
    const users = this.getAll();
    users[username.toLowerCase()] = password;
    this.save(users);
  },

  verify(username, password) {
    const users = this.getAll();
    return users[username.toLowerCase()] === password;
  }
};

/* =========================
   SESSION
========================= */
const Session = {
  set(username) {
    sessionStorage.setItem(SESSION_KEY, username);
  },

  get() {
    return sessionStorage.getItem(SESSION_KEY);
  },

  clear() {
    sessionStorage.removeItem(SESSION_KEY);
  }
};

/* =========================
   SIMPLE HASH (optional)
========================= */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
  }
  return hash;
}

/* =========================
   TOAST
========================= */
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.className = 'show';

  setTimeout(() => {
    toast.className = '';
  }, 3000);
}

/* =========================
   VALIDATION
========================= */
function validateUser(username) {
  if (!username) return "Username required";
  if (username.length < 3) return "Min 3 characters";
  return null;
}

function validatePass(password) {
  if (!password) return "Password required";
  if (password.length < 6) return "Min 6 characters";
  return null;
}

/* =========================
   LOGIN
========================= */
function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value;

    if (validateUser(u) || validatePass(p)) {
      showToast("Invalid input");
      return;
    }

    if (!UserStore.exists(u)) {
      showToast("User not found");
      return;
    }

    if (!UserStore.verify(u, p)) {
      showToast("Wrong password");
      return;
    }

    Session.set(u);
    showToast("Login successful");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  });
}

/* =========================
   SIGNUP
========================= */
function initSignup() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const u = document.getElementById('signupUsername').value.trim();
    const p = document.getElementById('signupPassword').value;
    const c = document.getElementById('signupConfirm').value;

    if (validateUser(u) || validatePass(p)) {
      showToast("Invalid input");
      return;
    }

    if (p !== c) {
      showToast("Passwords not match");
      return;
    }

    if (UserStore.exists(u)) {
      showToast("User already exists");
      return;
    }

    UserStore.add(u, p);
    showToast("Account created");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
  });
}

/* =========================
   INIT
========================= */
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initSignup();
});
