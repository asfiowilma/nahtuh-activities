// ============================================================
// Components
// ============================================================

Button = (type, text, onclick, style) => {
  let color, tColor, hover;
  switch (type) {
    case "primary":
      color = "bg-green-500";
      tColor = "white";
      hover = "bg-green-400";
      break;
    case "primary-outline":
      color = "border border-green-500";
      tColor = "green-500";
      hover = "bg-green-400 hover:text-white";
      break;
    case "secondary":
      color = "bg-gray-500";
      tColor = "white";
      hover = "bg-gray-300";
      break;
    case "secondary-outline":
      color = "border border-gray-500";
      tColor = "gray-500";
      hover = "bg-gray-300";
      break;
    case "light":
      color = "bg-white";
      tColor = "black";
      hover = "bg-gray-100";
      break;
    case "light-outline":
      color = "border border-white";
      tColor = "white";
      hover = "bg-gray-100 hover:text-black";
      break;
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

InputStyle =
  "w-full shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline";

OptionInput = (qid, idx, option) => {
  /* qid = question id, idx = option index, b = boolean correctness, v = option value */
  return `<div class="options flex items-center">
    <input
      type="radio"
      id="q-${qid}-o-${idx}-b"
      ${option.b && "checked"}
      name="isCorrect"
      class="form-radio h-6 w-6 mr-2 text-green-600"
    /><input
      type="text"
      id="q-${qid}-o-${idx}-v"
      placeholder="Option ${idx + 1}"
      value="${option.v}"
      class="${InputStyle}"
    />
  </div>`;
};

AnswerInput = (value, idx, isLast) => {
  return `
  <div class="flex items-center">
  <input id="answer-${
    HostPanel.qid
  }-${idx}" type="text" placeholder="Enter correct answer" class="options ${InputStyle}" onchange="HostPanel.changeAnswer(${idx})" value="${value}">
  ${Button(
    "danger",
    '<i class="fa fa-trash"></i>',
    `HostPanel.deleteAnswer(${idx})`,
    `ml-2 ${idx === 0 ? "hidden" : "visible"}`
  )}
  ${Button(
    "secondary",
    '<i class="fa fa-plus"></i>',
    "HostPanel.addAnswer()",
    `ml-2 ${isLast ? "visible" : "invisible"}`
  )}
  </div>
  `;
};

OptionGrid = (type) => {
  return `<div id="option-grid" class="grid ${
    ["SA", "MV", "TTS"].includes(type)
      ? "grid-cols-1"
      : "grid-rows-4 md:grid-rows-none md:grid-cols-2"
  } gap-4"></div>`;
};

MediaInput = (type, question) => {
  voices = speechSynthesis.getVoices();
  switch (type) {
    case "MV":
      src = question.media.video ? `https://www.youtube.com/embed/${question.media.video}` : "";
      return `
      <div class="my-4 w-full lg:w-3/4 mx-auto">
        <div class="flex">
          <input type="text" id="videoId" placeholder="Paste youtube video URL here" class="w-100 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
          ${Button(
            "secondary",
            "Submit",
            "HostPanel.saveMusicVideo()",
            "ml-2 flex items-center justify-center"
          )}
        </div>
        <iframe id="embedVideo" class="w-full h-80 mt-4 rounded-lg bg-gray-100"
          src="${src}">
        </iframe>
        <div id="mvSettings" class="grid grid-cols-2 md:grid-cols-3 mt-2 gap-2"></div>
      </div>
      `;
    case "TTS":
      var voices = speechSynthesis.getVoices();
      return `
      <div class="my-4 w-full grid gap-2 grid-cols-1 md:grid-cols-2">
        <div class="flex flex-col">
          <div class="text-gray-700">Turn lyrics into an auto-generated audio.</div>
          <textarea id="lyrics" placeholder="Paste song lyrics here" class="w-full my-2 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:shadow-outline" rows="4">${
            question.media.audio ? question.media.audio : ""
          }</textarea>
          <div class="flex items-center">
            ${Button(
              "secondary-outline",
              `<i class="fas fa-play mr-2"></i><span class="small">Play</span>`,
              "HostPanel.togglePlay()",
              'rounded-full flex items-center justify-center w-full" id="playButton"'
            )}
          </div>
          </div>
        <div class="flex flex-col bg-gray-50 px-4 py-2 rounded-lg">
          <div class="text-sm">This is only a preview, as your participants will choose their preferred voice before the quiz starts.</div>
          <div class="flex items-center mb-4">
            <div class="voices flex flex-col align-stretch w-full rounded">
              <label for="voices">Voice:</label>
              <div class="inline-block relative">
                <select
                  name="voices"
                  id="voices"
                  class="appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                >
                ${voices
                  .map(
                    (option, idx) => `
                <option ${
                  idx == question.media.voice && `selected="selected"`
                } value="${idx}" >${option.name}</option>
                `
                  )
                  .join("")}
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <i class="fas fa-chevron-down text-gray-500"></i>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-between flex-wrap mb-3">
            <label for="rate" class="flex-1">Speech Rate:</label><span id="rateLabel">1</span>
            <input id="rate" class="rounded-lg overflow-hidden appearance-none bg-gray-200 h-3 w-full" type="range" min="0.5" max="2" step="0.1" value="1" />
          </div>
          <div class="flex items-between flex-wrap">
            <label for="pitch" class="flex-1">Pitch:</label><span id="pitchLabel">1</span>
            <input id="pitch" class="rounded-lg overflow-hidden appearance-none bg-gray-200 h-3 w-full" type="range" min="0" max="2" step="0.1" value="1" />
          </div>   
                 
        </div>
      </div>
      `;
  }
};

MVSettings = (question) => {
  return `
  <div class="flex items-center relative">
    <span class="whitespace-nowrap">Start at</span>
    <span class="mx-2 relative">${Tooltip(
      '<i class="fas fa-question-circle text-gray-300"></i>',
      "Where the video should start playing from. Fill with number of seconds from the beginning of the video.",
      "w-60 -top-14 -right-2"
    )}</span>
    <input id="mv-start" type="number" placeholder="0" min="0" max="${length}" value="${
    question.media.startAt || ""
  }" class="${InputStyle}">
  </div>
  <div class="flex items-center">
    <span>Duration</span>
    <span class="relative mx-2">${Tooltip(
      '<i class="fas fa-question-circle text-gray-300"></i>',
      "How long the video hint should play",
      "-top-6 -right-2"
    )}</span>
    <input id="mv-playDuration" type="number" placeholder="10" min="1" max="30" value="${
      question.media.duration || ""
    }" class="${InputStyle}">
  </div>
`;
};

ProgressBar = (duration) => {
  return `
  <div id="progressBar" class="absolute top-4 w-full px-4 md:px-8 lg:px-16">
    <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-white container mx-auto">
      <div class="shadow-none flex flex-col text-center whitespace-nowrap text-green-900 justify-center bg-green-500" style="animation: progressbar-countdown; animation-duration: ${duration}s;"></div>
    </div>
  </div>
  `;
};

OptionButton = (option, reveal = false, isHost = false, answer = null) => {
  var optionBtn = $(`
    <div class="w-full text-black bg-white ${reveal && option.b ? "bg-green-400 text-white" : ""} ${
    reveal && !option.b ? "scale-90" : ""
  } ${
    reveal && answer && !answer.b && option.v === answer.v ? "bg-green-900 text-white" : ""
  } rounded-lg shadow px-4 py-6 cursor-pointer hover:bg-green-50 transform transition ${
    !reveal && !isHost ? "hover:scale-105" : ""
  } ease-in-out text-center">
      ${option.v}
    </div>
  `);
  if (!isHost)
    optionBtn.one("click", function () {
      MainScene.answerHandler(option);
    });
  return optionBtn;
};

Tooltip = (icon, text, style = "") => {
  return `
    <span class="has-tooltip">${icon}
      <div class="tooltip w-56 relative ${style}">
        <div class="bg-black text-white text-xs rounded py-1 px-4 right-0 bottom-full">${text}
          <svg class="absolute text-black h-2 right-0 mr-3 top-full" x="0px" y="0px" viewBox="0 0 255 255" xml:space="preserve"><polygon class="fill-current" points="0,0 127.5,127.5 255,0"/></svg>    
        </div>
      </div>
    </span>
  `;
};

Toggle = (id, toggleFunct, label) => {
  toggle = $(`
  <div class="flex items-center mx-2 cursor-pointer">
    <div id="${id}" class="w-9 h-6 flex items-center p-1 rounded-full transform duration-300 ease-in-out bg-gray-300">
      <div class="bg-white w-4 h-4 rounded-full shadow-md duration-300 ease-in-out transform"></div>
    </div>
    <span class="ml-2">${label}</span>
  </div>
  `);
  toggle.click(() => toggleActive(id, toggleFunct));
  return toggle;
};

toggleActive = (id, toggle) => {
  $("#" + id).toggleClass("bg-green-400");
  $("#" + id)
    .children()
    .first()
    .toggleClass("translate-x-3");
  toggle();
};
