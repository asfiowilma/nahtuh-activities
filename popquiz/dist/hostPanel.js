const HostPanel = new (function () {
  this.qid = 0;

  this.start = () => {
    sceneSwitcher("#host-panel");
    $("#credits").toggleClass("hidden");

    $("#hp-username").text(username);
    $("#hp-event-id").text(eventId);
    this.addQuestion(this.defaultQuestionTemplate());
    this.renderUtilButton();
    this.renderDropdown();
    this.questionInput();
  };

  // ============================================================
  // Render Scripts
  // ============================================================

  this.renderDropdown = () => {
    for (i of this.dropdownSettings) {
      for (o of i.options) {
        $(`#${i.id}`).append(`<option value="${o.val}">${o.txt}</option>`);
      }
    }
    $("#type").change((e) => {
      if (e.target.value === "SA") questions[this.qid].options = [""];
      this.questionInput();
    });
  };

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
    $("#hp-option-grid-sa").empty();
    this.rerenderAnswerOptions();
  };

  this.deleteAnswer = (idx) => {
    questions[this.qid].options.splice(idx, 1);
    this.rerenderAnswerOptions();
  };

  this.rerenderAnswerOptions = () => {
    $("#hp-option-grid-sa").empty();
    for (let i = 0; i < questions[this.qid].options.length; i++) {
      const isLast = i === questions[this.qid].options.length - 1;
      $("#hp-option-grid-sa").append(AnswerInput(questions[this.qid].options[i], i, isLast));
    }
  };

  this.saveQuestion = () => {
    const type = $("#type").val();
    const optionType = type === "T/F" ? "tf" : type.toLowerCase();
    let options;

    switch (type) {
      case "MC":
      case "T/F":
        options = $(`#hp-option-grid-${optionType}`).find(".option-input");
        options = Array.from(options);
        options = options.slice(0, type === "T/F" ? 2 : options.length).map((option) => ({
          b: option.children[0].checked,
          v: option.children[1].value,
        }));
        break;
      case "SA":
        options = $(`#hp-option-grid-${optionType}`).find(".answer-input");
        options = Array.from(options);
        options = options.map((option) => option.children[0].value);
        break;
    }

    const savedQuestion = {
      type: type,
      time: $("#time").val(),
      points: $("#points").val(),
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

    oldCard.replaceClass("bg-gummy scale-105", "bg-pink-300");
    newCard.replaceClass("bg-pink-300", "bg-gummy scale-105");

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

  this.startQuiz = () => {
    if (this.validate()) HostLobby.start();
  };

  this.getConfig = () => {
    return { questions: questions };
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
        }
        var flagCorrectOption = false;
        if (questionList[i].type === "SA") {
          for (let j = 0; j < questionList[i].options.length; j++) {
            if (questionList[i].options[j].length === 0) {
              text = `You can't have an empty option.\nOn Question ${i + 1}`;
              break;
            }
          }
        } else {
          for (let j = 0; j < questionList[i].options.length; j++) {
            if (questionList[i].options[j].v.length === 0) {
              text = `You can't have an empty option.\nOn Question ${i + 1}`;
              break;
            } else if (questionList[i].options[j].b) {
              flagCorrectOption = true;
            }
          }
          if (text.length === 0 && !flagCorrectOption) {
            text = `You must have at least one correct option.\nOn Question ${i + 1}`;
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

  this.dropdownSettings = [
    {
      id: "type",
      options: [
        { val: "MC", txt: "Multiple Choice" },
        { val: "T/F", txt: "True or False" },
        { val: "SA", txt: "Short Answer" },
      ],
    },
    {
      id: "time",
      options: [
        { val: "10", txt: "10 Seconds" },
        { val: "20", txt: "20 Seconds" },
        { val: "30", txt: "30 Seconds" },
        { val: "45", txt: "45 Seconds" },
        { val: "60", txt: "60 Seconds" },
      ],
    },
    {
      id: "points",
      options: [
        { val: "1", txt: "Default" },
        { val: "2", txt: "Double Points" },
        { val: "0", txt: "No Points" },
      ],
    },
  ];

  this.defaultQuestionTemplate = () => {
    return {
      type: "MC",
      time: "10",
      points: 1,
      q: "",
      options: Array.from({ length: 4 }, (_) => ({ b: false, v: "" })),
    };
  };

  // ============================================================
  // Components
  // ============================================================

  this.questionInput = () => {
    const type = $("#type").val();
    $("#hp-question-q").val(questions[this.qid].q);

    $("#hp-option-grid-sa").addClass("hidden");
    $("#hp-option-grid-mc").addClass("hidden");
    $("#hp-option-grid-tf").addClass("hidden");

    $("#hp-question-q").attr("value", questions[this.qid].q);
    switch (type) {
      case "SA":
        $("#hp-option-grid-sa").removeClass("hidden");
        $("#hp-option-grid-sa").empty();
        this.rerenderAnswerOptions();
        break;
      case "T/F":
        $("#hp-option-grid-tf").removeClass("hidden");
        $("#hp-option-grid-tf").empty();
        for (let i = 0; i < 2; i++) {
          var optionVal = questions[this.qid].options[i] || { b: false, v: "" };
          $("#hp-option-grid-tf").append(OptionInput(this.qid, i, optionVal));
        }
        break;
      case "MC":
        $("#hp-option-grid-mc").removeClass("hidden");
        $("#hp-option-grid-mc").empty();
        for (let i = 0; i < 4; i++) {
          var optionVal = questions[this.qid].options[i] || { b: false, v: "" };
          $("#hp-option-grid-mc").append(OptionInput(this.qid, i, optionVal));
        }
        break;
    }
  };
})();
