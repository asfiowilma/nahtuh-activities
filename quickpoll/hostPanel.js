const HostPanel = new (function () {
  this.qid = 0;

  this.start = () => {
    sceneSwitcher("#host-panel", false);
    $("#credits").toggleClass("hidden");

    if (window.location.hostname != "localhost") $("#hp-import-btn").addClass("hidden");

    $("#hp-username").text(username);
    $("#hp-event-id").text(eventId);
    this.addQuestion(this.defaultQuestionTemplate());
    this.renderUtilButton();
    this.questionInput();
  };

  // ============================================================
  // Render Scripts
  // ============================================================

  this.renderUtilButton = () => {
    $("#hp-delete-question-btn").click(() => this.deleteQuestion(this.qid));
    $("#hp-clone-question-btn").click(() => this.duplicateQuestion(this.qid));
  };

  this.toggleSidebar = () => {
    $("#sidebar").toggleClass("-translate-x-full");
  };

  // ============================================================
  // CRUD questions
  // ============================================================

  this.addQuestion = (questionToAdd) => {
    console.log("Adding Question");
    questionToAdd = questionToAdd || this.defaultQuestionTemplate();
    questions = [...questions, questionToAdd];
    const idx = questions.length - 1;

    $("#question-cards").append(QuestionCard(idx, questions[idx]));
    this.changeQuestion(idx);
  };

  this.changeAnswer = (idx, newValue) => {
    questions[this.qid].options[idx] = newValue;
  };

  this.addAnswer = () => {
    questions[this.qid].options.push("");
    $("#hp-option-grid").empty();
    this.rerenderAnswerOptions();
  };

  this.deleteAnswer = (idx) => {
    questions[this.qid].options.splice(idx, 1);
    this.rerenderAnswerOptions();
  };

  this.rerenderAnswerOptions = () => {
    $("#hp-option-grid").empty();
    for (let i = 0; i < questions[this.qid].options.length; i++) {
      const isLast = i === questions[this.qid].options.length - 1;
      $("#hp-option-grid").append(AnswerInput(questions[this.qid].options[i], i, isLast));
    }
    styleComponents();
  };
  this.importJson = () => {
    $("#import-json").click();
    uploadJson("import-json", function (json) {
      const importedQuestions = JSON.parse(json);
      questions = [];
      $("#question-cards").empty();
      for (question of importedQuestions) {
        hp.addQuestion(question);
      }
      if (questions.length > 0) hp.changeQuestion(0);
      swal({
        icon: "success",
        text: "Question set successfully imported!",
        button: false,
      });
    });
  };

  this.saveQuestion = () => {
    const type = $("input[name=type]:checked").val();
    let options = [""];
    if (["poll", "scales", "ranking"].includes(type)) {
      options = $(`#hp-option-grid`).find(".answer-input");
      options = Array.from(options);
      options = options.length > 0 ? options.map((option) => option.children[0].value) : [""];
    }

    const savedQuestion = {
      type: type,
      q: $("#hp-question-q").val(),
      options: options,
    };

    questions[this.qid] = savedQuestion;
    const oldQuestionCard = $(`.q-card:eq(${this.qid + 1})`);
    const newQuestionCard = QuestionCard(this.qid, savedQuestion);
    oldQuestionCard.replaceWith(newQuestionCard);
  };

  this.changeQuestion = (idx) => {
    let old = this.qid;
    this.qid = idx;

    let oldCard = $(`.q-card:eq(${old + 1})`);
    let newCard = $(`.q-card:eq(${idx + 1})`);

    oldCard.replaceClass("bg-lollipop scale-105", "bg-indigo-300");
    newCard.replaceClass("bg-indigo-300", "bg-lollipop scale-105");

    $("#type").val(questions[this.qid].type);
    $("#time").val(questions[this.qid].time);
    $("#points").val(questions[this.qid].points);
    this.questionInput();
  };

  this.duplicateQuestion = () => {
    const toDuplicate = questions[this.qid];
    this.addQuestion(toDuplicate);
  };

  this.deleteQuestion = (qid) => {
    questions.splice(qid, 1);
    $(`.q-card:eq(${qid + 1})`).remove();

    //replace question card numbering
    for (let idx = 0; idx < questions.length; idx++) {
      const qCard = $(`.q-card:eq(${idx + 1})`);
      qCard.find(".q-header").text(`Q${idx + 1}. ${questions[idx].q}`);
      qCard.unbind("click");
      qCard.click(() => this.changeQuestion(idx));
    }

    this.qid = 0;
    this.changeQuestion(0);
  };

  this.importJson = () => {
    $("#import-json").click();
    uploadJson("import-json", function (json) {
      const importedQuestions = JSON.parse(json);
      questions = [];
      $("#question-cards").empty();
      for (question of importedQuestions) {
        hp.addQuestion(question);
      }
      if (questions.length > 0) hp.changeQuestion(0);
      swal({
        icon: "success",
        text: "Question set successfully imported!",
        button: false,
      });
    });
  };

  this.exportAsActivitySet = () => {
    const title = $("#activity-set-title").val();
    const desc = $("#activity-set-desc").val();
    const thumbnail = activitySetThumbnail;
    const config = { questions: questions };

    if (this.validate())
      yai
        .createActivitySet(desc, title, username, config, thumbnail)
        .then(() => {
          toggleModal();
          swal({
            icon: "success",
            text: "Question set successfully made into an activity set!",
            button: false,
          });
        })
        .catch((err) => swal({ icon: "error", text: err, button: false }));
  };

  this.updateActivitySet = () => {
    const config = { questions: questions };

    if (this.validate())
      yai
        .updateActivitySetConfig(config)
        .then(() => {
          swal({
            icon: "success",
            text: "Activity set successfully updated!",
            button: false,
          });
        })
        .catch((err) => swal({ icon: "error", text: err, button: false }));
  };

  this.exportAsJson = () => {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions));
    var dlAnchorElem = document.getElementById("hp-export-json");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "questionSet.json");
    swal({
      icon: "success",
      text: "Successfully exported question set!",
      button: false,
    });
  };

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

  // ============================================================
  // Settings
  // ============================================================

  this.defaultQuestionTemplate = () => {
    return { type: "Poll", q: "", options: [""] };
  };

  // ============================================================
  // Components
  // ============================================================

  this.questionInput = () => {
    const type = $("input[name=type]:checked").val();
    $("#hp-question-q").val(questions[this.qid].q);
    if (["wordcloud", "open"].includes(type)) {
      $(".options-text").addClass("hidden");
      $("#hp-option-grid").empty();
    } else {
      $(".options-text").removeClass("hidden");
      this.rerenderAnswerOptions();
    }
  };
})();
