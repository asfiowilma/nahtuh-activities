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

  this.toggleAutoplay = () => {
    yai.eventVars.autoplay = !yai.eventVars.autoplay;
    console.log("autoplay: " + yai.eventVars.autoplay);
  };

  this.toggleHostOnly = () => {
    yai.eventVars.hostOnly = !yai.eventVars.hostOnly;
  };

  this.toggleManualReveal = () => {
    yai.eventVars.manualReveal = !yai.eventVars.manualReveal;
  };

  this.renderDropdown = () => {
    for (i of this.dropdownSettings) {
      for (o of i.options) {
        $(`#${i.id}`).append(`<option value="${o.val}">${o.txt}</option>`);
      }
    }
    $("#type").change(() => this.questionInput());
    for (setting of this.additionalSettings()) $("#additional-settings").append(Toggle(setting));
  };

  this.renderUtilButton = () => {
    $("#hp-delete-question-btn").click(() => this.deleteQuestion(this.qid));
    $("#hp-clone-question-btn").click(() => this.duplicateQuestion(this.qid));
  };

  this.toggleSidebar = () => {
    $("#sidebar").toggleClass("-translate-x-full");
  };

  // ============================================================
  // CRUD Questions
  // ============================================================

  this.addQuestion = (questionToAdd) => {
    questionToAdd = questionToAdd || this.defaultQuestionTemplate();
    questions = [...questions, questionToAdd];
    const idx = questions.length - 1;

    $("#question-cards").append(QuestionCard(idx, questions[idx]));
    this.changeQuestion(idx);
    // console.log("QUESTION ADDED");
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
    styleButtons();
  };

  this.saveQuestion = () => {
    const type = $("#type").val();
    let options = $(`#hp-option-grid`).find(".answer-input");
    options = Array.from(options);
    options = options.map((option) => option.children[0].value);

    media =
      type === "MV"
        ? {
            video: $("#embed-video").attr("src").slice(30) || "",
            startAt: $("#mv-start").val() || 0,
            duration: $("#mv-play-duration").val() || 10,
          }
        : {
            audio: $("#lyrics").val() || "",
            pitch: $("#pitch").val(),
            rate: $("#rate").val(),
            voice: $("#voices").val(),
          };

    const savedQuestion = {
      type: type,
      time: $("#time").val(),
      points: $("#points").val(),
      media: media,
      options: options,
    };

    questions[this.qid] = savedQuestion;
    const oldQuestionCard = $(`.q-card:eq(${this.qid + 1})`);
    const newQuestionCard = QuestionCard(this.qid, savedQuestion);
    oldQuestionCard.replaceWith(newQuestionCard);
  };

  this.changeQuestion = (idx) => {
    let old = this.qid;
    let oldCard = $(`.q-card:eq(${old + 1})`);
    oldCard.replaceClass("bg-lime-gradient scale-105", "bg-gray-200");
    oldCard.find(".q-type").replaceClass("text-white border-white", "text-gray-500 border-gray-500");
    oldCard.find(".q-type-icon").replaceClass("text-white", "text-gray-300");

    this.qid = idx;
    let newCard = $(`.q-card:eq(${idx + 1})`);
    newCard.replaceClass("bg-gray-200", "bg-lime-gradient scale-105");
    newCard.find(".q-type").replaceClass("text-gray-500 border-gray-500", "text-white border-white");
    newCard.find(".q-type-icon").replaceClass("text-gray-300", "text-white");

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

  this.saveMusicVideo = () => {
    videoId = $("#video-id")
      .val()
      .match(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/)[1];
    $("#embed-video").attr("src", "https://www.youtube.com/embed/" + videoId);
  };

  this.togglePlay = () => {
    lyrics = new SpeechSynthesisUtterance($("#lyrics").val());
    lyrics.voice = speechSynthesis.getVoices()[$("#voices").val()];
    lyrics.pitch = $("#pitch").val();
    lyrics.rate = $("#rate").val();

    if (speechSynthesis.speaking) {
      $("#play-button").html('<i class="fas fa-play mr-2"></i><span class="small">Play</span>');
      speechSynthesis.cancel();
    } else {
      $("#play-button").html('<i class="fas fa-stop mr-2"></i><span class="small">Stop</span>');
      speechSynthesis.speak(lyrics);
    }
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
    if (this.validate()) HostLobby.start();
  };

  this.validate = () => {
    var text = "";
    const questionList = questions;
    if (questionList.length < 1) text = "You must have at least one question.";
    else {
      for (let i = 0; i < questionList.length; i++) {
        if (questionList[i].media.length < 1) {
          text = `You still have a question with no media.\nOn Question ${i + 1}`;
          break;
        } else if (questionList[i].media.video && questionList[i].media.video.length < 1) {
          text = `You still have a question with no video.\nOn Question ${i + 1}`;
          break;
        } else if (questionList[i].media.audio && questionList[i].media.audio.length < 1) {
          text = `You still have a question with no lyrics.\nOn Question ${i + 1}`;
          break;
        }
        var flagCorrectOption = false;
        if (["SA", "MV", "TTS"].includes(questionList[i].type)) {
          for (let j = 0; j < questionList[i].options.length; j++) {
            if (questionList[i].options[j].length === 0) {
              text = `You must have at least one correct answer.\nOn Question ${i + 1}`;
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
        { val: "MV", txt: "Music Video" },
        { val: "TTS", txt: "Text-To-Speech" },
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

  this.additionalSettings = () => [
    {
      id: "autoplay",
      toggleFunct: HostPanel.toggleAutoplay,
      label: "Autoplay",
      tooltip: "If turned on, the audio will start upon rendering.",
    },
    {
      id: "hostOnly",
      toggleFunct: HostPanel.toggleHostOnly,
      label: "Play audio only on host",
      tooltip: "If turned on, the audio clue will only be played on the host's screen.",
    },
    {
      id: "manualReveal",
      toggleFunct: HostPanel.toggleManualReveal,
      label: "Manual reveal",
      tooltip:
        "If turned on, the answer will not be displayed until the host manually reveals it, even if the time's already up.",
    },
  ];

  this.defaultQuestionTemplate = () => {
    return {
      type: "MV",
      time: "10",
      points: 1,
      media: "",
      options: [""],
    };
  };

  this.questionInput = () => {
    type = $("#type").val();
    MediaInput(type, questions[this.qid]);

    if (type === "MV") {
      $("#question-input-tts").addClass("hidden");
      $("#question-input-mv").removeClass("hidden");
    } else if (type === "TTS") {
      $("#question-input-mv").addClass("hidden");
      $("#question-input-tts").removeClass("hidden");
      $("#rate").change(() => $("#rate-label").text($("#rate").val()));
      $("#pitch").change(() => $("#pitch-label").text($("#pitch").val()));
    }
    $("#hp-option-grid").empty();
    this.rerenderAnswerOptions();
  };
})();
