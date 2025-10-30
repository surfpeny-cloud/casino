// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Состояние игры
let state = {
    balance: 1000,
    currentBet: 10,
    isSpinning: false,
    history: [],
    achievements: {
        firstWin: false,
        bigWin: false,
        jackpot: false,
        blackjackWin: false,
        rouletteWin: false
    },
    gamesPlayed: 0
};

// Символы для слотов
const symbols = ['🍒', '🍋', '⭐', '🍊', '🔔', '7️⃣'];

// Рулетка
const rouletteNumbers = [
    { number: 0, color: 'green' },
    { number: 32, color: 'red' }, { number: 15, color: 'black' }, { number: 19, color: 'red' },
    { number: 4, color: 'black' }, { number: 21, color: 'red' }, { number: 2, color: 'black' },
    { number: 25, color: 'red' }, { number: 17, color: 'black' }, { number: 34, color: 'red' },
    { number: 6, color: 'black' }, { number: 27, color: 'red' }, { number: 13, color: 'black' },
    { number: 36, color: 'red' }, { number: 11, color: 'black' }, { number: 30, color: 'red' },
    { number: 8, color: 'black' }, { number: 23, color: 'red' }, { number: 10, color: 'black' },
    { number: 5, color: 'red' }, { number: 24, color: 'black' }, { number: 16, color: 'red' },
    { number: 33, color: 'black' }, { number: 1, color: 'red' }, { number: 20, color: 'black' },
    { number: 14, color: 'red' }, { number: 31, color: 'black' }, { number: 9, color: 'red' },
    { number: 22, color: 'black' }, { number: 18, color: 'red' }, { number: 29, color: 'black' },
    { number: 7, color: 'red' }, { number: 28, color: 'black' }, { number: 12, color: 'red' },
    { number: 35, color: 'black' }, { number: 3, color: 'red' }, { number: 26, color: 'black' }
];

// Колода карт для блэкджека
const deck = [];
let currentDeck = [];
let playerHand = [];
let dealerHand = [];
let currentRouletteBet = null;

// Инициализация приложения
function init() {
    createRouletteWheel();
    initDeck();
    updateDisplay();
    loadState();
    updateAchievements();
}

// Создание рулетки
function createRouletteWheel() {
    const wheel = document.getElementById('rouletteWheel');
    wheel.innerHTML = '<div class="wheel-pointer"></div><div class="wheel-center"></div>';
    
    rouletteNumbers.forEach((num, index) => {
        const angle = (index / rouletteNumbers.length) * 360;
        const numberElement = document.createElement('div');
        numberElement.className = 'wheel-number';
        numberElement.style.transform = `rotate(${angle}deg)`;
        numberElement.style.background = num.color === 'red' ? '#ff0000' : num.color === 'black' ? '#000000' : '#00aa00';
        numberElement.innerHTML = `<span>${num.number}</span>`;
        wheel.appendChild(numberElement);
    });
}

// Инициализация колоды
function initDeck() {
    deck.length = 0;
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    suits.forEach(suit => {
        values.forEach(value => {
            deck.push({
                suit: suit,
                value: value,
                isRed: suit === '♥' || suit === '♦'
            });
        });
    });
}

