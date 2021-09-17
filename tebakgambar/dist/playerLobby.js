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

  this.start = () => {
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
      canvas.replaceClass("bg-gray-light", "bg-gradient-to-br from-blue-400 to-blue-600");
      $("#lobby-footer").removeClass("hidden");
    }

    if (content.isStarted) {
      isStarted = isStarted;
      this.totalQuestions = content.totalQuestions;
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
    } else if (this.currentQuestion.type === "SA" && !isCorrect && this.answer && /\S/.test(this.answer)) {
      console.log("sending wrong answer");
      yai.eventVars.wrongAnswers = [...yai.eventVars.wrongAnswers, this.answer.toLowerCase()];
    }
    yai.sendToUser(this.hostId, { iAnswered: this.scoreEarned });
  };

  this.answerHandler = (option) => {
    this.answer = option || $("#pl-short-answer-input").val();
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
        display.text("0s");
        pl.stopTimer();
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
    sceneSwitcher("#waiting-for-host", true);
    $(".pl-username").text(username);
    $("#waiting-for-host").append(`<lobby-component id="waiting-room"></lobby-component>`);

    var waitingRoom = document.getElementById("waiting-room");
    waitingRoom.eventId = eventId;
    waitingRoom.onStart = this.startQuiz;
    waitingRoom.leaveEvent = () => history.back();
  };

  this.renderQuestion = (question) => {
    sceneSwitcher("#question-display", true);
    const componentsToDisplay = ["#display-question-q", "#display-question-img"];

    PlayerLobbyHeader(question.time);
    $("#display-question-q").text(question.q);
    $("#display-question-img").attr("src", question.img);

    if (question.type !== "SA") {
      componentsToDisplay.push("#display-options");
      $("#display-options").empty();
      for (option of question.options) {
        $("#display-options").append(OptionButton(option));
      }
    } else {
      componentsToDisplay.push("#pl-short-answer");
      $("#pl-short-answer-input").val("");
      $("#pl-short-answer-input").focus();
      $("#pl-short-answer-input").submitOnEnter("#pl-submit-answer-btn");
    }
    toggleHideQuestionDisplay(componentsToDisplay);
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
    sceneSwitcher("#waiting-for-reveal", true);
    $("#lobby-header").addClass("hidden");
    $("#pl-waiting-remarks").text(remarks[Math.floor(Math.random() * remarks.length)]);
  };

  this.renderTimeUpScreen = () => {
    sceneSwitcher("#waiting-for-reveal", true);
    $("#pl-waiting-remarks").text("Time's up!");
  };

  this.renderShowScore = (question) => {
    sceneSwitcher("#question-display", true);
    $("#lobby-header").addClass("hidden");
    $("#pl-reveal-remark").text(this.answeredCorrect ? "You're correct!" : "Better luck next time~");
    $("#pl-current-score").text(this.currentScore + ` (+${this.scoreEarned})`);
    const componentsToDisplay = ["#display-question-q", "#pl-reveal-remark", "#pl-reveal-score"];

    if (question.type !== "SA") {
      componentsToDisplay.push("#display-options");
      $("#display-options").empty();
      for (option of question.options) {
        $("#display-options").append(OptionButton(option, true, false, this.answer));
      }
    } else {
      componentsToDisplay.push("#display-correct-answer");
      if (this.answeredCorrect) {
        $("#display-correct-answer").text(this.answer);
      } else {
        componentsToDisplay.push("#display-wrong-answer");
        $("#display-correct-answer").text(this.currentQuestion.options[0]);
        $("#display-wrong-answer").text(this.answer && /\S/.test(this.answer) ? this.answer : "unanswered");
      }
    }
    toggleHideQuestionDisplay(componentsToDisplay);
  };

  this.renderFinalScreen = (lb) => {
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
