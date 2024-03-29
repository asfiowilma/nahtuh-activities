// ============================================================
// Components
// ============================================================

function setButtonsOnClick() {
  /* HOST PANEL */
  $("#menu-toggle, .menu-overlay").click(() => hp.toggleSidebar());
  $("#hp-start-quiz-btn").click(() => hp.startQuiz());
  $("#hp-add-question-btn").click(() => hp.addQuestion());
  $("#hp-add-question-2-btn").click(() => {
    hp.saveQuestion();
    hp.addQuestion();
  });
  $("#hp-save-question-btn").click(() => hp.saveQuestion());
  $("#hp-import-btn").click(() => hp.importJson());
  $("#hp-export-json").click(() => hp.exportAsJson());
  $("#hp-export-set").click(() => toggleModal());
  $("#hp-export-set-btn").click(() => hp.exportAsActivitySet());

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
  $("#pl-submit-answer-btn").click(() => pl.answerHandler());
  $(".pl-quit-btn").click(() => pl.onLeave());
  $(".final-score-btn").click(() => sceneSwitcher("#display-final-rank", true));
  $(".leaderboard-btn").click(() => sceneSwitcher("#leaderboard", true));
}

function sceneSwitcher(scene, isInLobby = false) {
  (isInLobby ? lobbyScenes : scenes).forEach((s) => $(s).addClass("hidden"));
  console.log(`switching scene into ${scene}`);
  $(scene).removeClass("hidden");
}

function toggleHideQuestionDisplay(componentsToUnhide) {
  const componentsToHide = [
    "#display-question-q",
    "#display-question-img",
    "#display-options",
    "#display-correct-answer",
    "#display-wrong-answer",
    "#pl-short-answer",
    "#pl-reveal-score",
    "#pl-reveal-remark",
    "#hl-wrong-answers",
  ];
  componentsToHide.forEach((hide) => $(hide).addClass("hidden"));
  componentsToUnhide.forEach((show) => $(show).removeClass("hidden"));
}

function imageViewer(img) {
  return {
    imageUrl: img || "",

    clearPreview() {
      document.getElementById("dropzone").value = null;
      this.imageUrl = "";
      hp.deleteImage();
    },

    loadThumbnail() {
      this.imageUrl = $("#load-dropzone").attr("src");
    },

    fileChosen(event) {
      this.fileToDataUrl(event, (src) => (this.imageUrl = src));
    },

    fileToDataUrl(event, callback) {
      if (!event.target?.files?.length && !event.dataTransfer?.files?.length) return;
      const files = [...(event.target?.files?.length ? event.target?.files : event.dataTransfer?.files)];

      let file = files[0];
      let reader = new FileReader();
      this.thumbnail = file;

      reader.readAsDataURL(file);
      reader.onload = (e) => {
        callback(e.target.result);
        loadedImage = e.target.result;
      };
    },
  };
}

const OptionInput = (qid, idx, option) => {
  const optionInput = $(".option-input").first().clone();
  optionInput.removeClass("hidden");

  const radioInput = optionInput.find("input[type=radio]");
  radioInput.attr("id", `q-${qid}-o-${idx}-b`);
  radioInput.attr("checked", option.b);

  const valueInput = optionInput.find("input[type=text]");
  valueInput.attr("id", `q-${qid}-o-${idx}-v`);
  valueInput.attr("placeholder", `Option ${idx + 1}`);
  valueInput.val(option.v);

  return optionInput;
};

const AnswerInput = (value, idx, isLast) => {
  const answerInput = $(".answer-input").first().clone();
  answerInput.removeClass("hidden");
  answerInput.find("input").val(value);
  answerInput.find("input").change((e) => hp.changeAnswer(idx, e.target.value));

  answerInput.find(".delete-answer-btn").click(() => hp.deleteAnswer(idx));
  answerInput.find(".delete-answer-btn").addClass(idx == 0 && isLast ? "hidden" : "visible");
  answerInput.find(".add-answer-btn").click(() => hp.addAnswer());
  answerInput.find(".add-answer-btn").addClass(isLast ? "visible" : "invisible");

  return answerInput;
};

OptionButton = (option, reveal = false, isHost = false, answer = null) => {
  var optionBtn = $(`
    <div class="w-full text-black bg-white ${reveal && option.b ? "bg-green-400 text-white" : ""} ${
    reveal && !option.b ? "scale-90" : ""
  } ${
    reveal && answer && !answer.b && option.v === answer.v ? "bg-blue-900 bg-opacity-50 text-white" : ""
  } rounded-lg shadow px-4 py-6 cursor-pointer hover:bg-blue-50 transform transition ${
    !reveal && !isHost ? "hover:scale-105" : ""
  } ease-in-out text-center">
      ${option.v}
    </div>
  `);
  if (!isHost && !reveal)
    optionBtn.one("click", function () {
      pl.answerHandler(option);
    });
  return optionBtn;
};