// Переключение между играми
function switchGame(gameId) {
    // Скрыть все разделы игр
    document.querySelectorAll('.game-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Убрать активный класс со всех вкладок
    document.querySelectorAll('.game-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Показать выбранную игру
    document.getElementById(gameId).classList.add('active');
    
    // Активировать соответствующую вкладку
    event.target.classList.add('active');
    
    // Сброс состояния для некоторых игр
    if (gameId === 'blackjack') {
        resetBlackjack();
    }
}

// Загрузка состояния из localStorage
function loadState() {
    const saved = localStorage.getItem('casinoState');
    if (saved) {
        const loadedState = JSON.parse(saved);
        state = { ...state, ...loadedState };
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
    document.getElementById('blackjackBet').textContent = state.currentBet;
    
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = state.isSpinning || state.balance < state.currentBet;
    
    const rouletteSpinBtn = document.getElementById('rouletteSpinBtn');
    rouletteSpinBtn.disabled = state.isSpinning || !currentRouletteBet;
    
    const startBlackjackBtn = document.getElementById('startBlackjackBtn');
    startBlackjackBtn.disabled = state.balance < state.currentBet;
    
    updateHistory();
}

// Изменение ставки
function changeBet(amount) {
    if (state.isSpinning) return;
    
    state.currentBet = amount;
    updateDisplay();
}

// ========== ИГРА: СЛОТЫ ==========
function spinSlots() {
    if (state.isSpinning || state.balance < state.currentBet) return;
    
    state.isSpinning = true;
    state.balance -= state.currentBet;
    state.gamesPlayed++;
    updateDisplay();
    
    const slots = [
        document.getElementById('slot1'),
        document.getElementById('slot2'),
        document.getElementById('slot3')
    ];
    
    slots.forEach(slot => slot.classList.add('spinning'));
    
    const spinDuration = 2000;
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
            finishSlotSpin();
        }
    }
    
    updateSlots();
}

function finishSlotSpin() {
    const slots = [
        document.getElementById('slot1'),
        document.getElementById('slot2'),
        document.getElementById('slot3')
    ];
    
    slots.forEach(slot => slot.classList.remove('spinning'));
    
    const results = [];
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * symbols.length);
        results.push(symbols[randomIndex]);
        slots[i].textContent = symbols[randomIndex];
    }
    
    const winAmount = calculateSlotWin(results, state.currentBet);
    
    if (winAmount > 0) {
        state.balance += winAmount;
        addToHistory(`Слоты: Выигрыш +${winAmount}`, 'win');
        
        // Проверка достижений
        if (!state.achievements.firstWin) {
            state.achievements.firstWin = true;
            addToHistory('🎉 Достижение: Первая победа!', 'win');
        }
        if (winAmount >= 500 && !state.achievements.bigWin) {
            state.achievements.bigWin = true;
            addToHistory('🎉 Достижение: Крупный выигрыш!', 'win');
        }
        if (results[0] === '7️⃣' && results[1] === '7️⃣' && results[2] === '7️⃣') {
            state.achievements.jackpot = true;
            addToHistory('🎉 Достижение: Джекпот!', 'win');
        }
    } else {
        addToHistory(`Слоты: Проигрыш -${state.currentBet}`, 'loss');
    }
    
    state.isSpinning = false;
    updateDisplay();
    saveState();
    updateAchievements();
}

function calculateSlotWin(results, bet) {
    if (results[0] === results[1] && results[1] === results[2]) {
        switch(results[0]) {
            case '7️⃣': return bet * 10;
            case '🔔': return bet * 5;
            case '⭐': return bet * 4;
            case '🍊': return bet * 3;
            case '🍋': return bet * 2;
            case '🍒': return bet * 2;
            default: return bet * 2;
        }
    }
    
    if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
        return bet * 1.5;
    }
    
    return 0;
}

// ========== ИГРА: РУЛЕТКА ==========
function placeRouletteBet(type) {
    if (state.isSpinning) return;
    currentRouletteBet = type;
    updateDisplay();
}

function spinRoulette() {
    if (state.isSpinning || !currentRouletteBet || state.balance < state.currentBet) return;
    
    state.isSpinning = true;
    state.balance -= state.currentBet;
    state.gamesPlayed++;
    updateDisplay();
    
    const wheel = document.getElementById('rouletteWheel');
    const resultDiv = document.getElementById('rouletteResult');
    
    wheel.classList.add('wheel-spinning');
    resultDiv.textContent = 'Крутим...';
    
    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * rouletteNumbers.length);
        const result = rouletteNumbers[randomIndex];
        
        wheel.classList.remove('wheel-spinning');
        wheel.style.transform = `rotate(${-(randomIndex * (360 / rouletteNumbers.length))}deg)`;
        
        let winAmount = 0;
        if ((currentRouletteBet === 'red' && result.color === 'red') ||
            (currentRouletteBet === 'black' && result.color === 'black')) {
            winAmount = state.currentBet * 2;
        } else if (currentRouletteBet === 'green' && result.color === 'green') {
            winAmount = state.currentBet * 14;
        }
        
        if (winAmount > 0) {
            state.balance += winAmount;
            addToHistory(`Рулетка: Выигрыш +${winAmount} (${result.number})`, 'win');
            if (!state.achievements.rouletteWin) {
                state.achievements.rouletteWin = true;
                addToHistory('🎉 Достижение: Победа в рулетке!', 'win');
            }
        } else {
            addToHistory(`Рулетка: Проигрыш -${state.currentBet} (${result.number})`, 'loss');
        }
        
        resultDiv.innerHTML = `Выпало: <span style="color: ${result.color === 'red' ? '#ff4444' : result.color === 'black' ? '#4444ff' : '#44ff44'}">${result.number} ${result.color}</span>`;
        
        state.isSpinning = false;
        currentRouletteBet = null;
        updateDisplay();
        saveState();
        updateAchievements();
    }, 5000);
}

