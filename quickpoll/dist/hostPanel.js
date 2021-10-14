const HostPanel = new (function () {
  this.qid = 0;

  this.start = () => {
    sceneSwitcher("#host-panel", false);
    $("#credits").toggleClass("hidden");

    if (window.location.hostname != "localhost") $("#hp-import-btn").addClass("hidden");
    var qCards = document.getElementById("question-cards");
    var sortable = Sortable.create(qCards, {
      fallbackTolerance: 5,
      animation: 150,
      swapThreshold: 0.8,
      onEnd: (evt) => reorder(evt.oldIndex, evt.newIndex),
    });

    $("#hp-username").text(username);
    $("#hp-event-id").text(eventId);
    this.addQuestion(this.defaultQuestionTemplate());
    this.renderUtilButton();
    this.questionInput();
  };

  // ============================================================
  /* Render Scripts */
  // ============================================================

  this.renderUtilButton = () => {
    $("#hp-delete-question-btn").click(() => this.deleteQuestion(this.qid));
    $("#hp-clone-question-btn").click(() => this.duplicateQuestion(this.qid));
  };

  this.toggleSidebar = () => {
    $("#sidebar").toggleClass("-translate-x-full");
    $("body").toggleClass("overflow-hidden");
    $(".menu-overlay").toggleClass("hidden");
  };

  // ============================================================
  /* CRUD questions  */
  // ============================================================

  this.addQuestion = (questionToAdd) => {
    console.log("Adding Question");
    questionToAdd = questionToAdd || this.defaultQuestionTemplate();
    questions = [...questions, questionToAdd];
    const idx = questions.length - 1;

    $(`label[for=poll]`).click();
    $("#question-cards").append(QuestionCard(idx, questions[idx]));
    this.changeQuestion(idx);
  };

  this.addAnswer = () => {
    questions[this.qid].options.push("");
    $("#hp-option-grid").empty();
    this.rerenderAnswerOptions();
  };

  this.rerenderAnswerOptions = () => {
    $("#hp-option-grid").empty();
    for (let i = 0; i < questions[this.qid].options.length; i++) {
      const isLast = i === questions[this.qid].options.length - 1;
      $("#hp-option-grid").append(AnswerInput(questions[this.qid].options[i], i, isLast));
    }
  };

  this.changeAnswer = (idx, newValue) => {
    questions[this.qid].options[idx] = newValue;
  };

  this.changeQuestion = (idx) => {
    let old = this.qid;
    this.qid = idx;

    let oldCard = $(`.q-card:eq(${old + 1})`);
    let newCard = $(`.q-card:eq(${idx + 1})`);

    oldCard.replaceClass("bg-lollipop scale-105", "bg-indigo-300");
    newCard.replaceClass("bg-indigo-300", "bg-lollipop scale-105");

    $(`label[for=${questions[this.qid].type}]`).click();
    this.questionInput();
  };

  this.saveQuestion = () => {
    const type = $("input[name=type]:checked").val();
    let settings,
      options = [""];
    if (["poll", "scales", "ranking"].includes(type)) {
      options = $(`#hp-option-grid`).find(".answer-input");
      options = Array.from(options);
      options = options.length > 0 ? options.map((option) => option.children[0].value) : [""];

      if (type == "scales") {
        settings = {
          skippable: $("input[name=skippable]").prop("checked"),
          label: {
            hi: $("#hp-label-value-hi").val() || "Strongly agree",
            lo: $("#hp-label-value-lo").val() || "Strongly disagree",
          },
        };
      }
    } else if (type == "qna") settings = { isAnonymous: $("input[name=anon]").prop("checked") };

    const savedQuestion = {
      type: type,
      q: $("#hp-question-q").val(),
      options: options,
      ...(settings || {}),
    };

    questions[this.qid] = savedQuestion;
    const oldQuestionCard = $(`.q-card:eq(${this.qid + 1})`);
    const newQuestionCard = QuestionCard(this.qid, savedQuestion);
    oldQuestionCard.replaceWith(newQuestionCard);
  };

  this.duplicateQuestion = () => {
    const toDuplicate = questions[this.qid];
    this.addQuestion(toDuplicate);
  };

  this.deleteAnswer = (idx) => {
    questions[this.qid].options.splice(idx, 1);
    this.rerenderAnswerOptions();
  };

  this.deleteQuestion = (qid) => {
    questions.splice(qid, 1);
    $(`.q-card:eq(${qid + 1})`).remove();

    //replace question card numbering
    for (let idx = 0; idx < questions.length; idx++) {
      const qCard = $(`.q-card:eq(${idx + 1})`);
      qCard.unbind("click");
      qCard.click(() => this.changeQuestion(idx));
    }

    this.qid = 0;
    this.changeQuestion(0);
  };

  // ============================================================
  /* Utils */
  // ============================================================

  this.startQuiz = () => {
    if (this.validate()) Lobby.start();
  };

  this.validate = () => {
    var text = "";
    const questionList = questions;
    if (questionList.length < 1) text = "You must have at least one question.";
    else {
      for (let i = 0; i < questionList.length; i++) {
        if (questionList[i].q.length < 1) {
          text = `You can't have an empty question.\nOn Question ${i + 1}`;
          break;
        } else if (["poll", "scales", "ranking"].includes(questionList[i].type)) {
          for (let j = 0; j < questionList[i].options.length; j++) {
            if (questionList[i].options[j].length === 0) {
              text = `You can't have an empty option.\nOn Question ${i + 1}`;
              break;
            }
          }
        }
      }
    }
    if (text.length !== 0) {
      swal({ icon: "warning", text: text, button: false });
      return false;
    }
    return true;
  };

  this.getConfig = () => {
    return { questions: questions };
  };

  // ============================================================
  /* Settings */
  // ============================================================

  this.defaultQuestionTemplate = () => {
    return { type: "Poll", q: "", options: [""] };
  };

  this.typeInfo = {
    poll: "Let your participants vote from a given set of options.",
    wordcloud: "Let your participants submit up to 3 words to make a word cloud.",
    open: "Let your participants answer with longer responses up to 250 characters.",
    scales: "Let your participants rate each option on a scale of 1 (low) to 5 (high).",
    ranking: "Let your participants sort the options in the order they prefer.",
    qna: "Let your participants ask questions and vote on the most relevant ones.",
  };

  // ============================================================
  /* Components */
  // ============================================================

  this.questionInput = () => {
    const type = $("input[name=type]:checked").val();
    $("#hp-question-q").val(questions[this.qid].q);
    $("#type-info").text(this.typeInfo[type]);
    $(".hp-scales-settings, .hp-qna-settings").addClass("hidden");
    $("#hp-question-q").attr("placeholder", "Type your question here");
    $("#edit-question > div:nth-child(2)").text("Question");
    if (["wordcloud", "open", "qna"].includes(type)) {
      if (type == "qna") {
        $("#hp-question-q").attr("placeholder", "Any questions?");
        $("#edit-question > div:nth-child(2)").text("Prompt");
        $(".hp-qna-settings").removeClass("hidden");
        $("input[name=anon]").prop("checked", questions[this.qid].isAnonymous || false);
      }
      $(".options-text").addClass("hidden");
      $("#hp-option-grid").empty();
    } else {
      if (type == "scales") {
        $(".hp-scales-settings").removeClass("hidden");
        $("#hp-label-value-hi").val(questions[this.qid]?.label?.hi || "");
        $("#hp-label-value-lo").val(questions[this.qid]?.label?.lo || "");
        $("input[name=skippable]").prop("checked", questions[this.qid].skippable || false);
      }
      $(".options-text").removeClass("hidden");

      this.rerenderAnswerOptions();
    }
  };
})();
