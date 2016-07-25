let React = require('react');
let ReactDOM = require('react-dom');

let {Modal, ChangeBankModal, LoadingModal, HelpModal} = require("./modal");

function choose(l) {
	return l[Math.floor(Math.random() * l.length)];
}

function range(l) {
	return Array.apply(null, Array(l)).map(function (_, i) {return i;});
}

// // Create a data file that can be downloaded
// var saveData = (function () {
// 	var a = document.createElement("a");
// 	document.body.appendChild(a);
// 	a.style = "display: none";
// 	return function (data, fileName) {
// 		a.href = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(data)));
// 		a.download = fileName;
// 		a.click();
// 	};
// }());

class QuestionContainer extends React.Component {
  render() {
    return (
      <div id="questiontext">
  			<div id="qtextcont">{
					(this.props.questionData.textList[0] || {question: ""}).question
				}</div>
  			<span id="msg"><em>Press [Space] to buzz</em></span>
  		</div>
    );
  }
}

class UIContainer extends React.Component {

  render() {
    return (
      <div id="ui">
  			<table className="buttongroup"><tbody><tr>
  				<td><button onClick={ this.props.buttons.next }><i className="fa fa-caret-square-o-right fa-lg"></i><span className="descr-inv"> NEXT</span> [N]</button></td>
  				<td><button onClick={ this.props.buttons.questions }><i className="fa fa-refresh fa-lg"></i><span className="descr-inv"> QUESTIONS</span></button></td>
  				<td><button onClick={ this.props.buttons.card }><i className="fa fa-file fa-lg"></i><span className="descr-inv"> NOTECARD</span> [C]</button></td>
  				<td><button onClick={ this.props.buttons.download }><i className="fa fa-download fa-lg"></i><span className="descr-inv"> DOWNLOAD</span></button></td>
  				<td><button onClick={ this.props.buttons.help }><i className="fa fa-info-circle fa-lg"></i></button></td>
  			</tr></tbody></table>

  			<div className="textcontainer">
  				<textarea></textarea>
  			</div>

  			<span className="speedlabel">Question Speed: [slow]</span>
  			<input type="range" defaultValue="50"/>
  			<span className="endspeedlabel">[fast]</span>
  		</div>
    );
  }
}

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      "isMobile": false,
      "visibleModal": "none",
			"readingState": "READING",
			"questions": {
				textList: [],
				indList: [],
				curInd: -1
			}
    };
  }

  openBankModal() { this.setState({"visibleModal": "changeBank"}); }
  openLoadingModal() { this.setState({"visibleModal": "loading"}); }
  openHelpModal() { this.setState({"visibleModal": "help"}); }

  closeModal() { this.setState({"visibleModal": "none"}); }

	onBankChanged(newFilters, updated) {
		if (updated) {
			this.openLoadingModal();
			this.retrieveQuestionSet(newFilters, function() {
				this.closeModal();
			}.bind(this));
		} else {
			closeModal();
		}
	}

	chooseQuestion() {

	}

	retrieveDatabase(formdata, callback) {
		var questionArray = [];
		async.each(["yes", "no"], function(isLimit, asyncCB) {
			$.ajax({
				url: "/php/searchDatabase.php",
				data: {
					limit: isLimit,
					info: formdata.search,
					categ: formdata.category,
					sub: formdata.subCategory,
					stype: formdata.searchType,
					qtype: "Tossups",
					difficulty: formdata.difficulty,
					tournamentyear: formdata.tournament
				},
				success: function(data) {
					var sliceI = (isLimit == "yes") ? [1, -2] : [0, -1];
					var qArray = data.replace(/\s+/g, " ").split("<hr>").slice(sliceI[0], sliceI[1]).map(function(s) {
						var parts = s.match(/<p>.+?<\/p>/g);
						return {
							meta: parts[0].replace(/<.+?>/g, "").split(" | "),
							question: parts[1].replace(/<.+?>/g, "").replace(/^Question: /, ""),
							answer: parts[2].replace(/<.+?>/g, "").replace(/^Answer: /, "")
						};
					});
					questionArray = questionArray.concat(qArray);
					console.log("retrieved");
					asyncCB();
				}
			});
		}, function(err) {
			if (err) throw err;
			console.log("calling back");
			callback(questionArray);
		});
	}

	retrieveQuestionSet(questionFilters, callback) {
		var fullQuestionArray = [];
		console.log("hi1");
		// TODO: add some sort of system to remove duplicates from question bank
		async.each(questionFilters, function(questionFilter, asyncCB) {

			this.retrieveDatabase(questionFilter, function(qArray) {
				console.log("hi2");
				fullQuestionArray = fullQuestionArray.concat(qArray);
				asyncCB();
			});
		}.bind(this), function(err) {
			if (err) throw err;
			console.log("start");

			var indList = range(fullQuestionArray.length);

			this.setState({
				questions: {
					textList: fullQuestionArray,
					indList: indList,
					curInd: choose(indList)
				},
				readerState: "READING"
			});

			console.log("hey");

			callback();
		}.bind(this));
	}

  render() {

    return (
      <div>
				<div className="appContent">
	        <QuestionContainer questionData={this.state.questions} readerState={this.state.readerState}/>
	        <UIContainer buttons={
	          {
	            "next": function() {}.bind(this),
	            "questions": this.openBankModal.bind(this),
	            "card": function() {}.bind(this),
	            "download": function() {}.bind(this),
	            "help": this.openHelpModal.bind(this)
	          }
	        }/>
					<div className="pullover">
						<h1>QuizBug <i className="fa fa-bug fa-lg"></i></h1>
						<span className="attribution">
						A Quinterest Add-On<br/>
						Created by Chris Winkler<br/>
						v1.1.0<br/>
						Questions/comments? Contact <a href="mailto:quidnovum@gmail.com" target="_blank">quidnovum@gmail.com</a>
						</span>
						<span className="pullover-bars"><i className="fa fa-bars"></i></span>
					</div>
				</div>

				<ChangeBankModal isOpen={ this.state.visibleModal == "changeBank" }
          onFinished={this.onBankChanged.bind(this)} />
        <LoadingModal isOpen={ this.state.visibleModal == "loading" } />
        <HelpModal isOpen={ this.state.visibleModal == "help" }
          onClosing={this.closeModal.bind(this)}/>


      </div>
    );
  }
}

