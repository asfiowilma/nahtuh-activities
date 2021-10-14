// ----------------------------------------------------------------
/* UTIL COMPONENT FUNCTIONS */
// ----------------------------------------------------------------

function setButtonsOnClick() {
  /* HOST PANEL */
  $("#menu-toggle, .menu-overlay").click(() => hp.toggleSidebar());
  $("#hp-start-quiz-btn").click(() => hp.startQuiz());
  $("#hp-add-question-btn").click(() => hp.addQuestion());
  $("#hp-save-question-btn").click(() => hp.saveQuestion());
  $("#hp-add-question-2-btn").click(() => {
    hp.saveQuestion();
    hp.addQuestion();
  });
  $("#hp-import-btn").click(() => hp.importJson());
  $("#hp-export-json").click(() => hp.exportAsJson());
  $("#hp-export-set").click(() => toggleModal());
  $("#hp-export-set-btn").click(() => hp.exportAsActivitySet());
  $("#hp-question-q").change((e) => (questions[hp.qid].q = e.target.value));
  $("input[name=type]").change(function () {
    $("input[name=type]:checked").prop("checked", false);
    $(`#${this.value}`).prop("checked", true);
    $("#type-panel label").removeClass().addClass("select-type");
    $(`label[for=${this.value}]`).removeClass().addClass("select-active");
    console.log(`changed to ${this.value} type`);
    hp.questionInput();
  });

  /* LOBBY */
  $(".pl-quit-btn").click(() => lobby.onLeave());
  $("#next-btn").click(() => lobby.nextQuestion());
  $("#export-result-btn").click(() => lobby.exportResults());
  $(".mute-btn").click(() => {
    $(".mute-btn i").toggleClass("fa-volume-mute").toggleClass("fa-volume-up");
    isMuted = !isMuted;
    $("audio").prop("muted", isMuted); // toggle mute 1/0
  });
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

function Sound(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function () {
    if (!isMuted) this.sound.play();
    return this;
  };
  this.loop = function () {
    this.sound.loop = true;
    return this;
  };
  this.then = function (playThis) {
    this.sound.addEventListener("ended", playThis);
  };
  this.bgm = function () {
    this.sound.volume = 0.1;
    return this;
  };
  this.stop = function () {
    this.sound.pause();
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
    case "qna":
      qCard.find(".q-type").text("QnA");
      icon.replaceClass("fa-chart-bar", "fa-chalkboard-teacher");
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
  let pollInput = $(".poll-input-wrapper").first().clone();
  pollInput.removeClass("hidden");
  let input = pollInput.find("input");
  input.prop("id", `q-${lobby.currentQid}-${i}`);
  input.prop("name", `q-${lobby.currentQid}`);
  input.val(i);
  let label = pollInput.find("label");
  label.text(option);
  label.prop("for", `q-${lobby.currentQid}-${i}`);
  return pollInput;
};

// WORD CLOUD

const WordCloudChart = () => {
  $(".chart").addClass("hidden");
  let chart = $(".chart-wordcloud").first().clone();
  chart.attr("id", `chart-${lobby.currentQid}`);
  chart.removeClass("hidden");
  let ctx = chart.find("canvas");

  let colors = ["white", "rosybrown", "burlywood", "bisque", "PeachPuff", "Moccasin", "PapayaWhip"];
  let wordCloud = new Chart(ctx, {
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
  let wcInput = $(".wordcloud-input-wrapper").first().clone();
  wcInput.removeClass("hidden");
  let input = wcInput.children("input");
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
      let scale = (val / valueSum) * range + minSize;
      scaledValues.push(scale);
    }
  } else if (valueSum > 20 && maxVal * minSize < maxSize) {
    console.log("this is in elif");
    for (val of wordValues) {
      let scale = val * minSize;
      scaledValues.push(scale);
    }
  } else {
    console.log("this is in else");
    for (val of wordValues) {
      let scale = (val / maxVal) * maxSize;
      scaledValues.push(scale);
    }
  }
  return scaledValues;
}

// OPEN ENDED

const OpenEndedChart = () => {
  $(".chart").addClass("hidden");
  let chart = $(".chart-open").first().clone();
  chart.attr("id", `chart-${lobby.currentQid}`);
  chart.removeClass("hidden");
  return chart;
};

const OpenEndedResponse = (response) => {
  let bgColors = ["bg-indigo-100", "bg-indigo-50", "bg-white", "bg-indigo-200"];
  let card = $(".open-ended-response").first().clone();
  card.removeClass("hidden");
  card.addClass(bgColors[Math.floor(Math.random() * bgColors.length)]);
  card.text(response);
  return card;
};

const OpenEndedInput = () => {
  let input = $(".open-ended-input").first().clone();
  input.removeClass("hidden");
  input.prop("name", `q-${lobby.currentQid}`);
  return input;
};

// SCALES

const ScalesChart = (question) => {
  $(".chart").addClass("hidden");
  let chart = $(".chart-scales").first().clone();
  chart.attr("id", `chart-${lobby.currentQid}`);
  chart.removeClass("hidden");
  let ctx = chart.find("canvas");

  let data = new Array(question.options.length).fill(0);
  let colors = ["white", "rosybrown", "burlywood", "bisque", "PeachPuff", "Moccasin", "PapayaWhip"];
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
        x: { min: 0, max: 5, ticks: { color: "white" }, grid: { color: "#6667c2" } },
        y: { ticks: { color: "white" }, grid: { display: false } },
      },
    },
  });
  charts[lobby.currentQid] = scales;
  return chart;
};

