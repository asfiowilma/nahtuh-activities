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

  /* LOBBY */
  $("#pl-submit-answer-btn").click(() => {
    btnClick.play();
    pl.answerHandler();
  });
  $(".pl-quit-btn").click(() => {
    btnClick.play();
    pl.onLeave();
  });
  $(".final-score-btn").click(() => {
    btnClick.play();
    sceneSwitcher("#display-final-rank", true);
  });
  $(".leaderboard-btn").click(() => {
    btnClick.play();
    sceneSwitcher("#leaderboard", true);
  });

  /* SOUND CONTROLS */
  $("#mute-btn").click(() => {
    muted = !muted;
    if (muted) {
      Howler.volume(0);
      $("#mute-btn .fas").replaceClass("fa-volume-up", "fa-volume-mute");
    } else {
      Howler.volume(volume);
      $("#mute-btn .fas").replaceClass("fa-volume-mute", "fa-volume-up");
    }
  });
  $("#volume-range").change(() => {
    volume = $("#volume-range").val();
    Howler.volume(volume);
    console.log(volume);
    if (volume == 0) {
      muted = true;
      $("#mute-btn .fas").replaceClass("fa-volume-up", "fa-volume-mute");
    } else {
      muted = false;
      $("#mute-btn .fas").replaceClass("fa-volume-mute", "fa-volume-up");
    }
  });
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

const OptionButton = (option, reveal = false, isHost = false, answer = null) => {
  var optionBtn = $(`
    <div class="w-full text-black bg-white ${reveal && option.b ? "bg-green-400 text-white" : "hover:bg-green-400"} ${
    reveal && !option.b ? "scale-90" : ""
  } ${
    reveal && answer && !answer.b && option.v === answer.v
      ? "bg-pink-900 bg-opacity-50 text-white"
      : "hover:bg-pink-900"
  } rounded-lg shadow px-4 py-6 cursor-pointer hover:bg-pink-50 transform transition ${
    !reveal && !isHost ? "hover:scale-105" : ""
  } ease-in-out text-center">
      ${option.v}
    </div>
  `);
  if (!isHost && !reveal)
    optionBtn.one("click", function () {
      btnClick.play();
      console.log(`${option.v} is clicked 😄`);
      PlayerLobby.answerHandler(option);
    });
  return optionBtn;
};

const ProgressBar = (duration) => {
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
    $("#next-or-skip-btn").click(() => {
      btnClick.play();
      hl.showLeaderboard();
    });
  } else if (!reveal) {
    $("#next-or-skip-btn").click(() => {
      btnClick.play();
      hl.stopTimer();
    });
  } else {
    $("#next-or-skip-btn").click(() => {
      btnClick.play();
      hl.nextQuestion();
    });
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
  $("#lobby-header").removeClass("hidden lg:-mb-10");
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
    btnClick.play();
    yai.broadcast({ regrade: answer });
    wrongBlock.replaceClass("bg-opacity-50", "bg-opacity-10");
    regradeBtn.replaceClass("btn-primary", "btn-light-outline");
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
  qCard.find(".q-header").text(`Q${idx + 1}. ${quiz.q}`);
  qCard.find(".q-type").text(quiz.type);
  qCard.click(() => {
    btnClick.play();
    hp.changeQuestion(idx);
  });

  const correctAnswer = qCard.find(".correct-answer").empty();
  switch (quiz.type) {
    case "SA":
      correctAnswer.replaceClass("grid-cols-2", "grid-cols-1");
      correctAnswer.append(`<div class="text-center bg-white text-pink-900 rounded p-1">${quiz.options[0]}</div>`);
      break;
    case "MC":
      for (opt of quiz.options) {
        var bgColor = opt.b ? "bg-white" : "bg-white opacity-50";
        correctAnswer.append(`<div class="choice rounded ${bgColor} h-4"></div>`);
      }
      break;
    case "T/F":
      for (opt of quiz.options.slice(0, 2)) {
        var bgColor = opt.b ? "bg-white" : "bg-white opacity-50";
        correctAnswer.append(`<div class="choice rounded ${bgColor} h-6"></div>`);
      }
      break;
  }

  return qCard;
};
