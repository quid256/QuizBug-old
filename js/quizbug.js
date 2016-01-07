function choose(l) {
	return l[Math.floor(Math.random() * l.length)];
}

$(function() {
	var saveData = (function () {
		var a = document.createElement("a");
		document.body.appendChild(a);
		a.style = "display: none";
		return function (data, fileName) {
			a.href = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(data)));
			a.download = fileName;
			a.click()
			//window.URL.revokeObjectURL(url);
		};
	}());
	var questionArray = [];
	var currentQuestion;
	var prevSelection = null;
	var readerState = "READING";
	var wordsToBeRead = [];
	var readerInterval = null;

	var wordSpeed = 200;

	function updateQuestion(callback) {
		arrSize = questionArray.length;
		if (arrSize == 0) {
			callback(arrSize);
			currnetQuestion = null;
		} else {
			currentQuestion = choose(questionArray);
			actuateQuestion(callback, arrSize);
		}
	}

	function actuateQuestion(callback, arrSize) {
		readerState = "READING";
		var $qspan = $("#questiontext div#qtextcont").html(currentQuestion);
		var descrBar = $qspan.find("p:first-child").html()
		var barArray = descrBar.replace(/<span.+?>.*?<\/span>/g, "")
			.replace(/<.?b>/g, "").split(" | ");
		$qspan.find("p:first-child").html("<b>" + barArray[2] + " " + barArray[1] + " | " + barArray[5] + " - " + (barArray[6] ? barArray[6] : "None") + "</b><span class='floatright'>(" + questionArray.length + " questions total)</span>");
		$qspan.find("p:last-child").hide();
		$qspan.find("p:nth-child(2)").html(
			$qspan.find("p:nth-child(2)").html().replace(/<em>.+?<\/em>/g, "")
			);
		wordsToBeRead = $("p:nth-child(2)").text().split(" ").slice(1)
		$("p:nth-child(2)").html("");

		clearInterval(readerInterval);

		readerInterval = setInterval(function() {
			var nextWord = wordsToBeRead.shift();
			if (nextWord)
				$("p:nth-child(2)").get(0).innerHTML += nextWord + " ";
			else
				$.event.trigger({type: "keypress", which: 32});
		}, wordSpeed);
		readerState = "READING";
		callback(arrSize);
	}

	function downloadNewDatabase(formdata, callback) {
		$.ajax({
			url: "/php/searchDatabase.php",
			data: {
				limit: "yes",
				info: formdata.questionQuery,
				categ: formdata.optionCategory,
				sub: formdata.optionSubcategory,
				stype: formdata.optionSType,
				qtype: "Tossups",
				difficulty: formdata.optionDifficulty,
				tournamentyear: formdata.optionTournament
			},
			success: function(data) {
				questionArray = questionArray.concat(data.replace(/\s+/g, " ").split("<hr>").slice(1, -2));
				$.ajax({
					url: "/php/searchDatabase.php",
					data: {
						limit: "no",
						info: formdata.questionQuery,
						categ: formdata.optionCategory,
						sub: formdata.optionSubcategory,
						stype: formdata.optionSType,
						qtype: "Tossups",
						difficulty: formdata.optionDifficulty,
						tournamentyear: formdata.optionTournament
					},
					success: function(data) {
						questionArray = questionArray.concat(data.replace(/\s+/g, " ").split("<hr>").slice(0, -1));
						callback();
					}
				});
			}
		});
	}

	function getDatabases(startI, callback) {
		var filterElems = $("table.filterarea > tbody > tr > td")
		if (startI >= filterElems.length) {
			updateQuestion(callback);
			return;
		}
		var curNode = filterElems.get(startI);
		downloadNewDatabase({
			questionQuery: 		$(curNode).find("> table.filter .questionquery").val(),
			optionCategory: 	$(curNode).find("> table.filter .optionCategory").val(),
			optionSubcategory: 	$(curNode).find("> table.filter .optionSubcategory").val(),
			optionSType: 		$(curNode).find("> table.filter .optionSType").val(),
			optionDifficulty: 	$(curNode).find("> table.filter .optionDifficulty").val(),
			optionTournament:   $(curNode).find("> table.filter .optionTournament").val()
		}, getDatabases.bind(null, startI + 1, callback));
	}


	$("#newquestion").click(function() {
		updateQuestion(function() {});
		readerState = "READING";
	});
	$("#annotate").click(function() {
		var selectedTextObj = window.getSelection().getRangeAt(0);
		var selectedText = selectedTextObj.startContainer.data
		var startWordSel = selectedTextObj.startOffset;
		while (selectedText.slice(startWordSel, startWordSel + 1) != " " && startWordSel > -1) {
			startWordSel--;
		}; startWordSel++;
		var endWordSel = selectedTextObj.endOffset;
		while (" ,.!?".indexOf(selectedText.slice(endWordSel, endWordSel + 1)) == -1 && endWordSel < selectedText.length) {
			endWordSel++;
		};

		var modSelectedText = selectedText.slice(startWordSel, endWordSel);
		if (window.getSelection().toString().length > 0) {
			var answerLine = $("#questiontext div#qtextcont div div p:last").html().slice("<em><strong>ANSWER:</strong></em> ".length);
			$("textarea").get(0).value += modSelectedText + "\t" + answerLine + "\n";
		}
	});

	$("#select").click(function() {
		$("#changebankform").show();
		$("#overlay").fadeIn();
		prevSelection = $(".filterarea").html();
	});

	function attachFilterListeners(cba) {
		var numLoaded = 0;
		cba = cba || function() {};

		var ldCounter = function() {
			numLoaded++;
			if (numLoaded == 2) {
				cba();
			}
		}

		var changeOptionCategory = function(cb, e) {
			console.log("hi");
			$.get("/php/loadSubcategories.php", {
				category: $(e.target).val()
			}, function(data) {
				$(e.target).parents(".filter").find(".optionSubcategory").html(data.replace(/<.?select.+?>/g, ""));
				cb();
			});
		}

		$(".filterarea .filter:last .optionCategory").change(changeOptionCategory.bind(null, function(){}));

		var changeOptionDifficulty = function(cb, e) {
			console.log("HI",$(e.target).val());
			$.get("/php/loadTournaments.php", {
				qtype: "Tossups",
				difficulty: $(e.target).val()
			}, function(data) {
				console.log("Difficulty Change");
				console.log($(e.target));
				$(e.target).parents(".filter").find(".optionTournament").html(data.replace(/<.?select.+?>/g, ""));
				cb();
			});
		}

		$(".filterarea .filter:last-child .optionDifficulty").change(changeOptionDifficulty.bind(null, function(){}));

		changeOptionDifficulty(ldCounter, { target: $(".filterarea .filter:last .optionDifficulty")[0] });
		changeOptionCategory(ldCounter, { target: $(".filterarea .filter:last .optionCategory")[0] });

		$(".filterarea .filter:last .delete").click(function(e) {
			var $sender = $(e.target);

			$sender.parents(".filter").fadeOut("fast", function() {
				$sender.parents(".filter").parent().remove();
				if ($("table.filterarea > tbody > tr > td").length == 1) {
					$(".filterarea > tbody > tr > td button.delete").prop("disabled", true);
				}
			})

			this.blur();

		});

	}
	$("#dialog_changebank").click(function() {
		if ($("table.filterarea > tbody > tr > td").length > 0) {
			$("#changebankform").hide();
			$("#loadingform").show();

			questionArray = [];
			getDatabases(0, function(arrSize) {
				if (arrSize == 0) {
					$("#emptyMsg").show().delay(2 * 1000).fadeOut("slow");

					$("#loadingform").hide();
					$("#changebankform").show();
				} else {
					$("#overlay").fadeOut(function() {
						$("#loadingform").hide();
					});
				}
			});

			prevSelection = null;
		}
	});
	$("#dialog_cancel").click(function() {
		$("#overlay").fadeOut(function() {
			$("#changebankform").hide();
			$(".filterarea").html(prevSelection);
			prevSelection = null;
		});

	});

	$("#dialog_addsearch").click(function() {

		if ($("table.filterarea > tbody > tr > td").length < 5) {
			if ($("table.filterarea > tbody > tr > td").length == 1) {
				$("table.filterarea > tbody > tr > td button.delete").prop("disabled", false);
			}
			$("<td>").appendTo("table.filterarea > tbody > tr")
			$("#changebankform > table.filter").clone().appendTo("table.filterarea > tbody > tr > td:last-child").fadeIn();

			attachFilterListeners();
		}
	});

	$(window).keypress(function(ev) {
		if (ev.which == 32) { // Space
			if (readerState == "READING") {
				clearInterval(readerInterval);
				$("#questiontext #qtextcont p:nth-child(2)").get(0).innerHTML += "(#) "
				$("span#msg").html("<em>Press [Space] to see the answer</em>")
				readerState = "WAITING";
			} else if (readerState == "WAITING") {
				$("#questiontext #qtextcont p:nth-child(2)").get(0).innerHTML += wordsToBeRead.join(" ");
				$("#questiontext #qtextcont p:last-child").show();
				$("span#msg").html("<em>Press [Space] for the next question</em>")
				readerState = "SHOWING";
			} else if (readerState == "SHOWING") {
				$("#newquestion").click();
				$("span#msg").html("<em>Press [Space] to buzz</em>")
				readerState = "READING";
			}
		} else if (ev.which == 99) { // C
			$("#annotate").click();
		} else if (ev.which == 110) { // N
			$("#newquestion").click();
			readerState = "READING";
		}
	});

	$("textarea").keypress(function(e) {
	  var $this, end, start;
	  if (e.keyCode === 9) {
	    start = this.selectionStart;
	    end = this.selectionEnd;
	    $this = $(this);
	    $this.val($this.val().substring(0, start) + "\t" + $this.val().substring(end));
	    this.selectionStart = this.selectionEnd = start + 1;
	    return false;
	  }
	  e.originalEvent.stopPropagation();
	});

	$("#changebankform").hide();
	$("#helpform").hide();
	$("#overlay").fadeIn();

	$("#download").click(function() {
		saveData($("textarea").val(), "flashcards.txt");
		this.blur();
	});

	$("input[type=range]").change(function(e) {
		var curVal = $(e.target).val();
		wordSpeed = (50 + (100 - curVal) * 3);

		if (readerState == "READING") {
			clearInterval(readerInterval);

			readerInterval = setInterval(function() {
				var nextWord = wordsToBeRead.shift();
				if (nextWord)
					$("p:nth-child(2)").get(0).innerHTML += nextWord + " ";
				else
					$.event.trigger({type: "keypress", which: 32});
			}, wordSpeed);
		}
	});

	$("button#halp").click(function() {
		$("#helpform").show();
		$("#overlay").fadeIn();
	});

	$("button#helpform-close").click(function() {
		$("#overlay").fadeOut(function() {
			$("#helpform").hide();
		});
	});

	$("<td>").appendTo("table.filterarea > tbody > tr")
	$("#changebankform > table.filter").clone().appendTo("table.filterarea > tbody > tr > td:last-child").fadeIn();
	$("table.filterarea > tbody > tr > td:last-child .optionCategory").val("Mythology")
	$("table.filterarea > tbody > tr > td:last-child button.delete").prop("disabled", true);
	attachFilterListeners(function() {
		getDatabases(0, function() {
			$("#overlay").fadeOut(function() {
				$("#loadingform").hide();
			});
			
		});
	});

	$("input[type=range]").val("50");

	$("button").click(function() {
		this.blur();
	})
	
});