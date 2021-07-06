const HostPanel = new (function () {
  this.qid = 0;

  this.start = () => {
    canvas.removeClass("bg-blue-800");
    canvas.addClass("bg-gray-100");
    this.renderHostPanel();
    this.addQuestion(this.defaultQuestionTemplate());
    this.renderUtilButton();
    this.renderDropdown();
    this.questionInput();
  };

  // ============================================================
  // Render Scripts
  // ============================================================

  this.renderHostPanel = () => {
    canvas.html(`
    <div id="host-panel" class="container mx-auto py-8 px-4 lg:px-0 flex items-start">
      <div id="menu-toggle" class="rounded-full bg-blue-500 h-10 w-10 flex items-center justify-center z-50 shadow-lg fixed top-2 left-2 block md:hidden"><i class="fas fa-bars text-white"></i></div>
      <div id="sidebar" class="bg-white w-60 fixed top-8 left-0 z-40 shadow-lg md:shadow-none md:translate-x-0 md:relative md:top-0 md:left-0 rounded-lg flex flex-col align-stretch p-4 transition ease-in-out transform -translate-x-full h-screen md:h-full overflow-y-auto pb-12 md:pb-4">
        <div class="flex flex-col mb-2">
          <div class="font-bold">Your username:</div>
          <span>${username}</span>
        </div>
        <div class="flex flex-col">
          <div class="font-bold">Game ID:</div>
          <span>${eventId}</span>
        </div>
        <hr class="my-2" />
        <div class="font-bold mb-2 relative inline-flex items-center justify-between">Import / Export: 
          <span class="has-tooltip"><i class="fas fa-question-circle text-gray-300"></i>
            <div class="tooltip w-56 relative -top-16 -right-1">
              <div class="bg-black text-white text-xs rounded py-1 px-4 right-0 bottom-full">
              Import a question set you made before, or export the current question set for future use.
              
                <svg class="absolute text-black h-2 right-0 mr-3 top-full" x="0px" y="0px" viewBox="0 0 255 255" xml:space="preserve">
                  <polygon class="fill-current" points="0,0 127.5,127.5 255,0"/>
                </svg>
              </div>
            </div>
          </span>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-1">
          <div class="w-full">${Button(
            "primary-outline",
            "Import",
            `HostPanel.importQuestions()`,
            "w-full"
          )}            
            <input id="importJson" value="import json" type="file" accept="application/json" style="display:none"/>
          </div>
          <a id="export-download">${Button(
            "primary-outline",
            "Export",
            `HostPanel.exportQuestions()`,
            "w-full"
          )}</a>
        </div>
        <hr class="my-2" />
        <div class="font-bold mb-1">Questions:</div>
        <div id="question-cards"></div>
            ${Button("secondary", "Add Question", `HostPanel.addQuestion()`, "w-full")}
          
      </div>
      <div id="panel" class="flex-1 flex-col md:ml-4" >
        <div id="mainPanel" class="bg-white rounded-lg p-4 relative w-full">
          <div class="flex w-full justify-between"><div class="flex-1 mr-4">Use this panel to edit your question set.</div>          
          <div id="utilbuttons" class="btn-wrapper flex relative"></div>
          </div>
          <form class="mt-6">
            <div id="settings" class="settings grid grid-rows-3 md:grid-rows-1 md:grid-cols-3 gap-2"></div>
            <hr class="my-4" />
            <div id="edit-question"></div>
            <div class="btnwrapper flex justify-end mt-4">
              ${Button("primary", "Save", "HostPanel.saveQuestion()", "w-full md:w-40")}
            </div>
          </form>
        </div>
        <div id="startPanel" class="bg-white rounded-lg p-4 mt-4 text-center w-full">
            When you're ready to start the quiz, press start.
            
          <div class="flex mt-2 justify-center">
            ${Button("primary", "Start", "HostPanel.startQuiz()", "w-40 px-4 text-lg ml-4")}
            </div>
        </div>
      </div>
    </div>
    `);
    $("#menu-toggle").click(() => this.toggleSidebar());
  };

  this.renderDropdown = () => {
    $("#settings").html(this.dropdownSettings.map((d) => this.dropdown(d)).join(""));
    $("#type").change((e) => {
      if (e.target.value === "SA") questions[this.qid].options = [""];
      this.questionInput();
    });
  };

  this.renderUtilButton = () => {
    $("#utilbuttons").html(
      Tooltip(
        Button(
          "secondary-outline",
          `<i class="fas fa-trash-alt"></i>`,
          `HostPanel.deleteQuestion(${this.qid})`,
          "text-sm mr-2"
        ),
        "Delete",
        "w-auto -top-8 right-9"
      ) +
        Tooltip(
          Button(
            "secondary",
            '<i class="fas fa-clone"></i>',
            `HostPanel.duplicateQuestion(${this.qid})`,
            "text-sm"
          ),
          "Duplicate",
          "w-auto -top-8 right-0"
        )
    );
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

    $("#question-cards").append(this.questionCard(idx, questions[idx]));

    this.changeQuestion(idx);
    // console.log("QUESTION ADDED");
  };

  this.changeAnswer = (idx) => {
    questions[this.qid].options[idx] = $(`#answer-${this.qid}-${idx}`).val();
  };

  this.addAnswer = () => {
    questions[this.qid].options.push("");
    $("#option-grid").empty();
    for (let i = 0; i < questions[this.qid].options.length; i++) {
      const isLast = i === questions[this.qid].options.length - 1;
      $("#option-grid").append(AnswerInput(questions[this.qid].options[i], i, isLast));
    }
  };

  this.deleteAnswer = (idx) => {
    questions[this.qid].options.splice(idx, 1);
    $("#option-grid").empty();
    for (let i = 0; i < questions[this.qid].options.length; i++) {
      const isLast = i === questions[this.qid].options.length - 1;
      $("#option-grid").append(AnswerInput(questions[this.qid].options[i], i, isLast));
    }
  };

  this.saveQuestion = () => {
    const type = $("#type").val();
    let options = $(".options");
    options = Array.from(options);

    const savedQuestion = {
      type: type,
      time: $("#time").val(),
      points: $("#points").val(),
      img: loadedImage || "",
      options:
        type === "SA"
          ? options.map((option) => option.value)
          : options.map((option) => ({
              b: option.children[0].checked,
              v: option.children[1].value,
            })),
    };

    // console.log(savedQuestion);
    questions[this.qid] = savedQuestion;
    $(`#qid-${this.qid}`).replaceWith(this.questionCard(this.qid, savedQuestion));
  };

  this.changeQuestion = (idx) => {
    let old = this.qid;
    this.qid = idx;
    loadedImage = questions[this.qid].img;

    $(`#qid-${old}`).replaceWith(this.questionCard(old, questions[old]));
    $(`#qid-${this.qid}`).replaceWith(this.questionCard(this.qid, questions[this.qid]));
    // console.log(`current qid: ${this.qid}`);

    this.renderUtilButton();
    this.renderDropdown();
    this.questionInput();
  };

  this.duplicateQuestion = () => {
    const toDuplicate = questions[this.qid];
    this.addQuestion(toDuplicate);
  };

  this.deleteQuestion = (qid) => {
    questions.splice(qid, 1);

    // resets qid to the first element
    this.qid = 0;
    $("#question-cards").empty();
    for (let i = 0; i < questions.length; i++) {
      $("#question-cards").append(this.questionCard(i, questions[i]));
    }
  };

  this.deleteImage = () => {
    questions[this.qid].img = "";
    loadedImage = "";
    this.questionInput();
  };

  this.importQuestions = () => {
    $("#importJson").click();
    uploadJson("importJson", function (json) {
      questions = JSON.parse(json);
      // // console.log(questions[1]);
      $("#question-cards").empty();

      for (let i = 0; i < questions.length; i++) {
        // console.log(questions[i]);
        $("#question-cards").append(HostPanel.questionCard(i, questions[i]));
      }
      if (questions.length > 0) HostPanel.changeQuestion(0);
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
        if (questionList[i].img.length < 1) {
          text = `You still have a question with no picture.\nOn Question ${i + 1}`;
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
      label: "Question Type",
      id: "type",
      options: [
        { value: "MC", text: "Multiple Choice" },
        { value: "SA", text: "Short Answer" },
      ],
    },
    {
      label: "Time Limit",
      id: "time",
      options: [
        { value: "20", text: "20 Seconds" },
        { value: "30", text: "30 Seconds" },
        { value: "10", text: "10 Seconds" },
        { value: "5", text: "5 Seconds" },
      ],
    },
    {
      label: "Points",
      id: "points",
      options: [
        { value: "1", text: "Default" },
        { value: "2", text: "Double Points" },
        { value: "0", text: "No Points" },
      ],
    },
  ];

  this.defaultQuestionTemplate = () => {
    return {
      type: "MC",
      time: "20",
      points: 1,
      img: "",
      options: Array.from({ length: 4 }, (i) => ({ b: false, v: "" })),
    };
  };

  this.dropdownTooltip = (id) => {
    switch (id) {
      case "type":
        return "The amount of options depends on the type of question";
      case "time":
        return "The time limit for answering each question";
      case "points":
        return "Amount of points player can gain for this question";
    }
  };

  this.questionCard = (idx, quiz) => {
    const renderOptions = quiz.type === "T/F" ? quiz.options.slice(0, 2) : quiz.options;

    return `
    <div class="question my-2 ${
      this.qid === idx ? "bg-blue-300" : "bg-gray-200"
    } p-2 rounded cursor-pointer transform hover:scale-105 transistion duration-300 ease-in-out" id="qid-${idx}" onclick="HostPanel.changeQuestion(${idx})">
      <div class="mb-2 relative">
        <span class="bg-blue-200 text-blue-600 border border-blue-600 rounded-full py-0.5 px-2 text-xs font-bold absolute top-2 left-2 z-10">${
          quiz.type
        }</span>
        ${
          quiz.img.length > 0
            ? `
          <img src="${quiz.img}" alt="" class="w-full rounded h-28 object-cover ${
                this.qid === idx ? "opacity-100" : "opacity-50"
              }"/>
        `
            : `<div class="w-full bg-gray-200 rounded h-28 flex items-center justify-center"><i class="fa fa-image fa-4x text-gray-400"></i></div>`
        }
      </div>
      ${
        quiz.type === "SA"
          ? `<div class="text-center">${quiz.options[0]}</div>`
          : `<div class="choices grid grid-cols-2 gap-2">
        ${renderOptions
          .map(
            (option) =>
              `<div class="choice bg-${option.b ? "blue-500" : "gray-100"} rounded ${
                quiz.type === "T/F" ? "h-6" : "h-4"
              }"></div>`
          )
          .join("")}
      </div>`
      }
    </div>
    `;
  };

  this.questionInput = () => {
    const type = $("#type").val();
    const length = type === "T/F" ? 2 : 4;
    $("#edit-question").html(Dropzone(`'${questions[this.qid].img}'`) + OptionGrid(type));
    if (type === "SA") {
      for (let i = 0; i < questions[this.qid].options.length; i++) {
        const isLast = i === questions[this.qid].options.length - 1;
        $("#option-grid").append(AnswerInput(questions[this.qid].options[i], i, isLast));
      }
    } else {
      for (let i = 0; i < length; i++) {
        const optionVal = questions[this.qid].options[i] || { b: false, v: "" };
        $("#option-grid").append(OptionInput(this.qid, i, optionVal));
      }
    }
  };

  this.dropdown = (dropdown) => {
    return `
   <div class="${dropdown.id} flex flex-col align-stretch rounded">
     <label for="${dropdown.id}" class="font-bold mb-2 flex justify-between relative"><span>${
      dropdown.label
    }:</span> <span class="has-tooltip"><i class="fas fa-question-circle text-gray-300"></i>
    <div class="tooltip w-56 relative -top-12 -right-1">
    <div class="bg-black text-white text-xs rounded py-1 px-4 right-0 bottom-full">${this.dropdownTooltip(
      dropdown.id
    )}
      <svg class="absolute text-black h-2 right-0 mr-3 top-full" x="0px" y="0px" viewBox="0 0 255 255" xml:space="preserve"><polygon class="fill-current" points="0,0 127.5,127.5 255,0"/></svg>    
    </div>
  </div></span></label>
     <div class="inline-block relative">
       <select
         name="${dropdown.id}"
         id="${dropdown.id}"
         class="appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
       >
       ${dropdown.options
         .map(
           (option) => `
       <option ${
         option.value === questions[this.qid][dropdown.id] && `selected="selected"`
       } value="${option.value}" >${option.text}</option>
       `
         )
         .join("")}
       </select>
       <div
         class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
       ><i class="fas fa-chevron-down text-gray-500"></i></div>
     </div>
   </div>`;
  };
})();
