var canvas = document.getElementById("canvas");
var createEvent = document.getElementById("create-event");
createEvent.onStart = onConnected;

function renderCreateEvent() {
  var createEvent = document.createElement("create-event-component");
  createEvent.onStart = onConnected;
  canvas.appendChild(createEvent);
}

function onParticipantLeave(data) {
  console.log(data);
}

function onParticipantJoined(data) {
  console.log(data);
}

function renderLobby(data) {
  clearCanvas();
  var lobbyComponent = document.createElement("lobby-component");
  lobbyComponent.id = "lobby";
  lobbyComponent.eventId = data.eventInfo.eventId;
  lobbyComponent.onStart = renderGame;
  lobbyComponent.leaveEvent = leaveEvent;
  lobbyComponent.listenOnJoin(yai, onParticipantJoined);
  lobbyComponent.listenOnLeave(yai, onParticipantLeave);
  lobbyComponent.listenOnVariableChange(yai);

  // lobbyComponent.colorDanger = "#9D174D";
  // lobbyComponent.colorPrimary = "#EC4899";
  // lobbyComponent.colorSecondary = "#BE185D";
  canvas.appendChild(lobbyComponent);
}

function renderGame() {
  clearCanvas();
  canvas.innerText = "GAME IS RENDERED YAYYY";
}

function leaveEvent() {
  window.location.reload();
}

function onConnected(data) {
  console.log("connected");
  console.log(data);
  renderLobby(data);
}

function onInit() {
  console.log("init");
}

//reset the canvas
function clearCanvas() {
  canvas.innerHTML = "";
}

onInit();
