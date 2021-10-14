var displayOptions = document.getElementById("display-options");
var sortableRank;

const Lobby = new (function () {
  this.hostId = "";
  this.totalQuestions = 0;
  this.answered = 0;

  this.currentQuestion = null;
  this.currentQid = 0;

  this.start = () => {
    if (!isHost) {
      $("#credits").addClass("hidden");
      findHost().then((host) => {
        this.hostId = host.participantId;
        if (yai.eventVars.isStartedFromLobby) yai.sendToUser(this.hostId, { imLate: true });
      });
    }

    sceneSwitcher("#lobby", false);
    this.renderWaitingRoom();
  };

  this.onIncomingMessage = (message) => {
    const content = message.content;
    const sender = message.senderId;

    if (content?.isStarted) {
      this.totalQuestions = content.totalQuestions;
    }

    if (canvas.hasClass("bg-gray-light")) {
      canvas.replaceClass("bg-gray-light", "bg-gradient-to-br from-indigo-500 to-indigo-900");
      if (!isHost) {
        $(".pl-username").text(username);
        $("#lobby-footer").removeClass("hidden");
      }
      bgLoopSound.play().then(bgLoopSound.bgm().loop().play());
    }

    if (isHost) {
      if (content?.iAnswered) {
        console.log(message);
        this.answered += 1;
        $("#answer-count").text(this.answered);
        questions[content.qid].answered = this.answered;
        this.updateChart(content);
        this.recordResponse(sender, content);
      } else if (content?.imLate && yai.eventVars.isStartedFromLobby) {
        yai.sendToUser(sender, {
          isStarted: true,
          totalQuestions: questions.length,
          nextQId: lobby.currentQid,
          nextQuestion: questions[lobby.currentQid],
        });
      }
    } else if (!isHost) {
      if (content?.nextQuestion) {
        this.currentQid = content.nextQId;
        this.currentQuestion = content.nextQuestion;
        this.renderQuestion(this.currentQuestion);
      } else if (content?.chartData) {
        if (
          this.currentQuestion.type == "qna" &&
          content.chartData.items.length > this.currentQuestion.data.items.length
        )
          bubbleSound.play();
        else bellSound.play();
        this.currentQuestion.data = content.chartData;
        this.updateChartOnParticipantLobby();
      }
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
    bgLoopSound.play().then(bgLoopSound.bgm().loop().play());
  };

  this.nextQuestion = () => {
    this.currentQid += 1;

    if (this.currentQid !== questions.length) {
      this.renderQuestion(questions[this.currentQid]);
      this.answered = 0;
      $("#answer-count").text(this.answered);
      yai.broadcast({ nextQId: this.currentQid, nextQuestion: questions[this.currentQid] });
    } else {
      $("#answered, #next-btn").addClass("hidden");
      $("#export-result-btn").removeClass("hidden");
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
    $("#review-answered").unhide();
    $("#review-answered span").text(questions[idx].answered || 0);

    if (questions[idx].type == "qna") {
      $("#review-answered").addClass("hidden");
      let qnaContainer = $(`#chart-${idx}`);
      let radio = qnaContainer.find("input[name='qna-filter']");
      let labels = qnaContainer.find("label");
      radio.change(function () {
        $("input[name='qna-filter']:checked").prop("checked", false);
        $(`#q-${lobby.currentQid}-${this.value}`).prop("checked", true);
        lobby.qnaFilter = this.value;
        labels.removeClass("btn-light px-6");
        $(`label[for=q-${lobby.currentQid}-qna-filter-${this.value}]`).addClass("btn-light px-6");
        lobby.renderQnAList(qnaContainer.find(".qna-items"), lobby.currentQid);
      });
      $(`label[for=q-${lobby.currentQid}-qna-filter-2]`).click();
    }
  };

  this.updateChart = (content) => {
    const { iAnswered: response, qid } = content;

    chart = charts[qid];
    q = questions[qid];
    type = q.type;

    switch (type) {
      case "poll":
        vote = parseInt(response);
        q.data[vote] += 1;
        chart.data.datasets[0].data[vote] += 1;
        yai.broadcast({ chartData: chart.data });
        chart.update();
        bellSound.play();
        break;

      case "wordcloud":
        for (res of response) {
          lowerCaseRes = res.toLowerCase();
          q.data[lowerCaseRes] = (q.data[lowerCaseRes] || 0) + 1;
        }
        words = Object.entries(q.data);
        wordsSorted = words.sort((a, b) => a[1] - b[1]);
        chart.data.labels = wordsSorted.map((w) => w[0]);
        chart.data.datasets[0].unscaled = wordsSorted.map((w) => w[1]);
        chart.data.datasets[0].data = wordCloudScaler(wordsSorted.map((w) => w[1]));
        yai.broadcast({ chartData: chart.data });
        chart.update();
        bellSound.play();
        break;

      case "open":
        chartContainer = $(`#chart-${qid}`);
        chartContainer.append(OpenEndedResponse(response));
        q.data.push(response);
        yai.broadcast({ chartData: q.data });
        chart.layout();
        bellSound.play();
        break;

      case "scales":
        for (i in response) {
          const res = parseInt(response[i]);
          if (res != 0) {
            sum = q.data[i].sum + res;
            count = q.data[i].count + 1;
            resCount = q.data[i][res] + 1;
            q.data[i] = { ...q.data[i], sum: sum, count: count, [res]: resCount };
            chart.data.datasets[0].data[i] = sum / count || 0;
          }
        }
        yai.broadcast({ chartData: chart.data });
        chart.update();
        bellSound.play();
        break;

      case "ranking":
        for (i in response) {
          const res = parseInt(response[i]);
          const origin = q.data.findIndex((d) => d.id == i);
          q.data[origin].data += res;
        }
        q.data.sort((a, b) => b.data - a.data);
        chart.data.labels = q.data.map((d) => d.opt);
        chart.data.datasets[0].data = q.data.map((d) => d.data);
        yai.broadcast({ chartData: chart.data });
        chart.update();
        bellSound.play();
        break;

      case "qna":
        chartContainer = $(`#chart-${qid} .qna-items`);

        if (response?.payload == "ASK") {
          // append new question
          q.data.items.push(response);
          bubbleSound.play();
        } else if (response?.payload == "UPVOTE") {
          // increment upvotes & sort list
          let item = q.data.items.find((item) => item.id == response.id);
          item.upvotes += 1;
          bellSound.play();
        } else if (response?.payload == "WITHDRAW") {
          q.data.items = q.data.items.filter((item) => item.id != response.id);
        }

        yai.broadcast({ chartData: q.data });
        this.renderQnAList(chartContainer, qid);
        break;
    }
  };

  this.updateChartOnParticipantLobby = () => {
    chart = charts[this.currentQid];

    if (type == "open") {
      chartContainer = $(`#chart-${this.currentQid}`);
      chartContainer.empty();
      for (response of this.currentQuestion.data) {
        if (response) chartContainer.append(OpenEndedResponse(response));
      }
      chart.layout();
    } else if (type == "qna") {
      chartContainer = $(`#chart-${this.currentQid} .qna-items`);
      this.renderQnAList(chartContainer, this.currentQid);
    } else {
      chart.data = this.currentQuestion.data;
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

  this.reorderRank = (oldIndex, newIndex) => {
    item = this.currentQuestion.options[oldIndex];
    this.currentQuestion.options.splice(oldIndex, 1);
    this.currentQuestion.options.splice(newIndex, 0, item);
    this.renderRankingInput();
  };

  this.recordResponse = (sender, content) => {
    q = questions[this.currentQid];
    type = q.type;
    pIndex = playerList.findIndex((p) => p.participantId == sender);

    switch (type) {
      case "poll":
        vote = q.options[content.iAnswered];
        content = { iAnswered: vote };
        break;

      case "scales":
        labels = q.options;
        res = labels.map((o, i) => `${o}: ${content.iAnswered[i]}`);
        content = { iAnswered: res };
        break;

      case "ranking":
        labels = q.data.map((o) => o.opt);
        ranked = Array.from({ length: labels.length });
        for (i in content.iAnswered) {
          const res = parseInt(content.iAnswered[i]);
          const origin = q.data.findIndex((d) => d.id == i);
          ranked[res - 1] = labels[origin];
        }
        content = { iAnswered: ranked.reverse() };
        break;
    }

    playerList[pIndex]["responses"] = { ...(playerList[pIndex]?.responses || {}), [this.currentQid]: content };
  };

  this.exportResults = () => {
    console.log("creating xlsx");
    var wb = XLSX.utils.book_new();
    wb.Props = {
      Title: "Quickpoll Results",
      Subject: "Test",
      Author: username,
      CreatedDate: new Date(),
    };
    wb.SheetNames.push("Results");
    wb.SheetNames.push("Participants");
    aoa_q = json_to_array_q(questions);
    aoa_p = json_to_array_p(playerList);
    var ws = XLSX.utils.aoa_to_sheet(aoa_q);
    var wsp = XLSX.utils.aoa_to_sheet(aoa_p);
    wb.Sheets["Results"] = ws;
    wb.Sheets["Participants"] = wsp;

    console.log("exporting for download");
    var wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
    saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), "quickpoll-results.xlsx");
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
      $("#answered").removeClass("hidden");
      this.renderChart(question);
    } else this.renderSurveyInput(question);
  };

  this.renderChart = (question) => {
    $("#chart-container").removeClass("hidden");
    let q = questions[this.currentQid];
    let type = question.type;
    switch (type) {
      case "poll":
        $("#chart-container").append(PollChart(question));
        q.data = new Array(question.options.length).fill(0);
        break;
      case "wordcloud":
        $("#chart-container").append(WordCloudChart());
        q.data = {};
        break;
      case "open":
        $("#chart-container").append(OpenEndedChart());
        container = `#chart-${this.currentQid}`;
        var masonry = new MiniMasonry({ container: container, ultimateGutter: 10 });
        charts[this.currentQid] = masonry;
        q.data = [];
        break;
      case "scales":
        $("#chart-container").append(ScalesChart(question));
        q.data = Array.from({ length: question.options.length }, () => ({
          sum: 0,
          count: 0,
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        }));
        break;
      case "ranking":
        $("#chart-container").append(RankingChart(question));
        q.data = Array.from({ length: question.options.length }, (_, i) => ({
          id: i,
          data: 0,
          opt: question.options[i],
        }));
        break;
      case "qna":
        $("#chart-container").append(QnAContainer());
        $("#answered").addClass("hidden");
        q.data = {
          pinned: "",
          items: new Array(),
        };
        break;
    }
  };

  this.renderChartOnParticipantLobby = () => {
    let question = this.currentQuestion;
    let type = question.type;
    $("#result-container").removeClass("hidden").empty();
    switch (type) {
      case "poll":
        $("#result-container").append(PollChart(question));
        break;
      case "wordcloud":
        $("#result-container").append(WordCloudChart());
        break;
      case "open":
        $("#result-container").append(OpenEndedChart());
        var container = `#chart-${this.currentQid}`;
        var masonry = new MiniMasonry({ container: container, ultimateGutter: 10 });
        charts[this.currentQid] = masonry;
        break;
      case "scales":
        $("#result-container").append(ScalesChart(question));
        break;
      case "ranking":
        $("#result-container").append(RankingChart(question));
        break;
      case "qna":
        $("#chart-container").append(QnAContainer());
        break;
    }
  };

  this.renderSurveyInput = (question) => {
    this.currentQuestion.data = [];
    type = question.type;
    options = question.options;
    sortableRank?.destroy();
    sortableRank = null;
    $("#input-container").removeClass("hidden");
    $("#display-options").empty();
    $(".rank-prompt").remove();
    $("#chart-container, #input-container label").addClass("hidden");
    $("#pl-submit-vote").unbind("click");
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
          $("#display-options label").removeClass().addClass("input-option");
          $(`#display-options label[for=q-${lobby.currentQid}-${this.value}]`).removeClass().addClass("input-active");
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
        sortableRank = Sortable.create(displayOptions, {
          fallbackTolerance: 5,
          animation: 150,
          swapThreshold: 0.8,
          onEnd: (evt) => lobby.reorderRank(evt.oldIndex, evt.newIndex),
        });
        $("#pl-submit-vote").one("click", () => this.rankingHandler());
        break;

      case "qna":
        $("#display-options").append(QnAInput());
        $("#pl-submit-vote").one("click", () => this.qnaAskHandler());
        this.currentQuestion.upvoted = [];
        this.currentQuestion.data = { pinned: "", items: [] };
        this.renderChartOnParticipantLobby();
        $("#chart-container").unhide();
        if (question.isAnonymous) $("#input-container label").removeClass("hidden");
        break;
    }
  };

  this.renderWaitingNextQuestion = () => {
    sceneSwitcher("#waiting-for-reveal", true);
    if (this.currentQid == this.totalQuestions - 1) {
      $("#pl-waiting-message").text("This is the end of the survey.");
      $("#pl-quit-btn").unhide();
    }
    this.renderChartOnParticipantLobby();
    this.updateChartOnParticipantLobby();
  };

  this.renderReviewSurvey = () => {
    sceneSwitcher("#review-survey");
    $("#question-cards").empty();
    $("#review-navigation").empty();
    let temp = $("#chart-container").replaceWith($("#review-charts"));
    $("#review-survey").append(temp);

    $("#chart-container").prepend(
      `<div id="review-question-q" class="text-xl font-bold text-white text-center mt-4"></div>
      <div id="review-answered" class="text-bold text-white mb-8">
        Answered <span></span><i class="fas fa-user ml-1"></i>
      </div>`
    );
    $("#chart-container").addClass("flex flex-col items-center justify-start");
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

  this.renderQnAList = (container, qid) => {
    container.empty();

    // Sorts and filters question items
    let data = isHost ? questions[qid].data : this.currentQuestion.data;
    let sortedItems;
    if (this.qnaFilter == 1)
      sortedItems = data.items
        .sort((a, b) => (a.time < b.time ? 1 : b.time < a.time ? -1 : 0))
        .filter((itm) => !itm.isAnswered);
    else if (this.qnaFilter == 2) sortedItems = data.items.filter((itm) => itm.isAnswered);
    else
      sortedItems = data.items
        .sort((a, b) => (a.upvotes < b.upvotes ? 1 : b.upvotes < a.upvotes ? -1 : 0))
        .filter((itm) => !itm.isAnswered);

    // Moves pinned item to top
    if (data.pinned) {
      pinnedItem = sortedItems.find((item) => item.id == data.pinned);
      sortedItems = sortedItems.filter((item) => item.id != data.pinned);
      sortedItems.unshift(pinnedItem);
    }

    // Display question items
    let isAnonymous = isHost ? questions[qid].isAnonymous : this.currentQuestion.isAnonymous;
    if (sortedItems.length == 0) container.append(QnAEmpty());
    else for (item of sortedItems) if (item) container.append(QnAItem(item, data.pinned == item.id, isAnonymous));

    // Updates question count
    $(`#chart-${qid} .qna-count`).text(sortedItems.length == 0 ? "No" : sortedItems.length);
    if (sortedItems.length == 1) $(`#chart-${qid} .qna-plural`).replaceClass("inline", "hidden");
    else $(`#chart-${qid} .qna-plural`).replaceClass("hidden", "inline");
  };
  this.qnaFilter = 0;

  // ----------------------------------------------------------------
  /* LOBBY HANDLERS */
  // ----------------------------------------------------------------

  this.pollHandler = () => {
    const vote = $(`input[name=q-${this.currentQid}]:checked`).val();
    yai.sendToUser(this.hostId, { iAnswered: vote, qid: this.currentQid });
    this.renderWaitingNextQuestion();
  };

  this.wordCloudResponseHandler = () => {
    wordEntered = Array.from($(`input[name=q-${lobby.currentQid}]`)).map((e) => e.value);
    console.log(wordEntered);
    wordIsValid = wordEntered.filter((w) => /\S/.test(w));
    console.log(wordIsValid);
    yai.sendToUser(this.hostId, { iAnswered: wordIsValid, qid: this.currentQid });
    this.renderWaitingNextQuestion();
  };

  this.openEndedResponseHandler = () => {
    response = $(`textarea[name=q-${this.currentQid}]`).val();
    console.log(response);
    if (/\S/.test(response)) yai.sendToUser(this.hostId, { iAnswered: response, qid: this.currentQid });
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
    yai.sendToUser(this.hostId, { iAnswered: responses, qid: this.currentQid });
    this.renderWaitingNextQuestion();
  };

  this.rankingHandler = () => {
    var rawResult = this.currentQuestion.options;
    var cleanResult = new Array(rawResult.length).fill(0);

    for (i in rawResult) {
      raw = rawResult[i];
      cleanResult[raw.id] = rawResult.length - i;
    }

    yai.sendToUser(this.hostId, { iAnswered: cleanResult, qid: this.currentQid });
    this.renderWaitingNextQuestion();
  };

  this.qnaAskHandler = () => {
    let askQuestion = $(`textarea[name=q-${this.currentQid}]`);
    let q = askQuestion.val();
    let id = yai.getCurrentParticipant().participantId + "-" + generateString(5);
    let response = {
      payload: "ASK",
      q: q,
      time: new Date(),
      id: id,
      upvotes: 0,
      isAnswered: false,
      asker: username,
      isAnonymous: $('input[name="pl-anon"]').prop("checked"),
    };
    console.log(response);
    if (/\S/.test(q)) yai.sendToUser(this.hostId, { iAnswered: response, qid: this.currentQid });
    askQuestion.val("");
    sleep(2000).then(() =>
      $("#pl-submit-vote").one("click", () => {
        lobby.qnaAskHandler();
      })
    );
  };

  this.qnaAnswerHandler = (id) => {
    let qid = this.currentQid;
    let chartContainer = $(`#chart-${qid} .qna-items`);
    let item = questions[qid].data.items.find((item) => item.id == id);
    item.isAnswered = true;
    yai.broadcast({ chartData: questions[qid].data });
    this.renderQnAList(chartContainer, qid);
  };

  this.qnaUpvoteHandler = (id) => {
    let response = { payload: "UPVOTE", id: id };
    this.currentQuestion.upvoted.push(id);
    yai.sendToUser(this.hostId, { iAnswered: response, qid: this.currentQid });
  };

  this.qnaWithdrawHandler = (id) => {
    let response = { payload: "WITHDRAW", id: id };
    this.currentQuestion.upvoted.filter((item) => item.id != id);
    yai.sendToUser(this.hostId, { iAnswered: response, qid: this.currentQid });
  };

  this.qnaPinHandler = (id) => {
    let qid = this.currentQid;
    let chartContainer = $(`#chart-${qid} .qna-items`);
    let q = questions[qid];
    if (q.data.pinned == id) q.data.pinned = "";
    else q.data.pinned = id;
    yai.broadcast({ chartData: questions[qid].data });
    this.renderQnAList(chartContainer, qid);
  };
})();
