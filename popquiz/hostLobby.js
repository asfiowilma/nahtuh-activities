const HostLobby = new (function () {
  this.currentQid = 0;
  this.timerInterval = null;
  this.answered = 0;

  this.start = () => {
    canvas.replaceClass("bg-gray-100", "from-pink-400 to-pink-600");
    sceneSwitcher("#lobby");

    $("#hl-event-id").text(eventId);
    sceneSwitcher("#waiting-for-players", true);
    this.renderPlayerList();
  };

  // ============================================================
  // Utility Methods
  // ============================================================

  this.onPlayerJoin = (message) => {
    yai.eventVars.leaderboard = {
      ...yai.eventVars.leaderboard,
      [message.participantName]: 0,
    };

    this.renderPlayerList();
  };

  this.onPlayerLeave = (message) => {
    delete yai.eventVars.leaderboard[message.participantName];
    this.renderPlayerList();
  };

  this.onEventVariableChanged = (message) => {
    if (isStarted && message.name === "leaderboard") {
      this.answered++;
      this.rerenderPlayerAnswered();
    }
  };

  this.startQuiz = () => {
    isStarted = true;
    yai.broadcast({
      isStarted: isStarted,
      totalQuestions: questions.length,
      nextQId: this.currentQid,
      nextQuestion: questions[this.currentQid],
    });
    this.renderQuestion(questions[this.currentQid]);
  };

  this.nextQuestion = () => {
    this.currentQid += 1;
    yai.eventVars.wrongAnswers = [];

    if (this.currentQid !== questions.length) {
      yai.broadcast({ nextQId: this.currentQid, nextQuestion: questions[this.currentQid] });
      this.renderQuestion(questions[this.currentQid]);
      this.answered = 0;
    } else {
      this.showLeaderboard(yai.eventVars.leaderboard, true);
      yai.broadcast("quizCompleted");
    }
  };

  this.startTimer = (timer, display) => {
    this.timerInterval = setInterval(() => {
      var seconds = parseInt(timer % 60, 10);
      display.text(seconds + "s");
      if (--timer < 0) {
        display.text("0s");
        hl.stopTimer();
      }
    }, 1000);
  };

  this.stopTimer = () => {
    clearInterval(this.timerInterval);
    this.renderCorrectAnswer(questions[this.currentQid]);
  };

  this.showLeaderboard = (final = false) => {
    var leaderboard = Object.entries(yai.eventVars.leaderboard).map((e) => ({
      username: e[0],
      score: e[1],
    }));
    leaderboard = leaderboard.sort((a, b) => (a.score > b.score ? -1 : 1));
    this.renderLeaderboard(final ? leaderboard : leaderboard.slice(0, 5), final);
  };

  // ============================================================
  // Renderer Scripts
  // ============================================================

  this.renderPlayerList = () => {
    $("#player-list").empty();

    if (playerList.length === 0) $("#player-list").append(PlayerBlock("Waiting for players..."));
    else {
      for (player of playerList) $("#player-list").append(PlayerBlock(player.participantName));
    }
  };

  this.renderQuestion = (question) => {
    console.log("rendering new question");
    sceneSwitcher("#question-display", true);
    const componentsToDisplay = ["#display-question-q"];

    HostLobbyHeader();
    $("#display-question-q").text(question.q);

    if (question.type !== "SA") {
      componentsToDisplay.push("#display-options");
      $("#display-options").empty();
      for (option of question.options) {
        $("#display-options").append(OptionButton(option, false, true));
      }
    }
    toggleHideQuestionDisplay(componentsToDisplay);
    this.startTimer(question.time - 1, $("#timer"));
  };

  this.renderCorrectAnswer = (question) => {
    console.log("rendering correct answer");
    sceneSwitcher("#question-display", true);
    $("#progress-bar").addClass("hidden");
    HostLobbyHeader(true, true);

    if (question.type !== "SA") {
      $("#display-options").empty();
      $("#display-options").removeClass("hidden");
      for (option of question.options) {
        $("#display-options").append(OptionButton(option, true, true));
      }
    } else {
      $("#display-options").addClass("hidden");
      $("#display-correct-answer").removeClass("hidden");
      $("#display-correct-answer").replaceClass("bg-green-400", "bg-white");
      $("#display-correct-answer").text(question.options[0]);

      if (yai.eventVars.wrongAnswers.length > 0) {
        $("#hl-wrong-answers").removeClass("hidden");

        // render wrong answers to be regraded
        console.log("counting wrong answers..");
        wrongAnswers = {};
        for (let i = 0; i < yai.eventVars.wrongAnswers.length; i++) {
          var answer = yai.eventVars.wrongAnswers[i];
          wrongAnswers[answer] = (wrongAnswers[answer] || 0) + 1;
        }
        console.log("done counting.");
        console.log("appending wrong answers..");
        for (const answer in wrongAnswers) {
          const count = wrongAnswers[answer];
          $("#wrong-answer-grid").append(WrongAnswerBlock(answer, count));
        }
        console.log("done appending.");
      }
    }
    yai.broadcast("showCorrect");
  };

  this.rerenderPlayerAnswered = () => {
    $("#answered").text(`Answered ${this.answered}`);
  };

  this.renderLeaderboard = (leaderboard, final = false) => {
    console.log("rendering leaderboard");
    sceneSwitcher("#leaderboard", true);
    const winner = leaderboard[0];

    if (final) {
      $("#lobby-header").addClass("hidden");
      $("#leaderboard-final").removeClass("hidden");
      $("#leaderboard-heading").text("Congratulations!");
      $("#leaderboard-winner-name").text(winner.username);
      $("#leaderboard-winner-score").text("Final Score: " + winner.score);
    } else {
      $("#leaderboard-heading").text("Top 5 Players");
      HostLobbyHeader(true, false);
    }

    $("#bars").empty();
    for (player of leaderboard.slice(0, final ? leaderboard.length : 5)) {
      $("#bars").append(LeaderboardScoreBar(player.username, player.score, winner.score));
    }
  };
})();
