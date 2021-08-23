const PlayerLobby = new (function () {
  this.hostId = "";
  this.totalQuestions = 0;
  this.scoreEarned = 0;

  this.currentQuestion = null;
  this.currentQid = 0;
  this.currentScore = 0;
  this.answeredCorrect = false;
  this.answer = null;

  this.timerInterval = null;
  this.timeRemaining = 0;

  // VOICES
  this.voices = speechSynthesis.getVoices();
  this.voice = 0;
  this.rate = 1;
  this.pitch = 1;

  this.start = () => {
    this.voices = speechSynthesis.getVoices();
    sceneSwitcher("#lobby");
    $("#credits").toggleClass("hidden");

    findHost().then((host) => (this.hostId = host.participantId));
    this.renderWaitingScreen();
  };

  this.onLeave = () => {
    swal({ icon: "warning", text: "Are you sure you want to leave?", buttons: true }).then((value) => {
      if (value) yai.leaveEvent().then(() => history.back());
    });
  };

  this.onIncomingMessage = (content) => {
    if (canvas.hasClass("bg-gray-light")) {
      canvas.replaceClass("bg-gray-light", "bg-gradient-to-br from-green-400 to-green-600");
      $("#lobby-footer").removeClass("hidden");
    }

    if (content.isStarted) {
      isStarted = isStarted;
      this.totalQuestions = content.totalQuestions;
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
        lyrics.voice = this.voices[this.voice];
        lyrics.pitch = this.pitch;
        lyrics.rate = this.rate;
        if (!yai.eventVars.hostOnly) speechSynthesis.speak(lyrics);
        timer = question.time;
      }
      ProgressBar(timer);
      this.startTimer(timer - 0.05, $("#timer"));
    }

    if (content === "showCorrect") {
      this.stopTimer();
      this.renderShowScore(this.currentQuestion);
      this.answeredCorrect = false;
    } else if (content?.leaderboard) {
      this.renderFinalScreen(content.leaderboard);
    } else if (content?.nextQuestion) {
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

  // ============================================================
  // Scoring Handlers
  // ============================================================

  this.resetAnswer = () => {
    this.answeredCorrect = false;
    this.scoreEarned = 0;
    this.answer = null;
  };

  this.SAChecker = (answer) => {
    for (ans of this.currentQuestion.options) {
      if (ans.toLowerCase() === answer.toLowerCase()) return true;
    }
    return false;
  };

  this.SAScoringHandler = (answer) => this.scoringHandler(this.SAChecker(answer));
  this.scoringHandler = (isCorrect) => {
    const multiplier = parseInt(this.currentQuestion.points);
    var score = 0;
    if (this.currentQuestion.type == "MV") {
      initialTime = parseInt(parseInt(this.currentQuestion.time) + parseInt(this.currentQuestion.media.duration));
    } else {
      initialTime = this.currentQuestion.time;
    }
    if (isCorrect) {
      score = BASE_SCORE;
      score += Math.floor((this.timeRemaining / initialTime) * BASE_SCORE);
      score *= multiplier;
      this.currentScore += score;
      this.scoreEarned = score;
      this.answeredCorrect = true;
    } else if (!isCorrect && this.answer && /\S/.test(this.answer)) {
      console.log("sending wrong answer");
      yai.eventVars.wrongAnswers = [...yai.eventVars.wrongAnswers, this.answer.toLowerCase()];
    }
    yai.sendToUser(this.hostId, { iAnswered: this.scoreEarned });
  };

  this.answerHandler = (option) => {
    this.answer = option || $("#pl-short-answer-input").val();
    this.stopTimer();
    this.SAScoringHandler(this.answer);
  };

  this.startTimer = (timer, display) => {
    this.timerInterval = setInterval(() => {
      var seconds = parseInt(timer % 60, 10);
      display.text(seconds + "s");
      timer -= 0.05;
      this.timeRemaining -= 0.05;
      if (timer < 0) {
        display.text(0 + "s");
        pl.stopTimer();
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
    sceneSwitcher("#waiting-for-host", true);
    $(".pl-username").text(username);
    $("#waiting-for-host").append(`<lobby-component id="waiting-room"></lobby-component>`);

    var waitingRoom = document.getElementById("waiting-room");
    waitingRoom.eventId = eventId;
    waitingRoom.onStart = this.startQuiz;
    waitingRoom.leaveEvent = () => history.back();

    // customize colors
    waitingRoom.colorPrimary = "#10B981";
    waitingRoom.colorSecondary = "#047857";
  };

  this.renderQuestion = (question) => {
    sceneSwitcher("#question-display", true);
    const media = question.media;
    const componentsToDisplay = ["#display-question-q"];
    $("#display-question-vid").parent().removeClass("hidden");

    if (question.type === "MV") {
      endTime = parseInt(parseInt(media.startAt) + parseInt(media.duration));
      timer = parseInt(parseInt(question.time) + parseInt(media.duration));
      src = `https://www.youtube.com/embed/${media.video}?start=${media.startAt}&end=${endTime}&autoplay=${
        yai.eventVars.autoplay ? 1 : 0
      }`;
      $("#display-question-vid").attr("src", src);
    } else if (question.type === "TTS") {
      lyrics = new SpeechSynthesisUtterance(media.audio);
      lyrics.voice = this.voices[this.voice];
      lyrics.pitch = this.pitch;
      lyrics.rate = this.rate;
      if (!yai.eventVars.hostOnly && yai.eventVars.autoplay) speechSynthesis.speak(lyrics);
      timer = question.time;
    }
    PlayerLobbyHeader(timer);
    componentsToDisplay.push("#display-cover-vid");
    componentsToDisplay.push("#pl-short-answer");
    $("#pl-short-answer-input").val("").focus();
    $("#pl-short-answer-input").unbind("keypress").submitOnEnter("#pl-submit-answer-btn");

    isMVhost = yai.eventVars.hostOnly && question.type === "MV";
    isMV = question.type === "MV";
    if (!isMV || isMVhost) {
      $("#display-cover-vid").removeClass("-mt-64 md:-mt-80 lg:-mt-96");
    } else if (isMV) {
      componentsToDisplay.push("#display-question-vid");
      $("#display-question-vid").replaceWith(
        `<iframe id="display-question-vid" class="w-full h-80 rounded-lg mx-auto" src="${src}"> </iframe>`
      );
      $("#display-cover-vid").addClass("-mt-64 md:-mt-80 lg:-mt-96");
    }

    this.timeRemaining = timer;
    toggleHideQuestionDisplay(componentsToDisplay);
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
    sceneSwitcher("#waiting-for-reveal", true);
    $("#lobby-header").addClass("hidden");
    $("#pl-waiting-remarks").text(remarks[Math.floor(Math.random() * remarks.length)]);
  };

  this.renderTimeUpScreen = () => {
    sceneSwitcher("#waiting-for-reveal", true);
    $("#pl-waiting-remarks").text("Time's up!");
  };

  this.renderShowScore = () => {
    sceneSwitcher("#question-display", true);
    $("#lobby-header").addClass("hidden");
    $("#pl-reveal-remark").text(this.answeredCorrect ? "You're correct!" : "Better luck next time~");
    $("#pl-current-score").text(this.currentScore + ` (+${this.scoreEarned})`);
    const componentsToDisplay = ["#display-question-q", "#pl-reveal-remark", "#pl-reveal-score"];

    componentsToDisplay.push("#display-correct-answer");
    if (this.answeredCorrect) {
      $("#display-correct-answer").text(this.answer);
    } else {
      componentsToDisplay.push("#display-wrong-answer");
      $("#display-correct-answer").text(this.currentQuestion.options[0]);
      $("#display-wrong-answer").text(this.answer && /\S/.test(this.answer) ? this.answer : "unanswered");
    }
    $("#display-question-vid").parent().addClass("hidden");
    toggleHideQuestionDisplay(componentsToDisplay);
  };

  this.renderFinalScreen = () => {
    const winner = lb[0];
    const rank = lb.findIndex((x) => x.username === username) + 1;
    const remarks = ["Congratulations!", "Great job!", 'You tried your best :")'];
    sceneSwitcher("#display-final-rank", true);
    $("#pl-final-remark").text(rank <= 3 ? remarks[0] : rank == lb.length ? remarks[2] : remarks[1]);
    $("#pl-final-rank").text(`You ranked ${rank + nth(rank)} out of ${lb.length}`);
    $("#pl-final-score").text(`Final Score: ${this.currentScore}`);

    $(".btn-wrapper").removeClass("hidden");
    $("#leaderboard-heading").text("Final Leaderboard");
    $("#leaderboard-heading").addClass("text-4xl");
    $("#bars").empty();
    for (player of lb) {
      $("#bars").append(LeaderboardScoreBar(player.username, player.score, winner.score));
    }
  };
})();
