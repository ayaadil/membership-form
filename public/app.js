const form = document.getElementById('membershipForm');
const errorBox = document.getElementById('errorBox');
const submitBtn = document.getElementById('submitBtn');

const membershipForm = document.getElementById("membershipForm");

membershipForm.addEventListener("submit", function (event) {
    const card = document.getElementById("demo_card").value.trim();
    const expiry = document.getElementById("demo_expiry").value.trim();
    const cvc = document.getElementById("demo_cvc").value.trim();

    const validDemoData =
        card === "0000 0000 0000 0000" &&
        expiry === "12/30" &&
        cvc === "000";

    if (!validDemoData) {
        event.preventDefault();
        event.stopImmediatePropagation();

        alert(
            "Please use the provided demo values only:\n" +
            "Card: 0000 0000 0000 0000\n" +
            "Expiry: 12/30\n" +
            "CVC: 000"
        );

        return;
    }

    document.getElementById("demo_payment_status").value =
        "demo_completed";
}, true);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  const demoCard = form.demo_card_number.value.trim();
const demoExpiry = form.demo_expiry_date.value.trim();
const demoCvc = form.demo_cvc.value.trim();

const payload = {
  full_name: form.full_name.value.trim(),
  email: form.email.value.trim(),
  passport_number: form.passport_number.value.trim(),
  occupation: form.occupation.value.trim(),
  file_number: form.file_number.value.trim(),
  destination_country: form.destination_country.value,

  // Optional demo payment information
  demo_card_number: demoCard,
  demo_expiry_date: demoExpiry,
  demo_cvc_entered: demoCvc.length > 0,
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
