
/**
 * ============================================================
 * ASSEMBLY AUTH SYSTEM — script.js
 * Frontend Authentication Logic + UI Effects
 * ============================================================
 */

'use strict';

/* ── Constants ─────────────────────────────────────────────── */
const STORAGE_KEY  = 'asm_auth_users';
const SESSION_KEY  = 'asm_auth_session';
const TOAST_DURATION = 3500;

/* ── User Store (localStorage simulation) ──────────────────── */
const UserStore = {
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
  },

  save(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  },

  exists(username) {
    return username.toLowerCase() in this.getAll();
  },

  add(username, password) {
    const users = this.getAll();
    users[username.toLowerCase()] = {
      username,
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString(),
    };
    this.save(users);
  },

  verify(username, password) {
    const users = this.getAll();
    const user  = users[username.toLowerCase()];
    if (!user) return false;
    return user.passwordHash === simpleHash(password);
  },

  getUser(username) {
    const users = this.getAll();
    return users[username.toLowerCase()] || null;
  }
};

/* ── Session ───────────────────────────────────────────────── */
const Session = {
  set(username) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      username, loginAt: new Date().toISOString()
    }));
  },
  get() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  },
  clear() { sessionStorage.removeItem(SESSION_KEY); }
};

/* ── Simple hash (demo only — use bcrypt server-side!) ─────── */
function simpleHash(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/* ════════════════════════════════════════════════════════════
   TOAST NOTIFICATION
════════════════════════════════════════════════════════════ */
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  toast.className = `toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;

  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), TOAST_DURATION);
}

/* ════════════════════════════════════════════════════════════
   ALERT BOX (inside card)
════════════════════════════════════════════════════════════ */
function showAlert(id, message, type = 'info') {
  const box = document.getElementById(id);
  if (!box) return;

  const icons = { success: '✓', error: '⚠', info: 'ℹ' };

  box.className = `alert-box alert-${type} visible`;
  box.innerHTML = `<span class="alert-icon">${icons[type]}</span><span class="alert-text">${message}</span>`;
}

function hideAlert(id) {
  const box = document.getElementById(id);
  if (box) box.classList.remove('visible');
}

/* ════════════════════════════════════════════════════════════
   FIELD VALIDATION HELPERS
════════════════════════════════════════════════════════════ */
function setFieldState(inputEl, state, message = '') {
  inputEl.classList.remove('error', 'success');
  const errEl = inputEl.closest('.form-group')?.querySelector('.field-error');

  if (state === 'error') {
    inputEl.classList.add('error');
    if (errEl) { errEl.textContent = message; errEl.classList.add('visible'); }
    return false;
  }

  if (state === 'success') {
    inputEl.classList.add('success');
    if (errEl) errEl.classList.remove('visible');
  } else {
    if (errEl) errEl.classList.remove('visible');
  }
  return true;
}

function clearField(inputEl) {
  inputEl.classList.remove('error', 'success');
  const errEl = inputEl.closest('.form-group')?.querySelector('.field-error');
  if (errEl) errEl.classList.remove('visible');
}

/* ════════════════════════════════════════════════════════════
   PASSWORD STRENGTH METER
════════════════════════════════════════════════════════════ */
function getStrength(password) {
  let score = 0;
  if (password.length >= 6)  score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 'weak',   segments: 1, label: 'Weak' };
  if (score <= 3) return { level: 'medium', segments: 3, label: 'Moderate' };
  return           { level: 'strong', segments: 5, label: 'Strong' };
}

function updateStrengthMeter(password, barId, labelId) {
  const bar   = document.getElementById(barId);
  const label = document.getElementById(labelId);
  if (!bar || !label) return;

  if (!password) {
    bar.classList.remove('visible');
    label.classList.remove('visible');
    return;
  }

  const { level, segments, label: text } = getStrength(password);
  const segs = bar.querySelectorAll('.strength-segment');

  bar.classList.add('visible');
  label.classList.add('visible');

  segs.forEach((s, i) => {
    s.className = 'strength-segment';
    if (i < segments) s.classList.add(level);
  });

  label.className = `strength-label visible ${level}`;
  label.textContent = `Password strength: ${text}`;
}

/* ════════════════════════════════════════════════════════════
   PASSWORD TOGGLE
════════════════════════════════════════════════════════════ */
function togglePassword(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btnEl.textContent = isHidden ? '🙈' : '👁';
}

/* ════════════════════════════════════════════════════════════
   BUTTON LOADING STATE
════════════════════════════════════════════════════════════ */
function setBtnLoading(btn, loading) {
  if (loading) {
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

/* ════════════════════════════════════════════════════════════
   TERMINAL TYPEWRITER
════════════════════════════════════════════════════════════ */
function startTypewriter(elId, lines, speed = 50) {
  const el = document.getElementById(elId);
  if (!el) return;

  let lineIdx = 0, charIdx = 0;
  const cursor = '<span class="terminal-cursor"></span>';

  function type() {
    if (lineIdx >= lines.length) { lineIdx = 0; }
    const line = lines[lineIdx];

    if (charIdx < line.length) {
      el.innerHTML = line.slice(0, charIdx + 1) + cursor;
      charIdx++;
      setTimeout(type, speed);
    } else {
      setTimeout(() => {
        charIdx = 0;
        lineIdx++;
        el.innerHTML = cursor;
        setTimeout(type, 300);
      }, 2000);
    }
  }

  type();
}

/* ════════════════════════════════════════════════════════════
   PARTICLE SYSTEM
════════════════════════════════════════════════════════════ */
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const colors = ['#00e5ff', '#a020f0', '#ff2d95', '#00ff88'];
  const COUNT  = 25;

  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';

    const x     = Math.random() * 100;
    const delay = Math.random() * 15;
    const dur   = 10 + Math.random() * 20;
    const size  = 1 + Math.random() * 3;
    const color = colors[Math.floor(Math.random() * colors.length)];

    p.style.cssText = `
      left: ${x}%;
      bottom: -10px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      box-shadow: 0 0 ${size * 3}px ${color};
      animation-delay: ${delay}s;
      animation-duration: ${dur}s;
    `;

    container.appendChild(p);
  }
}

/* ════════════════════════════════════════════════════════════
   VALIDATION RULES
════════════════════════════════════════════════════════════ */
const Rules = {
  username(val) {
    if (!val.trim())         return 'Username is required.';
    if (val.trim().length < 3)   return 'Username must be at least 3 characters.';
    if (val.trim().length > 20)  return 'Username cannot exceed 20 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(val.trim())) return 'Only letters, numbers and underscores allowed.';
    return null;
  },
  password(val) {
    if (!val)                return 'Password is required.';
    if (val.length < 6)      return 'Password must be at least 6 characters.';
    return null;
  },
  confirmPassword(val, original) {
    if (!val)                return 'Please confirm your password.';
    if (val !== original)    return 'Passwords do not match.';
    return null;
  }
};

/* ════════════════════════════════════════════════════════════
   LOGIN PAGE
════════════════════════════════════════════════════════════ */
function initLoginPage() {
  const form  = document.getElementById('loginForm');
  if (!form) return;

  const usernameEl = document.getElementById('loginUsername');
  const passwordEl = document.getElementById('loginPassword');
  const submitBtn  = document.getElementById('loginBtn');

  /* Live validation */
  usernameEl.addEventListener('blur', () => {
    const err = Rules.username(usernameEl.value);
    err ? setFieldState(usernameEl, 'error', err)
        : setFieldState(usernameEl, 'success');
  });

  usernameEl.addEventListener('input', () => clearField(usernameEl));
  passwordEl.addEventListener('input', () => clearField(passwordEl));

  /* Submit */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('loginAlert');

    const username = usernameEl.value.trim();
    const password = passwordEl.value;

    /* Client-side validation */
    let valid = true;
    const uErr = Rules.username(username);
    const pErr = Rules.password(password);

    if (uErr) { setFieldState(usernameEl, 'error', uErr); valid = false; }
    else        setFieldState(usernameEl, 'success');

    if (pErr) { setFieldState(passwordEl, 'error', pErr); valid = false; }
    else        setFieldState(passwordEl, 'success');

    if (!valid) return;

    setBtnLoading(submitBtn, true);

    /* Simulate async auth (replace with fetch('/api/login', ...) later) */
    await delay(900);

    if (!UserStore.exists(username)) {
      setBtnLoading(submitBtn, false);
      setFieldState(usernameEl, 'error', 'Username not found.');
      showAlert('loginAlert', 'No account found with that username. Please sign up first.', 'error');
      return;
    }

    if (!UserStore.verify(username, password)) {
      setBtnLoading(submitBtn, false);
      setFieldState(passwordEl, 'error', 'Incorrect password.');
      showAlert('loginAlert', 'Authentication failed. Please check your credentials.', 'error');
      return;
    }

    /* Success */
    Session.set(username);
    showAlert('loginAlert', `Access granted. Welcome back, ${username}!`, 'success');
    showToast(`Authenticated as ${username}`, 'success');

    await delay(1400);
    /* Redirect to a dashboard or back to index */
    window.location.href = `index.html?user=${encodeURIComponent(username)}`;
  });

  /* Typewriter */
  startTypewriter('loginTerminal', [
    '> INITIALIZING AUTH MODULE...',
    '> CONNECTING TO ASSEMBLY BACKEND...',
    '> AWAITING CREDENTIALS...',
    '> x86 VERIFY ROUTINE LOADED',
  ], 45);
}

/* ════════════════════════════════════════════════════════════
   SIGNUP PAGE
════════════════════════════════════════════════════════════ */
function initSignupPage() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  const usernameEl = document.getElementById('signupUsername');
  const passwordEl = document.getElementById('signupPassword');
  const confirmEl  = document.getElementById('signupConfirm');
  const submitBtn  = document.getElementById('signupBtn');

  /* Live validation & strength meter */
  usernameEl.addEventListener('blur', () => {
    const err = Rules.username(usernameEl.value);
    err ? setFieldState(usernameEl, 'error', err)
        : setFieldState(usernameEl, 'success');
  });
  usernameEl.addEventListener('input', () => clearField(usernameEl));

  passwordEl.addEventListener('input', () => {
    clearField(passwordEl);
    updateStrengthMeter(passwordEl.value, 'strengthBar', 'strengthLabel');
  });

  confirmEl.addEventListener('input', () => {
    clearField(confirmEl);
    if (confirmEl.value && confirmEl.value === passwordEl.value) {
      setFieldState(confirmEl, 'success');
    }
  });

  /* Submit */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('signupAlert');

    const username = usernameEl.value.trim();
    const password = passwordEl.value;
    const confirm  = confirmEl.value;

    let valid = true;

    const uErr = Rules.username(username);
    const pErr = Rules.password(password);
    const cErr = Rules.confirmPassword(confirm, password);

    if (uErr) { setFieldState(usernameEl, 'error', uErr); valid = false; }
    else        setFieldState(usernameEl, 'success');

    if (pErr) { setFieldState(passwordEl, 'error', pErr); valid = false; }
    else        setFieldState(passwordEl, 'success');

    if (cErr) { setFieldState(confirmEl, 'error', cErr); valid = false; }
    else        setFieldState(confirmEl, 'success');

    if (!valid) return;

    setBtnLoading(submitBtn, true);
    await delay(1000);

    if (UserStore.exists(username)) {
      setBtnLoading(submitBtn, false);
      setFieldState(usernameEl, 'error', 'Username already taken.');
      showAlert('signupAlert', `Username "${username}" is already registered. Please choose another.`, 'error');
      return;
    }

    /* Register user */
    UserStore.add(username, password);

    showAlert('signupAlert', `Account created successfully for ${username}! Redirecting to login...`, 'success');
    showToast('Account registered!', 'success');

    await delay(1600);
    window.location.href = 'login.html';
  });

  /* Typewriter */
  startTypewriter('signupTerminal', [
    '> LOADING SIGNUP MODULE...',
    '> HASH ENGINE READY',
    '> USERS.TXT FILE LINKED',
    '> READY TO REGISTER USER',
  ], 45);
}

/* ════════════════════════════════════════════════════════════
   INDEX PAGE
════════════════════════════════════════════════════════════ */
function initIndexPage() {
  /* Check if user just logged in */
  const params = new URLSearchParams(window.location.search);
  const user = params.get('user');
  if (user) {
    showToast(`Welcome back, ${decodeURIComponent(user)}! ✓`, 'success');
    /* Clean the URL */
    history.replaceState(null, '', 'index.html');
  }

  /* Animate feature cards on scroll */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card').forEach(card => {
    observer.observe(card);
  });

  /* Typewriter */
  startTypewriter('indexTerminal', [
    '> SYSTEM ONLINE',
    '> COAL PROJECT v1.0 LOADED',
    '> ASSEMBLY AUTH READY',
    '> FLASK BACKEND STANDBY',
  ], 45);
}

/* ════════════════════════════════════════════════════════════
   SHARED INIT
════════════════════════════════════════════════════════════ */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener('DOMContentLoaded', () => {
  /* Create toast element if missing */
  if (!document.getElementById('toast')) {
    const t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }

  initParticles();

  /* Detect page */
  const path = window.location.pathname;
  if (path.includes('login'))  initLoginPage();
  if (path.includes('signup')) initSignupPage();
  if (path.includes('index') || path.endsWith('/') || path.endsWith('.html') && !path.includes('login') && !path.includes('signup')) {
    initIndexPage();
  }

  /* Stagger nav items */
  document.querySelectorAll('[data-stagger]').forEach((el, i) => {
    el.style.animationDelay = `${i * 0.1}s`;
  });
});
