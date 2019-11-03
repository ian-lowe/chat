const socket = io();

const leftSidebar = document.querySelector("#left-side-bar");
const channelBox = document.querySelector("#channel-box");
const messageBox = document.querySelector("#message-box");
const chatBox = document.querySelector("#chat-box");
const chatMessages = document.querySelector("#chat-messages");

// nickname and currentRoom taken from index.html

// set up chat room on initial visit
socket.on("connect", function () {
    //reload page if navigated to page through history
    if(performance.navigation.type == 2) {
        location.reload();
    }

    socket.emit("join", currentRoom, nickname);
    messageBox.setAttribute("placeholder", "Message " + currentRoom);

    socket.emit("get channels");
    socket.on("receive channels", function (currentChannels) {
        for (let i = 0; i < currentChannels.length; i++) {
            const newDiv = document.createElement("div");
            newDiv.innerText = currentChannels[i];
            newDiv.addEventListener("click", function() {
                initChannel(newDiv, currentChannels[i]);
            });
            leftSidebar.append(newDiv);
        }

        const channels = document.querySelectorAll('.div1 div');
        for (channel of channels) {
            if (channel.innerText == currentRoom) {
                channel.classList.add("selected-channel");
            }
        }
    });

    document.querySelector("#channel-btn").addEventListener("click", function () {
        sumbitChannel();
    });

    channelBox.addEventListener("keyup", function () {
        if (event.key === "Enter") {
            sumbitChannel();
        }
    });

    // functionality for sending a message
    document.querySelector("#message-btn").addEventListener("click", function () {
        submitMessage();
        if (window.innerWidth > 499) {
            messageBox.focus();
        }
    });

    messageBox.addEventListener("keyup", function () {
        if (event.key === "Enter") {
            submitMessage();
        }
    });

    socket.emit("user connected", nickname);
});

// set up any newly created channel to accept click event
socket.on("broadcast channel", function (channelName) {
    // create div for channel
    const newDiv = document.createElement("div");
    newDiv.innerText = channelName;
    leftSidebar.append(newDiv);
    // set up newly created channel to accept click event
    newDiv.addEventListener("click", function () {
        initChannel(newDiv, channelName);
    });
});

socket.on("render room", function (messages) {
    while (chatMessages.hasChildNodes()) {
        chatMessages.removeChild(chatMessages.lastChild);
    }
    for (msg of messages) {
        const nameTime = document.createElement("li");
        const text = document.createElement("li");
        const localTime = new Date(msg["timestamp"]);
        const localTimeParsed = localTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        nameTime.innerHTML = `<span>${msg["nickname"]}</span> ${localTimeParsed}:`;
        text.innerText = `${msg["message"]}`;
        nameTime.classList.add("name-time");
        text.classList.add("text");

        chatMessages.append(nameTime);
        chatMessages.append(text);
    }
    chatBox.scrollTop = chatBox.scrollHeight - chatBox.clientHeight;
});

socket.on("broadcast msg", function (message, nickname, timestamp) {
    const localTime = new Date(timestamp);
    const localTimeParsed = localTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    const nameTime = document.createElement("li");
    const text = document.createElement("li");
    nameTime.innerHTML = `<span>${nickname}</span> ${localTimeParsed}:`;
    text.innerText = `${message}`;
    nameTime.classList.add("name-time");
    text.classList.add("text");

    chatMessages.append(nameTime);
    chatMessages.append(text);
    // keep chat scrolled to the bottom unless the user is scrolled up to view previous messages
    const messageHeight = chatBox.scrollTop + text.offsetHeight + nameTime.offsetHeight;
    if (messageHeight >= (chatBox.scrollHeight - chatBox.clientHeight)) {
        chatBox.scrollTop = chatBox.scrollHeight - chatBox.clientHeight;
    }
});

socket.on("on connection", function (nickname) {
    const li = document.createElement("li");
    li.innerText = `${nickname} has connected`;
    li.classList.add("connection");
    chatMessages.append(li);
    chatBox.scrollTop = chatBox.scrollHeight - chatBox.clientHeight;
});

socket.on("disconnected", function (nickname) {
    const li = document.createElement("li");
    li.innerText = `${nickname} has disconnected`;
    li.classList.add("disconnection");
    chatMessages.append(li);
    chatBox.scrollTop = chatBox.scrollHeight - chatBox.clientHeight;
});

function initChannel(self, channelName) {
    if (self.innerText !== currentRoom) {
        document.title = "Flack " + self.innerText;
        messageBox.setAttribute("placeholder", "Message " + self.innerText);
        const channels = document.querySelectorAll(".div1 div");
        for (channel of channels) {
            channel.classList.remove("selected-channel");
        }
        self.classList.add("selected-channel");
        // on larger browsers, keep message box in focus regardless of channel switch
        // needed because on phones, focusing of the input brings up the keyboard
        if (window.innerWidth > 499) {
            messageBox.focus();
        }
        socket.emit("leave", currentRoom);
        currentRoom = channelName;
        socket.emit("join", currentRoom, nickname);
    }
}

function sumbitChannel() {
    let channelName = channelBox.value;
    if (channelName == "") {
        return;
    }
    channelName = channelName.toLowerCase();
    channelBox.value = "";
    socket.emit("create channel", channelName);
}

function submitMessage() {
    const message = messageBox.value;
    if (message == "") {
        return;
    }
    messageBox.value = "";
    socket.emit("submit msg", message, nickname, currentRoom);
}
