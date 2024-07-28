const categories = ['Work', 'Play', 'Love', 'Health'];
const categoryColors = {
    'Work': '#4CAF50',  // Green
    'Play': '#2196F3',  // Blue
    'Love': '#F44336',  // Red
    'Health': '#9C27B0' // Purple
};
const importanceLevels = ['Low', 'Low/Medium', 'Medium', 'Medium/High', 'High'];
const gauges = {};
let currentUser = null;
const userHistory = {};
const charts = {};

// Simulated user database
const users = {};

function toggleSignup() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('signupScreen').style.display = 'block';
}

function toggleLogin() {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('signupScreen').style.display = 'none';
}

function signup() {
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const messageElement = document.getElementById('signupMessage');

    if (!username || !password || !confirmPassword) {
        messageElement.textContent = 'Please fill in all fields.';
        return;
    }

    if (password !== confirmPassword) {
        messageElement.textContent = 'Passwords do not match.';
        return;
    }

    if (users[username]) {
        messageElement.textContent = 'Username already exists.';
        return;
    }

    users[username] = { password: password, history: [] };
    messageElement.textContent = 'Sign up successful. You can now log in.';
    toggleLogin();
}

function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const messageElement = document.getElementById('loginMessage');
    
    if (!users[username] || users[username].password !== password) {
        messageElement.textContent = 'Invalid username or password.';
        return;
    }

    currentUser = username;
    userHistory[currentUser] = users[username].history;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    initializeDashboard();
}

function logout() {
    currentUser = null;
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginMessage').textContent = '';
}

function initializeDashboard() {
    document.getElementById('categoriesContainer').innerHTML = '';
    categories.forEach(createGauge);
    loadHistory();
}

function createGauge(category) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'category-row';
    rowDiv.innerHTML = `
        <div class="category-name">${category}</div>
        <div class="gauge-container">
            <div class="gauge-levels" id="${category}Levels">
                ${[...Array(9)].map((_, i) => `<div class="gauge-level" data-level="${i}"></div>`).join('')}
            </div>
            <div class="gauge-info">
                <div>
                    <label for="${category}Importance">Importance:</label>
                    <select id="${category}Importance">
                        <option value="">Select</option>
                        ${importanceLevels.map(level => `<option value="${level}">${level}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div id="${category}Error" class="error-message"></div>
        </div>
        <textarea class="category-note" id="${category}Note" placeholder="Note for ${category}"></textarea>
    `;
    document.getElementById('categoriesContainer').appendChild(rowDiv);

    const levelsContainer = document.getElementById(`${category}Levels`);
    levelsContainer.onclick = function(evt) {
        if (evt.target.classList.contains('gauge-level')) {
            const level = parseInt(evt.target.dataset.level);
            updateGaugeLevel(category, level);
        }
    };

    gauges[category] = { level: null };
}

function updateGaugeLevel(category, level) {
    const levelsContainer = document.getElementById(`${category}Levels`);
    
    gauges[category].level = level;

    Array.from(levelsContainer.children).forEach((div, index) => {
        if (index <= level) {
            div.classList.add('active');
            div.style.backgroundColor = getCategoryColor(category, index / 8);
        } else {
            div.classList.remove('active');
            div.style.backgroundColor = '';
        }
    });

    document.getElementById(`${category}Error`).textContent = '';
    levelsContainer.classList.remove('error');
}

function getCategoryColor(category, value = 1) {
    const baseColor = categoryColors[category];
    const rgb = parseInt(baseColor.slice(1), 16);
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;
    return `rgba(${r},${g},${b},${value})`;
}

function submitAll() {
    let isValid = true;
    const timestamp = new Date().toLocaleString();
    let historyEntry = {
        timestamp: timestamp,
        categories: {}
    };

    categories.forEach(category => {
        const level = gauges[category].level;
        const importance = document.getElementById(`${category}Importance`).value;
        const note = document.getElementById(`${category}Note`).value;
        const errorElement = document.getElementById(`${category}Error`);
        const gaugeElement = document.getElementById(`${category}Levels`);
        const importanceElement = document.getElementById(`${category}Importance`);

        errorElement.textContent = '';
        gaugeElement.classList.remove('error');
        importanceElement.classList.remove('error');

        if (level === null || importance === "") {
            isValid = false;
            errorElement.textContent = 'Please set both level and importance.';
            if (level === null) gaugeElement.classList.add('error');
            if (importance === "") importanceElement.classList.add('error');
        } else {
            historyEntry.categories[category] = {
                level: level,
                importance: importance,
                note: note
            };
        }
    });

    if (isValid) {
        if (!userHistory[currentUser]) {
            userHistory[currentUser] = [];
        }
        userHistory[currentUser].unshift(historyEntry);
        users[currentUser].history = userHistory[currentUser];

        categories.forEach(category => {
            document.getElementById(`${category}Note`).value = '';
        });

        loadHistory();
    }
}

function loadHistory() {
    const history = userHistory[currentUser] || [];
    
    categories.forEach(category => {
        updateCategoryChart(category, history);
    });
}

function updateCategoryChart(category, history) {
    const ctx = document.getElementById(`${category}Chart`).getContext('2d');
    
    if (charts[category]) {
        charts[category].destroy();
    }

    const chartData = history.map(entry => ({
        x: entry.timestamp,
        y: entry.categories[category].level,
        note: entry.categories[category].note
    })).reverse();

    charts[category] = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: category,
                data: chartData,
                fill: false,
                borderColor: getCategoryColor(category),
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 8
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return `Level: ${point.y}, Note: ${point.note || 'No note'}`;
                        }
                    }
                }
            }
        }
    });
}

categories.forEach(createGauge);
