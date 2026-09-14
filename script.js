// --- KONFIGURASI DATABASE ---
const URL_DATABASE_GOOGLE = "https://script.google.com/macros/s/AKfycbzEAe5HAwU_VwT7Plgej6YVKENp-zVaX3FOUb_98xxFluHuVq-pmRDJI9gnAy";

// --- ELEMEN DOM ---
const csvFileInput = document.getElementById('csvFileInput');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const teacherLogin = document.getElementById('teacherLogin');
const teacherDashboard = document.getElementById('teacherDashboard');
const userNameInput = document.getElementById('userNameInput');

let parsedStudents = [];
let currentActiveStudent = null;

// --- LOGIKA SISWA: UPLOAD & PARSING CSV ---
csvFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        processCSV(event.target.result);
    };
    reader.readAsText(file);
});

function processCSV(csvText) {
    const rows = csvText.split('\n');
    parsedStudents = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (row === '') continue;
        const cols = row.split(',').map(col => col.replace(/(^"|"$)/g, ''));
        if (cols.length >= 2) {
            parsedStudents.push({ nisn: cols[0], nama: cols[1] });
        }
    }

    if (parsedStudents.length > 0) {
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
    } else {
        alert("Gagal membaca data. Pastikan format CSV benar!");
    }
}

// --- LOGIKA SISWA: LOGIN MANUAL ---
function masukKeTugas() {
    const typedName = userNameInput.value.trim().toLowerCase();
    if (typedName === "") { alert("Silakan ketik nama Anda terlebih dahulu!"); return; }

    currentActiveStudent = parsedStudents.find(s => s.nama.toLowerCase() === typedName);

    if (currentActiveStudent) {
        document.getElementById('welcomeMessage').textContent = `Selamat Datang, ${currentActiveStudent.nama}!`;
        document.getElementById('userNisn').textContent = `NISN: ${currentActiveStudent.nisn}`;
        step2.classList.add('hidden');
        step3.classList.remove('hidden');
    } else {
        alert("Akses Ditolak! Nama tidak ditemukan. Pastikan ejaan sesuai dengan data sistem.");
        userNameInput.value = '';
    }
}

// --- LOGIKA SISWA: KUMPUL TUGAS (REAL-TIME KE GOOGLE SHEETS) ---
document.getElementById('taskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const tugas = document.getElementById('taskContent').value;
    
    if(tugas.length < 20) { alert("Catatan terlalu singkat. Jelaskan lebih detail!"); return; }

    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    btnSubmit.disabled = true;

    const dataTugas = {
        waktu: new Date().toLocaleString('id-ID'),
        nisn: currentActiveStudent.nisn,
        nama: currentActiveStudent.nama,
        isiTugas: tugas
    };

    fetch(URL_DATABASE_GOOGLE, {
        method: 'POST',
        body: JSON.stringify(dataTugas)
    })
    .then(response => response.json())
    .then(data => {
        alert("Luar biasa! Tugas berhasil dikirim ke server sekolah.");
        document.getElementById('taskContent').value = '';
        btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Kumpulkan Tugas';
        btnSubmit.disabled = false;
    })
    .catch(error => {
        alert("Gagal mengirim tugas. Cek koneksi internet Anda.");
        btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Kumpulkan Tugas';
        btnSubmit.disabled = false;
    });
});

// --- LOGIKA GURU: NAVIGASI & AUTENTIKASI ---
function tampilLoginGuru() {
    step1.classList.add('hidden');
    step2.classList.add('hidden');
    step3.classList.add('hidden');
    teacherDashboard.classList.add('hidden');
    teacherLogin.classList.remove('hidden');
}

function kembaliKeSiswa() {
    teacherLogin.classList.add('hidden');
    teacherDashboard.classList.add('hidden');
    step1.classList.remove('hidden');
    userNameInput.value = '';
    csvFileInput.value = '';
}

function validasiGuru() {
    const user = document.getElementById('guruUsername').value;
    const pass = document.getElementById('guruPassword').value;

    if (user === 'guru' && pass === 'admin123') {
        teacherLogin.classList.add('hidden');
        teacherDashboard.classList.remove('hidden');
        renderTabelTugas();
        document.getElementById('guruUsername').value = '';
        document.getElementById('guruPassword').value = '';
    } else {
        alert("Username atau Password Guru Salah!");
    }
}

// --- LOGIKA GURU: RENDER DASHBOARD (REAL-TIME DARI GOOGLE SHEETS) ---
function renderTabelTugas() {
    const tbody = document.getElementById('taskTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Mengambil data dari server secara real-time...</td></tr>';
    
    fetch(URL_DATABASE_GOOGLE)
    .then(response => response.json())
    .then(data => {
        tbody.innerHTML = '';
        if(data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Belum ada siswa yang mengumpulkan tugas.</td></tr>';
            return;
        }

        data.reverse().forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><small>${t.waktu}</small></td>
                <td>${t.nisn}</td>
                <td><strong>${t.nama}</strong></td>
                <td><div class="tugas-teks">${t.isiTugas}</div></td>
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(error => {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red; padding: 20px;">Gagal memuat data dari server.</td></tr>';
    });
}