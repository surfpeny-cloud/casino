// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Состояние игры
let state = {
    balance: 1000,
    currentBet: 10,
    isSpinning: false,
    history: []
};

// Символы для слотов
const symbols = ['🍒', '🍋', '⭐', '🍊', '🔔', '7️⃣'];

// Инициализация приложения
function init() {
    updateDisplay();
    loadState();
}

// Загрузка состояния из localStorage
function loadState() {
    const saved = localStorage.getItem('casinoState');
    if (saved) {
        state = JSON.parse(saved);
        updateDisplay();
    }
}

// Сохранение состояния в localStorage
function saveState() {
    localStorage.setItem('casinoState', JSON.stringify(state));
}

// Обновление отображения
function updateDisplay() {
    document.getElementById('balance').textContent = state.balance;
    document.getElementById('currentBet').textContent = state.currentBet;
    
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = state.isSpinning || state.balance < state.currentBet;
    
    updateHistory();
}

// Изменение ставки
function changeBet(amount) {
    if (state.isSpinning) return;
    
    state.currentBet = amount;
    updateDisplay();
}

// Вращение слотов
function spin() {
    if (state.isSpinning || state.balance < state.currentBet) return;
    
    state.isSpinning = true;
    state.balance -= state.currentBet;
    updateDisplay();
    
    // Анимация вращения
    const slots = [
        document.getElementById('slot1'),
        document.getElementById('slot2'),
        document.getElementById('slot3')
    ];
    
    slots.forEach(slot => slot.classList.add('spinning'));
    
    // Симуляция вращения
    const spinDuration = 2000; // 2 секунды
    const startTime = Date.now();
    
    function updateSlots() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        
        slots.forEach(slot => {
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            slot.textContent = randomSymbol;
        });
        
        if (progress < 1) {
            requestAnimationFrame(updateSlots);
        } else {
            finishSpin();
        }
    }
    
    updateSlots();
}

// Завершение вращения
function finishSpin() {
    const slots = [
        document.getElementById('slot1'),
        document.getElementById('slot2'),
        document.getElementById('slot3')
    ];
    
    // Остановка анимации
    slots.forEach(slot => slot.classList.remove('spinning'));
    
    // Генерация конечных результатов
    const results = [];
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * symbols.length);
        results.push(symbols[randomIndex]);
        slots[i].textContent = symbols[randomIndex];
    }
    
    // Проверка выигрыша
    const winAmount = calculateWin(results, state.currentBet);
    
    if (winAmount > 0) {
        state.balance += winAmount;
        addToHistory(`Выигрыш: +${winAmount}`, 'win');
    } else {
        addToHistory(`Проигрыш: -${state.currentBet}`, 'loss');
    }
    
    state.isSpinning = false;
    updateDisplay();
    saveState();
}

// Расчет выигрыша
function calculateWin(results, bet) {
    // Все три одинаковых
    if (results[0] === results[1] && results[1] === results[2]) {
        switch(results[0]) {
            case '7️⃣': return bet * 10; // Джекпот
            case '🔔': return bet * 5;
            case '⭐': return bet * 4;
            case '🍊': return bet * 3;
            case '🍋': return bet * 2;
            case '🍒': return bet * 2;
            default: return bet * 2;
        }
    }
    
    // Два одинаковых
    if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
        return bet * 1.5;
    }
    
    return 0;
}

// Добавление в историю
function addToHistory(message, type) {
    const timestamp = new Date().toLocaleTimeString();
    state.history.unshift({
        message: `${timestamp}: ${message}`,
        type: type
    });
    
    // Ограничиваем историю последними 10 записями
    if (state.history.length > 10) {
        state.history = state.history.slice(0, 10);
    }
    
    updateHistory();
}

// Обновление истории
function updateHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    state.history.forEach(item => {
        const div = document.createElement('div');
        div.className = `history-item ${item.type}`;
        div.textContent = item.message;
        historyList.appendChild(div);
    });
}

// Сброс игры (для тестирования)
function resetGame() {
    if (confirm('Сбросить игру?')) {
        state = {
            balance: 1000,
            currentBet: 10,
            isSpinning: false,
            history: []
        };
        updateDisplay();
        saveState();
    }
}

// Добавляем обработчик долгого нажатия для сброса
let resetTimer;
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

document.addEventListener('mousedown', function(e) {
    if (e.button === 2) { // Правая кнопка мыши
        resetTimer = setTimeout(() => {
            resetGame();
        }, 2000);
    }
});

document.addEventListener('mouseup', function(e) {
    if (e.button === 2) {
        clearTimeout(resetTimer);
    }
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', init);
