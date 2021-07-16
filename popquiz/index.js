var canvas = $("#canvas");
var username = "";
var eventId = "";
var isHost = false;
var isAcceptingPlayers = false;
var isStarted = false;
var playerList = [];
var questions = [];

const BASE_SCORE = 200;
const hp = HostPanel,
  hl = HostLobby,
  pl = PlayerLobby;

const scenes = ["#login-panel", "#username-panel", "#host-panel", "#lobby"];
const lobbyScenes = [
  "#waiting-for-players",
  "#waiting-for-reveal",
  "#waiting-for-host",
  "#question-display",
  "#leaderboard",
  "#display-final-rank",
];

yai.onParticipantJoined = onPlayerJoin;
yai.onIncomingMessage = onIncomingMessage;
yai.onEventVariableChanged = onEventVariableChanged;
yai.onParticipantLeave = onPlayerLeave;

function onPlayerJoin(message) {
  playerList.push(message);
  HostLobby.onPlayerJoin(message);
}

function onPlayerLeave(message) {
  playerList.pop(message);
  HostLobby.onPlayerLeave(message);
}

function onIncomingMessage(data) {
  // console.log(data);
  if (!isHost) PlayerLobby.onIncomingMessage(data.content);
}

function onEventVariableChanged(message) {
  // console.log(message);
  // PlayerLobby.onEventVariableChanged(message);
  HostLobby.onEventVariableChanged(message);
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

function uploadJson(id, callback) {
  document.getElementById(id).onchange = function (evt) {
    try {
      let files = evt.target.files;
      if (!files.length) {
        alert("No file selected!");
        return;
      }
      let file = files[0];
      let reader = new FileReader();
      const self = this;
      reader.onload = (event) => {
        callback(event.target.result);
      };
      reader.readAsText(file);
    } catch (err) {
      console.error(err);
    }
  };
}

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

function dev() {
  username = "litha";
  isHost = true;
  $("#login-panel").toggleClass("hidden");
  $("#username-panel").toggleClass("hidden");
  LoginScene.start();
}

detectJoinLink();
