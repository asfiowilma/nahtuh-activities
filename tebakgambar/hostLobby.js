const HostLobby = new (function () {
  this.currentQid = 0;
  this.timerInterval = null;
  this.answered = 0;

  this.start = () => {
    sceneSwitcher("#lobby");
    this.renderWaitingRoom();
  };

  // ============================================================
  // Utility Methods
  // ============================================================

  this.onPlayerJoin = (message) => {
    leaderboard[message.participantName] = 0;
  };

  this.onPlayerLeave = (message) => {
    delete yai.eventVars.leaderboard[message.participantName];
  };

  this.onIncomingMessage = (message) => {
    console.log(message);
    if (message.content?.iAnswered >= 0) {
      var sender = playerList.find((p) => p.participantId == message.senderId);
      console.log(sender);
      var senderName = sender.participantName;
      leaderboard[senderName] = (leaderboard[senderName] || 0) + message.content.iAnswered;

      this.answered = this.answered + 1;
      $("#answer-count").text(this.answered);
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
    canvas.replaceClass("bg-gray-light", "bg-gradient-to-br from-blue-400 to-blue-600");
    this.renderQuestion(questions[this.currentQid]);
  };

  this.nextQuestion = () => {
    this.currentQid += 1;
    yai.eventVars.wrongAnswers = [];

    if (this.currentQid !== questions.length) {
      yai.broadcast({ nextQId: this.currentQid, nextQuestion: questions[this.currentQid] });
      this.renderQuestion(questions[this.currentQid]);
      this.answered = 0;
      $("#answer-count").text(this.answered);
    } else {
      this.showLeaderboard(true);
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
    var lb = Object.entries(leaderboard).map((e) => ({
      username: e[0],
      score: e[1],
    }));
    lb = lb.sort((a, b) => (a.score > b.score ? -1 : 1));
    lb = lb.filter((a) => playerList.some((b) => b.participantName == a.username));
    this.renderLeaderboard(final ? lb : lb.slice(0, 5), final);
    if (final) yai.broadcast({ leaderboard: lb });
  };

  // ============================================================
  // Renderer Scripts
  // ============================================================

  this.renderWaitingRoom = () => {
    sceneSwitcher("#waiting-for-players", true);
    $("#waiting-for-players").append(`<lobby-component id="waiting-room"></lobby-component>`);

    var waitingRoom = document.getElementById("waiting-room");
    waitingRoom.eventId = eventId;
    waitingRoom.onStart = this.startQuiz;
    waitingRoom.leaveEvent = () => location.reload();
  };

  this.renderQuestion = (question) => {
    sceneSwitcher("#question-display", true);
    const componentsToDisplay = ["#display-question-q", "#display-question-img"];

    HostLobbyHeader();
    $("#display-question-q").text(question.q);
    $("#display-question-img").attr("src", question.img);

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
        $("#wrong-answer-grid").empty();
        for (const answer in wrongAnswers) {
          const count = wrongAnswers[answer];
          $("#wrong-answer-grid").append(WrongAnswerBlock(answer, count));
        }
        console.log("done appending.");
      }
    }
    yai.broadcast("showCorrect");
  };

  this.renderLeaderboard = (lb, final = false) => {
    console.log("rendering leaderboard");
    sceneSwitcher("#leaderboard", true);
    const winner = lb[0];

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
    for (player of lb.slice(0, final ? lb.length : 5)) {
      $("#bars").append(LeaderboardScoreBar(player.username, player.score, winner.score));
    }
  };
})();