const ScalesInput = (option, i, label) => {
  const qid = lobby.currentQid;
  let scalesInput = $(".scales-input-wrapper").first().clone();
  scalesInput.removeClass("hidden");
  scalesInput.attr("name", `q-${qid}-${i}`);
  scalesInput.find(".scale-lo").text(label.lo);
  scalesInput.find(".scale-hi").text(label.hi);

  let input = scalesInput.find("input");
  input.prop("id", `q-${qid}-${i}`);
  input.prop("name", `q-${qid}`);
  input.change(() => $(`.scales-input-wrapper[name=q-${qid}-${i}] .scale`).text($(`#q-${qid}-${i}`).val()));

  let optionLabel = scalesInput.find("label");
  optionLabel.find(".scale-option").text(option);
  optionLabel.find(".scale-skip ").click(() => {
    let inp = $(`#q-${qid}-${i}`);
    inp.attr("skip", !inp.attr("skip"));
    inp.toggleClass("opacity-50");
    inp.prop("disabled", !inp.prop("disabled"));
    $(`.scales-input-wrapper[name=q-${qid}-${i}]`).toggleClass("text-gray-400 bg-gray-100");
  });
  optionLabel.prop("for", `q-${qid}-${i}`);
  return scalesInput;
};

// RANKING

const RankingChart = (question) => {
  $(".chart").addClass("hidden");
  let chart = $(".chart-ranking").first().clone();
  chart.attr("id", `chart-${lobby.currentQid}`);
  chart.removeClass("hidden");
  let ctx = chart.find("canvas");

  let data = new Array(question.options.length).fill(0);
  let colors = ["white", "rosybrown", "burlywood", "bisque", "PeachPuff", "Moccasin", "PapayaWhip"];
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
  let rankInput = $(".ranking-input-wrapper").first().clone();
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

// QNA

const QnAContainer = () => {
  $(".chart").addClass("hidden");
  let qnaContainer = $(".chart-qna").first().clone();
  qnaContainer.removeClass("hidden");
  qnaContainer.prop("id", `chart-${lobby.currentQid}`);

  lobby.qnaFilter = 0;
  let radio = qnaContainer.find("input[name='qna-filter']");
  let labels = qnaContainer.find("label");
  radio.each(function (i) {
    $(this).prop("id", `q-${lobby.currentQid}-qna-filter-${i}`);
  });
  labels.each(function (i) {
    $(this).attr("for", `q-${lobby.currentQid}-qna-filter-${i}`);
  });
  radio.change(function () {
    $("input[name='qna-filter']:checked").prop("checked", false);
    $(`#q-${lobby.currentQid}-${this.value}`).prop("checked", true);
    lobby.qnaFilter = this.value;
    labels.removeClass("btn-light px-6");
    $(`label[for=q-${lobby.currentQid}-qna-filter-${this.value}]`).addClass("btn-light px-6");
    lobby.renderQnAList(qnaContainer.find(".qna-items"), lobby.currentQid);
  });
  return qnaContainer;
};

const QnAInput = () => {
  let qnaContainer = $(".qna-input").first().clone();
  qnaContainer.removeClass("hidden");
  qnaContainer.prop("name", `q-${lobby.currentQid}`);
  return qnaContainer;
};

const QnAItem = (item, isPinned, isAnonymous) => {
  const { id, time, q, upvotes, asker, isAnswered, isAnonymous: isAnon } = item;
  let qna = $(".qna-item").first().clone();
  if (isPinned) qna = $(".qna-item.pinned").first().clone();

  qna.removeClass("hidden");
  qna.prop("id", id);
  qna.find(".qna-upvotes").text(upvotes);
  qna.find(".qna-time").text(new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  qna.find(".qna-asker").text(isAnonymous && isAnon ? `Anonymous${mod(hash(asker), 100)}` : asker);
  qna.find(".qna-q").text(q);

  if (isHost) {
    qna.find(".qna-p-btn").addClass("hidden");
    qna.find(".qna-h-btn").unhide();
    let pinBtn = qna.find(".qna-pin-btn");
    let answerBtn = qna.find(".qna-answer-btn");
    answerBtn.one("click", () => lobby.qnaAnswerHandler(id));
    pinBtn.click(() => lobby.qnaPinHandler(id));
  } else {
    let upvoteBtn = qna.find(".qna-upvote-btn");
    let withdrawBtn = qna.find(".qna-withdraw-btn");
    if (lobby?.currentQuestion?.upvoted.includes(id)) upvoteBtn.addClass("opacity-40");
    else {
      upvoteBtn.one("click", () => {
        lobby.qnaUpvoteHandler(id);
        upvoteBtn.addClass("opacity-40");
      });
    }
    if (username != asker || isPinned) withdrawBtn.addClass("hidden");
    else {
      withdrawBtn.click(() =>
        swal({ icon: "warning", text: "Are you sure you want to withdraw this question?", buttons: true }).then(
          (value) => {
            if (value) lobby.qnaWithdrawHandler(id);
          }
        )
      );
    }
  }

  if (isAnswered) qna.find(".qna-p-btn, .qna-h-btn").addClass("hidden");

  return qna;
};

const QnAEmpty = () => {
  let qnaEmpty = $(".qna-empty").first().clone();
  return qnaEmpty;
};
