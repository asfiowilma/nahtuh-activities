// ============================================================
// Components
// ============================================================

function styleButtons() {
  $(".input-form").replaceClass(
    "input-form",
    "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
  );
  $(".btn").replaceClass("btn", "px-2 py-1 text-center cursor-pointer rounded transition ease-in-out");
  $(".btn-primary").replaceClass(
    "btn-primary",
    "bg-gradient-to-br from-green-400 to-green-500 hover:to-green-600 text-white"
  );
  $(".btn-primary-outline").replaceClass(
    "btn-primary-outline",
    "border border-green-500 hover:bg-green-400 text-green-500 hover:text-white"
  );
  $(".btn-secondary").replaceClass("btn-secondary", "bg-gray-500 hover:bg-gray-300 text-white");
  $(".btn-secondary-outline").replaceClass(
    "btn-secondary-outline",
    "border border-gray-500 text-gray-500 hover:bg-gray-300"
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
}

function setButtonsOnClick() {
  /* HOST PANEL */
  $("#menu-toggle").click(() => hp.toggleSidebar());
  $("#hp-start-quiz-btn").click(() => hp.startQuiz());
  $("#hp-add-question-btn").click(() => hp.addQuestion());
  $("#hp-save-question-btn").click(() => hp.saveQuestion());
  $("#hp-import-btn").click(() => hp.importJson());
  $("#hp-export-json").click(() => hp.exportAsJson());
  $("#hp-export-set").click(() => toggleModal());
  $("#hp-export-set-btn").click(() => hp.exportAsActivitySet());
  $("#save-music-video-btn").click(() => hp.saveMusicVideo());
  $("#tts-play-preview-btn").click(() => hp.togglePlay());
  $("#manual-reveal-btn").click(() => hl.manualReveal());

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
    "#display-options",
    "#display-tts-answer",
    "#display-question-vid",
    "#display-cover-vid",
    "#display-correct-answer",
    "#display-wrong-answer",
    "#play-btn",
    "#replay-btn",
    "#manual-reveal-btn",
    "#pl-short-answer",
    "#pl-reveal-score",
    "#pl-reveal-remark",
    "#hl-wrong-answers",
  ];
  componentsToHide.forEach((hide) => $(hide).addClass("hidden"));
  componentsToUnhide.forEach((show) => $(show).removeClass("hidden"));
}

function toggleModal() {
  $(".modal").toggleClass("opacity-0 pointer-events-none");
  $("body").toggleClass("modal-active");
}

var activitySetThumbnail = "";
function imageViewer(img) {
  return {
    imageUrl: img || "",

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
          const img = result[0];
          const base64str = "data:image/jpeg;charset=utf-8;base64, " + img.data;
          console.log(img.endSizeInMb + "MiB");
          activitySetThumbnail = img;
          callback(base64str);
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

AnswerInput = (value, idx, isLast) => {
  const answerInput = $(".answer-input").first().clone();
  answerInput.removeClass("hidden");
  answerInput.find("input").val(value);
  answerInput.find("input").change((e) => hp.changeAnswer(idx, e.target.value));

  answerInput.find(".delete-answer-btn").click(() => hp.deleteAnswer(idx));
  answerInput.find(".delete-answer-btn").addClass(idx === 0 ? "hidden" : "visible");
  answerInput.find(".add-answer-btn").click(() => hp.addAnswer());
  answerInput.find(".add-answer-btn").addClass(isLast ? "visible" : "invisible");

  return answerInput;
};

MediaInput = (type, question) => {
  switch (type) {
    case "MV":
      src = question.media.video ? `https://www.youtube.com/embed/${question.media.video}` : "";
      $("#video-id").val(src || "");
      $("#embed-video").attr("src", src);
      $("#mv-start").attr("value", question.media.startAt || 0);
      $("#mv-play-duration").attr("value", question.media.duration || "");
    case "TTS":
      voices = speechSynthesis.getVoices();
      $("#lyrics").val(question.media.audio || "");
      $("#pitch").val(question.media.pitch || 1);
      $("#rate").val(question.media.rate || 1);
      $("#voices").val(question.media.voice || 0);
      for (i = 0; i < voices.length; i++) {
        $("#voices").append(
          `<option ${i == question.media.voice && `selected="selected"`} value="${i}" >${voices[i].name}</option>`
        );
      }
  }
};

ProgressBar = (duration, freeze = false) => {
  $("#progress-bar").removeClass("hidden");
  const progress = $(".progress-animate").clone();
  progress.css("animation-duration", (freeze ? 9999 : duration) + "s");
  $(".progress-animate").replaceWith(progress);
};

const HostLobbyHeader = (reveal = false, leaderboard = false, timer = false) => {
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

  const time = timer ? timer : questions[hl.currentQid].time;
  const outlineBtn = "border border-white text-white hover:text-black";
  const solidBtn = "bg-white text-black";

  if (!reveal) {
    $("#timer").text(time + "s");
    $("#timer").removeClass("hidden");
    $("#answered").removeClass("hidden");
    $("#next-or-skip-btn").text("Skip");
    $("#next-or-skip-btn").replaceClass(solidBtn, outlineBtn);
    ProgressBar(time, !yai.eventVars.autoplay);
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
  ProgressBar(time, !yai.eventVars.autoplay);
};

Toggle = (setting) => {
  toggle = $(".toggle-container").first().clone();
  toggle.removeClass("hidden");
  toggle.find(".toggle div").attr("id", setting.id);
  toggle.find(".toggle span").text(setting.label);
  toggle.find("i").attr("title", setting.tooltip);
  toggle.click(() => toggleActive(setting.id, setting.toggleFunct));

  return toggle;
};

toggleActive = (id, toggleFunct) => {
  $("#" + id).toggleClass("bg-green-400");
  $("#" + id + " div").toggleClass("translate-x-3");
  toggleFunct();
};

const QuestionCard = (idx, quiz) => {
  isFilled = quiz.type === "MV" ? quiz.media?.video?.length > 0 : quiz.media?.audio?.length > 0;

  const qCard = $(".q-card").first().clone();
  qCard.removeClass("hidden");
  qCard.find(".q-type").text(quiz.type);
  qCard.find(".q-header").text(`Q${idx + 1}. ${quiz.q}`);
  qCard.find(".q-type").text(quiz.type);
  qCard.click(() => hp.changeQuestion(idx));
  qCard
    .find("div i")
    .replaceClass(isFilled ? "text-white" : "text-green-600", isFilled ? "text-green-600" : "text-white");
  if (quiz.type === "MV") qCard.find(".q-type-icon").replaceClass("fas fa-volume-up", "fab fa-youtube");
  else qCard.find(".q-type-icon").replaceClass("fab fa-youtube", "fas fa-volume-up");

  const correctAnswer = qCard.find(".correct-answer");
  correctAnswer.removeClass("hidden");
  correctAnswer.find("div").text(quiz.options[0]);

  return qCard;
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
