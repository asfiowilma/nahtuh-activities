Lobby = new (function () {
  this.game = null;
  this.history = [];
  this.guesses = [];
  this.hearts = 5;
  this.iWon = false;

  this.start = () => {
    sceneSwitcher("#lobby", false);
    $("#credits").addClass("hidden");
    $("#username-display").text(username);
    $("#game-id-display").text(eventId);
    this.renderPlayerList();
    this.onLeaderboardChange();

    if (isHost) {
      this.renderDropdown();
      sceneSwitcher("#game-setup");
    } else sceneSwitcher("#waiting-for-host");
  };

  /* LISTENERS */

  this.onIncomingMessage = (content) => {
    if (content.word) this.onComingWord(content);
    else if (content.hint) this.onComingHint(content.hint);
    else if (content.replayGame) this.onReplayGame();
    else if (content.gameEnded) this.gameOver();
  };

  this.onComingWord = (data) => {
    this.game = data;
    // console.log(this.game.word);
    this.gamePlay();
  };

  this.onComingHint = (hint) => {
    if (hint.hint1) this.keypressHandler(hint.hint1);
    else if (hint.hint2) this.keypressHandler(hint.hint2);
    else if (hint.hint3) for (letter of hint.hint3) this.disableKeycap(letter);
  };

  this.onReplayGame = () => {
    sceneSwitcher("#waiting-for-host");
    $("#waiting-for-host div div").text("Loading new word ...");
    this.resetGame();
  };

  this.onLeaderboardChange = () => {
    this.renderLeaderboard();
    this.renderLeaderboard(true);
  };

  this.somebodyWon = (whoWon, heartsRemaining) => {
    const playerName = playerList.find((player) => player.participantId === whoWon).participantName;
    this.game.winners = { ...(this.game.winners || {}), [playerName]: heartsRemaining };
    const winnerCount = Object.keys(this.game.winners).length;

    $("#winner-count").find("span").text(winnerCount);
    if (isHost) this.gameCountdown();
  };

  /* GAME */

  this.gamePlay = () => {
    sceneSwitcher("#game-play");
    gameStartSound.play().then(bgLoopSound.bgm().loop().play());

    if (this.game.endGame === "time-limit") {
      $("#winner-count").addClass("flex-1");
      $("#timer").unhide();
      this.startTimer(this.game.limit - 1, $("#timer span"));
    }

    $("#hearts").unhide();
    this.renderKeyboard();
    this.renderWord();
  };

  this.gameHint = () => {
    sceneSwitcher("#game-play");

    $("#reveal-first-letter").one("click", () => lobby.revealFirstLetter());
    $("#reveal-random-letter").one("click", () => lobby.revealRandomLetter());
    $("#elim-unused-letter").one("click", () => lobby.eliminateUnusedLetters());

    $("#replay-btn").addClass("hidden");
    $("#hints").unhide();
    this.renderWord();
  };

  this.gameCountdown = () => {
    if (this.game.endGame === "time-limit") {
      $("#timer").unhide();
      if (this.timerInterval == null) this.startTimer(this.game.limit, $("#timer span"));
    } else if (this.game.endGame === "winner-limit") {
      $("#timer").addClass("hidden");
      if (Object.keys(this.game["winners"])?.length == this.game.limit) this.endGame();
    }
  };

  this.gameOver = () => {
    bgLoopSound.stop();
    if (!this.iWon) youLoseSound.play();
    if (this.hearts == 0) $("#hearts").find(".fa-heart").replaceClass("fa-heart", "fa-heart-broken");
    const toBeRevealed = Object.keys(this.game.word).filter((char) => !this.guesses.includes(char));
    for (char of toBeRevealed) this.revealLetter(char);

    $("#word").addClass("text-red-500 animate__animated animate__pulse");
    $(".keycap").replaceClass("cursor-pointer", "cursor-not-allowed").unbind("click");
  };

  this.gameWon = () => {
    bgLoopSound.stop();
    youWinSound.play();
    this.iWon = true;
    $("#word").addClass("text-yellow-500 animate__animated animate__tada");
    $(".keycap").replaceClass("cursor-pointer", "cursor-not-allowed").unbind("click");
    if (!isHost) yai.broadcast({ iWon: this.hearts });
  };

  this.startGame = () => {
    const word = $("#word-to-guess").val().toUpperCase();
    const category = $("#category").val();
    const endGame = $("#select-end-game").val();
    const limit = (endGame === "time-limit" ? $("#select-time-limit") : $("#select-winner-limit")).val();

    if (!this.validateWord(word, category)) return;
    const wordObject = this.wordObjectify(word);

    var data = {
      word: wordObject,
      category: category || "no category",
      endGame: endGame,
      limit: limit || playerList.length,
    };

    // console.log(data);
    yai.broadcast(data);

    data = { ...data, winners: {}, answer: word };
    this.game = data;
    this.gameCountdown();
    this.gameHint();
  };

  this.endGame = () => {
    yai.broadcast({ gameEnded: this.game.answer });
    const data = { word: this.game.answer, category: this.game.category, winners: this.game.winners };
    yai.eventVars.words = [...yai.eventVars.words, data];
    // console.log(yai.eventVars.words);
    this.renderHistory();
    this.updateLeaderboard();
    this.onLeaderboardChange();

    const toBeRevealed = Object.keys(this.game.word).filter((char) => !this.guesses.includes(char));
    for (char of toBeRevealed) this.keypressHandler(char);
    $("#word").addClass("text-yellow-500 animate__animated animate__tada");

    $("#reveal-first-letter, #reveal-random-letter, #elim-unused-letter")
      .unbind("click")
      .replaceClass("cursor-pointer hover:text-white hover:bg-yellow-500", "cursor-not-allowed");

    $("#replay-btn").one("click", () => this.replayGame());
    $("#replay-btn").unhide();
  };

  this.replayGame = () => {
    this.resetGame();
    sceneSwitcher("#game-setup");
    yai.broadcast({ replayGame: true });
  };

  this.resetGame = () => {
    this.game = null;
    this.guesses = [];
    this.hearts = 5;
    this.iWon = false;
    this.timerInterval = null;
    $("#word-to-guess").val("");
    $("#category").val("");
    $("#life").text(5);
    $("#timer").addClass("hidden");
    $("#winner-count").find("span").text(0);
    $("#winner-count").removeClass("flex-1");
    $("#word").removeClass("text-yellow-500 text-red-500 animate__tada animate__pulse");
    $("#hearts").replaceClass("text-red-100 text-red-200 text-red-300 text-red-400 text-red-500", "text-white");
    $("#hearts").find(".heart-life").replaceClass("fa-heart-broken", "fa-heart");
    $(".keycap").replaceClass("cursor-not-allowed", "cursor-pointer");
    $("#reveal-first-letter, #reveal-random-letter, #elim-unused-letter").replaceClass(
      "cursor-not-allowed opacity-20",
      "cursor-pointer hover:text-white hover:bg-yellow-500"
    );
  };

  /* UTILS */

  this.wordObjectify = (word) => {
    var wordObject = { _wordLength: word.length };
    var wordArray = Array.from(word);
    wordArray = wordArray.map((char) => (char === " " ? "SPACE" : char));

    for (i in wordArray) wordObject[wordArray[i]] = [...(wordObject[wordArray[i]] || []), i];
    return wordObject;
  };

  this.keypressHandler = (char) => {
    if (!isAlpha(char) || this.guesses.includes(char)) return;

    $("#" + char).replaceClass("hover:bg-yellow-300", "opacity-20");
    this.guesses.push(char);
    const encodedChar = encoded[alphabet.indexOf(char)];

    if (this.game.word[char]) {
      correctSound.play();
      $(".char-" + encodedChar).text(char);
      $(".char-" + encodedChar).replaceClass("bg-white", "bg-transparent animate__animated animate__rubberBand");
      $("#" + char).addClass("animate__animated animate__tada");
    } else {
      wrongSound.play();
      this.hearts = this.hearts - 1;
      if (this.hearts == 4) {
        $("#hearts").replaceClass("text-white animate__slower", "text-red-100 animate__slow");
        $(".heart-life").replaceClass("animate__slower", "animate__slow");
      } else if (this.hearts == 3) {
        $("#hearts").replaceClass("text-red-100 animate__slower", "text-red-200");
        $(".heart-life").removeClass("animate__slow");
      } else if (this.hearts == 2) {
        $("#hearts").replaceClass("text-red-200", "text-red-300");
        $(".heart-life").addClass("animate__fast");
      } else if (this.hearts == 1) {
        $("#hearts").replaceClass("text-red-300", "text-red-400");
        $(".heart-life").replaceClass("animate__fast", "animate__faster");
      } else if (this.hearts == 0) {
        $("#hearts").replaceClass("text-red-400", "text-red-500");
        $(".heart-life").removeClass("animate__heartBeat");
      }
      $("#life").text(this.hearts);
      $("#" + char).addClass("animate__animated animate__headShake");
      this.renderBrokenHeart();
    }

    this.checkGameOver();
  };

  this.disableKeycap = (char) => {
    if (!isAlpha(char)) return;
    $("#" + char).replaceClass("hover:bg-yellow-300", "opacity-20");
    $("#" + char).unbind("click");
    $("#" + char).addClass("animate__animated animate__headShake");
  };

  this.revealLetter = (char) => {
    if (!isAlpha(char) || this.guesses.includes(char)) return;
    const encodedChar = encoded[alphabet.indexOf(char)];
    $(".char-" + encodedChar).text(char);
    $(".char-" + encodedChar).replaceClass("bg-white", "bg-transparent animate__animated animate__rubberBand");
    $("#" + char).addClass("animate__animated animate__tada");
  };

  this.checkGameOver = () => {
    if (this.hearts < 1) this.gameOver();
    else if (
      Object.keys(this.game.word)
        .filter((char) => isAlpha(char))
        .every((char) => this.guesses.includes(char))
    ) {
      this.gameWon();
    }
  };

  this.findFirstLetter = () => {
    const word = this.game.word;
    for (char in word) if (word[char].indexOf("0") !== -1) return char;
  };

  this.findRandomLetter = () => {
    const word = this.game.word;
    const charsInWord = Object.keys(word).filter((char) => isAlpha(char));
    do {
      const char = charsInWord[Math.floor(Math.random() * charsInWord.length)];
      if (word[char].indexOf("0") === -1) return char;
    } while (word[char].indexOf("0") !== -1);
  };

  this.sortLeaderboard = () => {
    var leaderboard = Object.entries(yai.eventVars.leaderboard).map((e) => ({ name: e[0], score: e[1] }));
    leaderboard = leaderboard.sort((a, b) => (a.score > b.score ? -1 : 1));
    return leaderboard.length > 0 ? leaderboard : this.emptyLeaderboard;
  };

  this.updateLeaderboard = () => {
    var leaderboard = yai.eventVars.leaderboard;
    for (winner of Object.keys(this.game.winners))
      leaderboard = {
        ...leaderboard,
        [winner]: (leaderboard[winner] || 0) + this.game.winners[winner],
      };
    yai.eventVars.leaderboard = leaderboard;
    // console.log(yai.eventVars.leaderboard);
  };

  this.validateWord = (word, category) => {
    var text = "";
    var alphabetChar = word.split("").filter((char) => alphabet.includes(char));
    if (alphabetChar.length < 3) text = "Minimum word length is 3 letters long.";
    else if (word.length > 20) text = "Maximum word length is 20 characters long.";
    else if (category.length < 2) text = "Category is too short. (min 2 characters)";
    else if (category.length > 20) text = "Category is too long. (max 20 characters)";

    if (text.length > 0) {
      swal({ icon: "warning", text: text, button: false });
      return false;
    }
    return true;
  };

  this.startTimer = (timer, display) => {
    this.timerInterval = setInterval(() => {
      var minutes = parseInt(timer / 60, 10);
      var seconds = parseInt(timer % 60, 10);

      display.text(`${minutes}m ${seconds}s`);
      if (--timer < 0) {
        display.text("Time's up!");
        lobby.stopTimer();
      }
    }, 1000);
  };

  this.stopTimer = () => {
    clearInterval(this.timerInterval);
    if (isHost) this.endGame();
  };

  /* HINTS */

  this.revealFirstLetter = () => {
    $("#reveal-first-letter").addClass("opacity-20").unbind("mouseenter mouseleave");
    const firstLetter = this.findFirstLetter();
    this.keypressHandler(firstLetter);

    // console.log("first letter is: " + firstLetter);
    yai.broadcast({ hint: { hint1: firstLetter } });
  };

  this.revealRandomLetter = () => {
    $("#reveal-random-letter").addClass("opacity-20").unbind("mouseenter mouseleave");
    const randomLetter = this.findRandomLetter();
    this.keypressHandler(randomLetter);

    // console.log("random letter is: " + randomLetter);
    yai.broadcast({ hint: { hint2: randomLetter } });
  };

  this.eliminateUnusedLetters = () => {
    $("#elim-unused-letter").addClass("opacity-20").unbind("mouseenter mouseleave");
    const usedLetters = Object.keys(this.game.word);
    var unusedLetters = alphabet
      .split("")
      .filter((letter) => !usedLetters.includes(letter))
      .join("");
    unusedLetters = shuffle(unusedLetters).split("").slice(0, 13);

    // console.log(unusedLetters);
    yai.broadcast({ hint: { hint3: unusedLetters } });
  };

  /* SETTINGS */

  this.emptyLeaderboard = [
    { name: "", score: 100 },
    { name: "", score: 85 },
    { name: "", score: 70 },
    { name: "", score: 55 },
    { name: "", score: 40 },
  ];
  this.timerInterval = null;
  this.selectSettings = [
    {
      id: "select-end-game",
      options: [
        { val: "time-limit", txt: "Time Limit" },
        { val: "winner-limit", txt: "Winner Limit" },
      ],
    },
    {
      id: "select-time-limit",
      options: [
        { val: "60", txt: "1 Minute" },
        { val: "120", txt: "2 Minute" },
        { val: "180", txt: "3 Minute" },
        { val: "300", txt: "5 Minute" },
      ],
    },
    {
      id: "select-winner-limit",
      options: [
        { val: "1", txt: "Top 1" },
        { val: "3", txt: "Top 3" },
        { val: "5", txt: "Top 5" },
        { val: "7", txt: "Top 7" },
        { val: "10", txt: "Top 10" },
      ],
    },
  ];

  /* RENDERER SCRIPTS */

  this.renderBrokenHeart = () => {
    $("#broken-heart").replaceClass("opacity-0", "translate-y-6");
    setTimeout(() => $("#broken-heart").replaceClass("translate-y-6", "opacity-0"), 1000);
  };

  this.renderPlayerList = () => {
    $("#players").empty();
    if (playerList.length < 1) $("#players").append(PlayerBlock("Waiting for players.."));
    else
      for (player of playerList) {
        $("#players").append(PlayerBlock(player.participantName));
      }
  };

  this.renderDropdown = () => {
    for (i of this.selectSettings) {
      $(`#${i.id}`).empty();
      for (o of i.options) {
        $(`#${i.id}`).append(`<option value="${o.val}">${o.txt}</option>`);
      }
    }
    $("#select-end-game").change((e) => {
      $("#time-limit").toggleClass("hidden");
      $("#winner-limit").toggleClass("hidden");
    });
  };

  this.renderKeyboard = () => {
    $("#keyboard").unhide();
    $("#keyboard").empty();
    for (char of alphabet) $("#keyboard").append(KeyboardKey(char));
  };

  this.renderWord = () => {
    $("#category-display").text(this.game.category);
    $("#word").empty();
    const word = this.game.word;
    for (_ of range(word._wordLength)) $("#word").append(CharBlock("A"));
    delete word["_wordLength"];

    for (char in word)
      for (idx of word[char]) {
        // console.log(char, idx);
        $(`.char:eq(${parseInt(idx) + 2})`).replaceWith(CharBlock(char.toString()));
      }
  };

  this.renderHistory = () => {
    $("#history-table").find(".history-row").remove();

    for (var i = 0; i < yai.eventVars.words.length; i++) {
      const history = yai.eventVars.words[i];
      const iWon = Object.keys(history.winners).includes(username);
      const winnerCount = Object.keys(history.winners).length;
      const rowData = { word: history.word, category: history.category, winners: winnerCount, iWon: iWon };
      $("#history-table").append(HistoryRow(rowData));
    }
  };

  this.renderLeaderboard = (isTop5) => {
    const leaderboard = this.sortLeaderboard();
    const maxScore = leaderboard[0]?.score;
    const bars = isTop5 ? $("#bars") : $("#full-bars");
    bars.empty();
    for (i in leaderboard.slice(0, isTop5 ? 5 : leaderboard.length)) {
      const player = leaderboard[i];
      const percent = (player.score / maxScore) * 100 + 2;
      bars.append(
        isTop5
          ? ScoreBlock(parseInt(i) + 1, player.name, player.score, percent)
          : FullScoreBlock(player.name, player.score, percent)
      );
    }
  };
})();
