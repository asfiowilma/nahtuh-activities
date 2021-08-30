/* UTIL COMPONENT FUNCTIONS */

function styleComponents() {
  $(".btn").replaceClass(
    "btn",
    "px-2 py-3 text-center cursor-pointer rounded-full transition ease-in-out text-xs font-semibold"
  );
  $(".btn-primary").replaceClass(
    "btn-primary",
    "bg-gradient-to-br from-indigo-500 to-indigo-700 filter hover:brightness-90 text-white"
  );
  $(".btn-primary-outline").replaceClass(
    "btn-primary-outline",
    "border border-indigo-500 hover:bg-indigo-500 text-indigo-500 hover:text-white"
  );
  $(".btn-secondary").replaceClass("btn-secondary", "bg-gray-500 filter hover:brightness-90 text-white");
  $(".btn-secondary-outline").replaceClass(
    "btn-secondary-outline",
    "border border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white"
  );
  $(".btn-light").replaceClass("btn-light", "bg-white hover:bg-gray-100 text-black");
  $(".btn-light-outline").replaceClass(
    "btn-light-outline",
    "border border-white text-white hover:bg-gray-100 hover:text-black"
  );
  $(".btn-dark").replaceClass("btn-dark", "bg-gray-600 hover:bg-gray-500 text-white");
  $(".btn-danger").replaceClass("btn-danger", "bg-red-500 hover:bg-red-600 text-white");
  $(".btn-danger-outline").replaceClass(
    "btn-danger-outline",
    "border border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
  );
  $(".select-type").replaceClass(
    "select-type",
    "p-2 w-18 h-18 rounded-lg border border-gray-500 text-xs text-center flex flex-col items-center cursor-pointer hover:border-indigo-500 hover:text-indigo-500"
  );
  $(".select-active").replaceClass(
    "select-active",
    "p-2 w-18 h-18 rounded-lg bg-indigo-500 text-white text-xs text-center flex flex-col items-center cursor-pointer"
  );
  $(".input-form").replaceClass(
    "input-form",
    "rounded-full py-3 px-6 border border-gray-300 focus:border-indigo-500 leading-tight focus:outline-none"
  );
  $(".input-option").replaceClass(
    "input-option",
    "rounded-full py-3 px-6 border border-gray-300 hover:border-indigo-500 leading-tight focus:outline-none hover:text-indigo-500"
  );
  $(".input-active").replaceClass(
    "input-active",
    "rounded-full py-3 px-6 border border-indigo-400 leading-tight bg-indigo-400 text-white flex-1"
  );
}

function setButtonsOnClick() {
  /* HOST PANEL */
  $("#menu-toggle").click(() => hp.toggleSidebar());
  $("#hp-start-quiz-btn").click(() => hp.startQuiz());
  $("#hp-add-question-btn, #hp-add-question-2-btn").click(() => hp.addQuestion());
  $("#hp-save-question-btn").click(() => hp.saveQuestion());
  $("#hp-import-btn").click(() => hp.importJson());
  $("#hp-export-json").click(() => hp.exportAsJson());
  $("#hp-export-set").click(() => toggleModal());
  $("#hp-export-set-btn").click(() => hp.exportAsActivitySet());
  $("input[name=type]").change(function () {
    $("input[name=type]:checked").prop("checked", false);
    $(`#${this.value}`).prop("checked", true);
    $("#type-panel label").removeClass().addClass("select-type");
    $(`label[for=${this.value}]`).removeClass().addClass("select-active");
    console.log(`changed to ${this.value} type`);
    styleComponents();
    hp.questionInput();
  });

  $(".modal-overlay").click(() => toggleModal());
  $(".modal-close, .modal-close").click(() => toggleModal());

  document.onkeydown = function (e) {
    e = e || window.event;
    var isEscape = false;
    if ("key" in e) {
      isEscape = e.key === "Escape" || e.key === "Esc";
    } else {
      isEscape = e.code === "Escape";
    }
    if (isEscape && $("body").hasClass("modal-active")) {
      toggleModal();
    }
  };

  /* LOBBY */
  $("#next-btn").click(() => lobby.nextQuestion());
}

function sceneSwitcher(scene, isInLobby = true) {
  (isInLobby ? lobbyScenes : scenes).forEach((s) => $(s).addClass("hidden"));
  $(scene).removeClass("hidden");
  console.log(`in ${scene}`);
}

/* COMPONENTS */

const QuestionCard = (idx, quiz) => {
  const qCard = $(".q-card").first().clone();
  qCard.removeClass("hidden");
  qCard.find(".q-question").text(quiz.q || "N/A");
  qCard.click(() => hp.changeQuestion(idx));

  const icon = qCard.find(".q-type-icon");
  switch (quiz.type) {
    case "wordcloud":
      qCard.find(".q-type").text("Word Cloud");
      icon.replaceClass("fa-chart-bar", "fa-cloud");
      break;
    case "open":
      qCard.find(".q-type").text("Open Ended");
      icon.replaceClass("fa-chart-bar", "fa-comments");
      break;
    case "scales":
      qCard.find(".q-type").text("Scales");
      icon.replaceClass("fa-chart-bar", "fa-sliders-h");
      break;
    case "ranking":
      qCard.find(".q-type").text("Ranking");
      icon.replaceClass("fa-chart-bar", "fa-list-ol");
      break;
    default:
      qCard.find(".q-type").text("Poll");
      break;
  }

  return qCard;
};