// ========== ИГРА: БЛЭКДЖЕК ==========
function startBlackjack() {
    if (state.balance < state.currentBet) return;
    
    state.balance -= state.currentBet;
    state.gamesPlayed++;
    updateDisplay();
    
    // Создаем новую колоду и перемешиваем
    currentDeck = [...deck];
    shuffleDeck(currentDeck);
    
    playerHand = [drawCard(), drawCard()];
    dealerHand = [drawCard(), drawCard()];
    
    document.getElementById('startBlackjackBtn').style.display = 'none';
    document.getElementById('gameControls').style.display = 'flex';
    document.getElementById('blackjackResult').textContent = '';
    
    updateBlackjackDisplay();
    
    // Проверяем блэкджек у игрока
    if (calculateHandValue(playerHand) === 21) {
        endBlackjackGame('blackjack');
    }
}

function playerHit() {
    playerHand.push(drawCard());
    updateBlackjackDisplay();
    
    const playerValue = calculateHandValue(playerHand);
    if (playerValue > 21) {
        endBlackjackGame('dealer');
    }
}

function playerStand() {
    // Дилер берет карты до 17
    while (calculateHandValue(dealerHand) < 17) {
        dealerHand.push(drawCard());
    }
    
    updateBlackjackDisplay(true);
    
    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);
    
    if (dealerValue > 21 || playerValue > dealerValue) {
        endBlackjackGame('player');
    } else if (dealerValue > playerValue) {
        endBlackjackGame('dealer');
    } else {
        endBlackjackGame('push');
    }
}

function drawCard() {
    return currentDeck.pop();
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;
    
    hand.forEach(card => {
        if (card.value === 'A') {
            aces++;
            value += 11;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value);
        }
    });
    
    // Корректируем тузы
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    
    return value;
}

function updateBlackjackDisplay(showDealerCards = false) {
    const dealerHandDiv = document.getElementById('dealerHand');
    const playerHandDiv = document.getElementById('playerHand');
    const dealerScoreDiv = document.getElementById('dealerScore');
    const playerScoreDiv = document.getElementById('playerScore');
    
    // Обновляем руку дилера
    dealerHandDiv.innerHTML = '';
    dealerHand.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.isRed ? 'red' : ''}`;
        if (index === 0 && !showDealerCards) {
            cardDiv.className += ' card-back';
            cardDiv.textContent = '?';
        } else {
            cardDiv.textContent = card.value + card.suit;
        }
        dealerHandDiv.appendChild(cardDiv);
    });
    
    // Обновляем руку игрока
    playerHandDiv.innerHTML = '';
    playerHand.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.isRed ? 'red' : ''}`;
        cardDiv.textContent = card.value + card.suit;
        playerHandDiv.appendChild(cardDiv);
    });
    
    // Обновляем очки
    dealerScoreDiv.textContent = showDealerCards ? calculateHandValue(dealerHand) : '?';
    playerScoreDiv.textContent = calculateHandValue(playerHand);
}

