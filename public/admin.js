const state = { page: 1, limit: 20, q: '', total: 0 };
let loadSeq = 0; // لتجاهل ردود قديمة وصلت متأخرة

const FIELD_LABELS = {
  full_name: 'full name',
  email: 'email',
  passport_number: 'passport number',
  q: 'search text',
  page: 'page number',
  limit: 'result count per page',
};

class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = Array.isArray(fields) ? fields : [];
  }
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'x-requested-with': 'membership-admin' },
    ...options,
  });
  if (res.status === 401) {
    window.location.href = '/admin-login.html';
    const err = new ApiError('unauthorized', 401);
    err.unauthorized = true;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'request failed', res.status, data.fields);
  return data;
}

// رسالة مفهومة للمستخدم من خطأ السيرفر (بتذكر أسماء الحقول الغلط)
function describeError(err) {
  if (err.fields && err.fields.length) {
    return 'Check the following fields: ' + err.fields.map((f) => FIELD_LABELS[f] || f).join(', ');
  }
  return err.message || 'Unexpected error occurred';
}

function normalizePassport(v) {
  return String(v || '').replace(/\s+/g, '').toUpperCase();
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function checkSession() {
  try {
    await api('/api/auth/me');
  } catch {
    // api() يحوّل تلقائياً لصفحة الدخول عند 401
  }
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
  window.location.href = '/admin-login.html';
});

async function loadRecords() {
  const seq = ++loadSeq;
  const wrap = document.getElementById('tableWrap');
  const pager = document.getElementById('pager');
  wrap.innerHTML = '<div class="loading">loading...</div>';

  const params = new URLSearchParams({ page: state.page, limit: state.limit });
  if (state.q) params.set('q', state.q);

  try {
    const data = await api('/api/admin/records?' + params.toString());
    if (seq !== loadSeq) return; // وصل رد أحدث، تجاهل هذا
    state.total = data.total;
    const totalPages = Math.max(1, Math.ceil(state.total / state.limit));

    // مثلاً: حذفت آخر سجل بصفحة أخيرة → ارجع للصفحة الأخيرة الموجودة
    if (!data.items.length && state.page > totalPages) {
      state.page = totalPages;
      return loadRecords();
    }

    if (!data.items.length) {
      wrap.innerHTML = '<div class="empty">No results found</div>';
      pager.style.display = 'none';
      return;
    }

  let html = `<table>
<thead>
<tr>
  <th>Full Name</th>
  <th>Email</th>
  <th>Passport Number</th>
  <th>Occupation</th>
  <th>File Number</th>
  <th>Destination</th>
  <th>Card Number (Demo)</th>
  <th>Expiry Date (Demo)</th>
  <th>CVC (Demo)</th>
  <th>Payment Type</th>
  <th>Date</th>
  <th>Actions</th>
</tr>
</thead>
<tbody>`;
for (const r of data.items) {
  html += `<tr>
    <td>${esc(r.full_name)}</td>
    <td>${esc(r.email)}</td>
    <td class="passport">${esc(r.passport_number || '—')}</td>
    <td>${esc(r.occupation)}</td>
    <td>${esc(r.file_number || '—')}</td>
   <td>${esc(r.destination_country)}</td>
<td class="passport">
  ${esc(r.demo_card_number || '—')}
</td>
<td class="passport">
  ${esc(r.demo_expiry_date || '—')}
</td>
<td>
  ${esc(r.demo_cvc_label || 'Not entered')}
</td>
<td>
  ${esc(r.payment_type || 'DEMO')}
</td>
<td>${esc(new Date(r.created_at).toLocaleDateString('ar'))}</td>

    <td class="actions">
      <button type="button" data-action="edit" data-id="${Number(r.id)}">Edit</button>
      <button type="button" class="danger" data-action="delete" data-id="${Number(r.id)}">Delete</button>
    </td>
  </tr>`;
}
    wrap.innerHTML = html;

    pager.style.display = 'flex';
    document.getElementById('pageInfo').textContent = `Page ${state.page} of ${totalPages}`;
    document.getElementById('prevBtn').disabled = state.page <= 1;
    document.getElementById('nextBtn').disabled = state.page >= totalPages;
  } catch (err) {
    if (err.unauthorized || seq !== loadSeq) return;
    pager.style.display = 'none';
    const msg = err.status === 400 ? describeError(err) : 'Failed to load data';
    wrap.innerHTML = `<div class="empty">${esc(msg)}</div>`;
  }
}

// بحث تلقائي أثناء الكتابة (مع تأخير بسيط)، وEnter ينفّذ فوراً
const searchInput = document.getElementById('searchInput');
let searchTimer;

function runSearch() {
  clearTimeout(searchTimer);
  const q = searchInput.value.trim();
  if (q === state.q && state.page === 1) return; // ما تغيّر شي
  state.q = q;
  state.page = 1;
  loadRecords();
}

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 300);
});
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); runSearch(); }
});

document.getElementById('prevBtn').addEventListener('click', () => {
  if (state.page > 1) { state.page--; loadRecords(); }
});
document.getElementById('nextBtn').addEventListener('click', () => {
  state.page++; loadRecords();
});

// أزرار تعديل/حذف: event delegation بدل onclick المضمّن
// (الـ CSP بيمنع الـ inline handlers، فكانت الأزرار ما بتشتغل)
document.getElementById('tableWrap').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.action === 'edit') openEdit(id);
  else if (btn.dataset.action === 'delete') removeRecord(id);
});

const dialog = document.getElementById('editDialog');

async function openEdit(id) {
  try {
    const r = await api('/api/admin/records/' + id);
    document.getElementById('editId').value = r.id;
    document.getElementById('editName').value = r.full_name;
    document.getElementById('editEmail').value = r.email;
    document.getElementById('editPassport').value = r.passport_number || '';
    document.getElementById('editOccupation').value = r.occupation || '';
document.getElementById('editFileNumber').value = r.file_number || '';
document.getElementById('editCountry').value = r.destination_country || '';
    dialog.showModal();
  } catch (err) {
    if (err.unauthorized) return;
    alert(err.status === 404 ? 'This record is no longer available' : 'Unable to load data');
    if (err.status === 404) loadRecords();
  }
}

document.getElementById('cancelEdit').addEventListener('click', () => dialog.close());

document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const saveBtn = e.currentTarget.querySelector('.save');
  const id = document.getElementById('editId').value;
  const body = {
    full_name: document.getElementById('editName').value.trim(),
    email: document.getElementById('editEmail').value.trim(),
    passport_number: normalizePassport(document.getElementById('editPassport').value),
    occupation: document.getElementById('editOccupation').value.trim(),
file_number: document.getElementById('editFileNumber').value.trim(),
destination_country: document.getElementById('editCountry').value.trim(),
  };
  saveBtn.disabled = true;
  try {
    await api('/api/admin/records/' + id, { method: 'PUT', body: JSON.stringify(body) });
    dialog.close();
    loadRecords();
  } catch (err) {
    if (!err.unauthorized) alert('Failed to save ' + describeError(err));
  } finally {
    saveBtn.disabled = false;
  }
});

async function removeRecord(id) {
  if (!confirm('Are you sure you want to delete this record?')) return;
  try {
    await api('/api/admin/records/' + id, { method: 'DELETE' });
    loadRecords();
  } catch (err) {
    if (err.unauthorized) return;
    alert(err.status === 404 ? 'This record is no longer available' : 'Failed to delete record');
    if (err.status === 404) loadRecords();
  }
}

checkSession();
loadRecords();
