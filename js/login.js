document.addEventListener('DOMContentLoaded', () => {
    // Cek apakah user sudah login. Jika ya, redirect ke recipes.html
    if (localStorage.getItem('userFirstName')) {
        window.location.href = 'recipes.html';
        return;
    }

    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const spinner = document.getElementById('loading-spinner');
    const buttonText = document.getElementById('button-text');
    const messageContainer = document.getElementById('message-container');

    // Base URL untuk API Users DummyJSON
    const API_URL = 'https://dummyjson.com/users';

    /**
     * Menampilkan pesan dinamis (error atau success).
     * @param {string} text - Isi pesan.
     * @param {string} type - Tipe pesan ('success' atau 'error').
     */
    function showMessage(text, type) {
        messageContainer.innerHTML = `<div class="message ${type}">${text}</div>`;
        
        // Hilangkan pesan setelah 5 detik
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }

    /**
     * Mengubah state tombol saat proses loading.
     * @param {boolean} isLoading - True untuk menampilkan loading, false sebaliknya.
     */
    function toggleLoadingState(isLoading) {
        loginButton.disabled = isLoading;
        if (isLoading) {
            spinner.classList.remove('hidden');
            buttonText.classList.add('hidden');
        } else {
            spinner.classList.add('hidden');
            buttonText.classList.remove('hidden');
        }
    }

    /**
     * Mengambil dan memvalidasi kredensial login.
     * @param {string} username - Username yang dimasukkan.
     * @param {string} password - Password yang dimasukkan.
     */
    async function handleLogin(username, password) {
        toggleLoadingState(true);
        messageContainer.innerHTML = ''; // Hapus pesan sebelumnya

        // Validasi sisi klien: password tidak boleh kosong
        if (!password.trim()) {
            showMessage('Password cannot be empty!', 'error');
            toggleLoadingState(false);
            return;
        }

        try {
            // Menggunakan fetch untuk mengambil semua user
            // Dalam implementasi nyata, akan lebih baik menggunakan endpoint login/autentikasi
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            const users = data.users || [];

            // Cari user yang cocok
            const user = users.find(u => u.username === username);

            if (user) {
                // Asumsi: DummyJSON tidak menyediakan endpoint login/password hashing
                // Cek username saja, sesuai instruksi (password tidak boleh kosong sudah dicek)
                
                // 1. Simpan firstName ke localStorage
                localStorage.setItem('userFirstName', user.firstName);
                
                // 2. Tampilkan success message
                showMessage(`Login Success! Welcome, ${user.firstName}. Redirecting...`, 'success');

                // 3. Redirect setelah jeda sebentar
                setTimeout(() => {
                    window.location.href = 'recipes.html';
                }, 1500);

            } else {
                // Username tidak ditemukan
                showMessage('Invalid username or credentials.', 'error');
            }

        } catch (error) {
            console.error('Login error:', error);
            // Error handling untuk koneksi API bermasalah
            showMessage('An error occurred. Check your network connection or API status.', 'error');
        } finally {
            // Hentikan loading state jika tidak ada redirect
            if (!localStorage.getItem('userFirstName')) {
                toggleLoadingState(false);
            }
        }
    }

    // Event Listener untuk submit form
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value; // Tidak perlu trim untuk password
        
        handleLogin(username, password);
    });
});