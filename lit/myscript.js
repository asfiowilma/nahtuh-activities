var canvas = document.getElementById("canvas");
var createEvent = document.getElementById("create-event");
var presetbtn = document.querySelector("preset-activity-button");
var presetmodal = document.querySelector("preset-activity-modal");
presetbtn.refModal = presetmodal;

createEvent.onStart = onConnected;

const QUESTIONS = [
  {
    type: "wordcloud",
    q: "What comes to mind when thinking about Nahtuh?",
    options: [""],
    data: {
      ayy: 1,
      hello: 3,
      collab: 4,
      qwqw: 1,
    },
    answered: 4,
  },
  {
    type: "poll",
    q: "Favorite drink to have while working?",
    options: ["Coffee", "Tea", "Soda", "Juice", "Water", "Others"],
    data: [2, 1, 0, 0, 0, 0],
    answered: 3,
  },
  {
    type: "open",
    q: 'How are you REALLY doing today? :"))',
    options: [""],
    data: [
      "ini long responseesjasklds lasdasd",
      "ewqeqweqeqw",
      "asdah askldhalk djhalsdkjh askljdh aslkdjhaslkj haskljdha lkjdhalskj haslkjdhas kjdhasdah askldhalk djhalsdkjh askljdh aslkdjhaslkj haskljdha lkjdhalskj haslkjdhas kjdhasdah askldhalk djhalsdkjh askljdh aslkdjhaslkj haskljdha lkjdhalskj haslkjdhas kj",
      "askljdh aslkdjhaslkj haskljdha lkjdhalskj haslkjdhas kjdh",
    ],
    answered: 4,
  },
  {
    type: "ranking",
    q: "Best anime ever?",
    options: ["Naruto", "One Piece", "Haikyuu", "Jujutsu Kaisen", "Attack on Titan", "My fav is not in this list :("],
    data: [
      {
        id: 3,
        data: 19,
        opt: "Jujutsu Kaisen",
      },
      {
        id: 2,
        data: 17,
        opt: "Haikyuu",
      },
      {
        id: 1,
        data: 17,
        opt: "One Piece",
      },
      {
        id: 0,
        data: 15,
        opt: "Naruto",
      },
      {
        id: 4,
        data: 10,
        opt: "Attack on Titan",
      },
      {
        id: 5,
        data: 6,
        opt: "My fav is not in this list :(",
      },
    ],
    answered: 4,
  },
  {
    type: "scales",
    q: "What do you think about this quickpoll activity?",
    options: ["Aesthetics", "Functionality", "Flow"],
    skippable: "on",
    label: {
      hi: "Amazing",
      lo: "Terrible",
    },
    data: [
      {
        1: 0,
        2: 1,
        3: 0,
        4: 0,
        5: 2,
        sum: 12,
        count: 3,
      },
      {
        1: 0,
        2: 1,
        3: 0,
        4: 1,
        5: 0,
        sum: 6,
        count: 2,
      },
      {
        1: 0,
        2: 1,
        3: 0,
        4: 1,
        5: 1,
        sum: 11,
        count: 3,
      },
    ],
    answered: 4,
  },
  {
    type: "scales",
    q: "Yang ini gabisa diskip",
    options: ["Gimana?"],
    skippable: false,
    label: {
      hi: "Strongly agree",
      lo: "Strongly disagree",
    },
    data: [
      {
        1: 0,
        2: 1,
        3: 0,
        4: 1,
        5: 2,
        sum: 16,
        count: 4,
      },
    ],
    answered: 4,
  },
];

