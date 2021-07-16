const HostPanel = new (function () {
  this.qid = 0;

  this.start = () => {
    canvas.replaceClass("from-pink-400 to-pink-600", "bg-gray-100");
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
  };

  // ============================================================
  // CRUD questions
  // ============================================================

  this.addQuestion = (questionToAdd) => {
    questionToAdd = questionToAdd || this.defaultQuestionTemplate();
    questions = [...questions, questionToAdd];
    const idx = questions.length - 1;

    $("#question-cards").append(this.questionCard(idx, questions[idx]));
    this.changeQuestion(idx);
    // console.log("QUESTION ADDED");
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
    styleButtons();
  };

  this.saveQuestion = () => {
    const type = $("#type").val();
    const optionType = type === "T/F" ? "tf" : type.toLowerCase();
    let options = $(`#hp-option-grid-${optionType}`).find(".option-input");
    options = Array.from(options);

    switch (type) {
      case "MC":
      case "T/F":
        options = options.slice(0, type === "T/F" ? 2 : options.length).map((option) => ({
          b: option.children[0].checked,
          v: option.children[1].value,
        }));
        break;
      case "SA":
        options = options.map((option) => option.value);
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

    const oldQuestionCard = $(`.q-card:nth-child(${this.qid + 2})`);
    const newQuestionCard = this.questionCard(this.qid, savedQuestion);
    oldQuestionCard.replaceWith(newQuestionCard);
  };

  this.changeQuestion = (idx) => {
    let old = this.qid;
    this.qid = idx;

    let oldCard = $(`.q-card:nth-child(${old + 2})`);
    let newCard = $(`.q-card:nth-child(${idx + 2})`);

    oldCard.replaceClass("from-pink-200 to-pink-300 scale-105", "from-gray-200 to-gray-200");
    newCard.replaceClass("from-gray-200 to-gray-200", "from-pink-200 to-pink-300 scale-105");

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
    $(`.q-card:nth-child(${qid + 2})`).remove();

    //replace question card numbering
    for (let idx = 0; idx < questions.length; idx++) {
      const qCard = $(`.q-card:nth-child(${idx + 2})`);
      qCard.find(".q-header").text(`Q${idx + 1}. ${questions[idx].q}`);
      qCard.unbind("click");
      qCard.click(() => this.changeQuestion(idx));
    }

    this.qid = 0;
    this.changeQuestion(0);
  };

  this.importQuestions = () => {
    $("#importJson").click();
    uploadJson("importJson", function (json) {
      const importedQuestions = JSON.parse(json);

      questions = [];
      $(".q-card:not(:nth-child(1))").remove(); //removes all qcards except the template

      for (question of importedQuestions) {
        hp.addQuestion(question);
        // $("#question-cards").append(HostPanel.questionCard(i, questions[i]));
      }
      if (questions.length > 0) hp.changeQuestion(0);

      swal({
        icon: "success",
        text: "Question set successfully imported!",
        button: false,
      });
    });
  };

  this.exportQuestions = () => {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions));
    var dlAnchorElem = document.getElementById("export-download");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "questionSet.json");
    swal({
      icon: "success",
      text: "Successfully exported question set!",
      button: false,
    });
  };

  this.startQuiz = () => {
    if (this.validate()) HostLobby.start();
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
      time: "20",
      points: 1,
      q: "",
      options: Array.from({ length: 4 }, (i) => ({ b: false, v: "" })),
    };
  };

  // ============================================================
  // Components
  // ============================================================

  this.questionCard = (idx, quiz) => {
    const qCard = $(".q-card:nth-child(1)").clone();
    qCard.removeClass("hidden");
    qCard.find(".q-type").text(quiz.type);
    qCard.find(".q-header").text(`Q${idx + 1}. ${quiz.q}`);
    qCard.find(".q-type").text(quiz.type);
    qCard.click(() => this.changeQuestion(idx));

    const correctAnswer = qCard.find(".correct-answer").empty();
    switch (quiz.type) {
      case "SA":
        correctAnswer.replaceClass("grid-cols-2", "grid-cols-1");
        correctAnswer.append(`<div class="text-center bg-gray-100 rounded p-1">${quiz.options[0]}</div>`);
        break;
      case "MC":
        for (opt of quiz.options) {
          var bgColor = opt.b ? "bg-pink-400" : "bg-gray-100";
          correctAnswer.append(`<div class="choice rounded ${bgColor} h-4"></div>`);
        }
        break;
      case "T/F":
        for (opt of quiz.options.slice(0, 2)) {
          var bgColor = opt.b ? "bg-pink-400" : "bg-gray-100";
          correctAnswer.append(`<div class="choice rounded ${bgColor} h-6"></div>`);
        }
        break;
    }

    return qCard;
  };

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
