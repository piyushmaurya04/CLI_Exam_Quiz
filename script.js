// script.js
// नोट: quizData अब questions.js फाइल से अपने आप आ जाएगा।

// --- 1. State Variables ---
let currentUser = "";
let currentCategory = "";
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 30;
let userAnswers = []; // Track user's selected answers

// --- 2. DOM Elements ---
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const selectionScreen = document.getElementById('selection-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const profileScreen = document.getElementById('profile-screen');

// --- 3. Initialization ---
window.onload = () => {
    // Check Local Storage for User
    const savedData = JSON.parse(localStorage.getItem('cli_user_data'));
    if (savedData && savedData.name) {
        currentUser = savedData.name;
        showDashboard();
    } else {
        showScreen(loginScreen);
    }
};

// --- 4. Navigation & Screen Management ---
function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.remove('hidden');
    screen.classList.add('active');
}

// --- 5. Login Logic ---
function loginUser() {
    const inputName = document.getElementById('username-input').value.trim();
    if (inputName) {
        currentUser = inputName;
        let data = JSON.parse(localStorage.getItem('cli_user_data')) || { results: {} };
        data.name = currentUser;
        localStorage.setItem('cli_user_data', JSON.stringify(data));
        showDashboard();
    } else {
        alert("कृपया अपना नाम दर्ज करें!");
    }
}

// --- 6. Dashboard Logic ---
function showDashboard() {
    document.getElementById('display-name').innerText = currentUser;
    const catContainer = document.getElementById('categories-container');
    catContainer.innerHTML = '';

    // quizData अब questions.js से ग्लोबली उपलब्ध है
    if (typeof quizData === 'undefined') {
        catContainer.innerHTML = '<p style="color:red">Error: questions.js फाइल लोड नहीं हुई!</p>';
        return;
    }

    Object.keys(quizData).forEach(cat => {
        const btn = document.createElement('div');
        btn.className = 'category-card';
        const totalQ = quizData[cat].length;
        
        // Add 'New !' badge for 'CLI Practise 1' category
        const isNewCategory = cat === 'CLI Practise 1';
        const badge = isNewCategory ? '<span class="new-badge">New !</span>' : '';
        
        btn.innerHTML = `<span>${cat} <small>(${totalQ} Qs)</small></span> ${badge}<span>➤</span>`;
        btn.onclick = () => showSelectionScreen(cat);
        catContainer.appendChild(btn);
    });

    showScreen(dashboardScreen);
}

// --- 7. Selection Screen Logic ---
function showSelectionScreen(category) {
    currentCategory = category;
    document.getElementById('sel-cat-name').innerText = category;
    
    // Get total questions available for this category
    const totalQuestions = quizData[category].length;
    
    // Generate dynamic buttons based on available questions
    const numberGrid = document.querySelector('.number-grid');
    numberGrid.innerHTML = '';
    
    // Create options: 10, 20, 30, 40, 50, and All
    const options = [10, 20, 30, 40, 50];
    
    options.forEach(num => {
        if (num <= totalQuestions) {
            const btn = document.createElement('button');
            btn.textContent = `${num} प्रश्न`;
            btn.onclick = () => initializeQuiz(num);
            numberGrid.appendChild(btn);
        }
    });
    
    // Always add "All" button
    const allBtn = document.createElement('button');
    allBtn.textContent = `सभी (All) - ${totalQuestions}`;
    allBtn.onclick = () => initializeQuiz('all');
    numberGrid.appendChild(allBtn);
    
    // Add custom input section
    const customSection = document.createElement('div');
    customSection.className = 'custom-input-section';
    
    const inputLabel = document.createElement('label');
    inputLabel.textContent = 'या कस्टम संख्या डालें (Or Enter Custom):';
    inputLabel.htmlFor = 'custom-count-input';
    
    const inputField = document.createElement('input');
    inputField.type = 'number';
    inputField.id = 'custom-count-input';
    inputField.placeholder = `1 - ${totalQuestions}`;
    inputField.min = '1';
    inputField.max = totalQuestions;
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCustomInput(totalQuestions);
        }
    });
    
    const customBtn = document.createElement('button');
    customBtn.textContent = 'शुरू करें (Start)';
    customBtn.className = 'custom-submit-btn';
    customBtn.onclick = () => handleCustomInput(totalQuestions);
    
    customSection.appendChild(inputLabel);
    customSection.appendChild(inputField);
    customSection.appendChild(customBtn);
    
    numberGrid.appendChild(customSection);
    
    showScreen(selectionScreen);
}

