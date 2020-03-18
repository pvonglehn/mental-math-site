function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Question {
    /**
    * Question class
    * Randomly generate a question
    * @param  {String} operator operator e.g. + for addition
    * @param  {Number} a_digit number of digits of operand a
    * @return {object} question returns a question object
    */

    constructor (operator="+",a_digit=1,b_digit=1) {
    // get function from operator string
    let operations = {
        "+" : function (operand1, operand2) {
            return operand1 + operand2;
        },
        "-" : function (operand1, operand2) {
            return operand1 - operand2;
        }
    };

    // start time
    this.start = new Date().getTime()

    this.operator = operator;
    this.a_digit  = a_digit;
    this.b_digit  = b_digit;

    // set range for question
    let a_min = Math.pow(10,this.a_digit - 1);
    let a_max = Math.pow(10,this.a_digit) - 1;
    let b_min = Math.pow(10,this.b_digit - 1);
    let b_max = Math.pow(10,this.b_digit) - 1;

    // randomly generate operands
    this.a = getRandomInt(a_min, a_max);
    this.b = getRandomInt(b_min, b_max);
    this.question = `${this.a} ${this.operator} ${this.b}`;

    // calculate answer
    this.answer = operations[this.operator](this.a,this.b);

    }

    // add answer
    setUserAnswer(user_answer) {
        this.user_answer = user_answer;
        this.end = new Date().getTime();
        this.duration = (this.end - this.start) / 1000;
    }

    checkAnswer() {
        if (this.answer == this.user_answer) {
            return true;
        } else {
            return false;
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
const userAnswerBox = document.getElementById("user-answer");
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
    current_question = new Question();
    question.innerHTML = current_question.question;
    if (settings.elements['readAloud'].checked){
        if (settings.elements['speechRecognition'].checked){
            responsiveVoice.speak(question.textContent,"UK English Male",{onend: speech_rec_function});
        } else {
            responsiveVoice.speak(question.textContent,"UK English Male");
        }
    }
    userAnswerBox.value = null;
    userAnswerBox.focus();
})

myForm.addEventListener("submit",function(event){
    event.preventDefault();
    current_question.setUserAnswer(myForm.elements["user-answer"].value);
    current_question.feedback(feedback_div);
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