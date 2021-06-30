const HostLobby = new (function () {
  this.currentQid = 0;
  this.timerInterval = null;
  this.answered = 0;

  this.start = () => {
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
    yai.eventVars.quiz.isStarted = true;
    yai.broadcast({
      isStarted: isStarted,
      nextQuestion: this.currentQid,
    });
    this.renderQuestion(yai.eventVars.questions[this.currentQid]);
  };

  this.nextQuestion = () => {
    this.currentQid += 1;
    if (this.currentQid !== yai.eventVars.questions.length) {
      yai.broadcast({ nextQuestion: this.currentQid });
      this.renderQuestion(yai.eventVars.questions[this.currentQid]);
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
        display.text(0 + "s");
        HostLobby.stopTimer();
      }
    }, 1000);
  };

  this.stopTimer = () => {
    clearInterval(this.timerInterval);
    this.renderCorrectAnswer(yai.eventVars.questions[this.currentQid]);
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
    canvas.addClass("bg-pink-600");

    // let header = document.createElement("div");
    // let headerContainer = document.createElement("div");
    // let gameIdDisplay = document.createElement("div");
    // let startButton = HostPanel.button(
    //   "light",
    //   "Start Quiz",
    //   "HostLobby.startQuiz()",
    //   "absolute top-4 right-4"
    // );
    // setAttributes(header, {
    //   className: "sticky top-0 w-full bg-pink-800 py-8",
    //   innerHTML: startButton,
    // });
    // header.appendChild(headerContainer);
    // setAttributes(headerContainer, {
    //   className:
    //     "container mx-auto flex flex-col items-center font-bold text-white",
    //   innerHTML: "Join by entering the game ID:",
    // });
    // headerContainer.appendChild(gameIdDisplay);
    // setAttributes(gameIdDisplay, {
    //   className:
    //     "text-4xl font-bold bg-white pt-2 pb-3 px-6 mt-2 rounded-lg text-pink-900 shadow-md",
    //   innerHTML: eventId,
    // });

    // let playerListDisplay = document.createElement("div");
    // setAttributes(playerListDisplay, {
    //   id: "player-list",
    //   className: "w-2/3 mx-auto my-8 flex justify-center flex-wrap",
    // });

    // canvas.append(header, playerListDisplay);

    canvas.html(`
      <div class="sticky top-0 w-full bg-pink-800 py-8">
        <div class="container mx-auto flex flex-col items-center font-bold text-white">
          Join by entering the game ID:
          <div class="bg-white mt-2 rounded-lg shadow-md pt-2 pb-4 px-4">
            <div class="text-4xl font-bold text-pink-900 pb-3">${eventId}</div>
            ${Button(
              "secondary",
              "Start Quiz",
              "HostLobby.startQuiz()",
              "bg-gray-600 hover:bg-gray-500"
            )}
          </div>
        </div>
      </div>
      <div id="player-list" class="flex-1 w-5/6 md:w-2/3 mx-auto my-8 flex justify-center items-start flex-wrap"></div>
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
    // let container = document.createElement("div");
    // let q = document.createElement("div");
    // let options = document.createElement("div");

    // container.className =
    //   "relative top-1/2 mx-auto transform -traslate-x-1/2 container mx-auto -translate-y-1/2";
    // options.className = "grid grid-cols-2 grid-rows-2 gap-3 my-4";
    // for (let i = 0; i < question.options.length; i++) {
    //   options.appendChild(
    //     MainScene.optionButton(question.options[i], false, true)
    //   );
    // }
    // setAttributes(q, {
    //   className: "text-xl font-bold text-white text-center",
    //   innerHTML: question.q,
    // });

    // container.append(q, options);
    // canvas.innerHTML = "";
    // canvas.append(this.header(question), container);

    canvas.html(
      `
      ${this.header(question)}
      <div class="flex-1 flex flex-col items-center justify-center mx-auto container md:max-w-lg lg:max-w-xl xl:max-w-3xl px-4 md:px-0">
        <div class="text-xl font-bold text-white text-center">${question.q}</div>
        <!-- <img src="${
          question.img
        }" alt="" class="max-w-full max-h-80 object-contain rounded-lg mx-auto" /> DEV -->
        ${
          question.type !== "SA"
            ? '<div id="options" class="w-full grid grid-rows-4 md:grid-cols-2 md:grid-rows-2 gap-3 my-4"></div>'
            : ""
        }
      </div>
    `
    );

    if (question.type !== "SA") {
      for (let i = 0; i < question.options.length; i++) {
        $("#options").append(OptionButton(question.options[i], false, true));
      }
    }
    this.startTimer(question.time - 1, $("#timer"));
  };

  this.renderCorrectAnswer = (question) => {
    // let container = document.createElement("div");
    // let q = document.createElement("div");
    // let options = document.createElement("div");

    // container.className =
    //   "relative top-1/2 mx-auto transform -traslate-x-1/2 container mx-auto -translate-y-1/2";
    // options.className = "grid grid-cols-2 grid-rows-2 gap-3 my-4";
    // for (let i = 0; i < question.options.length; i++) {
    //   options.appendChild(MainScene.optionButton(question.options[i], true, true));
    // }
    // setAttributes(q, {
    //   className: "text-xl font-bold text-white text-center",
    //   innerHTML: question.q,
    // });

    // container.append(q, options);
    // canvas.innerHTML = "";
    // canvas.append(this.header(question, true, true), container);
    canvas.html(
      `${this.header(question, true, true)}
      <div id="cAnswer" class="flex-1 flex flex-col items-center justify-center mx-auto container md:max-w-lg lg:max-w-xl xl:max-w-3xl px-4 md:px-0">
        <div class="text-xl font-bold text-white text-center">${question.q}</div>
        <!-- <img src="${question.img}" alt="" 
        class="max-w-full ${
          question.type === "SA" ? "max-h-96" : "max-h-80"
        } object-contain rounded-lg mx-auto" /> DEV -->
        ${
          question.type !== "SA"
            ? '<div id="options" class="w-full grid grid-rows-4 md:grid-cols-2 md:grid-rows-2 gap-3 my-4"></div>'
            : ""
        }
      </div>
    `
    );
    if (question.type !== "SA") {
      for (let i = 0; i < question.options.length; i++) {
        $("#options").append(OptionButton(question.options[i], true, true));
      }
    } else {
      $("#cAnswer").append(
        `<div class="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight bg-white mt-4 text-center w-1/2 mx-auto">${question.options[0]}</div>`
      );
    }
    yai.broadcast("showCorrect");
  };

  this.rerenderPlayerAnswered = () => {
    $("#answered").text(`Answered ${this.answered}`);
  };

  this.renderLeaderboard = (leaderboard, final = false) => {
    const leadScore = leaderboard[0].score;

    // let container = document.createElement("div");
    // let winner = document.createElement("div");
    // let bars = document.createElement("div");
    // let quitButton = HostPanel.button(
    //   "light-outline",
    //   "Quit",
    //   "location.reload()",
    //   "w-40 absolute bottom-4 right-4"
    // );
    // setAttributes(container, {
    //   className:
    //     "absolute w-1/2 top-1/2 left-1/2 mx-auto transform -translate-y-1/2 -translate-x-1/2",
    // });

    // winner.className = "my-4 text-center font-bold text-white";
    // winner.innerHTML = `
    //   <div class="text-lg ">Congratulations!</div>
    //   <div class="text-4xl">${leaderboard[0].username}</div>
    //   <div class="text-lg">Final Score: ${leaderboard[0].score}</div>
    // `;

    // for (let i = 0; i < leaderboard.length; i++) {
    //   var userScore = `
    //     <div class="flex text-white">
    //       <div class="break-all text-right w-1/4">${leaderboard[i].username}</div>
    //       <div class="relative ml-4 w-3/4">
    //         <div class="overflow-hidden h-6 mb-4 text-xs flex rounded-lg">
    //           <div style="width:${
    //             (leaderboard[i].score / leadScore) * 100
    //           }%" class="shadow-none flex flex-col text-center whitespace-nowrap rounded-lg text-pink-900 justify-center bg-pink-300">${
    //     leaderboard[i].score
    //   }</div>
    //         </div>
    //       </div>          
    //     </div>
    //   `;
    //   bars.innerHTML += userScore;
    // }

    // if (final) {
    //   container.appendChild(winner);
    //   canvas.innerHTML += quitButton;
    // }
    // container.appendChild(bars);
    // canvas.append(container);
    // if (!final) {
    //   canvas.append(this.header(yai.eventVars.questions[this.currentQid], true, false));
    // }
  
    canvas.html(`
    ${
      !final
        ? this.header(yai.eventVars.questions[this.currentQid], true, false)
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
              class="shadow-none flex flex-col text-center whitespace-nowrap rounded-lg text-pink-900 justify-center bg-pink-300">
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
    // let playerBlock = document.createElement("div");
    // setAttributes(playerBlock, {
    //   className: `py-2 px-6 rounded bg-pink-700 my-2 mx-2 font-bold text-white cursor-pointer hover:shadow-lg transform hover:-translate-y-0.5 hover:-translate-x-0.5 transition ease-in-out`,
    //   innerHTML: str,
    // });
    return `
      <div class="py-2 px-6 rounded bg-pink-700 my-2 mx-2 font-bold text-white cursor-pointer hover:shadow-lg transform hover:-translate-y-0.5 hover:-translate-x-0.5 transition ease-in-out">
        ${str}
      </div>
    `;
  };

  this.header = (question, reveal = false, leaderboard = false) => {
    // let hBar = document.createElement("div");
    // let hBarContainer = document.createElement("div");
    // let nextButton = HostPanel.button(
    //   "light",
    //   "Next",
    //   leaderboard ? "HostLobby.showLeaderboard()" : "HostLobby.nextQuestion()",
    //   "w-40"
    // );
    // let qCounter = document.createElement("div");
    // setAttributes(qCounter, {
    //   className: "font-bold text-white",
    //   innerHTML: `Question ${this.currentQid + 1}/${yai.eventVars.questions.length}`,
    // });
    // let aCounter = document.createElement("div");
    // setAttributes(aCounter, {
    //   id: "answered",
    //   className: "font-bold text-white text-right mr-8 mt-4",
    //   innerText: "Answered 0",
    // });
    // let timer = document.createElement("div");
    // setAttributes(timer, {
    //   id: "timer",
    //   className: "font-bold text-white",
    //   innerHTML: question.time + "s",
    // });

    // hBar.className = "absolute top-0 w-full flex flex-col items-end";
    // reveal ? hBarContainer.appendChild(qCounter) : hBarContainer.append(qCounter, timer);
    // hBarContainer.innerHTML += nextButton;
    // hBarContainer.className = "bg-pink-700 py-8 px-16 w-full flex items-center justify-between";

    // reveal
    //   ? hBar.appendChild(hBarContainer)
    //   : hBar.append(hBarContainer, MainScene.progressBar(question.time), aCounter);
      return `
      <div class="sticky top-0 z-40 w-screen flex flex-col items-end mb-4">
        <div class="bg-pink-700 p-4 pt-8 md:px-8 lg:py-8 lg:px-16 w-full flex items-center justify-between flex-wrap">
          <div class="font-bold text-white">
            Question ${this.currentQid + 1}/${yai.eventVars.questions.length}
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
            ? ProgressBar(question.time) +
              `<div id="answered" class="font-bold text-white text-right mr-8 mt-2 md:mt-4">Answered 0</div>`
            : ""
        }
      </div>
      `;
    };
})();
