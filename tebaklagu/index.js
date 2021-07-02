var canvas = $("#canvas");
var username = "";
var eventId = "";
var isHost = false;
var isAcceptingPlayers = false;
var isStarted = false;
var playerList = [];
var questions = [];
var loadedImage = null;

const BASE_SCORE = 200;

yai.onParticipantJoined = onPlayerJoin;
yai.onParticipantLeave = onPlayerLeave;
yai.onIncomingMessage = onIncomingMessage;
yai.onEventVariableChanged = onEventVariableChanged;

function setAttributes(el, attrs) {
  for (var key in attrs) {
    el[key] = attrs[key];
  }
}

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

function imageViewer(img) {
  return {
    imageUrl: img || "",

    fileChosen(event) {
      this.fileToDataUrl(event, (src) => (this.imageUrl = src));
    },

    fileToDataUrl(event, callback) {
      if (!event.target.files.length) return;
      const files = [...event.target.files];

      if (files[0].size > 1024 * 1024) {
        Compress.compress(files, {
          size: 1, // the max size in MB, defaults to 2MB
          quality: 0.6, // the quality of the image, max is 1
        }).then((result) => {
          // returns an array of compressed images
          const img = result[0];
          const base64str = "data:image/jpeg;charset=utf-8;base64, " + img.data;
          console.log(img.endSizeInMb + "MiB");
          callback(base64str);
          loadedImage = base64str;
        });
      } else {
        let file = event.target.files[0],
          reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = (e) => {
          callback(e.target.result);
          console.log(files[0].size / 1024 / 1024 + "MiB");
          loadedImage = e.target.result;
        };
      }
    },
  };
}

function detectJoinLink() {
  eventId = new URLSearchParams(window.location.search).get("id");
  if (eventId) {
    $("#gameId").val(eventId);
    $("#gameId").attr('readonly', true);
    $("#enterGameId").click();
  }
}

function nth(n) {
  return [, "st", "nd", "rd"][(n / 10) % 10 ^ 1 && n % 10] || "th";
}

detectJoinLink();

function dev() {
  username = "litha";
  isHost = true;
  LoginScene.start();
}

// dev();
