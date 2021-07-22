var canvas = $("#canvas");
var username = "";
var eventId = "";
var isHost = false;
var playerList = [];

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
  playerList.pop(player);
  lobby.renderPlayerList();
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
