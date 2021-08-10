const PlayerLobby = new (function () {
  this.currentQuestion = null;
  this.currentQid = 0;
  this.totalQuestions = 0;
  this.currentScore = 0;
  this.scoreEarned = 0;
  this.answeredCorrect = false;
  this.answer = null;
  this.timerInterval = null;
  this.timeRemaining = 0;

  this.start = () => {
    canvas.empty();
    this.renderWaitingScreen();
  };

  this.onLeave = () => {
    yai.leaveEvent().then(() => {
      location.reload();
    });
  };

  this.onIncomingMessage = (content) => {
    if (content.isStarted) {
      isStarted = isStarted;
      this.totalQuestions = content.totalQuestions;
      canvas.removeClass("h-screen");
    }

    if (content === "showCorrect") {
      this.renderShowScore(this.currentQuestion);
      this.answeredCorrect = false;
    } else if (content === "quizCompleted") {
      this.renderFinalScreen();
    } else if (content.nextQuestion != null) {
      this.currentQid = content.nextQId;
      this.currentQuestion = content.nextQuestion;
      this.resetAnswer();
      this.renderQuestion(this.currentQuestion);
    }

    if (content.regrade && content.regrade == this.answer) {
      console.log("regrading...");
      console.log(`user answer = ${this.answer}`);
      console.log(`to regrade = ${content.regrade}`);
      this.scoringHandler(true);
      this.renderShowScore(this.currentQuestion);
      this.answeredCorrect = false;
      console.log("finished regrading.");
    }
  };

  this.resetAnswer = () => {
    this.answeredCorrect = false;
    this.scoreEarned = 0;
    this.answer = null;
  };

  this.SAChecker = (answer) => {
    for (ans in this.currentQuestion.options) {
      if (this.currentQuestion.options[ans].toLowerCase() === answer.toLowerCase()) return true;
    }
    return false;
  };

  this.SAScoringHandler = (answer) => this.scoringHandler(this.SAChecker(answer));
  this.MCScoringHandler = (option) => this.scoringHandler(option.b);
  this.scoringHandler = (isCorrect) => {
    const multiplier = parseInt(this.currentQuestion.points);
    var score = 0;
    if (isCorrect) {
      score = BASE_SCORE;
      score += Math.floor((this.timeRemaining / this.currentQuestion.time) * BASE_SCORE);
      score *= multiplier;
      this.currentScore += score;
      this.scoreEarned = score;
      this.answeredCorrect = true;
    } else if (this.currentQuestion.type === "SA" && !isCorrect) {
      console.log("sending wrong answer");
      yai.eventVars.wrongAnswers = [...yai.eventVars.wrongAnswers, this.answer.toLowerCase()];
    }
    yai.eventVars.leaderboard = {
      ...yai.eventVars.leaderboard,
      [username]: this.currentScore,
    };
  };

  this.answerHandler = (option) => {
    this.answer = option || $("#answer").val();
    this.stopTimer();
    if (option) this.MCScoringHandler(this.answer);
    else this.SAScoringHandler(this.answer);
  };

  this.startTimer = (timer, display) => {
    this.timerInterval = setInterval(() => {
      var seconds = parseInt(timer % 60, 10);
      display.text(seconds + "s");
      timer -= 0.05;
      this.timeRemaining -= 0.05;
      if (timer < 0) {
        display.text(0 + "s");
        this.stopTimer();
      }
    }, 50);
  };

  this.stopTimer = () => {
    clearInterval(this.timerInterval);
    if (this.timeRemaining === 0) this.renderTimeUpScreen();
    else this.renderAnsweredBeforeTimeUpScreen();
  };

  // ============================================================
  // Renderer Scripts
  // ============================================================

  this.renderWaitingScreen = () => {
    canvas.html(
      `
    <div class="flex-1 flex items-center justify-center px-4 md:px-0">
      <div class="bg-white flex flex-col p-4 rounded-lg w-full md:w-1/2 mx-auto items-center">
        <div class="text-center text-4xl font-bold text-blue-800">${username}</div>
        <div class="text-center text-xl font-bold">
          You're in! Check if your name is on the host's screen.
        </div>
        <hr class="my-4 w-full">
        <div class="text-center text-xl font-bold text-blue-600">
          Waiting for host to start quiz...
        </div>
      </div>
    </div>
    ` + Button("light-outline", "Quit", "MainScene.onLeave()", "w-20 absolute bottom-4 right-4")
    );
  };

  this.renderQuestion = (question) => {
    canvas.html(
      `
      ${this.header(question)}
      <div class="flex-1 flex flex-col items-center justify-center mx-auto container md:max-w-lg lg:max-w-xl xl:max-w-3xl px-4 md:px-0 mb-4">
        <img src="${question.img}" alt="" class="max-w-full max-h-64 object-contain rounded-lg mx-auto" />
        ${
          question.type !== "SA"
            ? '<div id="options" class="w-full grid grid-rows-4 md:grid-cols-2 md:grid-rows-2 gap-3 my-4"></div>'
            : `<div class="flex w-full px-4 w-full xl:w-2/3 mt-4 mx-auto">
            <input id="answer" type="text" placeholder="Enter correct answer" class="options shadow appearance-none border rounded flex-1 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            ${Button("primary", "Submit", "MainScene.answerHandler()", `ml-2 flex items-center" id="submitAnswer"`)}
            </div>`
        }
      </div>
      ${this.footer()}      
      `
    );

    if (question.type !== "SA") {
      for (let i = 0; i < question.options.length; i++) {
        $("#options").append(OptionButton(question.options[i]));
      }
    } else {
      $("#answer").focus();
      $("#answer").on("keypress", function (e) {
        if (e.which == 13) {
          console.log("enter key pressed");
          e.preventDefault();
          $("#submitAnswer").click();
        }
      });
    }

    this.timeRemaining = question.time;
    this.startTimer(question.time - 0.05, $("#timer"));
  };

  this.renderAnsweredBeforeTimeUpScreen = () => {
    const remarks = [
      "Great work!",
      "Fast hands much!",
      "Pure genius!",
      "Good job!",
      "Excellent!",
      "Stellar!",
      "Extraordinary!",
    ];
    canvas.html(
      `
      <div class="flex-1 flex flex-col items-center justify-center mx-auto container md:max-w-lg lg:max-w-xl xl:max-w-3xl px-4 md:px-0 mb-4">        
        <div class="text-2xl font-bold text-white text-center">
          ${remarks[Math.floor(Math.random() * remarks.length)]}<br>
          Waiting for host to reveal answer..
        </div>
      </div>
      ${this.footer()}
        `
    );
  };

  this.renderTimeUpScreen = () => {
    canvas.html(
      `
      <div class="flex-1 flex flex-col items-center justify-center mx-auto container md:max-w-lg lg:max-w-xl xl:max-w-3xl px-4 md:px-0 mb-4">
        Time's up!
        <div class="text-2xl font-bold text-white text-center">Waiting for host to reveal answer..</div>
      </div>
      ${this.footer()}
        `
    );
  };

  this.renderShowScore = (question) => {
    canvas.html(
      `
      <div class="flex-1 flex flex-col items-center justify-center mx-auto container md:max-w-lg lg:max-w-xl xl:max-w-3xl px-4 md:px-0 mb-4 py-8">
        <div class="text-2xl font-bold text-white">${
          this.answeredCorrect ? "You're correct!" : "Better luck next time~"
        }</div>
        <div class="my-4 text-center font-bold text-white">
          <div class="text-white text-base text-center">Current score:</div>
          <div class="text-bold text-3xl text-center text-white">
            ${this.currentScore + ` (+${this.scoreEarned})`}
          </div>
        </div>
        <img src="${question.img}" 
          alt="" class="w-full md:w-1/2 md:max-h-40 object-contain rounded-lg mx-auto" />
        ${
          question.type !== "SA"
            ? '<div id="options" class="w-full grid grid-rows-4 md:grid-cols-2 md:grid-rows-2 gap-3 my-4"></div>'
            : '<div id="cAnswer" class="grid grid-cols-1 grid-rows-2 gap-3 my-4"></div>'
        }
      </div>
      ${this.footer()}
      `
    );
    if (question.type !== "SA") {
      for (let i = 0; i < question.options.length; i++) {
        $("#options").append(OptionButton(question.options[i], true, true, this.answer));
      }
    } else {
      if (this.answeredCorrect) {
        $("#cAnswer").append(
          `<div class="shadow rounded py-2 px-3 text-gray-700 leading-tight bg-green-400 text-center mx-auto">${this.answer}</div>`
        );
      } else {
        $("#cAnswer").append(
          `<div class="shadow rounded py-2 px-3 text-gray-700 leading-tight bg-green-400 text-center mx-auto">${
            this.currentQuestion.options[0]
          }</div>
          <div class="shadow appearance-none rounded py-2 px-3 text-white leading-tight bg-blue-900 text-center mx-auto">${
            this.answer || "unanswered"
          }</div>`
        );
      }
    }
  };

  this.renderFinalScreen = () => {
    var leaderboard = Object.entries(yai.eventVars.leaderboard).map((e) => ({
      username: e[0],
      score: e[1],
    }));
    leaderboard = leaderboard.sort((a, b) => (a.score > b.score ? -1 : 1));
    const rank = leaderboard.findIndex((x) => x.username === username) + 1;
    const remarks = ["Congratulations!", "Great job!", 'You tried your best :")'];
    canvas.html(
      `
      <div class="flex-1 flex flex-col items-center justify-center mx-auto container md:max-w-lg lg:max-w-xl xl:max-w-3xl px-4 md:px-0 mb-4">
        <div class="my-4 text-center font-bold text-white">
          <div class="text-lg ">${rank <= 3 ? remarks[0] : rank == leaderboard.length ? remarks[2] : remarks[1]}</div>
          <div class="text-4xl">
            You ranked ${rank + nth(rank)} out of ${leaderboard.length}
          </div>
          <div class="text-lg">Final Score: ${this.currentScore}</div>
        </div>
      </div>
      ${this.footer()}
        `
    );
  };

  // ============================================================
  // Components
  // ============================================================

  this.header = (question) => {
    return `
    <div class="sticky top-0 z-40 w-screen flex flex-col items-end mb-4">
      <div class="bg-blue-300 py-8 px-16 w-full flex items-center justify-between">
        <div class="font-bold text-blue-900">
          Question ${this.currentQid + 1}/${this.totalQuestions}
        </div>
        <div id="timer" class="font-bold text-blue-900">${question.time}s</div>
      </div>
      ${ProgressBar(question.time)}
    </div>
    `;
  };

  this.footer = () => {
    return `
    <div class="bg-blue-700 p-4 md:py-8 md:px-16 relative w-screen flex items-center justify-between">
      <div class="text-2xl font-bold text-white">${username}</div>
      ${Button("light-outline", "Quit", "MainScene.onLeave()", "w-20 md:w-40")}
    </div>
    `;
  };
})();
