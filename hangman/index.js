const ROOT = "";
var canvas = $("#canvas");
var username = "";
var eventId = "";
var playerList = [];
var isHost = false;
var isMuted = false;

yai.onParticipantJoined = onPlayerJoin;
yai.onIncomingMessage = onIncomingMessage;
yai.onEventVariableChanged = onEventVariableChanged;
yai.onParticipantLeave = onPlayerLeave;

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const encoded = shuffle(alphabet);
const scenes = ["#login-panel", "#username-panel", "#lobby"];
const lobbyScenes = ["#game-setup", "#game-play", "#waiting-for-host", "#full-leaderboard", "#word-history"];
const lobbyNavButtons = ["#leaderboard-btn", "#history-btn", "#play-game-btn"];
const lobby = Lobby;


function onPlayerJoin(player) {
  playerList.push(player);
  lobby.renderPlayerList();
}

function onPlayerLeave(player) {
  console.log(`player is leaving`);
  yai.getParticipantList().then((newList) => {
    playerList = newList.filter((p) => !p.isHost);
    lobby.renderPlayerList();
  });
  console.log(playerList);
}

function onIncomingMessage(message) {
  console.log(message);
  if (message.content.iWon) lobby.somebodyWon(message.senderId, message.content.iWon);
  else if (!isHost) lobby.onIncomingMessage(message.content);
}

function onEventVariableChanged(message) {
  if (message.name == "words") lobby.renderHistory();
  if (message.name == "leaderboard") lobby.onLeaderboardChange();
  console.log(message);
}

function leave() {
  console.log("leaving event");
  yai.leaveEvent().then(() => location.reload());
}

/* PLUGINS */

$.fn.submitOnEnter = function (submitId) {
  this.on("keypress", function (e) {
    if (e.key == "Enter") {
      e.preventDefault();
      $(submitId).click();
    }
  });
  return this;
};

$.fn.replaceClass = function (pFromClass, pToClass) {
  return this.removeClass(pFromClass).addClass(pToClass);
};

$.fn.unhide = function () {
  return this.removeClass("hidden");
};

/* SOUNDS */

var btnHoverSound = new Sound(ROOT + "sounds/btn-hover.ogg");
var sceneSwitchingSound = new Sound(ROOT + "sounds/scene-switcher.wav");
var bgLoopSound = new Sound(ROOT + "sounds/bg-loop.mp3");
var gameStartSound = new Sound(ROOT + "sounds/game-start.ogg");

var correctSound = new Sound(ROOT + "sounds/correct-letter.wav");
var wrongSound = new Sound(ROOT + "sounds/wrong-letter.wav");
var youWinSound = new Sound(ROOT + "sounds/you-won.wav");
var youLoseSound = new Sound(ROOT + "sounds/you-lose.wav");

/* UTILS */

function detectJoinLink() {
  eventId = new URLSearchParams(window.location.search).get("id");
  username = new URLSearchParams(window.location.search).get("username");
  if (username) $("#username").val(username);
  if (eventId) {
    $("#game-id").val(eventId);
    $("#game-id").attr("readonly", true);
    $("#enter-game-id").click();
  }
}

function nth(n) {
  return [, "st", "nd", "rd"][(n / 10) % 10 ^ 1 && n % 10] || "th";
}

function isAlpha(ch) {
  return /^[A-Z]$/i.test(ch);
}

function range(size, startAt = 0) {
  return [...Array(size).keys()].map((i) => i + startAt);
}

function shuffle(string) {
  return string
    .split("")
    .reverse()
    .sort(function () {
      return 0.5 - Math.random();
    })
    .join("");
}

function dev() {
  username = "litha";
  isHost = true;
  $("#login-panel").toggleClass("hidden");
  $("#username-panel").toggleClass("hidden");
  LoginScene.start();
}

detectJoinLink();
