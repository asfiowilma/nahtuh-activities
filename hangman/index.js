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

function onConnected(data) {
  isHost = data.participant.isHost;
  username = data.participant.participantName;
  eventId = data.eventInfo.eventId;
  // console.log(isHost, username, eventId);

  if (isHost) {
    yai.eventVars.words = [];
    yai.eventVars.leaderboard = {};
  } else {
    yai.getParticipantList().then((participants) => {
      playerList = participants.filter((player) => !player.isHost);
      lobby.renderPlayerList();
    });
  }
  Lobby.start();
}

function onAlert(message) {
  console.log(message);
  swal({ icon: "warning", text: message, button: false });
}

function onPlayerJoin(player) {
  playerList.push(player);
  lobby.renderPlayerList();
}

function onPlayerLeave(player) {
  yai.getParticipantList().then((newList) => {
    playerList = newList.filter((p) => !p.isHost);
    lobby.renderPlayerList();
  });
}

function onIncomingMessage(message) {
  // console.log(message);
  if (message.content.iWon) lobby.somebodyWon(message.senderId, message.content.iWon);
  else if (!isHost) lobby.onIncomingMessage(message.content);
}

function onEventVariableChanged(message) {
  if (message.name == "words") lobby.renderHistory();
  if (message.name == "leaderboard") lobby.onLeaderboardChange();
  // console.log(message);
}

function leave() {
  // console.log("leaving event");
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

var btnHoverSound = new Sound("./sounds/btn-hover.ogg");
var sceneSwitchingSound = new Sound("./sounds/scene-switcher.wav");
var bgLoopSound = new Sound("./sounds/bg-loop.mp3");
var gameStartSound = new Sound("./sounds/game-start.ogg");

var correctSound = new Sound("./sounds/correct-letter.wav");
var wrongSound = new Sound("./sounds/wrong-letter.wav");
var youWinSound = new Sound("./sounds/you-won.wav");
var youLoseSound = new Sound("./sounds/you-lose.wav");

/* UTILS */

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

$(document).ready(function () {
  styleButtons();
  setButtonsOnClick();

  var createEvent = document.getElementById("create-event");
  createEvent.onStart = onConnected;
  createEvent.onAlert = onAlert;
});
