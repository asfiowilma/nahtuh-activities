const HostLobby = new (function () {
  this.currentQid = 0;
  this.timerInterval = null;
  this.answered = 0;

  this.start = () => {
    this.voices = speechSynthesis.getVoices();
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
    canvas.replaceClass("bg-gray-light", "bg-gradient-to-br from-green-400 to-green-600");
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
        HostLobby.stopTimer();
      }
    }, 1000);
  };

  this.stopTimer = () => {
    clearInterval(this.timerInterval);
    if (!yai.eventVars.manualReveal) this.renderCorrectAnswer(questions[this.currentQid]);
    else $("#manual-reveal-btn").removeClass("hidden");
  };

  this.manualReveal = () => {
    this.renderCorrectAnswer(questions[this.currentQid]);
    $("#manual-reveal-btn").addClass("hidden");
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
    waitingRoom.leaveEvent = () => history.back();

    // customize colors
    waitingRoom.colorPrimary = "#10B981";
    waitingRoom.colorSecondary = "#047857";
  };

  this.renderQuestion = (question) => {
    sceneSwitcher("#question-display", true);
    const media = question.media;
    const componentsToDisplay = ["#display-question-q", "#display-question-img"];

    $("#display-question-q").text("What is the title of the song?");
    $("#display-cover-vid").removeClass("-mt-64 md:-mt-80 lg:-mt-96");
    if (question.type === "MV") {
      src = `https://www.youtube.com/embed/${media.video}?start=${media.startAt}&end=${parseInt(
        parseInt(media.startAt) + parseInt(media.duration)
      )}&autoplay=${yai.eventVars.autoplay ? 1 : 0}`;
      timer = parseInt(parseInt(question.time) + parseInt(media.duration));
      newIframe = `<iframe id="display-question-vid" class="w-full h-80 rounded-lg mx-auto" src="${src}"> </iframe>`;
      $("#display-question-vid").replaceWith(newIframe);
      $("#display-cover-vid").addClass("-mt-64 md:-mt-80 lg:-mt-96");
      componentsToDisplay.push("#display-question-vid");
    } else if (question.type === "TTS") {
      lyrics = new SpeechSynthesisUtterance(media.audio);
      lyrics.voice = this.voices[media.voice];
      lyrics.pitch = media.pitch;
      lyrics.rate = media.rate;
      if (yai.eventVars.autoplay) speechSynthesis.speak(lyrics);
      timer = question.time;
    }
    HostLobbyHeader(false, false, timer);
    componentsToDisplay.push("#display-cover-vid");

    if (!yai.eventVars.autoplay) {
      componentsToDisplay.push("#play-btn");
      $("#replay-btn").click(() => speechSynthesis.speak(lyrics));
    } else {
      componentsToDisplay.push("#replay-btn");
    }

    $("#play-btn").one("click", function () {
      if (question.type === "MV") {
        $("#display-question-vid").attr("src", `${src}1`);
        $("#play-btn").addClass("hidden");
      } else if (question.type === "TTS") {
        speechSynthesis.speak(lyrics);
        $("#play-btn").addClass("hidden");
        $("#replay-btn").removeClass("hidden");
      }
      hl.startTimer(timer - 1, $("#timer"));
      ProgressBar(timer);

      yai.broadcast("startTimer");
    });

    toggleHideQuestionDisplay(componentsToDisplay);
    if (yai.eventVars.autoplay) this.startTimer(timer - 1, $("#timer"));
  };

  this.renderCorrectAnswer = (question) => {
    sceneSwitcher("#question-display", true);
    $("#progress-bar, #replay-btn, #play-btn").addClass("hidden");
    const media = question.media;
    HostLobbyHeader(true, true);

    if (question.type === "MV") {
      src = `https://www.youtube.com/embed/${media.video}?start=${media.startAt}&end=${parseInt(
        parseInt(media.startAt) + parseInt(media.duration)
      )}&autoplay=1`;
      newIframe = `<iframe id="display-question-vid" class="w-full h-80 rounded-lg mx-auto" src="${src}"> </iframe>`;
      $("#display-question-vid").replaceWith(newIframe);
      $("#display-cover-vid").addClass("hidden");
    } else if (question.type === "TTS") {
      lyrics = new SpeechSynthesisUtterance(media.audio);
      lyrics.voice = this.voices[media.voice];
      lyrics.pitch = media.pitch;
      lyrics.rate = media.rate;
      speechSynthesis.speak(lyrics);

      $("#display-question-q").text(question.options[0]);
      $("#display-tts-answer").removeClass("hidden");
      $("#display-tts-answer").text(media?.audio);
    }

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
