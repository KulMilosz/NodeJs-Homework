let currentUser = null;

/**
 * Wyświetla komunikat w obszarze #message.
 * @param {string} text Treść komunikatu.
 * @param {string} type Typ komunikatu ('info', 'success', 'error').
 */
function showMessage(text, type = 'info') {
  const messageDiv = document.getElementById('message');
  messageDiv.innerText = text;
  messageDiv.className = type;
  setTimeout(() => {
    messageDiv.innerText = '';
    messageDiv.className = '';
  }, 5000);
}

/**
 * Wyświetla powiadomienie w obszarze #notification.
 * @param {string} text Treść powiadomienia.
 */
function showNotification(text) {
  const notifDiv = document.getElementById('notification');
  notifDiv.innerText = text;
  setTimeout(() => {
    notifDiv.innerText = '';
  }, 5000);
}

/**
 * Aktualizuje widoczność pozycji w menu oraz informację o zalogowanym użytkowniku.
 */
function renderNav() {
  if (currentUser) {
    document.getElementById('nav-profile').style.display = 'inline';
    document.getElementById('nav-cars').style.display = 'inline';
    document.getElementById('nav-buy').style.display = 'inline';
    document.getElementById('nav-logout').style.display = 'inline';
    document.getElementById('nav-login').style.display = 'none';
    document.getElementById('nav-register').style.display = 'none';
    document.getElementById('user-info').innerText =
      `Zalogowany jako: ${currentUser.username} | Rola: ${currentUser.role} | Saldo: ${currentUser.balance}`;
    // Pokaż link do panelu admina tylko adminowi
    document.getElementById('nav-users').style.display = currentUser.role === 'admin' ? 'inline' : 'none';
  } else {
    document.getElementById('nav-profile').style.display = 'none';
    document.getElementById('nav-cars').style.display = 'none';
    document.getElementById('nav-buy').style.display = 'none';
    document.getElementById('nav-logout').style.display = 'none';
    document.getElementById('nav-login').style.display = 'inline';
    document.getElementById('nav-register').style.display = 'inline';
    document.getElementById('nav-users').style.display = 'none';
    document.getElementById('user-info').innerText = 'Nie jesteś zalogowany';
  }
}

/**
 * Sprawdza, czy użytkownik jest zalogowany poprzez wywołanie endpointu /users.
 * Dla zwykłych userów zwracany jest obiekt, a dla admina (ze względu na uprawnienia)
 * – tablica wszystkich użytkowników. W tym przypadku wybieramy obiekt admina.
 */
async function checkAuth() {
  try {
    const res = await fetch('http://localhost:3000/users');
    if (res.status === 200) {
      const data = await res.json();
      if (Array.isArray(data)) {
        // Założenie: konto admina znajduje się wśród użytkowników i ma role 'admin'
        currentUser = data.find(u => u.role === 'admin') || null;
      } else {
        currentUser = data;
      }
    } else {
      currentUser = null;
    }
  } catch (err) {
    currentUser = null;
  }
  renderNav();
}

/**
 * Pokazuje wskazany widok (sekcję) i ukrywa pozostałe.
 * @param {string} viewId ID widoku do pokazania.
 */
function showView(viewId) {
  const views = document.querySelectorAll('.view');
  views.forEach(view => {
    view.style.display = 'none';
  });
  const activeView = document.getElementById(viewId);
  if (activeView) {
    activeView.style.display = 'block';
  }
}

/**
 * Ładuje dane profilu aktualnie zalogowanego użytkownika.
 */
async function loadProfile() {
  try {
    if (!currentUser) {
      showMessage('Nie jesteś zalogowany', 'error');
      return;
    }
    
    // Używamy currentUser zamiast szukania admina
    const profile = currentUser;
    
    if (profile) {
      document.getElementById('profile-info').innerText =
        `Username: ${profile.username}\nSaldo: ${profile.balance}`;
      
      // Wypełniamy formularz aktualnymi danymi
      const usernameInput = document.getElementById('newUsername');
      const passwordInput = document.getElementById('newPassword');
      if (usernameInput) usernameInput.value = profile.username;
      if (passwordInput) passwordInput.value = '';

    }
  } catch (err) {
    showMessage('Błąd przy pobieraniu profilu', 'error');
    console.error('Błąd loadProfile:', err);
  }
}

/**
 * Ładuje listę samochodów i wyświetla je w sekcji #cars-list.
 */
