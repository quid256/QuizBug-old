let React = require('react');
let ReactDOM = require('react-dom');

let {Modal, ChangeBankModal, LoadingModal, HelpModal} = require("./modal");

function choose(l) {
	return l[Math.floor(Math.random() * l.length)];
}

function range(l) {
	return Array.apply(null, Array(l)).map(function (_, i) {return i;});
}

// Create a data file that can be downloaded
var saveData;

class QuestionContainer extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			readTimer: -1,
			wordIndex: 0,
			curQuestionWords: {
				question: "",
				meta: []
			},
			curAnswer: ""
		};
	}

	componentWillReceiveProps(nextProps) {
		this.setState({
			curQuestionWords: (nextProps.questionData.textList[nextProps.questionData.curInd] || {
				question: "",
				meta: []
			})
		});

		if (nextProps.questionData.curInd != this.props.questionData.curInd && nextProps.questionData.curInd !== null) {
			this.setState({
				wordIndex: 0
			});
		}

		if (nextProps.setID != this.props.setID) {
			this.setState({
				wordIndex: 0
			});
		}

    if (nextProps.readerState != this.props.readerState) {
      if (nextProps.readerState == "READING") {
        this.setState({
					wordIndex: 0,
					readTimer: setInterval(function() {
						if (this.state.wordIndex < this.state.curQuestionWords.question.split(" ").length) {
							this.setState({wordIndex: this.state.wordIndex + 1});
						} else {
							clearInterval(this.state.readTimer);
							this.setState({
								readTimer: -1
							});
							this.props.onReadingFinished();
						}
					}.bind(this), 200)
				});
      }

			if (this.props.readerState == "READING") {
				clearInterval(this.state.readTimer);
				this.setState({
					readTimer: -1
				});
			}
    }
  }

  render() {
		let qMeta = this.state.curQuestionWords.meta;

		let wordArray = this.state.curQuestionWords.question.split(" ");
		let beforeWords = wordArray.slice(0, this.state.wordIndex).join(" ");
		let afterWords = wordArray.slice(this.state.wordIndex).join(" ");

		let visibleText;

		if (this.props.readerState == "READING") {
			visibleText = beforeWords;
		} else if (this.props.readerState == "WAITING") {
			visibleText = beforeWords + " (#)";
		} else if (this.props.readerState == "SHOWING") {
			visibleText = beforeWords + " (#) " + afterWords;

		}

    return (
      <div className={"questiontext" + (this.props.isMobile ? " full" : "")}>
  			<div id="qtextcont">
					<p>
						<b>{ qMeta.length > 0 ? `${qMeta[2]} ${qMeta[1]} | ${qMeta[5]} - ${qMeta[6]}` : "" }</b>
						<span style={{float: "right"}}>{
							qMeta.length > 0 ?
							`(Question ${this.props.questionData.textList.length - this.props.questionData.indList.length + 1} of ${this.props.questionData.textList.length})`
							: ""
							}
						</span>
					</p>
					<p> { visibleText } </p>
					{
						(this.props.readerState == "SHOWING") ? (<p>
							<em><strong>Answer: </strong></em>
							{ this.state.curQuestionWords.answer }
						</p>) : null
					}
				</div>
  			<span id="msg"><em>Press [Space] {
					{
						"READING": "to buzz",
						"WAITING": "to see the answer",
						"SHOWING": "for the next question"
					}[this.props.readerState]
				}</em></span>
  		</div>
    );
  }
}

class UIContainer extends React.Component {

	constructor(props) {
		super(props);
	}

	cardSelection() {
		var selectedTextObj = window.getSelection().getRangeAt(0);
		var selectedText = selectedTextObj.startContainer.data;
		var startWordSel = selectedTextObj.startOffset;
		while (selectedText.slice(startWordSel, startWordSel + 1) != " " && startWordSel > -1) {
			startWordSel--;
		}
		startWordSel++;
		var endWordSel = selectedTextObj.endOffset;
		while (" ,.!?".indexOf(selectedText.slice(endWordSel, endWordSel + 1)) == -1 && endWordSel < selectedText.length) {
			endWordSel++;
		}

		var modSelectedText = selectedText.slice(startWordSel, endWordSel);
		if (window.getSelection().toString().length > 0) {
			var answerLine = this.props.getAnswer();
			this.refs.cardarea.value += modSelectedText + "\t" + answerLine + "\n";
		}
	}