const PLAYERLIST = [
  {
    participantId: "cc77a8e6-badc-4f5d-8ab7-cc219508d217",
    isHost: true,
    participantName: "toblerone",
    avatarUrl: "https://lh3.googleusercontent.com/a-/AOh14Gi-aNphziSWb1pO_yugGprvwLAU8utZcrEp-d-y-g=s96-c",
    connected: true,
  },
  {
    participantId: "ee648612-7136-4a02-bf8c-d126f3554498",
    isHost: false,
    participantName: "toblerone1",
    avatarUrl: "https://lh3.googleusercontent.com/a-/AOh14Gi-aNphziSWb1pO_yugGprvwLAU8utZcrEp-d-y-g=s96-c",
    connected: true,
    responses: {
      0: {
        iAnswered: ["ayy", "hello"],
      },
      1: {
        iAnswered: "0",
      },
      2: {
        iAnswered: "ini long responseesjasklds lasdasd",
      },
      3: {
        iAnswered: [1, 5, 4, 6, 3, 2],
      },
      4: {
        iAnswered: ["5", "4", "4"],
      },
      5: {
        iAnswered: ["4"],
      },
    },
  },
  {
    participantId: "b9ca8229-aca1-4e98-bbd9-cd3403072c80",
    isHost: false,
    participantName: "toblerone2",
    avatarUrl: "https://lh3.googleusercontent.com/a-/AOh14Gi-aNphziSWb1pO_yugGprvwLAU8utZcrEp-d-y-g=s96-c",
    connected: true,
    responses: {
      0: {
        iAnswered: ["hello", "collab", "qwqw"],
      },
      1: {
        iAnswered: "1",
      },
      2: {
        iAnswered: "ewqeqweqeqw",
      },
      3: {
        iAnswered: [5, 1, 4, 6, 3, 2],
      },
      4: {
        iAnswered: ["5", 0, "2"],
      },
      5: {
        iAnswered: ["5"],
      },
    },
  },
  {
    participantId: "f3843972-1a5a-4f6e-90be-122a51846018",
    isHost: false,
    participantName: "toblerone3",
    avatarUrl: "https://lh3.googleusercontent.com/a-/AOh14Gi-aNphziSWb1pO_yugGprvwLAU8utZcrEp-d-y-g=s96-c",
    connected: true,
    responses: {
      0: {
        iAnswered: ["collab", "collab", "collab"],
      },
      1: {
        iAnswered: "0",
      },
      2: {
        iAnswered:
          "asdah askldhalk djhalsdkjh askljdh aslkdjhaslkj haskljdha lkjdhalskj haslkjdhas kjdhasdah askldhalk djhalsdkjh askljdh aslkdjhaslkj haskljdha lkjdhalskj haslkjdhas kjdhasdah askldhalk djhalsdkjh askljdh aslkdjhaslkj haskljdha lkjdhalskj haslkjdhas kj",
      },
      3: {
        iAnswered: [3, 6, 5, 4, 2, 1],
      },
      4: {
        iAnswered: ["2", "2", "5"],
      },
      5: {
        iAnswered: ["2"],
      },
    },
  },
  {
    participantId: "4c61e4da-ce96-4837-8ee2-4468f2144ca9",
    isHost: false,
    participantName: "toblerone4",
    avatarUrl: "https://lh3.googleusercontent.com/a-/AOh14Gi-aNphziSWb1pO_yugGprvwLAU8utZcrEp-d-y-g=s96-c",
    connected: true,
    responses: {
      0: {
        iAnswered: ["hello"],
      },
      2: {
        iAnswered: "askljdh aslkdjhaslkj haskljdha lkjdhalskj haslkjdhas kjdh",
      },
      3: {
        iAnswered: [6, 5, 4, 3, 2, 1],
      },
      4: {
        iAnswered: [0, 0, 0],
      },
      5: {
        iAnswered: ["5"],
      },
    },
  },
];

function renderCreateEvent() {
  var createEvent = document.createElement("create-event-component");
  createEvent.onStart = onConnected;
  canvas.pushChild(createEvent);
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

  // lobbyComponent.colorDanger = "#9D174D";
  // lobbyComponent.colorPrimary = "#EC4899";
  // lobbyComponent.colorSecondary = "#BE185D";
  canvas.append(lobbyComponent);
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

function exportFile() {
  console.log("creating xlsx");
  var wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "Quickpoll Results",
    Subject: "Test",
    Author: "Username",
    CreatedDate: new Date(),
  };
  wb.SheetNames.push("Results");
  wb.SheetNames.push("Participants");
  aoa_q = json_to_array_q(QUESTIONS);
  aoa_p = json_to_array_p(PLAYERLIST);
  var ws = XLSX.utils.aoa_to_sheet(aoa_q);
  var wsp = XLSX.utils.aoa_to_sheet(aoa_p);
  wb.Sheets["Results"] = ws;
  wb.Sheets["Participants"] = wsp;

  console.log("exporting for download");
  var wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
  saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), "quickpoll-results.xlsx");
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
  res.push(["Host", "Username"]);
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
  // console.log(res);
  return res;
}

function json_to_array_p(pl) {
  var res = [];

  // push headers
  var headers = ["", "Nickname"];
  for (i in QUESTIONS) headers.push(QUESTIONS[i].q);

  res.push(headers);

  // push participant data
  for (i in PLAYERLIST) {
    p = PLAYERLIST[i];
    if (!p.isHost) {
      pRow = [int(i), p.participantName];
      for (i in QUESTIONS) {
        if (p.responses[i]) pRow.push(p.responses[i].iAnswered.toString());
        else pRow.push("");
      }
      res.push(pRow);
    }
  }

  return res;
}

const int = (x) => parseInt(x);
const nth = (n) => [, "st", "nd", "rd"][(n / 10) % 10 ^ 1 && n % 10] || "th";

//reset the canvas
function clearCanvas() {
  canvas.innerHTML = "";
}

onInit();
