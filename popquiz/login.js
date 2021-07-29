const LoginScene = new (function () {
  this.start = () => {
    $("#enter-button").html('<i class="fas fa-spinner animate-spin"></i>');
    if (isHost) createGame();
    else joinGame();
  };

  async function createGame() {
    let loginResponse = await identityManager.login(username, "eventId");

    let createEventResponse = await yai.createEvent("XPQ", "", username, "", loginResponse.accessToken);
    // console.log(createEventResponse);
    eventId = createEventResponse.eventInfo.eventId;
    // console.log(eventId);

    yai.eventVars.wrongAnswers = [];

    HostPanel.start();
  }

  async function joinGame() {
    let joinEventResponse = await yai
      .join(eventId, username, "")
      .then(() => {
        PlayerLobby.start();
      })
      .catch((error) => {
        swal({ icon: "warning", text: error, button: false });
        $("#enter-button").text("Enter");
        $("#enter-button").one("click", () => joinOrCreateRoom());
      });
    console.log(joinEventResponse);
  }
})();

function validate(uname) {
  var text = "";
  if (/\S/.test(uname)) text = "Username cannot be empty.";
  else if (uname.length < 3) text = "Username should be at least 3 characters long.";
  else if (uname.length > 20) text = "Username can only be at most 20 characters long.";
  if (text.length !== 0) {
    swal({ icon: "warning", text: text, button: false });
    return false;
  }
  return true;
}

function joinOrCreateRoom() {
  // console.log("creating room ...");
  username = $("#username").val();
  if (validate(username)) LoginScene.start();
  else $("#enter-button").one("click", () => joinOrCreateRoom());
}

function renderUsernameInput(newHost = false) {
  isHost = newHost;
  eventId = !isHost ? $("#game-id").val() : "";

  if (!isHost && !eventId) {
    swal({
      icon: "warning",
      text: "Game ID cannot be empty.",
      button: false,
    }).then(() => location.reload());
  }

  $("#login-panel").toggleClass("hidden");
  $("#username-panel").toggleClass("hidden");

  $("#username").focus();
  $("#username").submitOnEnter("#enter-button");

  $("#create-or-enter").text(isHost ? "Create new Room" : "Enter Game");
  $("#enter-button").text(isHost ? "Create Room" : "Enter");
  $("#username").attr("placeholder", `Enter your ${isHost ? "user" : "player"} name`);
}

$(document).ready(function () {
  styleButtons();
  setButtonsOnClick();

  $("#game-id").focus();
  $("#game-id").submitOnEnter("#enter-game-id");
});
