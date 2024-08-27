'use strict';

// Consts & Variables
const URL = 'questions.json';

let quizData = {
  easy: [],
  medium: [],
  hard: [],
};

let currQuestionIndex = 0;
let currDiffLvL = 'easy';
let score = 0;
let timer;
let timeLeft = 60;
let quizEnded = false;

// Get DOM elements
const result = document.getElementById('result');
const leaderboard = document.getElementById('leaderboard');
const difficultyContainer = document.getElementById('difficulty-container');
const quizContainer = document.getElementById('quiz-container');
const btnNext = document.getElementById('next-button');
const btnPlayAgain = document.getElementById('play-again-button');
const questionCount = document.getElementById('question-count');
const infoContainer = document.getElementsByClassName('info-container')[0];

async function loadQuestions() {
  try {
    const response = await fetch(URL);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    quizData = await response.json();
  } catch (err) {
    console.error('Error loading questions,', err);
  }
}

loadQuestions();

function setInitialState() {
  currQuestionIndex = 0;
  score = 0;
  timeLeft = 60;
  quizEnded = false;
}

function setQuizStartUI() {
  result.textContent = '';
  leaderboard.style.display = 'none';
  difficultyContainer.style.display = 'none';
  quizContainer.style.display = 'block';
  btnNext.style.display = 'inline-block';
  btnPlayAgain.style.display = 'none';
  questionCount.style.display = 'block';
}

function startQuiz(level) {
  if (!quizData[level]) {
    console.error(`No data for the chosen level`);
    return;
  }
  // Set level
  currDiffLvL = level;
  // Initial State
  setInitialState();
  // Change to Quiz UI
  setQuizStartUI();
  // Get Questions
  loadQuestion();
  // Start Timer
  startTimer();
}

function loadQuestion() {
  if (quizEnded) return;

  const questionData = quizData[currDiffLvL][currQuestionIndex];
  document.getElementById('question').textContent = questionData.question;

  const optionsContainer = document.getElementById('options');
  optionsContainer.innerHTML = '';
  // Random number between -0.5 and 0.5 uses Sort to place question randomly
  const shuffledOptions = questionData.options.sort(() => 0.5 - Math.random());
  // Create clickable button for each option
  shuffledOptions.forEach(option => {
    const button = document.createElement('button');
    button.classList.add('option-button');
    button.textContent = option;
    button.onclick = () => checkAnswer(option, button);
    optionsContainer.appendChild(button);
  });
  // Can't go next unless we answer
  btnNext.disabled = true;
  // Question Progress
  questionCount.textContent = `Question: ${currQuestionIndex + 1}/${
    quizData[currDiffLvL].length
  }`;
}

function checkAnswer(selectedOption, button) {
  if (quizEnded) return;

  const correctAnswer = quizData[currDiffLvL][currQuestionIndex].answer;

  const optionButtons = document.querySelectorAll('.option-button');
  optionButtons.forEach(btn => (btn.disabled = true));

  if (selectedOption === correctAnswer) {
    button.classList.add('correct');
    score++;
  } else {
    button.classList.add('incorrect');
    optionButtons.forEach(btn => {
      if (btn.textContent === correctAnswer) {
        btn.classList.add('correct');
      }
    });
  }

  document.getElementById('next-button').disabled = false;
}

function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timer);
      endQuiz();
    } else {
      timeLeft--;
      document.getElementById('timer-value').textContent = timeLeft;
    }
  }, 1000);
}

function endQuiz() {
  quizEnded = true;
  clearInterval(timer);
  document.getElementById(
    'question'
  ).textContent = `Quiz Ended! Your score: ${score}`;
  document.getElementById('options').innerHTML = '';
  document.getElementById('question-count').style.display = 'none';
  infoContainer.style.justifyContent = 'center';
  document.getElementById('next-button').style.display = 'none';

  updateLeaderboard(score);

  // Show the Play Again button
  document.getElementById('play-again-button').style.display = 'inline-block';
}

function restartQuiz() {
  btnPlayAgain.style.display = 'none';
  difficultyContainer.style.display = 'flex';
  infoContainer.style.justifyContent = 'space-between';
  quizContainer.style.display = 'none';
  leaderboard.style.display = 'none';
  setInitialState();
}

function nextQuestion() {
  if (quizEnded) return;

  currQuestionIndex++;
  if (currQuestionIndex >= quizData[currDiffLvL].length) {
    endQuiz();
  } else {
    loadQuestion();
  }
}

function updateLeaderboard(score) {
  const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || {};

  if (!leaderboard[currDiffLvL]) {
    leaderboard[currDiffLvL] = [];
  }

  leaderboard[currDiffLvL].push({ score, date: new Date() });
  /*
  if it returns a negative value, the value in b will be ordered before a.
  if it returns 0, the ordering of b and a won’t change.
  if it returns a positive value, the value in a will be ordered before b.
  */
  leaderboard[currDiffLvL].sort((a, b) => b.score - a.score);
  // Key, Value pair storage
  // Takes string only
  // Stored in Browser (DevTools -> Application -> Storage)
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));

  displayLeaderboard();
}

function displayLeaderboard() {
  // Get Item from LocalStorage
  const leaderboardObject =
    JSON.parse(localStorage.getItem('leaderboard')) || {};
  const leaderboardScores = leaderboardObject[currDiffLvL] || [];

  leaderboard.style.display = 'block';
  leaderboard.innerHTML = `<h2>Leaderboard (${
    currDiffLvL.charAt(0).toUpperCase() + currDiffLvL.slice(1)
  })</h2>`;

  if (leaderboardScores.length === 0) {
    leaderboard.innerHTML += '<p>No scores available for this level.</p>';
  } else {
    leaderboardScores.forEach(entry => {
      const p = document.createElement('p');
      p.textContent = `Score: ${entry.score} on ${new Date(
        entry.date
      ).toLocaleDateString()}`;
      leaderboard.appendChild(p);
    });
  }
}

btnNext.addEventListener('click', nextQuestion);
btnPlayAgain.addEventListener('click', restartQuiz);
