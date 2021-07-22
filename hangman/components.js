/* UTIL COMPONENT FUNCTIONS */

function styleButtons() {
  $(".btn").replaceClass("btn", "px-2 py-1 text-center cursor-pointer rounded transition ease-in-out");
  $(".btn-primary").replaceClass(
    "btn-primary",
    "bg-gradient-to-br from-yellow-400 to-yellow-500 hover:to-yellow-700 text-white"
  );
  $(".btn-primary-outline").replaceClass(
    "btn-primary-outline",
    "border border-yellow-500 hover:bg-yellow-500 text-yellow-500 hover:text-white"
  );
  $(".btn-secondary").replaceClass("btn-secondary", "bg-gray-500 hover:bg-gray-300 text-white");
  $(".btn-secondary-outline").replaceClass(
    "btn-secondary-outline",
    "border border-gray-500 text-gray-500 hover:bg-gray-300"
  );
  $(".btn-light").replaceClass("btn-light", "bg-white hover:bg-gray-100 text-black");
  $(".btn-light-outline").replaceClass(
    "btn-light-outline",
    "border border-white text-white hover:bg-gray-100 hover:text-black"
  );
  $(".btn-dark").replaceClass("btn-dark", "bg-gray-600 hover:bg-gray-500 text-white");
  $(".btn-danger").replaceClass("btn-danger", "bg-red-500 hover:bg-red-600 text-white");
  $(".btn-danger-outline").replaceClass(
    "btn-danger-outline",
    "border border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
  );
}

function setButtonsOnClick() {
  /* LOGIN PANEL */
  $("#enter-game-id").click(() => renderUsernameInput(false));
  $("#create-link").click(() => renderUsernameInput(true));

  $("#enter-button").one("click", () => joinOrCreateRoom());
  $("#backlink").click(() => {
    $("#login-panel").toggleClass("hidden");
    $("#username-panel").toggleClass("hidden");
  });

  /* LOBBY GENERAL */
  $("#leave-game-btn").click(() => leave());
  $("#leaderboard-btn").click(() => sceneSwitcher("#full-leaderboard"));
  $("#history-btn").click(() => sceneSwitcher("#word-history"));
  $("#play-game-btn").click(() => {
    if (lobby.game !== null) sceneSwitcher("#game-play");
    else if (isHost) sceneSwitcher("#game-setup");
    else sceneSwitcher("#waiting-for-host");
  });
  $("#copy-game-id-btn").click(() => {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(eventId).select();
    document.execCommand("copy");
    $temp.remove();
    console.log("copied to clipboard");
    $("#copied-feedback").removeClass("opacity-0");
    setTimeout(() => $("#copied-feedback").addClass("opacity-0"), 1500);
  });
  $("#hide-player-list-btn").click(() => $("#players").toggleClass("hidden"));
  $("#hide-leaderboard-btn").click(() => $("#bars").toggleClass("hidden"));

  /* GAME SETUP */
  $("#start-game-btn").click(() => lobby.startGame());
  $("#toggle-word-visibility").click(() => {
    $("#toggle-word-visibility").toggleClass("fa-eye-slash");
    $("#toggle-word-visibility").toggleClass("fa-eye");
    if ($("#word-to-guess").attr("type") === "password") $("#word-to-guess").attr("type", "text");
    else $("#word-to-guess").attr("type", "password");
  });
}

function sceneSwitcher(scene, isInLobby = true) {
  (isInLobby ? lobbyScenes : scenes).forEach((s) => $(s).addClass("hidden"));
  console.log(`switching scene into ${scene}`);
  $(scene).unhide();

  switch (scene) {
    case "#full-leaderboard":
      navButtonSwitcher("#leaderboard-btn");
      break;
    case "#word-history":
      navButtonSwitcher("#history-btn");
      break;
    default:
      navButtonSwitcher("#play-game-btn");
      break;
  }
}

function navButtonSwitcher(locationButton) {
  lobbyNavButtons.forEach((s) => $(s).unhide());
  $(locationButton).addClass("hidden");
}

/* COMPONENTS */

const CharBlock = (char) => {
  const block = (isAlpha(char) ? $(".char") : $(".not-alpha")).first().clone();
  if (isAlpha(char)) {
    const encodedChar = encoded[alphabet.indexOf(char)];
    console.log(char, encodedChar);
    block.addClass("char-" + encodedChar);
  } else if (char !== "SPACE") block.text(char);
  block.unhide();
  return block;
};

const FullScoreBlock = (name, score, percent) => {
  const block = $(".full-score-bar").first().clone();
  block.find(".score-bar-name").text(name ? name : "Player");
  block.find(".score-bar-score").css("width", percent + "%");
  block.find(".score-bar-score").text(name ? score : "");
  return block;
};

const HistoryRow = (history) => {
  const row = $(".history-row").first().clone();
  row.find(".history-word").text(history.word);
  row.find(".history-category").text(history.category);
  row.find(".history-winners").text(history.winners);
  if (isHost) row.find(".history-iWon").find("i").addClass("hidden");
  else if (!history.iWon)
    row.find(".history-iWon").find("i").replaceClass("fa-heart text-yellow-500", "fa-heart-broken text-red-500");

  return row;
};

const KeyboardKey = (char) => {
  const keycap = $(".keycap").first().clone();
  keycap.unhide();
  keycap.text(char);
  keycap.attr("id", char);
  keycap.one("click", () => lobby.keypressHandler(char));
  return keycap;
};

const PlayerBlock = (str) => {
  const block = $(".player").first().clone();
  return block.unhide().text(str);
};

const ScoreBlock = (rank, name, score, percent) => {
  const block = $(".score-bar").first().clone();
  block.find(".score-bar-rank").text(rank + nth(rank));
  block.find(".score-bar-score").css("width", percent + "%");
  block.find(".score-bar-score").text(`${name ? name : ""} ${name ? "-" : ""} ${name ? score : ""}`);
  return block;
};

function Sound(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function(){
    this.sound.play();
  }
  this.stop = function(){
    this.sound.pause();
  }
}