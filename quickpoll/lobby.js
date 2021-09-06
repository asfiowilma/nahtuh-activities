const Lobby = new (function () {
  this.hostId = "";
  this.totalQuestions = 0;
  this.answered = 0;

  this.currentQuestion = null;
  this.currentQid = 0;

  this.start = () => {
    if (!isHost) {
      $("#credits").addClass("hidden");
      findHost().then((host) => (this.hostId = host.participantId));
    }

    sceneSwitcher("#lobby", false);
    this.renderWaitingRoom();
  };

  this.onIncomingMessage = (content) => {
    if (content.isStarted) {
      this.totalQuestions = content.totalQuestions;
      if (canvas.hasClass("bg-gray-light")) {
        canvas.replaceClass("bg-gray-light", "bg-gradient-to-br from-indigo-500 to-indigo-900");
        if (!isHost) {
          $(".pl-username").text(username);
          $("#lobby-footer").removeClass("hidden");
        }
      }
    }

    if (content?.iAnswered) {
      console.log(content);
      this.updateChart(content.iAnswered);
      this.answered += 1;
      $("#answer-count").text(this.answered);
    } else if (content?.nextQuestion && !isHost) {
      this.currentQid = content.nextQId;
      this.currentQuestion = content.nextQuestion;
      this.renderQuestion(this.currentQuestion);
    }
  };

  this.onLeave = () => {
    swal({ icon: "warning", text: "Are you sure you want to leave?", buttons: true }).then((value) => {
      if (value) yai.leaveEvent().then(() => history.back());
    });
  };

  // ----------------------------------------------------------------
  /* LOBBY UTILS */
  // ----------------------------------------------------------------

  this.startQuiz = () => {
    isStarted = true;
    yai.broadcast({
      isStarted: isStarted,
      totalQuestions: questions.length,
      nextQId: this.currentQid,
      nextQuestion: questions[this.currentQid],
    });
    canvas.replaceClass("bg-gray-light", "bg-gradient-to-br from-indigo-500 to-indigo-900");
    $("#lobby-header").removeClass("hidden");
    this.renderQuestion(questions[this.currentQid]);
  };

  this.nextQuestion = () => {
    this.currentQid += 1;

    if (this.currentQid !== questions.length) {
      yai.broadcast({ nextQId: this.currentQid, nextQuestion: questions[this.currentQid] });
      this.renderQuestion(questions[this.currentQid]);
      this.answered = 0;
      $("#answer-count").text(this.answered);
    } else {
      $("#answered, #next-btn").addClass("hidden");
      this.renderReviewSurvey();
    }
  };

  this.changeQuestionToReview = (idx) => {
    let old = this.currentQid;
    this.currentQid = idx;
    console.log(`changing from ${old} to ${idx}`);

    let oldCard = $(`.q-card:eq(${old + 1})`);
    let newCard = $(`.q-card:eq(${idx + 1})`);

    oldCard.replaceClass("bg-lollipop scale-105", "bg-indigo-300");
    newCard.replaceClass("bg-indigo-300", "bg-lollipop scale-105");

    $(`#chart-${old}`).addClass("hidden");
    $(`#chart-${idx}`).removeClass("hidden");
    $("#review-question-q").text(questions[idx].q);
    console.log(`${idx} should be unhidden`);
  };

  this.updateChart = (response) => {
    chart = charts[this.currentQid];
    q = questions[this.currentQid];
    type = q.type;

    switch (type) {
      case "poll":
        vote = parseInt(response);
        questions[this.currentQid].data[vote] += 1;
        chart.data.datasets[0].data[vote] += 1;
        chart.update();
        break;

      case "wordcloud":
        for (res of response) {
          lowerCaseRes = res.toLowerCase();
          questions[this.currentQid].data[lowerCaseRes] = (q.data[lowerCaseRes] || 0) + 1;
        }
        words = Object.entries(q.data);
        wordsSorted = words.sort((a, b) => a[1] - b[1]);
        chart.data.labels = wordsSorted.map((w) => w[0]);
        chart.data.datasets[0].unscaled = wordsSorted.map((w) => w[1]);
        chart.data.datasets[0].data = wordCloudScaler(wordsSorted.map((w) => w[1]));
        chart.update();
        break;

      case "open":
        chartContainer = $(`#chart-${this.currentQid}`);
        chartContainer.append(OpenEndedResponse(response));
        chart.layout();
        break;

      case "scales":
        for (i in response) {
          const res = parseInt(response[i]);
          if (res != 0) {
            sum = q.data[i].sum + res;
            count = q.data[i].count + 1;
            questions[this.currentQid].data[i] = { sum: sum, count: count };
            chart.data.datasets[0].data[i] = sum / count || 0;
          }
        }
        chart.update();

      case "ranking":
        for (i in response) {
          const res = parseInt(response[i]);
          const origin = q.data.findIndex((d) => d.id == i);
          questions[this.currentQid].data[origin].data += res;
        }
        questions[this.currentQid].data.sort((a, b) => b.data - a.data);
        chart.data.labels = q.data.map((d) => d.opt);
        chart.data.datasets[0].data = q.data.map((d) => d.data);
        chart.update();
    }
  };

  this.rankUp = (i) => {
    var temp = this.currentQuestion.options[i];
    this.currentQuestion.options[i] = this.currentQuestion.options[i - 1];
    this.currentQuestion.options[i - 1] = temp;
    console.log("ranking up");
    this.renderRankingInput();
  };

  this.rankDown = (i) => {
    var temp = this.currentQuestion.options[i];
    this.currentQuestion.options[i] = this.currentQuestion.options[i + 1];
    this.currentQuestion.options[i + 1] = temp;
    console.log("ranking down");
    this.renderRankingInput();
  };

  // ----------------------------------------------------------------
  /* LOBBY RENDERS */
  // ----------------------------------------------------------------

  this.renderWaitingRoom = () => {
    sceneSwitcher("#waiting-for-players");
    $("#waiting-for-players").append(`<lobby-component id="waiting-room"></lobby-component>`);

    var waitingRoom = document.getElementById("waiting-room");
    waitingRoom.eventId = eventId;
    if (isHost) waitingRoom.onStart = this.startQuiz;
    waitingRoom.leaveEvent = () => location.reload();

    // customize colors
    waitingRoom.colorPrimary = "#6366F1";
    waitingRoom.colorSecondary = "#4338CA";
  };

  this.renderQuestion = (question) => {
    sceneSwitcher("#question-display");
    $("#display-question-q").text(question.q);
    $("#question-count").text(`Question ${this.currentQid + 1}/${questions?.length || this.totalQuestions}`);

    if (isHost) {
      this.renderChart(question);
      $("#answered").removeClass("hidden");
    } else this.renderSurveyInput(question);
  };

  this.renderChart = (question) => {
    $("#chart-container").removeClass("hidden");
    type = question.type;
    switch (type) {
      case "poll":
        $("#chart-container").append(PollChart(question));
        questions[this.currentQid].data = new Array(question.options.length).fill(0);
        break;
      case "wordcloud":
        $("#chart-container").append(WordCloudChart());
        questions[this.currentQid].data = {};
        break;
      case "open":
        $("#chart-container").append(OpenEndedChart());
        container = `#chart-${this.currentQid}`;
        var masonry = new MiniMasonry({ container: container, ultimateGutter: 10 });
        charts[this.currentQid] = masonry;
        break;
      case "scales":
        $("#chart-container").append(ScalesChart(question));
        questions[this.currentQid].data = Array.from({ length: question.options.length }, () => ({
          sum: 0,
          count: 0,
        }));
        break;
      case "ranking":
        $("#chart-container").append(RankingChart(question));
        questions[this.currentQid].data = Array.from({ length: question.options.length }, (_, i) => ({
          id: i,
          data: 0,
          opt: question.options[i],
        }));
        break;
    }
  };

  this.renderSurveyInput = (question) => {
    type = question.type;
    options = question.options;
    $("#input-container").removeClass("hidden");
    $("#display-options").empty();
    $(".rank-prompt").remove();
    switch (type) {
      case "poll":
        if (options.length > 6) $("#display-options").replaceClass("grid-cols-1", "grid-cols-2");
        else $("#display-options").replaceClass("grid-cols-2", "grid-cols-1");
        for (let i = 0; i < options.length; i++) {
          $("#display-options").append(PollInput(options[i], i));
        }
        $(`input[name=q-${this.currentQid}]`).change(function () {
          console.log(`changing value to ${this.value}`);
          $(`input[name=q-${this.currentQid}]:checked`).prop("checked", false);
          $(`#q-${this.currentQid}-${this.value}`).prop("checked", true);
          $("#display-options label").removeClass().addClass("flex-1 input-option");
          $(`#display-options label[for=q-${lobby.currentQid}-${this.value}]`).removeClass().addClass("input-active");
          styleComponents();
        });
        $("#pl-submit-vote").one("click", () => this.pollHandler());
        break;

      case "wordcloud":
        $("#display-options").replaceClass("grid-cols-2", "grid-cols-1");
        $("#display-options").append(WordCloudInput());
        $("#pl-submit-vote").one("click", () => this.wordCloudResponseHandler());
        break;

      case "open":
        $("#display-options").replaceClass("grid-cols-2", "grid-cols-1");
        $("#display-options").append(OpenEndedInput());
        $("#pl-submit-vote").one("click", () => this.openEndedResponseHandler());
        break;

      case "scales":
        for (let i = 0; i < options.length; i++) {
          $("#display-options").append(ScalesInput(options[i], i, question.label));
        }
        if (question.skippable) $(".scale-skip").not(":eq(0)").removeClass("hidden");
        $("#pl-submit-vote").one("click", () => this.scalesHandler());
        break;

      case "ranking":
        $("#input-container").prepend("<div class='rank-prompt'>Rank these items in the order you prefer.</div>");
        this.currentQuestion.options = Array.from({ length: options.length }, (_, i) => ({
          id: i,
          opt: this.currentQuestion.options[i],
        }));
        this.renderRankingInput();
        $("#pl-submit-vote").one("click", () => this.rankingHandler());
    }
  };

  this.renderWaitingNextQuestion = () => {
    sceneSwitcher("#waiting-for-reveal", true);
    if (this.currentQid == this.totalQuestions - 1) $("#pl-waiting-message").text("This is the end of the survey.");
  };

  this.renderReviewSurvey = () => {
    sceneSwitcher("#review-survey");
    $("#question-cards").empty();
    $("#review-navigation").empty();
    temp = $("#chart-container").replaceWith($("#review-charts"));
    $("#review-survey").append(temp);

    $("#chart-container").prepend(
      `<div id="review-question-q" class="text-xl font-bold text-white text-center mb-8"></div>`
    );
    $("#chart-container").addClass("flex flex-col items-center justify-center");
    this.currentQid = 0;
    for (let i = 0; i < questions.length; i++) {
      qCard = QuestionCard(i, questions[i]);
      qCard.unbind("click").click(() => this.changeQuestionToReview(i));
      $("#review-navigation").append(qCard);
      this.changeQuestionToReview(i);
    }
  };

  this.renderRankingInput = () => {
    var options = this.currentQuestion.options;
    $("#display-options").empty();
    for (i in options) {
      $("#display-options").append(RankingInput(options[i].opt, options[i].id, parseInt(i), i == options.length - 1));
    }
  };

  // ----------------------------------------------------------------
  /* LOBBY HANDLERS */
  // ----------------------------------------------------------------

  this.pollHandler = () => {
    const vote = $(`input[name=q-${this.currentQid}]:checked`).val();
    yai.sendToUser(this.hostId, { iAnswered: vote });
    this.renderWaitingNextQuestion();
  };

  this.wordCloudResponseHandler = () => {
    wordEntered = Array.from($(`input[name=q-${lobby.currentQid}]`)).map((e) => e.value);
    console.log(wordEntered);
    wordIsValid = wordEntered.filter((w) => /\S/.test(w));
    console.log(wordIsValid);
    yai.sendToUser(this.hostId, { iAnswered: wordIsValid });
    this.renderWaitingNextQuestion();
  };

  this.openEndedResponseHandler = () => {
    response = $(`textarea[name=q-${this.currentQid}]`).val();
    console.log(response);
    if (/\S/.test(response)) yai.sendToUser(this.hostId, { iAnswered: response });
    this.renderWaitingNextQuestion();
  };

  this.scalesHandler = () => {
    let responses = [];
    $(`input[name=q-${lobby.currentQid}]`).each(function () {
      let e = $(this);
      if (e.attr("skip") == "true") responses.push(0);
      else responses.push(e.val());
    });
    console.log(responses);
    yai.sendToUser(this.hostId, { iAnswered: responses });
    this.renderWaitingNextQuestion();
  };

  this.rankingHandler = () => {
    var rawResult = this.currentQuestion.options;
    var cleanResult = new Array(rawResult.length).fill(0);

    for (i in rawResult) {
      raw = rawResult[i];
      cleanResult[raw.id] = rawResult.length - i;
    }

    yai.sendToUser(this.hostId, { iAnswered: cleanResult });
    this.renderWaitingNextQuestion();
  };
})();

