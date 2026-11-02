const form = document.getElementById('loginForm');
const errorBox = document.getElementById('errorBox');
const loginBtn = document.getElementById('loginBtn');
const btnText = document.getElementById('btnText');
const togglePw = document.getElementById('togglePw');

// إظهار / إخفاء كلمة السر
togglePw.addEventListener('click', () => {
  const show = form.password.type === 'password';
  form.password.type = show ? 'text' : 'password';
  togglePw.classList.toggle('on', show);
  togglePw.setAttribute('aria-label', show ? 'Hide Password' : 'Show Password');
});

function fail(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
  loginBtn.disabled = false;
  btnText.textContent = 'login';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.style.display = 'none';
  loginBtn.disabled = true;
  btnText.textContent = 'login...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email: form.email.value.trim(), password: form.password.value }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      fail(data.error || 'Failed to login');
      return;
    }
    window.location.href = '/admin.html';
  } catch {
    fail('Failed to connect to the server');
  }
});