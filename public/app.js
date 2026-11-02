const form = document.getElementById('membershipForm');
const errorBox = document.getElementById('errorBox');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  const payload = {
    full_name: form.full_name.value.trim(),
    email: form.email.value.trim(),
    passport_number: form.passport_number.value.trim(),
  };

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      errorBox.textContent = data.error || 'An error occurred, please try again';
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Request';
      return;
    }

    window.location.href = '/thank-you.html';
  } catch {
    errorBox.textContent = 'Failed to connect to the server, please try again';
    errorBox.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Request';
  }
});