function endBlackjackGame(result) {
    let winAmount = 0;
    let message = '';
    
    switch(result) {
        case 'player':
            winAmount = state.currentBet * 2;
            message = `Вы выиграли ${winAmount}!`;
            addToHistory(`Блэкджек: Выигрыш +${winAmount}`, 'win');
            break;
        case 'dealer':
            message = 'Дилер выиграл';
            addToHistory(`Блэкджек: Проигрыш -${state.currentBet}`, 'loss');
            break;
        case 'blackjack':
            winAmount = Math.floor(state.currentBet * 2.5);
            message = `Блэкджек! Выигрыш ${winAmount}!`;
            addToHistory(`Блэкджек: Блэкджек! +${winAmount}`, 'win');
            state.achievements.blackjackWin = true;
            break;
        case 'push':
            winAmount = state.currentBet;
            message = 'Ничья, ставка возвращена';
            addToHistory('Блэкджек: Ничья', 'win');
            break;
    }
    
    if (winAmount > 0) {
        state.balance += winAmount;
    }
    
    document.getElementById('blackjackResult').textContent = message;
    document.getElementById('startBlackjackBtn').style.display = 'block';
    document.getElementById('gameControls').style.display = 'none';
    
    updateDisplay();
    saveState();
    updateAchievements();
}

function resetBlackjack() {
    playerHand = [];
    dealerHand = [];
    document.getElementById('dealerHand').innerHTML = '';
    document.getElementById('playerHand').innerHTML = '';
    document.getElementById('dealerScore').textContent = '0';
    document.getElementById('playerScore').textContent = '0';
    document.getElementById('blackjackResult').textContent = '';
}

// ========== ДОСТИЖЕНИЯ ==========
function updateAchievements() {
    const achievementsList = document.getElementById('achievementsList');
    achievementsList.innerHTML = '';
    
    const achievements = [
        { id: 'firstWin', name: 'Первая победа', description: 'Выиграйте в любой игре', icon: 'fa-star' },
        { id: 'bigWin', name: 'Крупный выигрыш', description: 'Выиграйте 500 или больше', icon: 'fa-gem' },
        { id: 'jackpot', name: 'Джекпот', description: 'Выиграйте джекпот в слотах', icon: 'fa-crown' },
        { id: 'blackjackWin', name: 'Мастер блэкджека', description: 'Выиграйте блэкджек', icon: 'fa-club' },
        { id: 'rouletteWin', name: 'Удачливый игрок', description: 'Выиграйте в рулетку', icon: 'fa-dharmachakra' }
    ];
    
    achievements.forEach(achievement => {
        const achieved = state.achievements[achievement.id];
        const achievementDiv = document.createElement('div');
        achievementDiv.className = `achievement ${achieved ? 'achieved' : ''}`;
        achievementDiv.innerHTML = `
            <i class="fas ${achievement.icon} ${achieved ? 'gold' : 'gray'}"></i>
            <div>
                <strong>${achievement.name}</strong><br>
                <small>${achievement.description}</small>
            </div>
            ${achieved ? '<i class="fas fa-check gold"></i>' : '<i class="fas fa-lock gray"></i>'}
        `;
        achievementsList.appendChild(achievementDiv);
    });
}

// ========== ОБЩИЕ ФУНКЦИИ ==========
function addToHistory(message, type) {
    const timestamp = new Date().toLocaleTimeString();
    state.history.unshift({
        message: `${timestamp}: ${message}`,
        type: type
    });
    
    if (state.history.length > 10) {
        state.history = state.history.slice(0, 10);
    }
    
    updateHistory();
}

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

// Сброс игры
function resetGame() {
    if (confirm('Сбросить всю игру?')) {
        state = {
            balance: 1000,
            currentBet: 10,
            isSpinning: false,
            history: [],
            achievements: {
                firstWin: false,
                bigWin: false,
                jackpot: false,
                blackjackWin: false,
                rouletteWin: false
            },
            gamesPlayed: 0
        };
        resetBlackjack();
        currentRouletteBet = null;
        updateDisplay();
        saveState();
        updateAchievements();
    }
}

// Добавляем обработчик долгого нажатия для сброса
let resetTimer;
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

document.addEventListener('mousedown', function(e) {
    if (e.button === 2) {
        resetTimer = setTimeout(() => {
            resetGame();
        }, 3000);
    }
});

document.addEventListener('mouseup', function(e) {
    if (e.button === 2) {
        clearTimeout(resetTimer);
    }
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', init);