addEventListener("load", () => {
  ReactDOM.render(<App/>, document.getElementById("appContainer"));
});

// $(function() {
// 	var mobileLayout = false;
// 	var isMobile = window.matchMedia("only screen and (max-width: 760px)");
//
// 	var questionArray = [];
// 	var currentQuestion;
// 	var prevSelection = null;
// 	var readerState = "READING";
// 	var wordsToBeRead = [];
// 	var readerInterval = null;
//
// 	var wordSpeed = 200;
//
// 	// Select question to be read and actuate it if applicable
// 	function updateQuestion(callback) {
// 		arrSize = questionArray.length;
// 		if (arrSize === 0) {
// 			currentQuestion = null;
// 		} else {
// 			currentQuestion = choose(questionArray);
// 			actuateQuestion();
// 		}
// 		if (callback) {
// 			callback(arrSize);
// 		}
// 	}
//
// 	// Render a question and start the reader. After complete, call the callback.
// 	function actuateQuestion() {
// 		readerState = "READING";
// 		var $qspan = $("#questiontext div#qtextcont").html(currentQuestion);
// 		var descrBar = $qspan.find("p:first-child").html();
// 		var barArray = descrBar.replace(/<span.+?>.*?<\/span>/g, "")
// 			.replace(/<.?b>/g, "").split(" | ");
// 		$qspan.find("p:first-child").html("<b>" + barArray[2] + " " + barArray[1] + " | " + barArray[5] + " - " + (barArray[6] ? barArray[6] : "None") + "</b><span class='floatright'>(" + questionArray.length + " questions total)</span>");
// 		$qspan.find("p:last-child").hide();
// 		$qspan.find("p:nth-child(2)").html(
// 			$qspan.find("p:nth-child(2)").html().replace(/<em>.+?<\/em>/g, "")
// 		);
// 		wordsToBeRead = $("p:nth-child(2)").text().split(" ").slice(1);
// 		$("p:nth-child(2)").html("");
//
// 		clearInterval(readerInterval);
//
// 		readerInterval = setInterval(function() {
// 			var nextWord = wordsToBeRead.shift();
// 			if (nextWord) {
// 				$("p:nth-child(2)").get(0).innerHTML += nextWord + " ";
// 			}
// 			else {
// 				$.event.trigger({type: "keypress", which: 32});
// 			}
// 		}, wordSpeed);
//
// 		readerState = "READING";
// 	}
//
// 	// Download the entire database associated with the given form data. After finished, callback.
// 	function downloadNewDatabase(formdata, callback) {
// 		async.each(["yes", "no"], function(isLimit, asyncCB) {
// 			$.ajax({
// 				url: "/php/searchDatabase.php",
// 				data: {
// 					limit: "yes",
// 					info: formdata.questionQuery,
// 					categ: formdata.optionCategory,
// 					sub: formdata.optionSubcategory,
// 					stype: formdata.optionSType,
// 					qtype: "Tossups",
// 					difficulty: formdata.optionDifficulty,
// 					tournamentyear: formdata.optionTournament
// 				},
// 				success: function(data) {
// 					var sliceI = (isLimit == "yes") ? [1, -2] : [0, -1];
// 					questionArray = questionArray.concat(data.replace(/\s+/g, " ").split("<hr>").slice(sliceI[0], sliceI[1]));
// 					asyncCB();
// 				}
// 			});
// 		}, function(err) {
// 			callback();
// 		});
// 	}
//
// 	// Download the aggregate database containing all entries from all filters
// 	function getDatabases(startI, callback) {
//
// 		var filterElems = $("table.filterarea > tbody > tr > td");
// 		async.each(range(filterElems.length), function(i, asyncCB) {
// 			// For each index corresponding to a filter...
// 			var curNode = filterElems.get(i);
// 			downloadNewDatabase({
// 				questionQuery: 		$(curNode).find("> table.filter .questionquery").val(),
// 				optionCategory: 	$(curNode).find("> table.filter .optionCategory").val(),
// 				optionSubcategory: 	$(curNode).find("> table.filter .optionSubcategory").val(),
// 				optionSType: 		$(curNode).find("> table.filter .optionSType").val(),
// 				optionDifficulty: 	$(curNode).find("> table.filter .optionDifficulty").val(),
// 				optionTournament:   $(curNode).find("> table.filter .optionTournament").val()
// 			}, asyncCB);
//
// 		}, function(err) {
// 			updateQuestion(callback);
// 		});
//
// 	}
//
//
// 	$("#newquestion").click(function() {
// 		updateQuestion();
// 		readerState = "READING";
// 	});
//
// 	$("#annotate").click(function() {
// 		var selectedTextObj = window.getSelection().getRangeAt(0);
// 		var selectedText = selectedTextObj.startContainer.data;
// 		var startWordSel = selectedTextObj.startOffset;
// 		while (selectedText.slice(startWordSel, startWordSel + 1) != " " && startWordSel > -1) {
// 			startWordSel--;
// 		}
// 		startWordSel++;
// 		var endWordSel = selectedTextObj.endOffset;
// 		while (" ,.!?".indexOf(selectedText.slice(endWordSel, endWordSel + 1)) == -1 && endWordSel < selectedText.length) {
// 			endWordSel++;
// 		}
//
// 		var modSelectedText = selectedText.slice(startWordSel, endWordSel);
// 		if (window.getSelection().toString().length > 0) {
// 			var answerLine = $("#questiontext div#qtextcont div div p:last").html().slice("<em><strong>ANSWER:</strong></em> ".length);
// 			$("textarea").get(0).value += modSelectedText + "\t" + answerLine + "\n";
// 		}
// 	});
//
// 	$("#select").click(function() {
// 		$("#changebankform").show();
// 		$("#overlay").fadeIn();
// 		prevSelection = $(".filterarea").html();
// 	});
//
// 	function attachFilterListeners(cba) {
//
// 		cba = cba || function() {};
//
// 		var changeOptionCategory = function(cb, e) {
// 			$.get("/php/loadSubcategories.php", {
// 				category: $(e.target).val()
// 			}, function(data) {
// 				$(e.target).parents(".filter").find(".optionSubcategory").html(data.replace(/<.?select.+?>/g, ""));
// 				cb();
// 			});
// 		};
//
// 		$(".filterarea .filter:last .optionCategory").change(changeOptionCategory.bind(null, function(){}));
//
// 		var changeOptionDifficulty = function(cb, e) {
// 			$.get("/php/loadTournaments.php", {
// 				qtype: "Tossups",
// 				difficulty: $(e.target).val()
// 			}, function(data) {
// 				console.log("Difficulty Change");
// 				console.log($(e.target));
// 				$(e.target).parents(".filter").find(".optionTournament").html(data.replace(/<.?select.+?>/g, ""));
// 				cb();
// 			});
// 		};
//
// 		$(".filterarea .filter:last-child .optionDifficulty").change(changeOptionDifficulty.bind(null, function(){}));
//
// 		async.parallel([
// 			function(cb) {
// 				changeOptionDifficulty(cb, { target: $(".filterarea .filter:last .optionDifficulty")[0] });
// 			}, function(cb) {
// 				changeOptionCategory(cb, { target: $(".filterarea .filter:last .optionCategory")[0] });
// 			}
// 		], cba);
//
//
//
// 		$(".filterarea .filter:last .delete").click(function(e) {
// 			var $sender = $(e.target);
//
// 			$sender.parents(".filter").fadeOut("fast", function() {
// 				$sender.parents(".filter").parent().remove();
// 				if ($("table.filterarea > tbody > tr > td").length == 1) {
// 					$(".filterarea > tbody > tr > td button.delete").prop("disabled", true);
// 				}
// 			});
//
// 			this.blur();
//
// 		});
//
// 	}
//
// 	$("#dialog_changebank").click(function() {
// 		if ($("table.filterarea > tbody > tr > td").length > 0) {
// 			$("#changebankform").hide();
// 			$("#loadingform").show();
//
// 			questionArray = [];
// 			getDatabases(0, function(arrSize) {
// 				if (arrSize === 0) {
// 					$("#emptyMsg").show().delay(2 * 1000).fadeOut("slow");
//
// 					$("#loadingform").hide();
// 					$("#changebankform").show();
// 				} else {
// 					$("#overlay").fadeOut(function() {
// 						$("#loadingform").hide();
// 					});
// 				}
// 			});
//
// 			prevSelection = null;
// 		}
// 	});
// 	$("#dialog_cancel").click(function() {
// 		$("#overlay").fadeOut(function() {
// 			$("#changebankform").hide();
// 			$(".filterarea").html(prevSelection);
// 			prevSelection = null;
// 		});
//
// 	});
// 	$("#dialog_addsearch").click(function() {
//
// 		if ($("table.filterarea > tbody > tr > td").length < 5) {
// 			if ($("table.filterarea > tbody > tr > td").length == 1) {
// 				$("table.filterarea > tbody > tr > td button.delete").prop("disabled", false);
// 			}
// 			$("<td>").appendTo("table.filterarea > tbody > tr");
// 			$("#changebankform > table.filter").clone().appendTo("table.filterarea > tbody > tr > td:last-child").fadeIn();
//
// 			attachFilterListeners();
// 		}
// 	});
//
// 	$(window).keypress(function(ev) {
// 		if (ev.which == 32) { // Space
// 			if (readerState == "READING") {
// 				clearInterval(readerInterval);
// 				$("#questiontext #qtextcont p:nth-child(2)").get(0).innerHTML += "(#) ";
// 				$("span#msg").html("<em>Press [Space] to see the answer</em>");
// 				readerState = "WAITING";
// 			} else if (readerState == "WAITING") {
// 				$("#questiontext #qtextcont p:nth-child(2)").get(0).innerHTML += wordsToBeRead.join(" ");
// 				$("#questiontext #qtextcont p:last-child").show();
// 				$("span#msg").html("<em>Press [Space] for the next question</em>");
// 				readerState = "SHOWING";
// 			} else if (readerState == "SHOWING") {
// 				$("#newquestion").click();
// 				$("span#msg").html("<em>Press [Space] to buzz</em>");
// 				readerState = "READING";
// 			}
// 		} else if (ev.which == 99) { // C
// 			$("#annotate").click();
// 		} else if (ev.which == 110) { // N
// 			$("#newquestion").click();
// 			readerState = "READING";
// 		}
// 	});
//
// 	$("textarea").keypress(function(e) {
// 	  var $this, end, start;
// 	  if (e.keyCode === 9) {
// 	    start = this.selectionStart;
// 	    end = this.selectionEnd;
// 	    $this = $(this);
// 	    $this.val($this.val().substring(0, start) + "\t" + $this.val().substring(end));
// 	    this.selectionStart = this.selectionEnd = start + 1;
// 	    return false;
// 	  }
// 	  e.originalEvent.stopPropagation();
// 	});
//
// 	$("#changebankform").hide();
// 	$("#helpform").hide();
// 	$("#overlay").fadeIn();
//
// 	$("#download").click(function() {
// 		saveData($("textarea").val(), "flashcards.txt");
// 		this.blur();
// 	});
//
// 	$("input[type=range]").change(function(e) {
// 		var curVal = $(e.target).val();
// 		wordSpeed = (50 + (100 - curVal) * 3);
//
// 		if (readerState == "READING") {
// 			clearInterval(readerInterval);
//
// 			readerInterval = setInterval(function() {
// 				var nextWord = wordsToBeRead.shift();
// 				if (nextWord)
// 					$("p:nth-child(2)").get(0).innerHTML += nextWord + " ";
// 				else
// 					$.event.trigger({type: "keypress", which: 32});
// 			}, wordSpeed);
// 		}
// 	});
//
// 	$("button#halp").click(function() {
// 		$("#helpform").show();
// 		$("#overlay").fadeIn();
// 	});
// 	$("button#helpform-close").click(function() {
// 		$("#overlay").fadeOut(function() {
// 			$("#helpform").hide();
// 		});
// 	});
//
// 	$("<td>").appendTo("table.filterarea > tbody > tr");
// 	$("#changebankform > table.filter").clone().appendTo("table.filterarea > tbody > tr > td:last-child").fadeIn();
// 	$("table.filterarea > tbody > tr > td:last-child .optionCategory").val("Mythology");
// 	$("table.filterarea > tbody > tr > td:last-child button.delete").prop("disabled", true);
//
// 	attachFilterListeners(function() {
// 		getDatabases(0, function() {
// 			$("#overlay").fadeOut(function() {
// 				$("#loadingform").hide();
// 			});
//
// 		});
// 	});
//
// 	$("input[type=range]").val("50");
//
// 	$("button").click(function() {
// 		this.blur();
// 	});
//
// 	function handleLayoutChange() {
// 		if (isMobile.matches) {
// 			if (!mobileLayout) {
// 				mobileLayout = true;
//
// 			}
// 		} else {
// 			if (mobileLayout) {
// 				mobileLayout = false;
//
// 			}
// 		}
// 	}
//
// 	$(window).resize(handleLayoutChange);
// 	handleLayoutChange();
//
// });
