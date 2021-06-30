var canvas = $("#canvas");
var username = "";
var eventId = "";
var isHost = false;
var isAcceptingPlayers = false;
var isStarted = false;
var playerList = [];

const BASE_SCORE = 200;

yai.onParticipantJoined = onPlayerJoin;
yai.onIncomingMessage = onIncomingMessage;
yai.onEventVariableChanged = onEventVariableChanged;
// yai.onPlayerLeave


function setAttributes(el, attrs) {
  for (var key in attrs) {
    el[key] = attrs[key];
  }
}

function onPlayerJoin(message) {
  playerList.push(message);
  HostLobby.onPlayerJoin(message);
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
    const formId = document.getElementById("gameId");
    formId.value = eventId;
    formId.disabled = true;
    document.getElementById("enterGameId").click();
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
