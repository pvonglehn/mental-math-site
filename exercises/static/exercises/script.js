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
    * @param  {String} username
    * @return {object} question returns a question object
    */

    constructor (operator_name,a_digits=1,b_digits=1,username) {
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
    this.username  = username;

    // set range for question
    let a_min = Math.pow(10,this.a_digits - 1) + 1;
    let a_max = Math.pow(10,this.a_digits) - 1;
    let b_min = Math.pow(10,this.b_digits - 1) + 1;
    let b_max = Math.pow(10,this.b_digits) - 1;

    if (this.operator_name == "division") {

        this.a = getRandomInt(a_min, a_max);
        this.b = getRandomInt(b_min, b_max);
        

        // calculate answer
        this.quotient = Math.floor(this.a/this.b);
        this.remainder = this.a % this.b;
        this.answer = [this.quotient, this.remainder]

        this.question = `${this.a} ${this.operator_symbol} ${this.b}`;

    } else {
        // randomly generate operands
        this.a = getRandomInt(a_min, a_max);
        this.b = getRandomInt(b_min, b_max);
        this.question = `${this.a} ${this.operator_symbol} ${this.b}`;

        // calculate answer
        this.answer = operations[this.operator_name](this.a,this.b);
        }
    }

    // add answer
    setUserAnswer(user_answer, quotient, remainder) {
        if (this.operator_name == "division") {
            this.user_answer = [quotient,remainder]
        } else {
        this.user_answer = user_answer;
    }
        this.end = new Date().getTime();
        this.duration = (this.end - this.start) / 1000;
    }

    checkAnswer() {
        if (this.operator_name == "division") {
            if ((this.quotient == this.user_answer[0]) & (this.remainder == this.user_answer[1])) {
                this.correct = true;
                } else {
                    this.correct = false;
                }
            } else {
            if (this.answer == this.user_answer) {
                this.correct = true;
            } else {
            this.correct = false;
            }
        }
        return this.correct;
    }

    feedback(feedback) {
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

// daily stats (only active if user is signed in)
class DailyStats {
    /**
 
    */

        calculate_derived() {
            this.incorrect = this.total - this.correct;
            this.mean_duration = this.total_duration / this.total;
            this.accuracy = 100*(this.correct/this.total);
        }

        updateFromServer() {

            if (this.username == "" ) {
                this.reset();
                
            } else {

                let xhttp = new XMLHttpRequest();
                var ds = this;
                xhttp.onreadystatechange=function() {
                    if (this.readyState == 4 && this.status == 200) {
                    
                        let response_json = JSON.parse(this.responseText)
                        ds.correct = response_json.correct;
                        ds.total = response_json.total;
                        ds.total_duration = response_json.total_duration;
                        ds.daily_target = response_json.daily_target || "";
                        ds.calculate_derived();
                        ds.updateTable();
                    }
                };
                xhttp.open("GET","/get_daily_stats?" 
                                + "operator_name=" + this.operator_name
                                + "&a_digits=" + this.a_digits
                                + "&b_digits=" + this.b_digits
                                + "&username="  + this.username);
                xhttp.send();
            }
            
        }

        constructor(operator_name,a_digits,b_digits,username) {
        
            this.operator_name = operator_name;
            this.a_digits = a_digits;
            this.b_digits = b_digits;
            this.username = username;
            this.correct = 0;
            this.updateFromServer();
            this.calculate_derived();
            this.updateTable();
            

        };

        reset() {
            this.correct = 0;
            this.incorrect = 0;
            this.total = 0;
            this.total_duration = 0;
            this.accuracy = 0;
            this.mean_duration = 0;   
                   
        }

        set_params(question) {
            this.operator_name  = question.operator_name;
            this.a_digits       = question.a_digits;
            this.b_digits       = question.b_digits;
            this.username       = question.username ;      
        }



        updateTable() {
            document.getElementById("n_correct").innerHTML = this.correct;
            document.getElementById("n_incorrect").innerHTML = this.incorrect;
            if (!Number.isNaN(this.mean_duration)) {
                
                document.getElementById("daily_average_duration").innerHTML = this.mean_duration.toFixed(1) + " seconds";
            } else {
                document.getElementById("daily_average_duration").innerHTML = "";
            }
            if (!Number.isNaN(this.accuracy)) {
                
                document.getElementById("daily_accuracy").innerHTML = this.accuracy.toFixed(1) + "%";
            } else {
                document.getElementById("daily_accuracy").innerHTML = "";
            }           
            
            document.getElementById("daily_target").innerHTML = this.daily_target || "";

            document.getElementById('daily_stats_heading').innerHTML = "daily stats: " 
                                                                + this.operator_name 
                                                                + " " + this.a_digits 
                                                                + " by " + this.b_digits
        }

        update(question) {
            

            if (!(question.operator_name === this.operator_name
               && question.a_digits == this.a_digits
               && question.b_digits == this.b_digits
               && question.username == this.username)) {
                   this.reset();
                   this.set_params(question);
               }

            if (question.correct == true) {
                ++this.correct;
            }

            ++this.total;            
            this.total_duration += question.duration;
            // this.mean_duration = this.total_duration / this.total;
            // this.accuracy = 100*(this.correct / this.total);
            this.calculate_derived();
            this.updateTable();

        }
    }

// document elements to be manipulated
const newQuestionButton = document.getElementById("new-question");
const question = document.getElementById("question");
const myForm = document.getElementById("myForm");
const userAnswerBox = document.getElementById("user_answer");
const feedback = document.getElementById("feedback");
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

// open up settings if screen size large enough
if (window.matchMedia("(min-width: 600px)").matches){
    $(document).ready(function(){
        document.getElementById('settings_table_head').click();
    })
}

document.getElementById("update_settings").addEventListener("click",function(e){
    
        e.preventDefault();
        
        // fetch daily stats from server
        window.ds = new DailyStats(settings.elements.operator_name.value,
        settings.elements.a_digits.value,
        settings.elements.b_digits.value,
        myForm.elements.username.value);
        
        cleanFeedback();

        
        toggleState("inactive");

        document.getElementById('exercise-type').innerHTML = settings.elements.operator_name.value 
                                                    + "<br />"
                                                    + " " + settings.elements.a_digits.value 
                                                    + " by " + settings.elements.b_digits.value
        document.getElementById('exercise-type').style.display = "block";

        let user_answer_container = document.getElementById('user_answer_container')
        let quotient_container = document.getElementById('quotient_container')
        let remainder_container = document.getElementById('remainder_container')
        if (settings.elements.operator_name.value == "division") {
            user_answer_container.style.display = "none"
            quotient_container.style.display = "inline"
            remainder_container.style.display = "inline"
        } else {
            user_answer_container.style.display = "inline"
            quotient_container.style.display = "none"
            remainder_container.style.display = "none"
        }

        if (showQuestion.checked) {
            question.style.visibility = "visible";
        } else {
            question.style.visibility = "hidden";
        }

        try{
            $('#accordion').collapse('toggle');
        } 
        catch(err) {
            console.log("failed accordion collapse")
        }

})


// increment and decrement number of a digits
document.getElementById('a_digits_dec').addEventListener("click",function(e){
    e.preventDefault();
    let current_value = document.getElementById('a_digits').value ;
    if (current_value > 1) {
        document.getElementById('a_digits').value = parseInt(current_value) - 1;
    }
})

document.getElementById('a_digits_inc').addEventListener("click",function(e){
    e.preventDefault();
    let current_value = document.getElementById('a_digits').value;
    document.getElementById('a_digits').value = parseInt(current_value) + 1;
})

// increment and decrement number of b digits
document.getElementById('b_digits_dec').addEventListener("click",function(e){
    e.preventDefault();
    let current_value = document.getElementById('b_digits').value ;
    if (current_value > 1) {
        document.getElementById('b_digits').value = parseInt(current_value) - 1;
    }
})

document.getElementById('b_digits_inc').addEventListener("click",function(e){
    e.preventDefault();
    let current_value = document.getElementById('b_digits').value;
    document.getElementById('b_digits').value = parseInt(current_value) + 1;
})



// get parameters in URL (GET request parameters)
const urlParams = new URLSearchParams(window.location.search);
settings.elements.operator_name.value = urlParams.get('operator_name') || "addition";
settings.elements.a_digits.value = urlParams.get('a_digits') || "1";
settings.elements.b_digits.value = urlParams.get('b_digits') || "1";

document.getElementById("update_settings").click();

var username = myForm.elements.username.value;
var operator_name = settings.elements.operator_name.value;
var a_digits = settings.elements.a_digits.value;
var b_digits = settings.elements.b_digits.value;


var ds = new DailyStats(operator_name,
                    a_digits,
                    b_digits,
                    username);

const dailyStatsTable = document.getElementById("dailyStatsTable");


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
    question.innerHTML = "";
    correctIncorrect.innerHTML = "";
    yourAnswer.innerHTML = "";
    correctAnswer.innerHTML = "";
    timeTaken.innerHTML = "";
}