/* 
max = 32px

*/

// myChart = new Chart(ctx, {
//   type: "wordCloud",
//   data: {
//     // text
//     labels: ["Hello", "world", "normally", "you", "want", "more", "words", "than", "this"],
//     datasets: [
//       {
//         label: "Response(s)",
//         // size in pixel
//         data: [90, 80, 70, 60, 50, 40, 30, 20, 10],
//         color: ["white", "rosybrown", "burlywood", "bisque"],
//       },
//     ],
//   },
//   options: {
//     plugins: {
//       legend: {
//         display: false,
//       },
//     },
//   },
// });
// var myChart = new Chart(ctx, {
//   type: "bar",
//   data: {
//     labels: [
//       "Red",
//       "Blue",
//       "Yellow",
//       "GreenGreenGreenGreen",
//       "Purple",
//       "Orange",
//       "Red",
//       "Blue",
//       "Yellow",
//       "Green",
//       "Purple",
//       "Orange",
//     ],
//     datasets: [
//       {
//         label: "Votes",
//         data: [12, 19, 3, 5, 2, 3, 12, 19, 3, 5, 2, 3],
//         backgroundColor: "rgba(255, 99, 132, 1)",
//         borderColor: "rgba(255, 99, 132, 1)",
//       },
//     ],
//   },
//   options: {
//     plugins: {
//       legend: {
//         display: false,
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         display: false,
//       },
//       x: {
//         ticks: {
//           color: "white",
//         },
//         grid: { display: false },
//       },
//     },
//   },
// });