const AnswerInput = (value, idx, isLast) => {
  const answerInput = $(".answer-input").first().clone();
  answerInput.removeClass("hidden");
  answerInput.find("input").val(value);
  answerInput.find("input").change((e) => hp.changeAnswer(idx, e.target.value));

  answerInput.find(".delete-answer-btn").click(() => hp.deleteAnswer(idx));
  if (idx == 0 && isLast) answerInput.find(".delete-answer-btn").addClass("hidden");
  answerInput.find(".add-answer-btn").click(() => hp.addAnswer());
  answerInput.find(".add-answer-btn").addClass(isLast && idx != 11 ? "visible" : "invisible");

  return answerInput;
};

const PollChart = (question) => {
  $(".chart").addClass("hidden");
  chart = $(".chart-poll").first().clone();
  chart.attr("id", `chart-${lobby.currentQid}`);
  chart.removeClass("hidden");
  ctx = chart.find("canvas");

  data = new Array(question.options.length).fill(0);
  colors = ["white", "rosybrown", "burlywood", "bisque", "PeachPuff", "Moccasin", "PapayaWhip"];
  pollChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: question.options,
      datasets: [{ label: "Votes", data: data, backgroundColor: colors }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, display: false },
        x: { ticks: { color: "white" }, grid: { display: false } },
      },
    },
  });
  charts[lobby.currentQid] = pollChart;
  return chart;
};

const PollInput = (option, i) => {
  pollInput = $(".poll-input-wrapper").first().clone();
  pollInput.removeClass("hidden");
  input = pollInput.find("input");
  input.prop("id", `q-${lobby.currentQid}-${i}`);
  input.prop("name", `q-${lobby.currentQid}`);
  input.val(i);
  label = pollInput.find("label");
  label.text(option);
  label.prop("for", `q-${lobby.currentQid}-${i}`);
  return pollInput;
};

const WordCloudChart = () => {
  $(".chart").addClass("hidden");
  chart = $(".chart-wordcloud").first().clone();
  chart.attr("id", `chart-${lobby.currentQid}`);
  chart.removeClass("hidden");
  ctx = chart.find("canvas");

  colors = ["white", "rosybrown", "burlywood", "bisque", "PeachPuff", "Moccasin", "PapayaWhip"];
  wordCloud = new Chart(ctx, {
    type: "wordCloud",
    data: {
      labels: [""],
      datasets: [
        {
          label: "Response(s)",
          // size in pixel
          data: [0],
          color: colors,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              var label = context.dataset.label || "";
              if (label) label += ": ";
              if (context.parsed.y !== null) {
                label += (context.parsed.y - 10) / 5;
              }
              return label;
            },
          },
        },
      },
    },
  });
  charts[lobby.currentQid] = wordCloud;
  return chart;
  // else if (type == "wordcloud")
  // else if (type == "scales") chart = $(".chart-scales").first().clone();
  // else if (type == "ranking") chart = $(".chart-ranking").first().clone();
  // else if (type == "open") chart = $(".chart-poll").first().clone();
};

const WordCloudInput = () => {
  wcInput = $(".wordcloud-input-wrapper").first().clone();
  wcInput.removeClass("hidden");
  input = wcInput.children("input");
  for (let i = 0; i < input.length; i++) {
    input[i].id = `q-${lobby.currentQid}-${i}`;
    input[i].name = `q-${lobby.currentQid}`;
    // input[i].prop("id", `q-${lobby.currentQid}-${i}`);
    // input[i].prop("name", `q-${lobby.currentQid}`);
  }
  return wcInput;
};

function wordCloudScaler(wordValues) {
  var scaledValues = [];
  const minSize = 15,
    maxSize = 135,
    range = maxSize - minSize,
    valueSum = wordValues.reduce((a, b) => a + b),
    maxVal = Math.max.apply(Math, wordValues);

  if (valueSum <= 20) {
    console.log("this is in if");
    for (val of wordValues) {
      scale = (val / valueSum) * range + minSize;
      scaledValues.push(scale);
    }
  } else if (valueSum > 20 && maxVal * minSize < maxSize) {
    console.log("this is in elif");
    for (val of wordValues) {
      scale = val * minSize;
      scaledValues.push(scale);
    }
  } else {
    console.log("this is in else");
    for (val of wordValues) {
      scale = (val / maxVal) * maxSize;
      scaledValues.push(scale);
    }
  }
  return scaledValues;
}