	onKeyPress(e) {
		if (e.keyCode == 99) {
			this.cardSelection();
		}
	}

	componentDidMount() {
		window.addEventListener('keypress', this.onKeyPress.bind(this));
	}

	componentWillUnmount() {
		window.removeEventListener('keypress', this.onKeyPress.bind(this));
	}

	saveCardData() {
		saveData(this.refs.cardarea.value, "cards.txt");
	}

	pressBttn(name) {

		this.refs[name + "Bttn"].blur();

		this.props.buttons[name]();
	}

  render() {
		if (this.props.isMobile) {
			return null;
		}
    return (
      <div className="ui">
  			<table className="buttongroup"><tbody><tr>
  				<td><button ref="nextBttn" onClick={ this.pressBttn.bind(this, "next") }><i className="fa fa-caret-square-o-right fa-lg"></i><span className="descr-inv"> NEXT</span> [N]</button></td>
  				<td><button ref="questionsBttn" onClick={ this.pressBttn.bind(this, "questions") }><i className="fa fa-refresh fa-lg"></i><span className="descr-inv"> QUESTIONS</span></button></td>
  				<td><button ref="cardBttn" onClick={ this.cardSelection.bind(this) }><i className="fa fa-file fa-lg"></i><span className="descr-inv"> NOTECARD</span> [C]</button></td>
  				<td><button ref="saveBttn" onClick={ this.saveCardData.bind(this) }><i className="fa fa-download fa-lg"></i><span className="descr-inv"> DOWNLOAD</span></button></td>
  				<td><button ref="helpBttn" onClick={ this.pressBttn.bind(this, "help") }><i className="fa fa-info-circle fa-lg"></i></button></td>
  			</tr></tbody></table>

  			<div className="textcontainer">
  				<textarea ref="cardarea"></textarea>
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
			"isMobileReq": window.matchMedia("only screen and (max-width: 760px)"),
      "isMobile": window.matchMedia("only screen and (max-width: 760px)").matches,
      "visibleModal": "none",
			"bankModalError": false,
			"readingState": "PAUSED",
			"questions": {
				textList: [],
				indList: [],
				curInd: -1
			},
			setID: 0,
			"cardContent": ""
    };
		setTimeout(this.onBankChanged.bind(this, [{
			query: "",
			category: "Mythology",
			subCategory: "None",
			searchType: "Answer",
			difficulty: "HS",
			tournament: "All",
		}], true), 0);
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
			this.closeModal();
		}
	}

	retrieveDatabase(formdata, callback) {
		var questionArray = [];
		async.each(["yes", "no"], function(isLimit, asyncCB) {
			$.ajax({
				url: "/php/searchDatabase.php",
				data: {
					limit: isLimit,
					info: formdata.query,
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
						let meta = parts[0].replace("ID: ", " | ID: ").replace(/<.+?>/g, "").split(" | ");
						if (meta[6] === "") {
							meta[6] = "None";
						}
						return {
							meta: meta,
							question: parts[1].replace(/<.+?>/g, "").replace(/^Question: /, ""),
							answer: parts[2].replace(/<.+?>/g, "").replace(/^Answer: /i, "")
						};
					});
					questionArray = questionArray.concat(qArray);
					asyncCB();
				}
			});
		}, function(err) {
			if (err) throw err;
			callback(questionArray);
		});
	}

	retrieveQuestionSet(questionFilters, callback) {
		var fullQuestionArray = [];
		// TODO: add some sort of system to remove duplicates from question bank
		async.each(questionFilters, function(questionFilter, asyncCB) {

			this.retrieveDatabase(questionFilter, function(qArray) {
				fullQuestionArray = fullQuestionArray.concat(qArray);
				asyncCB();
			});
		}.bind(this), function(err) {
			if (err) throw err;

			if (fullQuestionArray.length < 1) {
				// No valid questions
				this.setState({bankModalError: true});
				this.openBankModal();

				setTimeout(function() {
					this.setState({bankModalError: false});
				}.bind(this), 2000);

				return;
			}

			var indList = range(fullQuestionArray.length);
			// console.log(fullQuestionArray[0]);
			this.setState({
				questions: {
					textList: fullQuestionArray,
					indList: indList,
					curInd: choose(indList)
				},
				setID: this.state.setID + 1,
				readerState: "READING"
			});


			callback();
		}.bind(this));
	}


	onKeyPress(ev) {
		if (ev.keyCode == 32) { // Space
			if (this.state.visibleModal == "none") {
				if (this.state.readerState == "READING") {
					this.setState({readerState: "WAITING"});
				} else if (this.state.readerState == "WAITING") {
					this.setState({readerState: "SHOWING"});
				} else if (this.state.readerState == "SHOWING") {
					this.nextQuestion();
				}
			}
		} else if (ev.keyCode == 110) { // N
			this.nextQuestion();
		}
	}

	nextQuestion() {
		let qIndex = this.state.questions.indList.indexOf(this.state.questions.curInd);
		let newIndList = this.state.questions.indList.slice(0, qIndex)
			.concat(this.state.questions.indList.slice(qIndex + 1));

		this.setState({
			questions: {
				textList: this.state.questions.textList,
				indList: newIndList,
				curInd: choose(newIndList)
			},
			readerState: "READING"
		});

	}

	onRSZ() {
		var isNowMobile = this.state.isMobileReq.matches;
		if (this.state.isMobile != isNowMobile) {
			console.log("small", isNowMobile);
			this.setState({
				"isMobile": isNowMobile
			});
		}
	}

	componentDidMount() {
		window.addEventListener('keypress', this.onKeyPress.bind(this));
		window.addEventListener('resize', this.onRSZ.bind(this));
	}

	componentWillUnmount() {
		window.removeEventListener('keypress', this.onResize.bind(this));
		window.removeEventListener('resize', this.onRSZ.bind(this));
	}

	getQuestionAnswer() {
		if (this.state.readerState == "SHOWING") {
			return this.refs.QCont.state.curQuestionWords.answer;
		} else {
			return "";
		}
	}

  render() {
		console.log("render", this.state.isMobile, this.state.isMobileReq.matches);

    return (
      <div>
				<div className="appContent">
	        <QuestionContainer ref="QCont"
						questionData={this.state.questions}
						readerState={this.state.readerState}
						onReadingFinished={ function() {this.setState({readerState: "WAITING"});}.bind(this)}
						setID={this.state.setID}
						isMobile={this.state.isMobile}/>
	        <UIContainer buttons={
	          {
	            "next": this.nextQuestion.bind(this),
	            "questions": this.openBankModal.bind(this),
	            "card": function() {}.bind(this),
	            "download": function() {}.bind(this),
	            "help": this.openHelpModal.bind(this)
	          }}

						getAnswer={this.getQuestionAnswer.bind(this)}
						isMobile={this.state.isMobile}

	        />
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

				<ChangeBankModal
					isOpen={ this.state.visibleModal == "changeBank" }
          onFinished={this.onBankChanged.bind(this)}
					hasError={this.state.bankModalError}/>
        <LoadingModal isOpen={ this.state.visibleModal == "loading" } />
        <HelpModal isOpen={ this.state.visibleModal == "help" }
          onClosing={this.closeModal.bind(this)}/>

      </div>
    );
  }
}



addEventListener("load", () => {
	ReactDOM.render(<App/>, document.getElementById("appContainer"));

	saveData = (function () {
		var a = document.createElement("a");
		document.body.appendChild(a);
		a.style = "display: none";
		return function (data, fileName) {
			a.href = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(data)));
			a.download = fileName;
			a.click();
		};
	}());

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
