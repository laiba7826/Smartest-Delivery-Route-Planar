/* =========================================
   SMART ROUTE DELIVERY PLANNER - index.js
   ========================================= */

'use strict';

// ---- Redirect if already logged in ----
(function checkAuth() {
  const session = localStorage.getItem('srdp_session');
  if (session) {
    window.location.href = 'dashboard.html';
  }
})();

// ============================
//  MODAL SYSTEM
// ============================
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
  clearAlerts();
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('active');
  document.body.style.overflow = '';
  clearAlerts();
}

function closeModalOutside(e, id) {
  if (e.target === document.getElementById(id)) {
    closeModal(id);
  }
}

function switchModal(closeId, openId) {
  closeModal(closeId);
  setTimeout(() => openModal(openId), 200);
}

function clearAlerts() {
  document.querySelectorAll('.alert-custom').forEach(el => {
    el.textContent = '';
    el.className = 'alert-custom';
  });
}

// ---- ESC key to close modals ----
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    ['loginModal', 'signupModal'].forEach(id => closeModal(id));
  }
});

// ============================
//  PASSWORD TOGGLE
// ============================
function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon = btn.querySelector('i');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'bi bi-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'bi bi-eye';
  }
}

// ============================
//  AUTH HELPERS
// ============================
function showAlert(elId, message, type = 'error') {
  const el = document.getElementById(elId);
  if (!el) return;
  const icon = type === 'error' ? '<i class="bi bi-exclamation-triangle-fill me-1"></i>' : '<i class="bi bi-check-circle-fill me-1"></i>';
  el.innerHTML = icon + message;
  el.className = `alert-custom show-${type}`;
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('srdp_users') || '{}');
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem('srdp_users', JSON.stringify(users));
}

function setSession(username) {
  const session = {
    username,
    loginTime: Date.now(),
    expires: Date.now() + 86400000 // 24 hours
  };
  localStorage.setItem('srdp_session', JSON.stringify(session));
}

// ============================
//  SIGNUP HANDLER
// ============================
async function handleSignup(e) {
  e.preventDefault();
  const username = document.getElementById('signupUsername').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirm  = document.getElementById('signupConfirm').value;
  const btn      = e.target.querySelector('.btn-submit');
  const btnText  = btn.querySelector('.btn-text');
  const btnLoad  = btn.querySelector('.btn-loader');

  clearAlerts();

  // Validation
  if (username.length < 3) {
    return showAlert('signupAlert', 'Username must be at least 3 characters.');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return showAlert('signupAlert', 'Username can only contain letters, numbers, and underscores.');
  }
  if (password.length < 6) {
    return showAlert('signupAlert', 'Password must be at least 6 characters.');
  }
  if (password !== confirm) {
    return showAlert('signupAlert', 'Passwords do not match.');
  }

  // Loading state
  btnText.classList.add('d-none');
  btnLoad.classList.remove('d-none');
  btn.disabled = true;

  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (response.ok) {
      setSession(result.username);
      showAlert('signupAlert', 'Account created! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      btnText.classList.remove('d-none');
      btnLoad.classList.add('d-none');
      btn.disabled = false;
      showAlert('signupAlert', result.message || 'Signup failed.');
    }
  } catch (err) {
    btnText.classList.remove('d-none');
    btnLoad.classList.add('d-none');
    btn.disabled = false;
    showAlert('signupAlert', 'Server connection error.');
  }
}

// ============================
//  LOGIN HANDLER
// ============================
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = e.target.querySelector('.btn-submit');
  const btnText  = btn.querySelector('.btn-text');
  const btnLoad  = btn.querySelector('.btn-loader');

  clearAlerts();

  if (!username || !password) {
    return showAlert('loginAlert', 'Please fill in all fields.');
  }

  // Loading state
  btnText.classList.add('d-none');
  btnLoad.classList.remove('d-none');
  btn.disabled = true;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (response.ok) {
      setSession(result.username);
      showAlert('loginAlert', 'Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      btnText.classList.remove('d-none');
      btnLoad.classList.add('d-none');
      btn.disabled = false;
      showAlert('loginAlert', result.message || 'Login failed.');
    }
  } catch (err) {
    btnText.classList.remove('d-none');
    btnLoad.classList.add('d-none');
    btn.disabled = false;
    showAlert('loginAlert', 'Server connection error.');
  }
}

// ============================
//  NAVBAR SCROLL EFFECT
// ============================
window.addEventListener('scroll', function() {
  const nav = document.querySelector('.glass-nav');
  if (!nav) return;
  if (window.scrollY > 50) {
    nav.style.borderBottomColor = 'rgba(59,130,246,0.2)';
    nav.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
  } else {
    nav.style.borderBottomColor = '';
    nav.style.boxShadow = '';
  }
});

// ============================
//  INTERSECTION OBSERVER
// ============================
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  const animatedEls = document.querySelectorAll('.feature-card, .step-card, .stat-chip');
  animatedEls.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s`;
    observer.observe(el);
  });
});
