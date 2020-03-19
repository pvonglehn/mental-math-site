function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Question {
    /**
    * Question class
    * Randomly generate a question
    * @param  {String} operator_name operator e.g. addition
    * @param  {Number} a_digits number of digits of operand a
    * @param  {Number} b_digits number of digits of operand a
    * @return {object} question returns a question object
    */

    constructor (operator_name,a_digits=1,b_digits=1) {
    // get function from operator string
    let operations = {
        "addition" : function (operand1, operand2) {
            return operand1 + operand2;
        },
        "subtraction" : function (operand1, operand2) {
            return operand1 - operand2;
        },
        "multiplication" : function (operand1, operand2) {
            return operand1 * operand2;
        }
    };

    let operator_names2symbols = {
        "addition" : "+",
        "subtraction" : "-",
        "multiplication" : "&times;",
        "division" : "&div;"
    }

    // start time
    this.start = new Date().getTime()

    this.operator_name = operator_name;
    this.operator_symbol = operator_names2symbols[operator_name];
    this.a_digits  = a_digits;
    this.b_digits  = b_digits;

    // set range for question
    let a_min = Math.pow(10,this.a_digits - 1);
    let a_max = Math.pow(10,this.a_digits) - 1;
    let b_min = Math.pow(10,this.b_digits - 1);
    let b_max = Math.pow(10,this.b_digits) - 1;

    // randomly generate operands
    this.a = getRandomInt(a_min, a_max);
    this.b = getRandomInt(b_min, b_max);
    this.question = `${this.a} ${this.operator_symbol} ${this.b}`;

    // calculate answer
    this.answer = operations[this.operator_name](this.a,this.b);

    }

    // add answer
    setUserAnswer(user_answer) {
        this.user_answer = user_answer;
        this.end = new Date().getTime();
        this.duration = (this.end - this.start) / 1000;
    }

    checkAnswer() {
        if (this.answer == this.user_answer) {
            this.correct = true;
            return true;
        } else {
            return false;
            this.correct = false;
        }
    }

    feedback(feedback_div) {
        if (this.checkAnswer()) {
            correctIncorrect.innerHTML =  `${this.user_answer} is correct!`;
        } else {
            correctIncorrect.innerHTML = `Incorrect!`;
            yourAnswer.innerHTML = `your answer: ${this.user_answer}`;
            correctAnswer.innerHTML = `correct answer: ${this.answer}`;
        }
        timeTaken.innerHTML = `time taken: ${Math.round(this.duration * 10) / 10} seconds`;
    }
}


// document elements to be manipulated
const newQuestionButton = document.getElementById("new-question");
const question = document.getElementById("question");
const myForm = document.getElementById("myForm");
const userAnswerBox = document.getElementById("user_answer");
const feedback_div = document.getElementById("feedback");
const timeTaken = document.getElementById("time-taken");
const correctIncorrect = document.getElementById("correct-incorrect");
const yourAnswer = document.getElementById("your-answer");
const correctAnswer = document.getElementById("correct-answer");

// Settings
const settings = document.getElementById("settings");
var showQuestion = document.getElementById("showQuestion");
showQuestion.addEventListener("change", function(){
    if (showQuestion.checked) {
        question.style.visibility = "visible";
    } else {
        question.style.visibility = "hidden";
    }
})

// get parameters in URL (GET request parameters)
const urlParams = new URLSearchParams(window.location.search);
settings.elements.operator_name.value = urlParams.get('operator_name') || "addition";
settings.elements.a_digits.value = urlParams.get('a_digits') || "1";
settings.elements.b_digits.value = urlParams.get('b_digits') || "1";

// update statistics link to reflect current settings

function updateStatsLink() {
    const statsLink = document.getElementById("stats-link")
    let statsLinkUrl = statsLink.getAttribute("href")
    let query = statsLinkUrl.indexOf('?');
    if (query > 0) {
        var statsLinkUrlNew = statsLinkUrl.substring(0, query);
    } else {
        var statsLinkUrlNew = statsLinkUrl;
    }
    statsLinkUrlNew = statsLinkUrlNew + "?" + "operator_name"  + "="  + settings.elements.operator_name.value
                                    + "&" + "a_digits"  + "="  + settings.elements.a_digits.value
                                    + "&" + "b_digits"  + "="  + settings.elements.b_digits.value
    statsLink.setAttribute("href",statsLinkUrlNew)
}
updateStatsLink()
const statsLink = document.getElementById("stats-link");
statsLink.addEventListener("click",function(e){
    e.preventDefault();
    updateStatsLink()
    window.location.href = this.getAttribute("href")});

// create unassigned variable current_question
var current_question;

function cleanFeedback() {
    correctIncorrect.innerHTML = null;
    yourAnswer.innerHTML = null;
    correctAnswer.innerHTML = null;
    timeTaken.innerHTML = null;
}

// set visibility state
myForm.style.visibility = "hidden";
newQuestionButton.focus();

newQuestionButton.addEventListener("click",function(){
    cleanFeedback();
    newQuestionButton.style.visibility = "hidden";
    myForm.style.visibility = "visible";
    current_question = new Question(operator_name=settings.elements.operator_name.value,
                        a_digits=settings.elements.a_digits.value,
                        b_digits=settings.elements.b_digits.value);
    question.innerHTML = current_question.question;
    if (settings.elements['readAloud'].checked){
        if (settings.elements['speechRecognition'].checked){
            responsiveVoice.speak(question.textContent,"UK English Male",{onend: speech_rec_function});
        } else {
            responsiveVoice.speak(question.textContent,"UK English Male");
        }
    } else {
        if (settings.elements['speechRecognition'].checked) {
            speech_rec_function();
        }
    }
    userAnswerBox.value = null;
    if (!settings.elements.speechRecognition.checked) {
        userAnswerBox.focus();
    }
})


function sendData(form) {
    const XHR = new XMLHttpRequest();

    // Bind the FormData object and the form element
    const FD = new FormData( form );

    // Set up our request
    XHR.open( "POST", "/submit_answer" );

    // The data sent is what the user provided in the form
    XHR.send( FD );
}


myForm.addEventListener("submit",function(event){
    event.preventDefault();
    current_question.setUserAnswer(myForm.elements["user_answer"].value);
    current_question.feedback(feedback_div);

    // fill in form to be sent to backend
    myForm.elements.operator_name.value = current_question.operator_name;
    myForm.elements.question.value = current_question.question;
    myForm.elements.a_digits.value = current_question.a_digits;
    myForm.elements.b_digits.value = current_question.b_digits;
    myForm.elements.answer.value = current_question.answer;
    myForm.elements.correct.value = current_question.correct;
    myForm.elements.duration.value = current_question.duration;
    
    sendData(myForm);

    // prepare for new question
    newQuestionButton.style.visibility = "visible";
    myForm.style.visibility = "hidden";
    newQuestionButton.focus();
    
    
})


function speech_rec_function() {
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
    var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
    var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

    var grammar = '#JSGF V1.0;'

    var recognition = new SpeechRecognition();
    var speechRecognitionList = new SpeechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);
    recognition.grammars = speechRecognitionList;
    //recognition.continuous = false;
    recognition.lang = 'en-UK';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    console.log('Ready to receive speech');

    recognition.onresult = function(event) {

    var last = event.results.length - 1;
    var number = event.results[last][0].transcript;

    // input the answer
    userAnswerBox.value = number;

    // submit
    document.getElementById("submit-answer").click();
    

    console.log('Confidence: ' + event.results[0][0].confidence);
    }

    recognition.onspeechend = function() {
    recognition.stop();
    }

    recognition.onerror = function(event) {
    diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
    }
}