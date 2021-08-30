var canvas = $("#canvas");
var username = "";
var eventId = "";
var questions = [];
var charts = {};
var playerList = [];
var isHost = false;

yai.onIncomingMessage = onIncomingMessage;
yai.onEventVariableChanged = onEventVariableChanged;

const scenes = ["#login-panel", "#host-panel", "#lobby"];
const lobby = Lobby,
  hp = HostPanel;
const lobbyScenes = ["#waiting-for-players", "#waiting-for-reveal", "#waiting-for-host", "#question-display"];

function onConnected(data) {
  isHost = data.participant.isHost;
  username = data.participant.participantName;
  eventId = data.eventInfo.eventId;
  console.log("in onConnected");

  if (isHost) hp.start();
  else lobby.start();
}

function onAlert(message) {
  console.log(message);
  swal({ icon: "warning", text: message, button: false });
}

function onIncomingMessage(message) {
  lobby.onIncomingMessage(message.content);
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

/* UTILS */

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

async function findHost() {
  var participants = await yai.getParticipantList();
  var host = participants.find((player) => player.isHost);
  return host;
}

$(document).ready(function () {
  styleComponents();
  setButtonsOnClick();

  var createEvent = document.getElementById("create-event");
  createEvent.onStart = onConnected;
  createEvent.onAlert = onAlert;
});
