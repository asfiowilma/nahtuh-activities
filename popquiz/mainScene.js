const MainScene = new (function () {
  this.currentQid = null;
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

  this.onIncomingMessage = (content) => {
    if (content.isStarted) isStarted = isStarted;

    if (content === "showCorrect") {
      this.renderShowScore(yai.eventVars.questions[this.currentQid]);
      this.answeredCorrect = false;
    } else if (content === "quizCompleted") {
      this.renderFinalScreen();
    } else if (content.nextQuestion != null) {
      this.currentQid = content.nextQuestion;
      this.answeredCorrect = false;
      this.scoreEarned = 0;
      this.answer = null;
      this.renderQuestion(yai.eventVars.questions[this.currentQid]);
    }
  };

  this.scoringHandler = (option, maxTime) => {
    const isCorrect = option.b;
    const multiplier = parseInt(
      yai.eventVars.questions[this.currentQid].points
    );
    var score = 0;
    if (isCorrect) {
      score = BASE_SCORE;
      score += Math.floor((this.timeRemaining / maxTime) * BASE_SCORE);
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
    this.scoringHandler(option, yai.eventVars.questions[this.currentQid].time);
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
    // this.renderCorrectAnswer(yai.eventVars.questions[this.currentQid]);
  };

  // ============================================================
  // Renderer Scripts
  // ============================================================

  this.renderWaitingScreen = () => {
    // let container = document.createElement("div");
    // let h1 = document.createElement("h1");
    // let success = document.createElement("div");
    // let hr = document.createElement("hr");
    // let waiting = document.createElement("div");

    // container.className =
    //   "bg-white flex flex-col p-4 rounded-lg w-1/2 relative top-1/2 mx-auto transform -traslate-x-1/2 -translate-y-1/2 items-center";
    // setAttributes(h1, {
    //   innerHTML: username,
    //   className: "text-center text-4xl font-bold text-pink-800",
    // });
    // setAttributes(success, {
    //   innerHTML: "You're in! Check if your name is on the host's screen.",
    //   className: "text-center text-xl font-bold",
    // });
    // hr.className = "my-4 w-full";
    // setAttributes(waiting, {
    //   innerHTML: "Waiting for host to start quiz...",
    //   className: "text-center text-xl font-bold text-pink-600",
    // });

    // container.append(h1, success, hr, waiting);
    // canvas.innerHTML += HostPanel.button(
    //   "light-outline",
    //   "Quit",
    //   "location.reload()",
    //   "w-40 absolute bottom-4 right-4"
    // );
    // canvas.appendChild(container);
    canvas.html(
      `
    <div class="flex-1 flex items-center justify-center px-4 md:px-0">
      <div class="bg-white flex flex-col p-4 rounded-lg w-full md:w-1/2 mx-auto items-center">
        <div class="text-center text-4xl font-bold text-pink-800">${username}</div>
        <div class="text-center text-xl font-bold">
          You're in! Check if your name is on the host's screen.
        </div>
        <hr class="my-4 w-full">
        <div class="text-center text-xl font-bold text-pink-600">
          Waiting for host to start quiz...
        </div>
      </div>
    </div>
    ` + Button("light-outline", "Quit", "location.reload()", "w-40 absolute bottom-4 right-4")
    );
  };

  this.renderQuestion = (question) => {
    // let container = document.createElement("div");
    // let q = document.createElement("div");
    // let options = document.createElement("div");

    // container.className =
    //   "relative top-1/2 mx-auto transform -traslate-x-1/2 container mx-auto -translate-y-1/2";
    // options.className = "grid grid-cols-2 grid-rows-2 gap-3 my-4";
    // for (let i = 0; i < question.options.length; i++) {
    //   options.appendChild(this.optionButton(question.options[i]));
    // }
    // setAttributes(q, {
    //   className: "text-xl font-bold text-white text-center",
    //   innerHTML: question.q,
    // });

    // container.append(q, options);
    // canvas.innerHTML = "";
    // canvas.append(this.header(question), this.footer(), container);
    // this.timeRemaining = question.time;
    // let display = document.getElementById("timer");
    // this.startTimer(question.time - 1, display);

    canvas.html(
      `
      ${this.header(question)}
      <div class="flex-1 flex flex-col items-center justify-center mx-auto container md:max-w-lg lg:max-w-xl xl:max-w-3xl px-4 md:px-0 mb-4">
        <div class="text-xl font-bold text-white text-center">${question.q}</div>
        <!-- <img src="${
          question.img
        }" alt="" class="max-w-full max-h-64 object-contain rounded-lg mx-auto" /> DEV -->
        ${
          question.type !== "SA"
            ? `<div id="options" class="w-full grid grid-rows-${question.type === "T/F" ? 2 : 4} md:grid-cols-2 md:grid-rows-2 gap-3 my-4"></div>`
            : `<div class="flex w-full px-4 w-full xl:w-2/3 mt-4 mx-auto">
            <input id="answer" type="text" placeholder="Enter correct answer" class="options shadow appearance-none border rounded flex-1 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            ${Button("primary", "Submit", "MainScene.answerHandler()", `ml-2 flex items-center`)}
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
    // let container = document.createElement("div");
    // let waiting = document.createElement("div");
    // setAttributes(container, {
    //   className:
    //     "relative top-1/2 mx-auto transform -traslate-x-1/2 container text-center font-bold text-white text-2xl mx-auto -translate-y-1/2",
    //   innerHTML: remarks[Math.floor(Math.random() * remarks.length)],
    // });
    // setAttributes(waiting, {
    //   className: "text-white text-center text-md",
    //   innerHTML: "Waiting for host to reveal answer..",
    // });
    // container.appendChild(waiting);
    // canvas.append(container, this.footer());
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
    // canvas.innerHTML = "";
    // let container = document.createElement("div");
    // let waiting = document.createElement("div");
    // setAttributes(container, {
    //   className:
    //     "relative top-1/2 mx-auto transform -traslate-x-1/2 container text-center font-bold text-white text-2xl mx-auto -translate-y-1/2",
    //   innerHTML: "Time's up!",
    // });
    // setAttributes(waiting, {
    //   className: "text-white text-center",
    //   innerHTML: "Waiting for host to reveal answer..",
    // });
    // container.appendChild(waiting);
    // canvas.append(container, this.footer());
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
    // canvas.innerHTML = "";
    // let container = document.createElement("div");
    // let waiting = document.createElement("div");
    // let scoreDisp = document.createElement("div");
    // let q = document.createElement("div");
    // let options = document.createElement("div");

    // scoreDisp.innerText = this.currentScore + ` (+${this.scoreEarned})`;
    // scoreDisp.className = "text-bold text-3xl text-center text-white";
    // setAttributes(container, {
    //   className:
    //     "relative top-1/2 mx-auto transform -traslate-x-1/2 container text-center font-bold text-white text-xl mx-auto -translate-y-1/2 flex flex-col items-center",
    //   innerHTML: this.answeredCorrect
    //     ? "You're correct!"
    //     : "Better luck next time~",
    // });
    // setAttributes(waiting, {
    //   className: "text-white text-base text-center",
    //   innerHTML: "Current score:",
    // });
    // options.className =
    //   "grid grid-cols-2 grid-rows-2 gap-3 my-4 text black font-normal w-full";
    // for (let i = 0; i < question.options.length; i++) {
    //   options.appendChild(
    //     this.optionButton(question.options[i], true, true, this.answer)
    //   );
    // }
    // setAttributes(q, {
    //   className: "text-xl font-bold text-white text-center mt-4",
    //   innerHTML: question.q,
    // });

    // container.append(waiting, scoreDisp, q, options);
    // canvas.append(container, this.footer());
    canvas.html(
      `
      <div class="flex-1 flex flex-col items-center justify-center mx-auto container md:max-w-lg lg:max-w-xl xl:max-w-3xl px-4 md:px-0 mb-4 py-8">
        <div class="text-2xl font-bold text-white">${this.answeredCorrect ? "You're correct!" : "Better luck next time~"}</div>
        <div class="my-4 text-center font-bold text-white">
          <div class="text-white text-base text-center">Current score:</div>
          <div class="text-bold text-3xl text-center text-white">
            ${this.currentScore + ` (+${this.scoreEarned})`}
          </div>
        </div>
        <div class="text-xl font-bold text-white text-center">${question.q}</div>
        <!-- <img src="${question.img}" 
          alt="" class="w-full md:w-1/2 md:max-h-40 object-contain rounded-lg mx-auto" />DEV -->
        ${
          question.type !== "SA"
            ? `<div id="options" class="w-full grid grid-rows-${question.type === "T/F" ? 2 : 4} md:grid-cols-2 md:grid-rows-2 gap-3 my-4"></div>`
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
          `<div class="shadow rounded py-2 px-3 text-gray-700 leading-tight bg-green-400 text-center mx-auto">${this.currentQuestion.options[0]}</div>
          <div class="shadow appearance-none rounded py-2 px-3 text-white leading-tight bg-pink-900 text-center mx-auto">${this.answer}</div>`
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
    // let container = document.createElement("div");
    // setAttributes(container, {
    //   className:
    //     "absolute w-1/2 top-1/2 left-1/2 mx-auto transform -translate-y-1/2 -translate-x-1/2",
    // });
    // let winner = document.createElement("div");
    // winner.className = "my-4 text-center font-bold text-white";
    // winner.innerHTML = `
    //   <div class="text-lg ">Congratulations!</div>
    //   <div class="text-4xl">You ranked ${rank + nth(rank)} out of ${
    //   leaderboard.length
    // }</div>
    //   <div class="text-lg">Final Score: ${this.currentScore}</div>
    // `;
    // canvas.innerHTML = "";
    // container.appendChild(winner);
    // canvas.append(container, this.footer());
    canvas.html(
      `
      <div class="flex-1 flex flex-col items-center justify-center mx-auto container md:max-w-lg lg:max-w-xl xl:max-w-3xl px-4 md:px-0 mb-4">
        <div class="my-4 text-center font-bold text-white">
          <div class="text-lg ">Congratulations!</div>
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

  // this.progressBar = (duration) => {
  //   let pBar = document.createElement("div");
  //   let progressContainer = document.createElement("div");
  //   let progressInner = document.createElement("div");
  //   setAttributes(pBar, {
  //     id: "progressBar",
  //     className: "absolute top-4 w-full",
  //   });
  //   progressContainer.className =
  //     "overflow-hidden h-2 mb-4 text-xs flex rounded bg-pink-500 container mx-auto";
  //   setAttributes(progressInner, {
  //     style: `animation: progressbar-countdown; animation-duration: ${duration}s;`,
  //     className:
  //       "shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-pink-200",
  //   });

  //   progressContainer.appendChild(progressInner);
  //   pBar.appendChild(progressContainer);
  //   return pBar;
  // };

  this.header = (question) => {
    // let hBar = document.createElement("div");
    // hBar.className = "absolute top-0 w-full flex items-center justify-between";
    // let timer = document.createElement("div");
    // setAttributes(timer, {
    //   id: "timer",
    //   className: "font-bold text-white mx-8 mt-8",
    //   innerHTML: question.time + "s",
    // });
    // let qCounter = document.createElement("div");
    // setAttributes(qCounter, {
    //   className: "font-bold text-white mx-8 mt-8",
    //   innerHTML: `Question ${this.currentQid + 1}/${
    //     yai.eventVars.questions.length
    //   }`,
    // });

    // hBar.append(qCounter, timer);
    // canvas.appendChild(this.progressBar(question.time));
    return `
    <div class="sticky top-0 z-40 w-screen flex flex-col items-end mb-4">
      <div class="py-8 px-16 w-full flex items-center justify-between">
        <div class="font-bold text-white">
          Question ${this.currentQid + 1}/${yai.eventVars.questions.length}
        </div>
        <div id="timer" class="font-bold text-white">${question.time}s</div>
      </div>
      ${ProgressBar(question.time)}
    </div>
    `;
  };

  this.footer = () => {
    // let fBar = document.createElement("div");
    // let playerName = document.createElement("div");
    // let quitButton = HostPanel.button(
    //   "light-outline",
    //   "Quit",
    //   "location.reload()",
    //   "w-40"
    // );
    // setAttributes(playerName, {
    //   className: "text-2xl font-bold text-white",
    //   innerHTML: username,
    // });
    // setAttributes(fBar, {
    //   className:
    //     "bg-pink-700 py-8 px-16 absolute bottom-0 w-full flex flex-row-reverse items-center justify-between",
    //   innerHTML: quitButton,
    // });
    // fBar.appendChild(playerName);
    return `
    <div class="bg-pink-700 p-4 md:py-8 md:px-16 relative w-screen flex items-center justify-between">
      <div class="text-2xl font-bold text-white">${username}</div>
      ${Button("light-outline", "Quit", "location.reload()", "w-20 md:w-40")}
    </div>
    `;
  };

  // this.optionButton = (
  //   option,
  //   reveal = false,
  //   isHost = false,
  //   answer = null
  // ) => {
  //   let optionBtn = document.createElement("div");
  //   setAttributes(optionBtn, {
  //     className: `w-full text-black bg-white ${
  //       reveal && option.b && "bg-green-400 text-white"
  //     } ${reveal && !option.b && "scale-90"} ${
  //       reveal &&
  //       answer &&
  //       !answer.b &&
  //       option.v === answer.v &&
  //       "bg-pink-900 text-white"
  //     } rounded-lg shadow px-4 py-6 cursor-pointer hover:bg-pink-50 transform transition ${
  //       !reveal && !isHost && "hover:scale-105"
  //     } ease-in-out text-center`,
  //     innerHTML: option.v,
  //   });
  //   if (!isHost) {
  //     optionBtn.onclick = () => this.answerHandler(option);
  //   }
  //   return optionBtn;
  // };
})();
