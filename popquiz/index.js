var canvas = $("#canvas");
var username = "";
var eventId = "";
var isHost = false;
var isAcceptingPlayers = false;
var isStarted = false;
var playerList = [];
var questions = [];

const BASE_SCORE = 200;

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
  if (!isHost) MainScene.onIncomingMessage(data.content);
}

function onEventVariableChanged(message) {
  // console.log(message);
  // MainScene.onEventVariableChanged(message);
  HostLobby.onEventVariableChanged(message);
}

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
  if (eventId) {
    $("#gameId").val(eventId);
    $("#gameId").disable();
    $("#enterGameId").click();
  }
}

function nth(n) {
  return [, "st", "nd", "rd"][(n / 10) % 10 ^ 1 && n % 10] || "th";
}

function dev() {
  username = "litha";
  isHost = true;
  LoginScene.start();
}

detectJoinLink();
