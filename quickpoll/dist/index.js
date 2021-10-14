var canvas = $("#canvas");
var presetModal = document.querySelector("preset-activity-modal");
var presetButton = document.querySelector("preset-activity-button");
var username = "";
var eventId = "";
var questions = [];
var charts = {};
var playerList = [];
var isHost = false;
var isMuted = false;

const { nahtuhClient: yai, identityManager } = window.NahtuhClient;

yai.onIncomingMessage = onIncomingMessage;
yai.onParticipantJoined = onPlayerJoin;
yai.onEventVariableChanged = onEventVariableChanged;

const scenes = ["#login-panel", "#host-panel", "#lobby"];
const lobby = Lobby,
  hp = HostPanel;
const lobbyScenes = ["#waiting-for-players", "#waiting-for-reveal", "#waiting-for-host", "#question-display"];

/* SOUNDS */

var bellSound = new Sound("./bell.mp3");
var bubbleSound = new Sound("./buble.mp3");
var bgLoopSound = new Sound("./bgm.mp3");

function onConnected(data) {
  isHost = data.participant.isHost;
  username = data.participant.participantName;
  eventId = data.eventInfo.eventId;
  yai.getParticipantList().then((res) => {
    playerList = res;
  });
  console.log("in onConnected");

  if (isHost) {
    if (yai.isLoadingActivitySet) loadActivitySet();
    hp.start();
  } else lobby.start();
}

function onAlert(message) {
  console.log(message);
  swal({ icon: "warning", text: message, button: false });
}

function onIncomingMessage(message) {
  lobby.onIncomingMessage(message);
  console.log(message);
}

function onEventVariableChanged(message) {
  console.log(message);
  if (!isHost && message.name == "chartData") lobby.updateChartOnParticipantLobby();
}

function onPlayerJoin(message) {
  playerList.push(message);
  console.log(`new player entered❗ ${message.participantId}`);
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

const nth = (n) => [, "st", "nd", "rd"][(n / 10) % 10 ^ 1 && n % 10] || "th";
const isAlpha = (ch) => /^[A-Z]$/i.test(ch);
const range = (size, startAt = 0) => [...Array(size).keys()].map((i) => i + startAt);
const int = (n) => parseInt(n);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const hash = (str) => str.split("").reduce((prev, curr) => ((prev << 5) - prev + curr.charCodeAt(0)) | 0, 0);
const mod = (n, m) => ((n % m) + m) % m;
const generateString = (l) =>
  Array(l)
    .fill("")
    .map((_) => Math.random().toString(36).charAt(2))
    .join("");

async function findHost() {
  var participants = await yai.getParticipantList();
  var host = participants.find((player) => player.isHost);
  return host;
}

function reorder(oldIndex, newIndex) {
  item = questions[oldIndex];
  questions.splice(oldIndex, 1);
  questions.splice(newIndex, 0, item);

  for (let idx = 0; idx < questions.length; idx++) {
    const qCard = $(`.q-card:eq(${idx + 1})`);
    qCard.unbind("click");
    qCard.click(() => hp.changeQuestion(idx));
    qCard.replaceClass("bg-lollipop scale-105", "bg-indigo-300");
  }
  hp.changeQuestion(newIndex);
  console.log(questions);
}

async function loadActivitySet() {
  let preset = await yai.getPresetActivityData();
  presetModal.isOwner = yai.isActivitySetOwner;
  presetModal.loadPresetActivityData(preset);

  questions = [];
  $("#question-cards").empty();
  for (question of preset.config.questions) {
    hp.addQuestion(question);
  }
  if (questions.length > 0) hp.changeQuestion(0);
}

function s2ab(s) {
  var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
  var view = new Uint8Array(buf); //create uint8array as viewer
  for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff; //convert to octet
  return buf;
}

function json_to_array_q(q) {
  var res = [];
  // push header
  res.push(["QUICKPOLL RESULTS"]);
  res.push(["Host", username]);
  res.push(["Date", new Date().toLocaleString()]);
  res = [...res, [], []];

  // push each question
  for (i in q) {
    cq = q[i];
    type = cq.type;
    res.push([`Question ${int(i) + 1}`]);
    res.push(["type", type]);
    res.push(["question", cq.q]);
    res.push(["responses", cq.answered]);
    res.push([]);
    if (type == "poll") {
      res.push(["Option", "Votes"]);
      for (i in cq.options) res.push([cq.options[i], cq.data[i]]);
    } else if (type == "wordcloud") {
      res.push(["Responses"]);
      res = [...res, ...Object.entries(cq.data)];
    } else if (type == "open") {
      res.push(["Responses"]);
      res = [...res, ...cq.data.map((x) => [x])];
    } else if (type == "ranking") {
      res.push(["", "Option", "Weight"]);
      sorted = cq.data.sort((a, b) => b.data - a.data);
      for (i in cq.data) {
        d = cq.data[i];
        res.push([int(i) + 1 + nth(int(i) + 1), d.opt, d.data]);
      }
    } else if (type == "scales") {
      res.push(["Option", "Average", "1", "2", "3", "4", "5"]);
      for (i in cq.options) {
        res.push([
          cq.options[i],
          cq.data[i].sum / cq.data[i].count,
          cq.data[i][1],
          cq.data[i][2],
          cq.data[i][3],
          cq.data[i][4],
          cq.data[i][5],
        ]);
      }
    }
    res.push([], []);
  }
  console.log(res);
  return res;
}

function json_to_array_p(pl) {
  var res = [];

  // push headers
  var headers = ["", "Nickname"];
  for (i in questions) headers.push(questions[i].q);

  res.push(headers);

  // push participant data
  for (i in pl) {
    p = pl[i];
    if (!p.isHost) {
      pRow = [int(i), p.participantName];
      for (i in questions) {
        if (p.responses[i]) pRow.push(p.responses[i].iAnswered.toString());
        else pRow.push("");
      }
      res.push(pRow);
    }
  }

  return res;
}

function dev(createEvent) {
  createEvent.renderRoot.querySelector("#username").value = generateString(5);
}

$(document).ready(function () {
  setButtonsOnClick();

  var createEvent = document.getElementById("create-event");
  createEvent.onStart = onConnected;
  createEvent.onAlert = onAlert;

  presetButton.refModal = presetModal;
  presetModal.validate = hp.validate;
  presetModal.getConfig = hp.getConfig;

  dev(createEvent);
});
