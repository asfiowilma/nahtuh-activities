var canvas = $("#canvas");
var username = "";
var eventId = "";
var isHost = false;
var isAcceptingPlayers = false;
var isStarted = false;
var playerList = [];
var questions = [];
var leaderboard = {};

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

function onConnected(data) {
  isHost = data.participant.isHost;
  username = data.participant.participantName;
  eventId = data.eventInfo.eventId;

  if (isHost) {
    yai.eventVars.wrongAnswers = [];
    if (yai.isLoadingActivitySet) {
      if (yai.isActivitySetOwner) {
        $("#hp-export-set-btn")
          .unbind("click")
          .click(() =>
            swal({
              title: "Update Activity Set",
              text: "Your previous activity set will be overwritten.\nAre you sure?",
              buttons: {
                cancel: "Nevermind",
                saveAs: {
                  text: "Save As",
                  value: "saveAs",
                },
                save: true,
              },
            }).then((value) => {
              if (value == "saveAs") hp.exportAsActivitySet();
              else if (value) hp.updateActivitySet();
            })
          );
      }
      loadActivitySet();
      console.log("loading activity set...");
    }
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

function nth(n) {
  return [, "st", "nd", "rd"][(n / 10) % 10 ^ 1 && n % 10] || "th";
}

async function findHost() {
  var participants = await yai.getParticipantList();
  var host = participants.find((player) => player.isHost);
  return host;
}

async function loadActivitySet() {
  let preset = await yai.getPresetActivityData();
  console.log(preset);
  $("#activity-set-title").val(preset.title);
  $("#activity-set-desc").val(preset.description);
  $("#load-thumbnail").attr("src", BLOB_SOURCE + "/presetactivity/" + preset.imageUrl);
  if (preset.isPrivate) $("#set-private").prop("checked", true);
  questions = [];
  $("#question-cards").empty();
  for (question of preset.config.questions) {
    hp.addQuestion(question);
  }
  if (questions.length > 0) hp.changeQuestion(0);
}

const loadPresetThumbnail = async (url) => {
  const data = await fetch(url);
  const blob = await data.blob();
  activitySetThumbnail = blob;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result;
      resolve(base64data);
    };
  });
};

$(document).ready(function () {
  setButtonsOnClick();

  var createEvent = document.getElementById("create-event");
  createEvent.onStart = onConnected;
  createEvent.onAlert = onAlert;
});
