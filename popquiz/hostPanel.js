const HostPanel = new (function () {
  this.qid = 0;

  this.start = () => {
    canvas.removeClass("bg-pink-600");
    canvas.addClass("bg-gray-100");
    this.renderHostPanel();
    this.addQuestion(this.defaultQuestionTemplate);
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
      <div id="menu-toggle" class="rounded-full bg-pink-500 h-10 w-10 flex items-center justify-center z-50 shadow-lg fixed top-2 left-2 block md:hidden"><i class="fas fa-bars text-white"></i></div>
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
      if (e.target.value === "SA") yai.eventVars.questions[this.qid].options = [""];
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
  // CRUD yai.eventVars.questions
  // ============================================================

  this.addQuestion = (questionToAdd) => {
    questionToAdd = questionToAdd || this.defaultQuestionTemplate;
    yai.eventVars.questions = [...yai.eventVars.questions, questionToAdd];
    const idx = yai.eventVars.questions.length - 1;

    $("#question-cards").append(this.questionCard(idx, yai.eventVars.questions[idx]));

    this.changeQuestion(idx);
    // console.log("QUESTION ADDED");
  };

  this.saveQuestion = () => {
    const type = $("#type").val();
    let options = $(".options");
    options = Array.from(options);

    const savedQuestion = {
      type: type,
      time: $("#time").val(),
      points: $("#points").val(),
      q: $("#question-q").val(),
      options: options.slice(0, type === "T/F" ? 2 : options.length).map((option) => ({
        b: option.children[0].checked,
        v: option.children[1].value,
      })),
    };

    // console.log(savedQuestion);
    yai.eventVars.questions[this.qid] = savedQuestion;
    $(`#qid-${this.qid}`).replaceWith(this.questionCard(this.qid, savedQuestion));
  };

  this.changeQuestion = (idx) => {
    let old = this.qid;
    this.qid = idx;

    $(`#qid-${old}`).replaceWith(this.questionCard(old, yai.eventVars.questions[old]));
    $(`#qid-${this.qid}`).replaceWith(
      this.questionCard(this.qid, yai.eventVars.questions[this.qid])
    );

    // console.log(`current qid: ${this.qid}`);

    this.renderUtilButton();
    this.renderDropdown();
    this.questionInput();
  };

  this.duplicateQuestion = () => {
    const toDuplicate = yai.eventVars.questions[this.qid];
    this.addQuestion(toDuplicate);
  };

  this.deleteQuestion = (qid) => {
    yai.eventVars.questions.splice(qid, 1);

    // resets qid to the first element
    this.qid = 0;
    $("#question-cards").empty();
    for (let i = 0; i < yai.eventVars.questions.length; i++) {
      $("#question-cards").append(this.questionCard(i, yai.eventVars.questions[i]));
    }
  };

  this.importQuestions = () => {
    $("#importJson").click();
    uploadJson("importJson", function (json) {
      yai.eventVars.questions = JSON.parse(json);
      // console.log(yai.eventVars.questions[1]);
      $("#question-cards").empty();

      for (let i = 0; i < yai.eventVars.questions.length; i++) {
        // console.log(yai.eventVars.questions[i]);
        $("#question-cards").append(HostPanel.questionCard(i, yai.eventVars.questions[i]));
      }
      if (yai.eventVars.questions.length > 0) HostPanel.changeQuestion(0);
      swal({
        icon: "success",
        text: "Question set successfully imported!",
        button: false,
      });
    });
  };

  this.exportQuestions = () => {
    var dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(yai.eventVars.questions));
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
    const questionList = yai.eventVars.questions;
    if (questionList.length < 1) text = "You must have at least one question.";
    else {
      for (let i = 0; i < questionList.length; i++) {
        if (questionList[i].q.length < 1) {
          text = `You can't have an empty question.\nOn Question ${i + 1}`;
          break;
        }
        var flagCorrectOption = false;
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
        { value: "T/F", text: "True or False" },
      ],
    },
    {
      label: "Time Limit",
      id: "time",
      options: [
        { value: "10", text: "10 Seconds" },
        { value: "20", text: "20 Seconds" },
        { value: "30", text: "30 Seconds" },
        { value: "45", text: "45 Seconds" },
        { value: "60", text: "60 Seconds" },
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

  this.defaultQuestionTemplate = {
    type: "MC",
    time: "10",
    points: 1,
    q: "",
    options: [
      { b: false, v: "" },
      { b: false, v: "" },
      { b: false, v: "" },
      { b: false, v: "" },
    ],
  };
  this.defaultOption = { b: false, v: "" };

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

  // ============================================================
  // Components
  // ============================================================

  this.questionCard = (idx, quiz) => {
    const renderOptions = quiz.type === "T/F" ? quiz.options.slice(0, 2) : quiz.options;

    return `
    <div class="question my-2 ${
      this.qid === idx ? "bg-pink-300" : "bg-gray-200"
    } p-2 rounded cursor-pointer transform hover:scale-105 transistion duration-300 ease-in-out" id="qid-${idx}" onclick="HostPanel.changeQuestion(${idx})">
        <div class="mb-2">
        <span class="bg-pink-200 text-pink-600 border border-pink-600 rounded-full py-0.5 px-2 text-xs font-bold">${
          quiz.type
        }</span>
        <span class="ml-1">Q${idx + 1}. ${quiz.q}</span>
      </div>
      <div class="choices grid grid-cols-2 gap-2">
        ${renderOptions
          .map(
            (option) =>
              `<div class="choice bg-${option.b ? "pink-500" : "gray-100"} rounded ${
                quiz.type === "T/F" ? "h-6" : "h-4"
              }"></div>`
          )
          .join("")}
      </div>
    </div>
    `;
  };

  this.questionInput = () => {
    const type = $("#type").val();
    const length = type === "T/F" ? 2 : 4;
    
    $("#edit-question").html(
      `
    <input id="question-q" value="${
      yai.eventVars.questions[this.qid].q
    }" class="w-100 mb-4 shadow appearance-none border rounded w-full py-2 
    px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" placeholder="Type your question here">
    ` + OptionGrid(type)
    );
    for (let i = 0; i < length; i++) {
      const optionVal = yai.eventVars.questions[this.qid].options[i] || this.defaultOption;
      $("#option-grid").append(OptionInput(this.qid, i, optionVal));
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
         option.value === yai.eventVars.questions[this.qid][dropdown.id] && `selected="selected"`
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