function handleCustomInput(totalQuestions) {
    const input = document.getElementById('custom-count-input');
    const count = parseInt(input.value);
    
    // Validate input
    if (isNaN(count) || count < 1) {
        alert(`कृपया 1 से ${totalQuestions} के बीच एक मान्य संख्या दर्ज करें। (Please enter a valid number between 1 and ${totalQuestions})`);
        return;
    }
    
    if (count > totalQuestions) {
        alert(`केवल ${totalQuestions} प्रश्न उपलब्ध हैं। (Only ${totalQuestions} questions are available.)`);
        return;
    }
    
    // Initialize quiz with custom count
    initializeQuiz(count);
}

// --- 8. Quiz Logic ---
function initializeQuiz(count) {
    let allQuestions = [...quizData[currentCategory]];
    
    // Shuffle Questions
    allQuestions.sort(() => Math.random() - 0.5);
    
    if (count === 'all') {
        currentQuestions = allQuestions;
    } else {
        // अगर 10 मांगे हैं लेकिन हमारे पास फाइल में कम हैं, तो भी यह एरर नहीं देगा
        currentQuestions = allQuestions.slice(0, count);
    }
    
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = new Array(currentQuestions.length).fill(-1); // Initialize with -1 (no answer)
    
    document.getElementById('quiz-category-title').innerText = currentCategory;
    showScreen(quizScreen);
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        endQuiz();
        return;
    }

    clearInterval(timer);
    timeLeft = 30;
    document.getElementById('timer').innerText = timeLeft;
    startTimer();

    const qData = currentQuestions[currentQuestionIndex];
    document.getElementById('question-text').innerText = `${currentQuestionIndex + 1}. ${qData.q}`;
    document.getElementById('question-count').innerText = `${currentQuestionIndex + 1} / ${currentQuestions.length}`;
    
    const progressPercent = ((currentQuestionIndex) / currentQuestions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progressPercent}%`;

    const optsContainer = document.getElementById('options-container');
    optsContainer.innerHTML = '';

    qData.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.onclick = () => selectAnswer(index, qData.correct, btn);
        optsContainer.appendChild(btn);
    });
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            showCorrectAnswerAndNext(-1);
        }
    }, 1000);
}

function selectAnswer(selectedIndex, correctIndex, btnElement) {
    clearInterval(timer);
    const buttons = document.querySelectorAll('.options-grid button');
    buttons.forEach(b => b.onclick = null);

    // Store the user's answer
    userAnswers[currentQuestionIndex] = selectedIndex;

    if (selectedIndex === correctIndex) {
        btnElement.classList.add('correct');
        score++;
    } else {
        btnElement.classList.add('wrong');
        buttons[correctIndex].classList.add('correct');
    }

    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 1000);
}

function showCorrectAnswerAndNext(correctIndex) {
    const buttons = document.querySelectorAll('.options-grid button');
    const qData = currentQuestions[currentQuestionIndex];
    
    // User didn't select an answer (timeout), so answer remains -1
    if(buttons.length > 0) {
         buttons[qData.correct].classList.add('correct');
    }

    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 1000);
}

function quitQuiz() {
    if (confirm('क्या आप क्विज़ छोड़ना चाहते हैं? आपका प्रदर्शन सहेजा नहीं जाएगा।\n\nAre you sure you want to quit? Your score will not be saved.')) {
        clearInterval(timer);
        showDashboard();
    }
}

// --- 9. Result Logic ---
function endQuiz() {
    showScreen(resultScreen);
    document.getElementById('result-category').innerText = currentCategory;
    document.getElementById('score-text').innerText = `${score} / ${currentQuestions.length}`;
    
    const percentage = (score / currentQuestions.length) * 100;
    let feedback = "";
    
    if (percentage >= 90) {
        feedback = "Excellent! 🌟";
    } else if (percentage > 70) {
        feedback = "Good! Keep Practicing 💪";
    } else if (percentage > 50) {
        feedback = "Hmm! Need Some Serious Practice 📚";
    } else {
        feedback = "Aap Rehnedo Aap nhi bann paoge CLI 😅";
    }
    
    document.getElementById('feedback-msg').innerText = feedback;
    
    // Display question review
    displayQuestionReview();
    
    saveResult(currentCategory, score, currentQuestions.length);
}

function displayQuestionReview() {
    const reviewContainer = document.getElementById('questions-review');
    reviewContainer.innerHTML = '';
    
    currentQuestions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-review-item';
        
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correct;
        const isAnswered = userAnswer !== -1;
        
        questionDiv.innerHTML = `
            <div class="question-header">
                <span class="question-number">Q${index + 1}.</span>
                <span class="question-text">${question.q}</span>
                <span class="question-status ${isCorrect ? 'correct-status' : 'wrong-status'}">
                    ${isCorrect ? '✓' : (isAnswered ? '✗' : '⏰')}
                </span>
            </div>
            <div class="options-review">
                ${question.options.map((option, optIndex) => {
                    let optionClass = '';
                    let optionLabel = '';
                    
                    if (optIndex === question.correct) {
                        optionClass = 'correct-option';
                        optionLabel = '(Correct)';
                    }
                    
                    if (isAnswered && optIndex === userAnswer) {
                        if (isCorrect) {
                            optionClass = 'user-correct-option';
                            optionLabel = '(Your Answer - Correct)';
                        } else {
                            optionClass = 'user-wrong-option';
                            optionLabel = '(Your Answer - Wrong)';
                        }
                    }
                    
                    return `<div class="option-review ${optionClass}">
                        ${option} ${optionLabel}
                    </div>`;
                }).join('')}
            </div>
        `;
        
        reviewContainer.appendChild(questionDiv);
    });
}

function saveResult(category, score, total) {
    let data = JSON.parse(localStorage.getItem('cli_user_data'));
    if (!data.results) data.results = {};
    data.results[category] = { score, total, date: new Date().toLocaleDateString() };
    localStorage.setItem('cli_user_data', JSON.stringify(data));
}

function goToDashboard() {
    showDashboard();
}

// --- 10. Profile Logic ---
function showProfile() {
    showScreen(profileScreen);
    document.getElementById('profile-name').innerText = currentUser;
    
    const statsContainer = document.getElementById('profile-stats');
    statsContainer.innerHTML = '';
    
    let data = JSON.parse(localStorage.getItem('cli_user_data'));
    const results = data.results || {};

    if (Object.keys(results).length === 0) {
        statsContainer.innerHTML = "<p>No quizzes taken yet.</p>";
    } else {
        // Get categories and sort by reverse order (latest first)
        const categories = Object.keys(results).reverse();
        
        categories.forEach(cat => {
            const res = results[cat];
            const div = document.createElement('div');
            div.className = 'stat-card';
            div.innerHTML = `
                <div>
                    <strong>${cat}</strong>
                    <small><strong>Score:</strong> ${res.score}/${res.total} | <strong>Date:</strong> ${res.date}</small>
                </div>
                <button class="reset-btn" onclick="resetCategory('${cat}')">Reset</button>
            `;
            statsContainer.appendChild(div);
        });
    }
}

function resetCategory(cat) {
    if(confirm(`क्या आप ${cat} का रिजल्ट मिटाना चाहते हैं?`)) {
        let data = JSON.parse(localStorage.getItem('cli_user_data'));
        delete data.results[cat];
        localStorage.setItem('cli_user_data', JSON.stringify(data));
        showProfile();
    }
}

function logout() {
    currentUser = null;
    currentCategory = null;
    currentQuestions = [];
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    showScreen(loginScreen);
    document.getElementById('username-input').value = '';
}