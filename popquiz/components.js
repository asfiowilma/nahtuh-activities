// ============================================================
// Components
// ============================================================

function styleButtons() {
  $(".btn").replaceClass("btn", "px-2 py-1 text-center cursor-pointer rounded transition ease-in-out");
  $(".btn-primary").replaceClass(
    "btn-primary",
    "bg-gradient-to-br from-pink-400 to-pink-500 hover:bg-pink-400 text-white"
  );
  $(".btn-primary-outline").replaceClass(
    "btn-primary-outline",
    "border border-pink-500 hover:bg-pink-400 text-pink-500 hover:text-white"
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
  /* LOGIN PANEL */
  $("#enter-game-id").click(() => renderUsernameInput(false));
  $("#create-link").click(() => renderUsernameInput(true));

  $("#enter-button").one("click", () => joinOrCreateRoom());
  $("#backlink").click(() => {
    $("#login-panel").toggleClass("hidden");
    $("#username-panel").toggleClass("hidden");
  });

  /* HOST PANEL */
  $("#menu-toggle").click(() => hp.toggleSidebar());
  $("#hp-start-quiz-btn").click(() => hp.startQuiz());
  $("#hp-add-question-btn").click(() => hp.addQuestion());
  $("#hp-save-question-btn").click(() => hp.saveQuestion());
  $("#hp-import-btn").click(() => hp.importQuestions());
  $("#hp-export-btn").click(() => hp.exportQuestions());

  /* LOBBY */
  $("#hl-start-quiz-btn").click(() => hl.startQuiz());
  $("#pl-submit-answer-btn").click(() => pl.answerHandler());
  $(".pl-quit-btn").click(() => pl.onLeave());
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

const Button = (type, text, onclick, style) => {
  let color, tColor, hover;
  switch (type) {
    case "danger":
      color = "bg-red-500";
      tColor = "white";
      hover = "bg-red-600";
      break;
  }
  return `
   <div
     class="px-2 py-1 text-center ${color} hover:${hover} cursor-pointer rounded text-${tColor} ${style}" onclick="${onclick}" 
   >
     ${text}
   </div>
 `;
};

const OptionInput = (qid, idx, option) => {
  const optionInput = $(".option-input").first().clone();
  optionInput.removeClass("hidden");

  const radioInput = optionInput.find(".form-radio");
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
  answerInput.find(".delete-answer-btn").addClass(idx === 0 ? "hidden" : "visible");
  answerInput.find(".add-answer-btn").click(() => hp.addAnswer());
  answerInput.find(".add-answer-btn").addClass(isLast ? "visible" : "invisible");

  return answerInput;
};

const OptionGrid = (type) => {
  return `<div id="option-grid" class="grid ${
    type === "SA" ? "grid-cols-1" : `grid-rows-${type === "T/F" ? 2 : 4} md:grid-rows-none md:grid-cols-2`
  } gap-4"></div>`;
};

const ProgressBar = (duration) => {
  $("#progress-bar").removeClass("hidden");
  const progress = $(".progress-animate").clone();
  progress.css("animation-duration", duration + "s");
  $("#progress-bar div").append(progress);
};

const OptionButton = (option, reveal = false, isHost = false, answer = null) => {
  var optionBtn = $(`
    <div class="w-full text-black bg-white ${reveal && option.b ? "bg-green-400 text-white" : ""} ${
    reveal && !option.b ? "scale-90" : ""
  } ${
    reveal && answer && !answer.b && option.v === answer.v ? "bg-pink-900 text-white" : ""
  } rounded-lg shadow px-4 py-6 cursor-pointer hover:bg-pink-50 transform transition ${
    !reveal && !isHost ? "hover:scale-105" : ""
  } ease-in-out text-center">
      ${option.v}
    </div>
  `);
  if (!isHost)
    optionBtn.one("click", function () {
      console.log(`${option.v} is clicked 😄`);
      PlayerLobby.answerHandler(option);
    });
  return optionBtn;
};

const HostLobbyHeader = (reveal = false, leaderboard = false) => {
  $("#lobby-header").removeClass("hidden");
  $("#question-count").text(`Question ${this.currentQid + 1}/${questions.length}`);

  $("#next-or-skip-btn").unbind("click");
  if (reveal && leaderboard) {
    $("#next-or-skip-btn").click(() => this.showLeaderboard());
  } else {
    $("#next-or-skip-btn").click(() => this.nextQuestion());
  }

  const time = questions[this.currentQid].time;

  if (!reveal) {
    $("#timer").text(time + "s");
    $("#timer").removeClass("hidden");
    $("#answered").removeClass("hidden");
    $("#next-or-skip-btn").text("Skip");
    ProgressBar(time);
  } else {
    $("#next-or-skip-btn").text("Next");
    $("progress-bar").addClass("hidden");
    $("#timer").addClass("hidden");
    $("#answered").addClass("hidden");
  }
};

const PlayerLobbyHeader = (time) => {
  $("#lobby-header").removeClass("hidden");
  $("#question-count").text(`Question ${this.currentQid + 1}/${this.totalQuestions}`);
  $("#timer").text(time + "s");
  ProgressBar(time);
};

const PlayerBlock = (str) => {
  return $(".player-block").first().clone().removeClass("hidden").text(str);
};

const WrongAnswerBlock = (answer, count) => {
  // const answerSlug = answer.replace(/[^\w ]+/g, "").replace(/ +/g, "-");
  const wrongBlock = $(".wrong-answer-block").first().clone();
  wrongBlock.removeClass("hidden");
  wrongBlock.find(".wab-answer").text(answer);
  wrongBlock.find(".wab-count").prepend(count);

  const regradeBtn = wrongBlock.find(".wab-regrade-btn");
  // wrongBlock.find(".wab-regrade-btn").attr("id", answerSlug);
  regradeBtn.hover(
    () => regradeBtn.find("span").removeClass("hidden"),
    () => regradeBtn.find("span").addClass("hidden")
  );
  regradeBtn.one("click", function () {
    yai.broadcast({ regrade: answer });
    wrongBlock.removeClass("bg-pink-900");
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

  return scoreBar;
};
