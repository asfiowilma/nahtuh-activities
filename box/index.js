var canvas = document.getElementById("canvas");
var username = "";
var eventId = "";
var isHost = false;
var playerList = [];

yai.onEventVariableChanged = onEventVarChange;
yai.onParticipantJoined = onPlayerJoin;

const GameScene = new (function () {
  let myBox = document.createElement("div");
  myBox.id = username;
  myBox.className = "myBox";

  this.start = () => {
    this.renderEventInfo();
    this.renderMyBox();
    this.renderOtherBox();

    window.addEventListener("keydown", this.keyListener);
  };

  // listens to keyboard events and updates the eventVars accordingly.
  this.keyListener = ({ keyCode }) => {
    switch (keyCode) {
      case 37:
        yai.eventVars[username] = {
          ...yai.eventVars[username],
          positionX: yai.eventVars[username].positionX - 1,
        };
        break;
      case 38:
        yai.eventVars[username] = {
          ...yai.eventVars[username],
          positionY: yai.eventVars[username].positionY - 1,
        };
        break;
      case 39:
        yai.eventVars[username] = {
          ...yai.eventVars[username],
          positionX: yai.eventVars[username].positionX + 1,
        };
        break;
      case 40:
        yai.eventVars[username] = {
          ...yai.eventVars[username],
          positionY: yai.eventVars[username].positionY + 1,
        };
        break;
    }
    this.rerenderMyBox();
  };

  /******************************
   * eventVars Getters
   * */
  this.getColor = (username) => {
    var isInitiated = false;
    if (yai.eventVars[username]) isInitiated = true;

    return isInitiated ? `${yai.eventVars[username].color}` : "bisque";
  };

  this.getPosition = (username) => {
    var isInitiated = false;
    if (yai.eventVars[username]) isInitiated = true;

    return {
      x: isInitiated ? yai.eventVars[username].positionX : 0,
      y: isInitiated ? yai.eventVars[username].positionY : 0,
    };
  };

  /******************************
   * UTIL METHODS
   * */
  this.onEventVarChange = (name, value) => {
    this.rerenderOtherBox(name, value);
  };

  this.onPlayerJoin = () => {
    this.renderOtherBox();
  };

  this.renderEventInfo = () => {
    // renders event ID
    displayEventId = document.createElement("div");
    displayEventId.innerHTML = `Room ID: ${eventId}`;
    displayEventId.className = `font-bold text-center text-green-900 my-4 absolute top-0 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg p-4 py-2`;

    // renders username
    displayUsername = document.createElement("div");
    displayUsername.innerHTML = `You are: ${username}`;
    displayEventId.appendChild(displayUsername);
    canvas.appendChild(displayEventId);
  };

  this.renderMyBox = () => {
    myBox.innerHTML = username;
    myBox.className =
      "font-bold text-xl text-white flex justify-center items-center text-center";
    myBox.style.width = "100px";
    myBox.style.height = "100px";
    myBox.style.position = "absolute";
    myBox.style.borderRadius = "1rem";
    myBox.style.textShadow = "2px 2px 1rem #888";
    myBox.style.backgroundColor = this.getColor(username);
    myBox.style.top = `${this.getPosition(username).y}rem`;
    myBox.style.left = `${this.getPosition(username).x}rem`;

    canvas.appendChild(myBox);
  };

  this.rerenderMyBox = () => {
    myBox.style.top = `${this.getPosition(username).y}rem`;
    myBox.style.left = `${this.getPosition(username).x}rem`;
  };

  this.renderOtherBox = () => {
    playerList.forEach((player) => {
      if (player.participantName !== username) {
        let newBox = document.createElement("div");
        newBox.id = player.participantName;
        newBox.innerHTML = player.participantName;
        newBox.className =
          "font-bold text-xl text-white flex justify-center items-center text-center";
        newBox.style.width = "100px";
        newBox.style.height = "100px";
        newBox.style.position = "absolute";
        newBox.style.borderRadius = "1rem";
        newBox.style.textShadow = "2px 2px 1rem #888";
        newBox.style.backgroundColor = this.getColor(player.participantName);
        newBox.style.top = `${this.getPosition(player.participantName).y}rem`;
        newBox.style.left = `${this.getPosition(player.participantName).x}rem`;

        console.log(this.getPosition(player.participantName));

        canvas.appendChild(newBox);
      }
    });
  };

  this.rerenderOtherBox = (name, value) => {
    let tempBox = document.getElementById(name);

    tempBox.style.backgroundColor = value.color;
    tempBox.style.top = `${value.positionY}rem`;
    tempBox.style.left = `${value.positionX}rem`;
  };

  this.generateStyle = () => {
    addStyle(`
      #canvas {
        width: 100vw; 
        height: 100vh;
      }
      .myBox {
        width: 100px;
        height: 100px;
        border-radius: 1rem;
        position: absolute;
      }
    `);
  };
})();

/******************************************
 * handles event creation and user joining
 * */
async function initializeBox() {
  loginPanel = document.getElementById("login-panel");
  spinner = document.getElementById("spinner");
  if (!spinner) {
    spinner = document.createElement("img");
    spinner.id = "spinner";
    spinner.src = "box/spinner.svg";
    spinner.className = "mx-auto mb-2";
    loginPanel.prepend(spinner);
  }

  randomColor = `#${Math.floor(Math.random() * 0x1000000)
    .toString(16)
    .padStart(6, 0)}`;

  let loginResponse = await identityManager.login(username, "eventId");

  if (isHost) {
    let createEventResponse = await yai.createEvent(
      "X01",
      "",
      username,
      "",
      loginResponse.accessToken
    );
    console.log(createEventResponse);
    console.log(createEventResponse.eventInfo.eventId);
    eventId = createEventResponse.eventInfo.eventId;
  } else {
    let joinEventResponse = await yai.join(eventId, username, "");
    console.log(joinEventResponse);
  }

  yai.eventVars[username] = {
    username,
    positionX: 0,
    positionY: 0,
    color: randomColor,
  };

  canvas.removeChild(loginPanel);

  playerList = await yai.getParticipantList();
  GameScene.start();
}

/******************************
 * UTIL FUNCTIONS
 * */
function onEventVarChange(message) {
  console.log(message);
  console.log(yai.eventVars);
  GameScene.onEventVarChange(message.name, message.value);
}

function onPlayerJoin(message) {
  playerList.push(message);
  GameScene.onPlayerJoin();
}

const addStyle = (() => {
  const style = document.createElement("style");
  document.head.append(style);
  return (styleString) => (style.textContent = styleString);
})();

function login() {
  username = document.getElementById("username").value;
  isHost = true;
  // console.log(`username=${username} isHost=${isHost}`);
  initializeBox();
}

function joinRoom() {
  username = document.getElementById("username").value;
  eventId = document.getElementById("eventId").value;
  initializeBox();
}

function showInputEventId() {
  console.log("shoooww");
  document.getElementById("btn-wrapper").classList.add("hidden");
  document.getElementById("join-room").classList.remove("hidden");
}
