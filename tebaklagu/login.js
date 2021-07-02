const LoginScene = new (function () {
  this.start = () => {
    $("#enterBtn").html('<i class="fas fa-spinner animate-spin"></i>');
    if (isHost) createGame();
    else joinGame();
  };

  async function createGame() {
    let loginResponse = await identityManager.login(username, "eventId");

    let createEventResponse = await yai.createEvent(
      "XTL",
      "",
      username,
      "",
      loginResponse.accessToken
    );
    // console.log(createEventResponse);
    eventId = createEventResponse.eventInfo.eventId;
    // console.log(eventId);

    yai.eventVars.quiz = { isStarted: false };
    yai.eventVars.questions = [];
    yai.eventVars.wrongAnswers = [];
    yai.eventVars.leaderboard = {};
    yai.eventVars.autoplay = false;
    yai.eventVars.hostOnly = false;
    yai.eventVars.manualReveal = false;

    HostPanel.start();
  }

  async function joinGame() {
    let joinEventResponse = await yai.join(eventId, username, "");
    // console.log(joinEventResponse);
    MainScene.start();
  }
})();

function validate(uname) {
  var text = "";
  if (uname.length < 3) text = "Username should be at least 3 characters long.";
  else if (uname.length > 20) text = "Username can only be at most 20 characters long.";
  if (text.length !== 0) {
    swal({ icon: "warning", text: text, button: false });
    return false;
  }
  return true;
}

function createRoom() {
  // console.log("creating room ...");
  username = $("#username").val();
  if (validate(username)) LoginScene.start();
  else
    $("#enterBtn").one("click", function () {
      isHost ? createRoom() : joinRoom();
    });
}

function joinRoom() {
  // console.log("joining room ...");
  username = $("#username").val();
  if (validate(username)) LoginScene.start();
  else
    $("#enterBtn").one("click", function () {
      isHost ? createRoom() : joinRoom();
    });
}

function renderUsernameInput(newHost = false) {
  isHost = newHost;
  eventId = !isHost ? $("#gameId").val() : "";
  loginPanel = $("#login-panel");

  if (!isHost && !eventId) {
    swal({
      icon: "warning",
      text: "Game ID cannot be empty.",
      button: false,
    }).then(() => location.reload());
  }

  canvas.html(`
    <div id="username-panel" class="flex-1 flex flex-col w-full md:w-96 px-4 mx-auto items-center justify-center">
      <div class="text-center text-3xl md:text-4xl font-bold text-white">
        ${isHost ? "Create new Room" : "Enter Game"}
      </div>
      <div class="p-4 bg-white rounded-lg mt-4 mb-2 w-full">
        <div class="flex flex-col justify-center items-stretch">
          <input type="text" id="username" class="rounded ring-1 ring-gray-300 px-4 py-2 mb-3 text-center" placeholder="Enter your ${
            isHost ? "user" : "player"
          } name">
          <div id="enterBtn" class="text-center disabled:opacity-50 bg-gray-600 text-white rounded font-bold py-2 cursor-pointer hover:bg-gray-500">${
            isHost ? "Create Room" : "Enter"
          }</div>
        </div>
      </div>
      <div id="backlink" class="text-white hover:text-green-300 hover:underline cursor-pointer text-center">Back</div>
    </div>
  `);
  $("#username").focus();
  $("#username").on("keypress", function (e) {
    if (e.which == 13) {
      e.preventDefault();
      $("#enterBtn").click();
    }
  });
  $("#enterBtn").one("click", function () {
    isHost ? createRoom() : joinRoom();
  });
  $("#backlink").click(() => canvas.html(loginPanel));
}

$("#gameId").focus();
$("#gameId").on("keypress", function (e) {
  if (e.which == 13) {
    e.preventDefault();
    $("#enterGameId").click();
  }
});
