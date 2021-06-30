const MainScene = new (function () {
  this.currentQuestion = null;
  this.currentQid = 0;
  this.totalQuestions = 0;
  this.currentScore = 0;
  this.scoreEarned = 0;
  this.answeredCorrect = false;
  this.answer = null;
  this.timerInterval = null;
  this.timeRemaining = 0;
  this.voices = speechSynthesis.getVoices();

  this.start = () => {
    canvas.empty();
    this.voices = speechSynthesis.getVoices();
    this.renderWaitingScreen();
  };

  this.onIncomingMessage = (content) => {
    if (content.isStarted) {
      isStarted = isStarted;
      this.totalQuestions = content.totalQuestions;
      canvas.removeClass("h-screen");
    }

    if (content === "startTimer") {
      question = this.currentQuestion;
      media = question.media;
      if (question.type === "MV") {
        endTime = parseInt(parseInt(media.startAt) + parseInt(media.duration));
        src = `https://www.youtube.com/embed/${media.video}?start=${media.startAt}&end=${endTime}&autoplay=1`;
        $("iframe").attr("src", src);
        timer = parseInt(parseInt(question.time) + parseInt(media.duration));
      } else if (question.type === "TTS") {
        lyrics = new SpeechSynthesisUtterance(media.audio);
        lyrics.voice = this.voices[media.voice];
        lyrics.pitch = media.pitch;
        lyrics.rate = media.rate;
        yai.eventVars.autoplay && speechSynthesis.speak(lyrics);
        timer = question.time;
      }

      $("#progressBar").replaceWith(ProgressBar(timer));
      this.startTimer(timer - 0.05, $("#timer"));
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
    if (this.timeRemaining === 0 && !yai.eventVars.manualReveal) this.renderTimeUpScreen();
    else if (this.answer != null) this.renderAnsweredBeforeTimeUpScreen();
  };

  // ============================================================
  // Renderer Scripts
  // ============================================================

  this.renderWaitingScreen = () => {
    canvas.html(
      `
    <div class="flex-1 flex items-center justify-center px-4 md:px-0">
      <div class="bg-white flex flex-col p-4 rounded-lg w-full md:w-1/2 mx-auto items-center">
        <div class="text-center text-4xl font-bold text-green-800">${username}</div>
        <div class="text-center text-xl font-bold">
          You're in! Check if your name is on the host's screen.
        </div>
        <hr class="my-4 w-full">
        <div class="text-center text-xl font-bold text-green-600">
          Waiting for host to start quiz...
        </div>
      </div>
    </div>
    ` + Button("light-outline", "Quit", "location.reload()", "w-40 absolute bottom-4 right-4")
    );
  };

  this.renderQuestion = (question) => {
    media = question.media;
    let src;
    if (question.type === "MV") {
      endTime = parseInt(parseInt(media.startAt) + parseInt(media.duration));
      src = `https://www.youtube.com/embed/${media.video}?start=${media.startAt}&end=${endTime}&autoplay=1`;
    } else if (question.type === "TTS") {
      lyrics = new SpeechSynthesisUtterance(media.audio);
      lyrics.voice = this.voices[media.voice];
      lyrics.pitch = media.pitch;
      lyrics.rate = media.rate;
      !yai.eventVars.hostOnly && !yai.eventVars.autoplay && speechSynthesis.speak(lyrics);
    }
    isMVhost = yai.eventVars.hostOnly && question.type === "MV";
    isMV = question.type === "MV";
    canvas.html(
      `
      ${this.header(question)}
      <div class="flex-1 flex flex-col items-center justify-center mx-auto container md:max-w-lg lg:max-w-xl xl:max-w-3xl px-4 md:px-0 mb-4">
      ${
        !isMV || isMVhost
          ? ""
          : `<iframe class="w-full h-80 rounded-lg mx-auto" src="${src}">
          </iframe>`
      }
        <div class="w-full h-80 ${
          !isMV || isMVhost ? "" : "-mt-80"
        } z-10 bg-green-500 flex flex-col items-center justify-center rounded-lg">
          <i class="fab fa-itunes-note text-white animate-bounce fa-4x "></i>
          <span class="text-white font-bold text-xl mt-2">What is the title of the song?</span>
        </div>
        ${
          !["SA", "MV", "TTS"].includes(question.type)
            ? '<div id="options" class="w-full grid grid-rows-4 md:grid-cols-2 md:grid-rows-2 gap-3 my-4"></div>'
            : `<div class="flex w-full px-4 w-full xl:w-2/3 mt-4 mx-auto">
            <input id="answer" type="text" placeholder="Enter correct answer" class="options shadow appearance-none border rounded flex-1 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            ${Button("primary", "Submit", "MainScene.answerHandler()", `ml-2 flex items-center`)}
            </div>`
        }
      </div>
      ${this.footer()}      
      `
    );

    if (!["SA", "MV", "TTS"].includes(question.type)) {
      for (let i = 0; i < question.options.length; i++) {
        $("#options").append(OptionButton(question.options[i]));
      }
    }

    timer =
      question.type === "MV"
        ? parseInt(parseInt(question.time) + parseInt(question.media.duration))
        : question.time;
    this.timeRemaining = timer;
    if (yai.eventVars.autoplay) this.startTimer(timer - 0.05, $("#timer"));
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
        <div class="w-full h-80 bg-green-500 flex flex-col items-center justify-center rounded-lg p-4">
          <i class="fab fa-itunes-note text-white animate-bounce fa-2x mb-4"></i>
          <div class="whitespace-pre-line text-white">${question.media.audio}</div>
        </div>
        ${
          !["SA", "MV", "TTS"].includes(question.type)
            ? '<div id="options" class="w-full grid grid-rows-4 md:grid-cols-2 md:grid-rows-2 gap-3 my-4"></div>'
            : '<div id="cAnswer" class="grid grid-cols-1 grid-rows-2 gap-3 my-4"></div>'
        }
      </div>
      ${this.footer()}
      `
    );
    if (!["SA", "MV", "TTS"].includes(question.type)) {
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
          `<div class="shadow rounded py-2 px-3 text-gray-700 leading-tight bg-green-400 text-center mx-auto">${this.currentQuestion.options[0]}</div>
          <div class="shadow appearance-none rounded py-2 px-3 text-white leading-tight bg-green-900 text-center mx-auto">${this.answer}</div>`
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
          <div class="text-lg ">${
            rank <= 3 ? remarks[0] : rank == leaderboard.length ? remarks[2] : remarks[1]
          }</div>
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
    timer =
      question.type === "MV"
        ? parseInt(parseInt(question.time) + parseInt(question.media.duration))
        : question.time;

    return `
    <div class="sticky top-0 z-40 w-screen flex flex-col items-end mb-4">
      <div class="bg-green-700 py-8 px-16 w-full flex items-center justify-between">
        <div class="font-bold text-white">
          Question ${this.currentQid + 1}/${this.totalQuestions}
        </div>
        <div id="timer" class="font-bold text-white">${timer}s</div>
      </div>
      ${ProgressBar(yai.eventVars.autoplay ? timer : 9999)}
    </div>
    `;
  };

  this.footer = () => {
    return `
    <div class="bg-green-700 p-4 md:py-8 md:px-16 relative w-screen flex items-center justify-between">
      <div class="text-2xl font-bold text-white">${username}</div>
      ${Button("light-outline", "Quit", "location.reload()", "w-20 md:w-40")}
    </div>
    `;
  };
})();
