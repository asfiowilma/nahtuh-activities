// ----------------------------------------------------------------
/* UTIL COMPONENT FUNCTIONS */
// ----------------------------------------------------------------

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
  $(".pl-quit-btn").click(() => lobby.onLeave());
  $("#next-btn").click(() => lobby.nextQuestion());
}

function sceneSwitcher(scene, isInLobby = true) {
  (isInLobby ? lobbyScenes : scenes).forEach((s) => $(s).addClass("hidden"));
  $(scene).removeClass("hidden");
  console.log(`in ${scene}`);
}

function toggleModal() {
  $(".modal").toggleClass("opacity-0 pointer-events-none");
  $("body").toggleClass("modal-active");
}

var activitySetThumbnail = "";
function imageViewer(img) {
  return {
    imageUrl: img || "",

    loadThumbnail() {
      var el = $("#load-thumbnail");
      loadPresetThumbnail(el.attr("src")).then((res) => (this.imageUrl = res));
    },

    clearPreview() {
      document.getElementById("activity-set-thumbnail").value = null;
      this.imageUrl = "";
      activitySetThumbnail = "";
      styleButtons();
    },

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
          const img1 = result[0];
          const base64strPreview = "data:image/jpeg;charset=utf-8;base64, " + img1.data;
          const base64str = img1.data;
          const imgExt = img1.ext;
          const file = Compress.convertBase64ToFile(base64str, imgExt);
          console.log(img1.endSizeInMb + "MiB");

          activitySetThumbnail = file;
          callback(base64strPreview);
        });
      } else {
        let file = event.target.files[0];
        let reader = new FileReader();
        activitySetThumbnail = file;

        reader.readAsDataURL(file);
        reader.onload = (e) => {
          callback(e.target.result);
          console.log(files[0].size / 1024 / 1024 + "MiB");
        };
      }
    },
  };
}

// ----------------------------------------------------------------
/* COMPONENTS */
// ----------------------------------------------------------------

// HOST PANEL

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

// POLL

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

// WORD CLOUD

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
          unscaled: [0],
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
              label += ": ";
              if (context.dataset.unscaled !== null) {
                label += context.dataset.unscaled[context.dataIndex];
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

// OPEN ENDED

const OpenEndedChart = () => {
  $(".chart").addClass("hidden");
  chart = $(".chart-open").first().clone();
  chart.attr("id", `chart-${lobby.currentQid}`);
  chart.removeClass("hidden");
  return chart;
};

const OpenEndedResponse = (response) => {
  bgColors = ["bg-indigo-100", "bg-indigo-50", "bg-white", "bg-indigo-200"];
  card = $(".open-ended-response").first().clone();
  card.removeClass("hidden");
  card.addClass(bgColors[Math.floor(Math.random() * bgColors.length)]);
  card.text(response);
  return card;
};

const OpenEndedInput = () => {
  input = $(".open-ended-input").first().clone();
  input.removeClass("hidden");
  input.prop("name", `q-${lobby.currentQid}`);
  return input;
};

// SCALES

const ScalesChart = (question) => {
  $(".chart").addClass("hidden");
  chart = $(".chart-scales").first().clone();
  chart.attr("id", `chart-${lobby.currentQid}`);
  chart.removeClass("hidden");
  ctx = chart.find("canvas");

  data = new Array(question.options.length).fill(0);
  colors = ["white", "rosybrown", "burlywood", "bisque", "PeachPuff", "Moccasin", "PapayaWhip"];
  var scales = new Chart(ctx, {
    type: "bar",
    data: {
      labels: question.options,
      datasets: [{ label: "Scale", data: data, backgroundColor: colors }],
    },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { ticks: { color: "white" }, grid: { display: false } },
      },
    },
  });
  charts[lobby.currentQid] = scales;
  return chart;
};

const ScalesInput = (option, i, label) => {
  const qid = lobby.currentQid;
  scalesInput = $(".scales-input-wrapper").first().clone();
  scalesInput.removeClass("hidden");
  scalesInput.attr("name", `q-${qid}-${i}`);
  scalesInput.find(".scale-lo").text(label.lo);
  scalesInput.find(".scale-hi").text(label.hi);
  input = scalesInput.find("input");
  input.prop("id", `q-${qid}-${i}`);
  input.prop("name", `q-${qid}`);
  input.change(() => $(`.scales-input-wrapper[name=q-${qid}-${i}] .scale`).text($(`#q-${qid}-${i}`).val()));
  label = scalesInput.find("label");
  label.find(".scale-option").text(option);
  label.find(".scale-skip ").click(() => {
    inp = $(`#q-${qid}-${i}`);
    inp.attr("skip", !inp.attr("skip"));
    inp.toggleClass("opacity-50");
    inp.prop("disabled", !inp.prop("disabled"));
    $(`.scales-input-wrapper[name=q-${qid}-${i}]`).toggleClass("text-gray-400 bg-gray-100");
  });
  label.prop("for", `q-${qid}-${i}`);
  return scalesInput;
};

// RANKING

const RankingChart = (question) => {
  $(".chart").addClass("hidden");
  chart = $(".chart-ranking").first().clone();
  chart.attr("id", `chart-${lobby.currentQid}`);
  chart.removeClass("hidden");
  ctx = chart.find("canvas");

  data = new Array(question.options.length).fill(0);
  colors = ["white", "rosybrown", "burlywood", "bisque", "PeachPuff", "Moccasin", "PapayaWhip"];
  var scales = new Chart(ctx, {
    type: "bar",
    data: {
      labels: question.options,
      datasets: [{ label: "Weight", data: data, backgroundColor: colors }],
    },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { ticks: { color: "white" }, grid: { display: false } },
      },
    },
  });
  charts[lobby.currentQid] = scales;
  return chart;
};

const RankingInput = (option, id, i, isLast) => {
  rankInput = $(".ranking-input-wrapper").first().clone();
  rankInput.removeClass("hidden");
  rankInput.prop("id", `q-${lobby.currentQid}-${id}`);
  rankInput.find(".rank-nth").text(i + 1 + nth(i + 1));
  rankInput.find(".rank-q").text(option);
  rankInput.find(".rank-up").click(() => lobby.rankUp(i));
  rankInput.find(".rank-down").click(() => lobby.rankDown(i));

  if (i == 0)
    rankInput
      .find(".rank-up")
      .unbind("click")
      .replaceClass("text-gray-500 hover:bg-gray-500 hover:text-white", "text-white bg-gray-500 opacity-20");
  else if (isLast)
    rankInput
      .find(".rank-down")
      .unbind("click")
      .replaceClass("text-gray-500 hover:bg-gray-500 hover:text-white", "text-white bg-gray-500 opacity-20");
  return rankInput;
};
