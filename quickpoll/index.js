var canvas = $("#canvas");
var username = "";
var eventId = "";
var questions = [];
var charts = {};
var playerList = [];
var isHost = false;
var devHost = "https://yaidevstraccwebapp.blob.core.windows.net/presetactivity/";
var prodHost = "https://nahtuhprodstasset.blob.core.windows.net/presetactivity/";

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

  if (isHost) {
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
              if (value == "save") hp.updateActivitySet();
              else if (value == "saveAs") hp.exportAsActivitySet();
            })
          );
      }
      console.log("loading activity set...");
      loadActivitySet();
    }
    hp.start();
  } else lobby.start();
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

async function loadActivitySet() {
  let preset = await yai.getPresetActivityData();
  console.log(preset);
  $("#activity-set-title").val(preset.title);
  $("#activity-set-desc").val(preset.description);
  $("#load-thumbnail").attr("src", prodHost + preset.imageUrl);
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
  styleComponents();
  setButtonsOnClick();

  var createEvent = document.getElementById("create-event");
  createEvent.onStart = onConnected;
  createEvent.onAlert = onAlert;
});