ProgressBar = (duration) => {
  $("#progress-bar").removeClass("hidden");
  const progress = $(".progress-animate").clone();
  progress.css("animation-duration", duration + "s");
  $(".progress-animate").replaceWith(progress);
};

const HostLobbyHeader = (reveal = false, leaderboard = false) => {
  $("#lobby-header").removeClass("hidden");
  $("#question-count").text(`Question ${hl.currentQid + 1}/${questions.length}`);

  $("#next-or-skip-btn").unbind("click");
  if (reveal && leaderboard) {
    $("#next-or-skip-btn").click(() => hl.showLeaderboard());
  } else if (!reveal) {
    $("#next-or-skip-btn").click(() => hl.stopTimer());
  } else {
    $("#next-or-skip-btn").click(() => hl.nextQuestion());
  }

  const time = questions[hl.currentQid].time;
  const outlineBtn = "border border-white text-white hover:text-black";
  const solidBtn = "bg-white text-black";

  if (!reveal) {
    $("#timer").text(time + "s");
    $("#timer").removeClass("hidden");
    $("#answered").removeClass("hidden");
    $("#next-or-skip-btn").text("Skip");
    $("#next-or-skip-btn").replaceClass(solidBtn, outlineBtn);
    ProgressBar(time);
  } else {
    $("#next-or-skip-btn").text("Next");
    $("#next-or-skip-btn").replaceClass(outlineBtn, solidBtn);
    $("progress-bar").addClass("hidden");
    $("#timer").addClass("hidden");
    $("#answered").addClass("hidden");
  }
};

const PlayerLobbyHeader = (time) => {
  $("#lobby-header").removeClass("hidden");
  $("#next-or-skip-btn").addClass("hidden");
  $("#question-count").text(`Question ${pl.currentQid + 1}/${pl.totalQuestions}`);
  $("#timer").text(time + "s");
  ProgressBar(time);
};

const WrongAnswerBlock = (answer, count) => {
  const wrongBlock = $(".wrong-answer-block").first().clone();
  wrongBlock.removeClass("hidden");
  wrongBlock.find(".wab-answer").text(answer);
  wrongBlock.find(".wab-count").prepend(count);

  const regradeBtn = wrongBlock.find(".wab-regrade-btn");
  regradeBtn.hover(
    () => regradeBtn.find("span").removeClass("hidden"),
    () => regradeBtn.find("span").addClass("hidden")
  );
  regradeBtn.one("click", function () {
    yai.broadcast({ regrade: answer });
    wrongBlock.replaceClass("bg-opacity-50", "bg-opacity-10");
    regradeBtn.unbind("mouseenter mouseleave");
    regradeBtn.find("span").text("Marked as correct");
  });

  return wrongBlock;
};

const LeaderboardScoreBar = (uname, score, winner) => {
  const scoreBar = $(".score-bar").first().clone();
  scoreBar.find(".score-bar-name").text(uname);
  scoreBar.find(".score-bar-score").text(score);
  scoreBar.find(".score-bar-score").css("width", (score / winner) * 100 + 2 + "%");

  if (!isHost && uname != username) {
    scoreBar.find(".score-bar-score").addClass("bg-opacity-40");
  }

  return scoreBar;
};

const QuestionCard = (idx, quiz) => {
  const qCard = $(".q-card").first().clone();
  qCard.removeClass("hidden");
  qCard.find(".q-type").text(quiz.type);
  if (quiz.img.length > 0) {
    qCard.find("i").addClass("hidden");
    qCard.find("img").removeClass("hidden").attr("src", quiz.img);
  } else {
    qCard.find("i").removeClass("hidden");
    qCard.find("img").addClass("hidden");
  }

  qCard.click(() => hp.changeQuestion(idx));

  const correctAnswer = qCard.find(".correct-answer").empty();
  switch (quiz.type) {
    case "SA":
      correctAnswer.replaceClass("grid-cols-2", "grid-cols-1");
      correctAnswer.append(`<div class="text-center bg-white text-blue-900 rounded p-1">${quiz.options[0]}</div>`);
      break;
    case "MC":
      for (opt of quiz.options) {
        var bgColor = opt.b ? "bg-white" : "bg-white opacity-50";
        correctAnswer.append(`<div class="choice rounded ${bgColor} h-4"></div>`);
      }
      break;
  }

  return qCard;
};
