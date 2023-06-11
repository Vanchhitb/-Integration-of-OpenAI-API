const API_CHATBOT_OTHERIDEAS = "http://localhost:2001/";


var connectionOptions =  {
    "force new connection" : true,
    "reconnectionAttempts": "Infinity", //avoid having user reconnect manually in order to prevent dead clients after a server restart
    "timeout" : 10000, //before connect_error and connect_timeout are emitted.
    "transports" : ["websocket"]
};

var socket = io(`${API_CHATBOT_OTHERIDEAS}`, connectionOptions)
var userId = null
var chatType = `chatGPT`
var questionIndex = 0
var userReponse = []
const chatbotTypingComponent = `
    <div class="chatbot-typing">
        <p>
            <strong> ChatBot : </strong>
            <div class="chatbot-dot"></div>
            <div class="chatbot-dot"></div>
            <div class="chatbot-dot"></div>
        </p>
    </div>
`

// dom elements identifiers
var chatWindow = document.getElementById("chat-window")
var chatbotTypingDOMContainer = document.getElementById("chatbot-typing-msg")
var userInput = document.getElementById("message")
var form = document.getElementById("chatForm")

const initiateConversation = () => {

    chatbotTypingDOMContainer.innerHTML = ""
    chatMsgOUtput.innerHTML += `
        <p><strong> ChatBot :</strong> Hey👋 I am a ChatBot. How can I help you today? </p>
    `
    chatWindow.scrollTo(0, chatWindow.scrollHeight)
}

const chatbotTyping = () => {
    chatbotTypingDOMContainer.innerHTML = chatbotTypingComponent
    chatWindow.scrollTo(0, chatWindow.scrollHeight);
}

const showQuestion = (question, additionalHTML = "") => {
    chatbotTypingDOMContainer.innerHTML = ""
    chatMsgOUtput.innerHTML += `<p><strong> ChatBot :</strong> ${question} </p>`
    if (additionalHTML.trim().length) {
        chatMsgOUtput.innerHTML += additionalHTML
    }
    chatWindow.scrollTo(0, chatWindow.scrollHeight);
}

window.addEventListener("DOMContentLoaded", () => {
    initiateConversation()
}, false)

const chattingThroughChatGPT = () => {
    if ((userInput.value ?? "").trim().length) {
        socket.emit("chat", {
            userId,
            userType: "user",
            content: userInput.value.trim()
        })
    } else {
        console.log("Enter a valid msg :)")
    }

    userInput.value = ""
    return
}

form.addEventListener("submit", (e) => {
    e.preventDefault()

    switch (chatType) {
        case "chatGPT": chattingThroughChatGPT()
            break
        default: console.log("invalid chatType", chatType)
    }
})

socket.on("chat", function (msg) {
    console.log(`msg`, msg)
    // chatbotTypingDOMContainer.innerHTML = ""
    // chatWindow.scrollTo(0, chatWindow.scrollHeight);

    if (userId && userId != msg.userId) {
        return false
    }

    userId = msg.userId

    if ((msg.content ?? "").trim().length) {
        if (msg.userType === "system") {
            if (msg.content === "initiate") {
                setTimeout(() => {
                    chatbotTyping()
                }, 4000)
                setTimeout(() => {
                    initiateConversation()
                }, 5000)
            } else if (msg.content === "searching") {
                chatbotTyping()
            } else {
                setTimeout(() => {
                    showQuestion(msg.content)
                }, 1500)
            }
        } else if (msg.userType === "user") {
            chatMsgOUtput.innerHTML += `<p class="text-end"><strong> Me :</strong> ${msg.content} </p>`
            chatWindow.scrollTo(0, chatWindow.scrollHeight);
            setTimeout(() => {
                chatbotTyping()
            }, 1500)
        }
    }
})

const chatBotArea = () => {
    var x = document.getElementById("chat-area-hideorshow")
    if (x.style.display === "none") {
        x.style.display = "block"
    } else {
        x.style.display = "none"
    }
}