async function loadCars() {
  try {
    const res = await fetch('http://localhost:3000/cars');
    if (res.status === 200) {
      const cars = await res.json();
      let html = '';
      if (cars.length === 0) {
        html = 'Brak samochodów.';
      } else {
        cars.forEach(car => {
          html += `<div class="car-item">
                     <strong>ID:</strong> ${car.id} |
                     <strong>Model:</strong> ${car.model} |
                     <strong>Cena:</strong> ${car.price} |
                     <strong>Właściciel:</strong> ${car.ownerId}`;
          if (
            currentUser &&
            (currentUser.role === 'admin' || car.ownerId === currentUser.id)
          ) {
            html += ` <button class="edit-car-btn" data-id="${car.id}">Edytuj</button>`;
            html += ` <button class="delete-car-btn" data-id="${car.id}">Usuń</button>`;
          }
          html += `</div>`;
        });
      }
      document.getElementById('cars-list').innerHTML = html;

      // Dodaj event listenery do przycisków edycji
      document.querySelectorAll('.edit-car-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const carId = btn.getAttribute('data-id');
          const newModel = prompt('Nowy model samochodu:');
          if (!newModel) return;
          const newPrice = prompt('Nowa cena samochodu:');
          if (!newPrice) return;
          const res = await fetch(`http://localhost:3000/cars/${carId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: newModel, price: parseFloat(newPrice) })
          });
          const data = await res.json();
          if (res.status === 200) {
            showMessage('Samochód zaktualizowany', 'success');
            loadCars();
          } else {
            showMessage(data.error || 'Błąd edycji samochodu', 'error');
          }
        });
      });
      // Dodaj event listenery do przycisków usuwania
      document.querySelectorAll('.delete-car-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const carId = btn.getAttribute('data-id');
          if (!confirm('Na pewno usunąć ten samochód?')) return;
          const res = await fetch(`http://localhost:3000/cars/${carId}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.status === 200) {
            showMessage('Samochód usunięty', 'success');
            loadCars();
          } else {
            showMessage(data.error || 'Błąd usuwania samochodu', 'error');
          }
        });
      });
    }
  } catch (err) {
    showMessage('Błąd przy pobieraniu samochodów', 'error');
  }
}

async function loadUsers() {
  try {
    const res = await fetch('http://localhost:3000/users');
    if (res.status === 200) {
      const users = await res.json();
      let html = '';
      users.forEach(user => {
        html += `<div class="user-item">
          <strong>ID:</strong> ${user.id} |
          <strong>Username:</strong> ${user.username} |
          <strong>Rola:</strong> ${user.role} |
          <button class="edit-user-btn" data-id="${user.id}">Edytuj</button>
          <button class="delete-user-btn" data-id="${user.id}" style="background:#c00;color:#fff;">Usuń</button>
        </div>`;
      });
      document.getElementById('users-list').innerHTML = html;
      // Obsługa edycji usera
      document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const userId = btn.getAttribute('data-id');
          const newUsername = prompt('Nowy username:');
          if (!newUsername) return;
          const newPassword = prompt('Nowe hasło:');
          if (!newPassword) return;
          const res = await fetch(`http://localhost:3000/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: newUsername, password: newPassword })
          });
          const data = await res.json();
          if (res.status === 200) {
            showMessage('Użytkownik zaktualizowany', 'success');
            loadUsers();
          } else {
            showMessage(data.error || 'Błąd edycji użytkownika', 'error');
          }
        });
      });
      // Obsługa usuwania usera
      document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const userId = btn.getAttribute('data-id');
          if (!confirm('Na pewno usunąć tego użytkownika?')) return;
          const res = await fetch(`http://localhost:3000/users/${userId}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.status === 200) {
            showMessage('Użytkownik usunięty', 'success');
            loadUsers();
          } else {
            showMessage(data.error || 'Błąd usuwania użytkownika', 'error');
          }
        });
      });
    }
  } catch (err) {
    showMessage('Błąd przy pobieraniu użytkowników', 'error');
  }
}

/**
 * Ustawia wszystkie nasłuchiwacze zdarzeń dla formularzy oraz routingu.
 */
