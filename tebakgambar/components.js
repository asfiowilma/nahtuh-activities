// ============================================================
// Components
// ============================================================

const Button = (type, text, onclick, style) => {
  let color, tColor, hover;
  switch (type) {
    case "primary":
      color = "bg-blue-500";
      tColor = "white";
      hover = "bg-blue-400";
      break;
    case "primary-outline":
      color = "border border-blue-500";
      tColor = "blue-500";
      hover = "bg-blue-400 hover:text-white";
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

const OptionInput = (qid, idx, option) => {
  /* qid = question id, idx = option index, b = boolean correctness, v = option value */
  return `<div class="options flex items-center">
    <input
      type="radio"
      id="q-${qid}-o-${idx}-b"
      ${option.b && "checked"}
      name="isCorrect"
      class="form-radio h-6 w-6 mr-2 text-blue-600"
    /><input
      type="text"
      id="q-${qid}-o-${idx}-v"
      placeholder="Option ${idx + 1}"
      value="${option.v}"
      class="w-100 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    />
  </div>`;
};

const AnswerInput = (value, idx, isLast) => {
  return `
  <div class="flex items-center">
  <input id="answer-${
    HostPanel.qid
  }-${idx}" type="text" placeholder="Enter correct answer" class="options w-100 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" onchange="HostPanel.changeAnswer(${idx})" value="${value}">
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

const OptionGrid = (type) => {
  return `<div id="option-grid" class="grid ${
    type === "SA" ? "grid-cols-1" : "grid-rows-4 md:grid-rows-none md:grid-cols-2"
  } gap-4"></div>`;
};

const Dropzone = (img) => {
  return `
  <div class="bg-white mb-4">
    <div class="max-w-md mx-auto rounded-lg overflow-hidden md:max-w-xl">
      <div class="md:flex">
        <div class="w-full md:p-3">
          <div class="
                  relative
                  border-dotted
                  h-80
                  rounded-lg
                  border-dashed border-2 border-blue-600
                  bg-gray-100
                  p-2
                ">
            <div x-data="imageViewer(${img})" class="relative w-full h-full flex justify-center items-center">
              <!-- Show the image -->
              <template x-if="imageUrl">
                <div class="relative rounded-lg h-full w-full"><img :src="imageUrl" class="object-contain w-full h-full" />
                ${Button(
                  "danger",
                  '<i class="fa fa-trash"></i>',
                  "HostPanel.deleteImage()",
                  "absolute bottom-2 right-2 z-20"
                )}</div>
              </template>

              <!-- Show the gray box when image is not available -->
              <template x-if="!imageUrl">
                <div class="flex flex-col items-center">
                  <i class="fa fa-image fa-4x text-gray-400"></i>
                  <span class="block text-gray-400 font-normal">Drag and drop image or</span>
                  ${Button("primary-outline", "Choose file", "", "mt-4")}
                </div>
              </template>
              <!-- Image file selector -->
              <!-- <input class="mt-2" type="file" accept="image/*" @change="fileChosen" /> -->
              <input type="file" class="h-full w-full opacity-0 absolute top-0 z-10 cursor-pointer" accept="image/*"
                @change="fileChosen" name="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;
};

ProgressBar = (duration) => {
  return `
  <div id="progressBar" class="absolute top-4 w-full px-4 md:px-8 lg:px-16">
    <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-white container mx-auto">
      <div class="shadow-none flex flex-col text-center whitespace-nowrap text-blue-900 justify-center bg-blue-500" style="animation: progressbar-countdown; animation-duration: ${duration}s;"></div>
    </div>
  </div>
  `;
};

OptionButton = (option, reveal = false, isHost = false, answer = null) => {
  var optionBtn = $(`
    <div class="w-full text-black bg-white ${reveal && option.b ? "bg-green-400 text-white" : ""} ${
    reveal && !option.b ? "scale-90" : ""
  } ${
    reveal && answer && !answer.b && option.v === answer.v ? "bg-blue-900 text-white" : ""
  } rounded-lg shadow px-4 py-6 cursor-pointer hover:bg-blue-50 transform transition ${
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

const Tooltip = (icon, text, style = "") => {
  return `
    <span class="has-tooltip">${icon}</i></i>
      <div class="tooltip w-56 relative ${style}">
      <div class="bg-black text-white text-xs rounded py-1 px-4 right-0 bottom-full">${text}
        <svg class="absolute text-black h-2 right-0 mr-3 top-full" x="0px" y="0px" viewBox="0 0 255 255" xml:space="preserve"><polygon class="fill-current" points="0,0 127.5,127.5 255,0"/></svg>    
      </div>
    </div></span>
  `;
};
