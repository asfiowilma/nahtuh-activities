var canvas = $("#canvas");
var presetButton = document.querySelector("preset-activity-button");
var presetModal = document.querySelector("preset-activity-modal");
var username = "";
var eventId = "";
var isHost = false;
var isAcceptingPlayers = false;
var isStarted = false;
var playerList = [];
var questions = [];
var leaderboard = {};
var loadedImage = null;

const BLOB_SOURCE = "https://yaidevstraccwebapp.blob.core.windows.net";
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
yai.onParticipantLeave = onPlayerLeave;
yai.onIncomingMessage = onIncomingMessage;

// SOUNDS
var muted = false;
var volume = 1;
var bgmLoop = new Howl({ src: ["./sounds/bgm-loop.wav"], loop: true });
var correctSound = new Howl({ src: ["./sounds/answer-correct.wav"] });
var incorrectSound = new Howl({ src: ["./sounds/answer-incorrect.wav"] });
var btnClick = new Howl({ src: ["./sounds/btn-click.ogg"] });
var gameOver = new Howl({ src: ["./sounds/game-over.wav"] });

function onConnected(data) {
  isHost = data.participant.isHost;
  username = data.participant.participantName;
  eventId = data.eventInfo.eventId;

  if (isHost) {
    yai.eventVars.wrongAnswers = [];
    if (yai.isLoadingActivitySet) loadActivitySet();
    HostPanel.start();
  } else {
    PlayerLobby.start();
  }
}

function onAlert(message) {
  swal({ icon: "warning", text: message, button: false });
}

function onPlayerJoin(message) {
  playerList.push(message);
  hl.onPlayerJoin(message);
}

function onPlayerLeave(message) {
  hl.onPlayerLeave(message);
}

function onIncomingMessage(data) {
  // console.log(data);
  if (isHost) hl.onIncomingMessage(data);
  else pl.onIncomingMessage(data.content);
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

const nth = (n) => [, "st", "nd", "rd"][(n / 10) % 10 ^ 1 && n % 10] || "th";
const int = (n) => parseInt(n);

async function findHost() {
  var participants = await yai.getParticipantList();
  var host = participants.find((player) => player.isHost);
  return host;
}

async function loadActivitySet() {
  let preset = await yai.getPresetActivityData();
  presetModal.isOwner = yai.isActivitySetOwner;
  presetModal.loadPresetActivityData(preset);

  if (preset.isPrivate) $("#set-private").prop("checked", true);
  questions = [];
  $("#question-cards").empty();
  for (question of preset.config.questions) {
    hp.addQuestion(question);
  }
  if (questions.length > 0) hp.changeQuestion(0);
}

$(document).ready(function () {
  setButtonsOnClick();

  var createEvent = document.getElementById("create-event");
  createEvent.onStart = onConnected;
  createEvent.onAlert = onAlert;

  var presetButton = document.querySelector("preset-activity-button");
  var presetModal = document.querySelector("preset-activity-modal");
  presetButton.refModal = presetModal;
  presetModal.validate = hp.validate;
  presetModal.getConfig = hp.getConfig;
});
