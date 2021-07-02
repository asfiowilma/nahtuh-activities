const HostLobby = new (function () {
  this.currentQid = 0;
  this.timerInterval = null;
  this.answered = 0;
  this.voices = speechSynthesis.getVoices();

  this.start = () => {
    this.voices = speechSynthesis.getVoices();
    this.renderWaitingForPlayers();
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
    // console.log(playerList);
  };

  this.onPlayerLeave = (message) => {
    delete yai.eventVars.leaderboard[message.participantName];
    this.renderPlayerList();
  };

  this.onEventVariableChanged = (message) => {
    // console.log("ini dari host lobby");
    // console.log(message.name, message.value);
    if (isStarted && message.name === "leaderboard") {
      this.answered++;
      this.rerenderPlayerAnswered();
    }
    // console.log(yai.eventVars.leaderboard);
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
        HostLobby.stopTimer();
      }
    }, 1000);
  };

  this.stopTimer = () => {
    clearInterval(this.timerInterval);
    console.log("timer stopped");
    if (!yai.eventVars.manualReveal) this.renderCorrectAnswer(questions[this.currentQid]);
    else
      canvas
        .children()
        .last()
        .append(Button("light-outline", "Reveal Answer", "HostLobby.manualReveal()", "w-40"));
  };

  this.manualReveal = () => {
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

  this.renderWaitingForPlayers = () => {
    canvas.removeClass("bg-gray-100");
    canvas.addClass("bg-green-600");

    canvas.html(`
      <div class="sticky top-0 w-full bg-green-700 py-8">
        <div class="container mx-auto flex flex-col items-center font-bold text-white">
          Join by entering the game ID:
          <div class="bg-white mt-2 rounded-lg shadow-md pt-2 pb-4 px-4">
            <div class="text-4xl font-bold text-green-800 pb-3">${eventId}</div>
            ${Button(
              "secondary",
              "Start Quiz",
              "HostLobby.startQuiz()",
              "bg-gray-600 hover:bg-gray-500"
            )}
          </div>
        </div>
      </div>
      <div id="player-list" class="w-5/6 md:w-2/3 mx-auto my-8 flex justify-center items-start flex-wrap"></div>
    `);
  };

  this.renderPlayerList = () => {
    $("#player-list").empty();

    if (playerList.length === 0) {
      $("#player-list").append(this.playerBlock("Waiting for players..."));
    } else {
      for (let i = 0; i < playerList.length; i++) {
        $("#player-list").append(this.playerBlock(playerList[i].participantName));
      }
    }
  };

  this.renderQuestion = (question) => {
    if (question.type === "MV") {
      src = `https://www.youtube.com/embed/${question.media.video}?start=${
        question.media.startAt
      }&end=${parseInt(
        parseInt(question.media.startAt) + parseInt(question.media.duration)
      )}&autoplay=${yai.eventVars.autoplay ? 1 : 0}`;
      timer = parseInt(parseInt(question.time) + parseInt(question.media.duration));
    } else if (question.type === "TTS") {
      lyrics = new SpeechSynthesisUtterance(question.media.audio);
      lyrics.voice = this.voices[question.media.voice];
      lyrics.pitch = question.media.pitch;
      lyrics.rate = question.media.rate;
      if (yai.eventVars.autoplay) speechSynthesis.speak(lyrics);
      timer = question.time;
    }
    canvas.html(
      `
      ${this.header(question)}
      <div class="flex-1 flex flex-col items-center justify-center mx-auto container md:max-w-lg lg:max-w-xl xl:max-w-3xl px-4 md:px-0 relative">
      <iframe class="w-full h-80 rounded-lg mx-auto" src="${src}">
      </iframe>
      <div class="w-full h-80 -mt-80 z-10 bg-green-500 flex flex-col items-center justify-center rounded-lg">
        <i class="fab fa-itunes-note text-white animate-bounce fa-4x "></i>
        <span class="text-white font-bold text-xl mt-2">What is the title of the song?</span>
      </div>
      ${yai.eventVars.autoplay ? "" : Button("primary", "Play", "", 'w-40 mt-4" id="playButton"')}
        ${
          question.type !== "SA"
            ? '<div id="options" class="w-full grid grid-rows-4 md:grid-cols-2 md:grid-rows-2 gap-3 my-4"></div>'
            : ""
        }
      </div>
    `
    );

    $("#playButton").one("click", function () {
      if (question.type === "MV") $("iframe").attr("src", `${src}1`);
      else if (question.type === "TTS") speechSynthesis.speak(lyrics);
      HostLobby.startTimer(timer - 1, $("#timer"));
      $("#progressBar").replaceWith(ProgressBar(timer));
      $("#playButton").remove();
      yai.broadcast("startTimer");
    });

    if (!["SA", "MV", "TTS"].includes(question.type)) {
      for (let i = 0; i < question.options.length; i++) {
        $("#options").append(OptionButton(question.options[i], false, true));
      }
    }
    if (yai.eventVars.autoplay) this.startTimer(timer - 1, $("#timer"));
  };

  this.renderCorrectAnswer = (question) => {
    if (question.type === "MV") {
      src = `https://www.youtube.com/embed/${question.media.video}?start=${
        question.media.startAt
      }&end=${parseInt(
        parseInt(question.media.startAt) + parseInt(question.media.duration)
      )}&autoplay=1`;
    } else if (question.type === "TTS") {
      lyrics = new SpeechSynthesisUtterance(question.media.audio);
      lyrics.voice = this.voices[question.media.voice];
      lyrics.pitch = question.media.pitch;
      lyrics.rate = question.media.rate;
      speechSynthesis.speak(lyrics);
    }
    canvas.html(
      `${this.header(question, true, true)}
      <div id="cAnswer" class="flex-1 flex flex-col items-center justify-center mx-auto container md:max-w-lg lg:max-w-xl xl:max-w-3xl px-4 md:px-0">
      ${
        question.type === "MV"
          ? `<iframe class="w-full h-80 rounded-lg mx-auto" src="${src}"></iframe>`
          : `<div class="w-full h-80 bg-green-500 flex flex-col items-center justify-center rounded-lg p-4">
            <i class="fab fa-itunes-note text-white animate-bounce fa-3x mb-4"></i>
            <div class="whitespace-pre-line text-white">${question.media.audio}</div>
          </div>`
      }        
        ${
          !["SA", "MV", "TTS"].includes(question.type)
            ? '<div id="options" class="w-full grid grid-rows-4 md:grid-cols-2 md:grid-rows-2 gap-3 my-4"></div>'
            : ""
        }
      </div>
    `
    );
    if (!["SA", "MV", "TTS"].includes(question.type)) {
      for (let i = 0; i < question.options.length; i++) {
        $("#options").append(OptionButton(question.options[i], true, true));
      }
    } else {
      console.log("appending correct answer..");
      $("#cAnswer").append(
        `<div class="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight bg-white mt-4 text-center w-1/2 mx-auto">${question.options[0]}</div>`
      );
      $("#cAnswer").append(
        `<div class="font-bold text-xl text-white text-center mt-4">Wrong answers:</div>
        <div id="wrongAnswerGrid" class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 my-4"></div>`
      );
      // render wrong answers to be regraded
      console.log("counting wrong answers..");
      wrongAnswers = {};
      for (var i = 0; i < yai.eventVars.wrongAnswers.length; i++) {
        var answer = yai.eventVars.wrongAnswers[i];
        wrongAnswers[answer] = wrongAnswers[answer] ? wrongAnswers[answer] + 1 : 1;
      }
      console.log("done counting.");
      console.log("appending wrong answers..");
      for (const wrong of Object.entries(wrongAnswers)) {
        (answer = wrong[0]), (count = wrong[1]);
        answerSlug = answer.replace(/[^\w ]+/g, "").replace(/ +/g, "-");
        $("#wrongAnswerGrid").append(`
          <div class="border border-white bg-green-900 text-white rounded-lg p-4 flex flex-col transform ease-in-out">
            <div class="flex items-center justify-end">${Button(
              "primary",
              '<i class="fas fa-check"></i>',
              "",
              `transform ease-in-out" id="${answerSlug}`
            )}</div>
            <div class="flex-1 text-center my-2">${answer}</div>
            <div class="text-sm text-right">${count} <i class="fas fa-user ml-2 text-sm"></i></div>
          </div>
        `);
        $(`#${answerSlug}`).hover(
          () => $(`#${answerSlug}`).html('Mark as correct <i class="fas fa-check"></i>'),
          () => $(`#${answerSlug}`).html('<i class="fas fa-check"></i>')
        );
        $(`#${answerSlug}`).one("click", function () {
          yai.broadcast({ regrade: answer });
          $(`#${answerSlug}`).parent().parent().removeClass("bg-green-900");
          $(`#${answerSlug}`).unbind("mouseenter mouseleave");
          $(`#${answerSlug}`).html('Marked as correct <i class="fas fa-check"></i>');
        });
        console.log("done appending.");
      }
    }
    yai.broadcast("showCorrect");
  };

  this.rerenderPlayerAnswered = () => {
    $("#answered").text(`Answered ${this.answered}`);
  };

  this.renderLeaderboard = (leaderboard, final = false) => {
    const leadScore = leaderboard[0].score;
    canvas.html(`
      ${
        !final
          ? this.header(questions[this.currentQid], true, false)
          : Button("light-outline", "Quit", "location.reload()", "w-40 absolute bottom-4 right-4")
      }
      <div class="flex-1 flex flex-col items-center justify-center mx-auto container md:max-w-lg lg:max-w-xl xl:max-w-3xl px-4 md:px-0">
        ${
          final
            ? `<div class="my-4 text-center font-bold text-white">
            <div class="text-lg ">Congratulations!</div>
            <div class="text-4xl">${leaderboard[0].username}</div>
            <div class="text-lg">Final Score: ${leaderboard[0].score}</div>
          </div>`
            : ""
        }
        <div id="bars" class="w-full"></div>
      </div>      
    `);

    for (let i = 0; i < leaderboard.length; i++) {
      $("#bars").append(`
        <div class="flex text-white">
          <div class="break-all text-right w-1/4">${leaderboard[i].username}</div>
          <div class="relative ml-4 w-3/4">
            <div class="overflow-hidden h-6 mb-4 text-xs flex rounded-lg">
              <div style="width:${(leaderboard[i].score / leadScore) * 100}%" 
                class="shadow-none flex flex-col text-center whitespace-nowrap rounded-lg text-green-900 justify-center bg-green-300">
                ${leaderboard[i].score}
              </div>
            </div>
          </div>          
        </div>
      `);
    }
  };

  // ============================================================
  // Components
  // ============================================================

  this.playerBlock = (str) => {
    return `
      <div class="py-2 px-6 rounded bg-green-700 my-2 mx-2 font-bold text-white cursor-pointer hover:shadow-lg transform hover:-translate-y-0.5 hover:-translate-x-0.5 transition ease-in-out">
        ${str}
      </div>
    `;
  };

  this.header = (question, reveal = false, leaderboard = false) => {
    timer =
      question.type === "MV"
        ? parseInt(parseInt(question.time) + parseInt(question.media.duration))
        : question.time;
    return `
    <div class="sticky top-0 z-40 w-screen flex flex-col items-end mb-4">
      <div class="bg-green-700 p-4 pt-8 md:px-8 lg:py-8 lg:px-16 w-full flex items-center justify-between flex-wrap">
        <div class="font-bold text-white">
          Question ${this.currentQid + 1}/${questions.length}
        </div>
        ${!reveal ? `<div id="timer" class="font-bold text-white">${question.time}s</div>` : ""}
        ${Button(
          "light",
          "Next",
          leaderboard ? "HostLobby.showLeaderboard()" : "HostLobby.nextQuestion()",
          "w-full mt-2 md:mt-0 md:w-40"
        )}
      </div>
      ${
        !reveal
          ? ProgressBar(yai.eventVars.autoplay ? timer : 9999) +
            `<div id="answered" class="font-bold text-white text-right mr-8 mt-2 md:mt-4">Answered 0</div>`
          : ""
      }
    </div>
    `;
  };
})();