myFormHeight = getComputedStyle(myForm).height;

feedbackHeight = getComputedStyle(feedback).height;

function toggleState(state) {
    if (state == "active"){
        // newQuestionButton.style.visibility = "hidden";
        // feedback.style.height = "0";
        // myForm.style.visibility = "visible";
        // myForm.style.height = myFormHeight;
        feedback.style.display = "none";
        // myForm.style.display = "block";
        document.getElementById('input-area').style.display = "block";

    } else {
        // myForm.style.visibility = "hidden";
        // myForm.style.height = "0";
        // newQuestionButton.style.visibility = "visible";
        // feedback.style.height = feedbackHeight;
        feedback.style.display = "block";
        // myForm.style.display = "none";
        document.getElementById('input-area').style.display = "none";
    }
}

// set visibility state
// myForm.style.visibility = "hidden";
newQuestionButton.focus();
toggleState("inactive")

newQuestionButton.addEventListener("click",function(){
    document.getElementById("exercise-type").style.display = "none";
    cleanFeedback();
    // newQuestionButton.style.visibility = "hidden";
    // myForm.style.visibility = "visible";
    toggleState("active")
    current_question = new Question(operator_name=settings.elements.operator_name.value,
                        a_digits=settings.elements.a_digits.value,
                        b_digits=settings.elements.b_digits.value,
                        username=myForm.elements.username.value);

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
    current_question.setUserAnswer(myForm.elements["user_answer"].value, myForm.elements["quotient"].value, myForm.elements["remainder"].value);
    current_question.feedback(feedback);

    // fill in form to be sent to backend
    myForm.elements.operator_name.value = current_question.operator_name;
    myForm.elements.question.value = current_question.question;
    myForm.elements.a_digits.value = current_question.a_digits;
    myForm.elements.b_digits.value = current_question.b_digits;
    myForm.elements.answer.value = current_question.answer;
    myForm.elements.correct.value = current_question.correct;
    myForm.elements.duration.value = current_question.duration;
    
    sendData(myForm);

    myForm.reset();

    // update daily stats (if ds exists)
    ds && ds.update(current_question);


    // prepare for new question
    // newQuestionButton.style.visibility = "visible";
    // myForm.style.visibility = "hidden";
    toggleState("inactive")
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


// set navbar height
document.querySelector('body').style.marginTop =
parseInt(getComputedStyle(document.querySelector('nav'),null).getPropertyValue("height")) -2 +"px"  ;