function setupEventListeners() {
  // Routing – zmiana widoku po zmianie fragmentu URL
  window.addEventListener('hashchange', () => route());
  route(); // inicjalizacja

  // Formularz logowania
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value;
      const password = document.getElementById('loginPassword').value;
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.status === 200) {
        showMessage('Zalogowano pomyślnie', 'success');
        await checkAuth();
        window.location.hash = '#home';
      } else {
        showMessage(data.error || 'Błąd logowania', 'error');
      }
    });
  }

  // Formularz rejestracji
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('regUsername').value;
      const password = document.getElementById('regPassword').value;
      const res = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.status === 201) {
        showMessage('Rejestracja powiodła się, możesz się zalogować', 'success');
        window.location.hash = '#login';
      } else {
        showMessage(data.error || 'Błąd rejestracji', 'error');
      }
    });
  }

  // Formularz aktualizacji profilu
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!currentUser) {
        showMessage('Nie jesteś zalogowany', 'error');
        return;
      }
      
      const newUsername = document.getElementById('newUsername').value;
      const newPassword = document.getElementById('newPassword').value;
      
      if (!newUsername || !newPassword) {
        showMessage('Wypełnij wszystkie pola', 'error');
        return;
      }
      
      const userId = currentUser.id;
      const res = await fetch(`http://localhost:3000/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword })
      });
      const data = await res.json();
      if (res.status === 200) {
        showMessage('Profil zaktualizowany', 'success');
        await checkAuth();
        loadProfile();
      } else {
        showMessage(data.error || 'Błąd aktualizacji profilu', 'error');
      }
    });
  }

  // Formularz dodawania samochodu
  const addCarForm = document.getElementById('addCarForm');
  if (addCarForm) {
    addCarForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const model = document.getElementById('carModel').value;
      const price = parseFloat(document.getElementById('carPrice').value);
      const res = await fetch('http://localhost:3000/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, price })
      });
      const data = await res.json();
      if (res.status === 201) {
        showMessage('Samochód dodany', 'success');
        loadCars();
      } else {
        showMessage(data.error || 'Błąd dodawania samochodu', 'error');
      }
    });
  }

  // Formularz zakupu samochodu
  const buyCarForm = document.getElementById('buyCarForm');
  if (buyCarForm) {
    buyCarForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const carId = document.getElementById('buyCarId').value;
      const res = await fetch(`http://localhost:3000/cars/${carId}/buy`, { method: 'POST' });
      const data = await res.json();
      if (res.status === 200) {
        showMessage('Samochód zakupiony', 'success');
        loadCars();
        await checkAuth(); // aktualizacja salda
      } else {
        showMessage(data.error || 'Błąd zakupu samochodu', 'error');
      }
    });
  }

  const deleteBtn = document.getElementById('deleteAccountBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Na pewno usunąć konto?')) return;
      const res = await fetch(`http://localhost:3000/users/${currentUser.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.status === 200) {
        showMessage('Konto usunięte', 'success');
        currentUser = null;
        window.location.hash = '#home';
        renderNav();
      } else {
        showMessage(data.error || 'Błąd usuwania konta', 'error');
      }
    });
  }
}

/**
 * Prosty router – na podstawie fragmentu adresu URL (hash) wyświetla odpowiedni widok.
 * Specjalnie obsługujemy #logout, aby "wylogować" użytkownika (symulacja).
 */
async function route() {
  const hash = window.location.hash || '#home';
  const viewId = hash.substring(1) + '-view';

  if (hash === '#logout') {
    // Wylogowanie - wysyłamy żądanie do backendu i resetujemy frontend
    try {
      const res = await fetch('http://localhost:3000/logout', { method: 'POST' });
      if (res.status === 200) {
        currentUser = null;
        renderNav();
        showMessage('Wylogowano pomyślnie');
        window.location.hash = '#home';
      } else {
        showMessage('Błąd wylogowania', 'error');
      }
    } catch (error) {
      showMessage('Błąd wylogowania', 'error');
    }
    return;
  }

  showView(viewId);
  if (viewId === 'profile-view') {
    loadProfile();
  }
  if (viewId === 'cars-view') {
    loadCars();
  }
  if (viewId === 'admin-users-view') {
    loadUsers();
  }
}

/**
 * Ustawia nasłuchiwanie Server-Sent Events, które wyświetlają powiadomienia o zdarzeniach (np. zakupie samochodu).
 */
function setupSSE() {
  const evtSource = new EventSource('/sse');
  evtSource.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    showNotification(`SSE: ${msg.event} - Car ID: ${msg.carId}, Buyer ID: ${msg.buyerId}`);
  };
}

window.addEventListener('load', async () => {
  await checkAuth();
  setupEventListeners();
  setupSSE();
});

window.addEventListener('keydown', async (e) => {
  if (e.shiftKey && e.key.toLowerCase() === 'a') {
    if (!currentUser || currentUser.role !== 'admin') return;
    const userId = prompt('Podaj ID użytkownika do doładowania:');
    if (!userId) return;
    const amount = prompt('Podaj kwotę doładowania:');
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    const res = await fetch(`http://localhost:3000/fund/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount) })
    });
    const data = await res.json();
    if (res.status === 200) {
      showMessage('Saldo doładowane', 'success');
      loadUsers && loadUsers();
    } else {
      showMessage(data.error || 'Błąd doładowania', 'error');
    }
  }
});
