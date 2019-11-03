var socket = io();

const leftSidebar = document.querySelector(".div1");
const messageInput = document.querySelector(".div4 input");

// nickname and currentRoom taken from index.html

// set up chat room on initial visit
socket.on("connect", function () {
    //reload page if navigated to page through history
    if(performance.navigation.type == 2){
        location.reload();
    }

    socket.emit("join", currentRoom, nickname);
    messageInput.setAttribute("placeholder", "Message " + currentRoom);

    socket.emit("get channels");
    socket.on("receive channels", function (currentChannels) {
        for (let i = 0; i < currentChannels.length; i++) {
            let newDiv = document.createElement("div");
            newDiv.innerText = currentChannels[i];
            newDiv.addEventListener("click", function() {
                initChannel(newDiv, currentChannels[i]);
            });
            leftSidebar.append(newDiv);
        }

        let channels = document.querySelectorAll('.div1 div');
        for (channel of channels) {
            if (channel.innerText == currentRoom) {
                channel.classList.add("selected-channel");
            }
        }
    });

    // functionality for channel creation
    document.querySelectorAll("button")[0].addEventListener("click", function () {
        let channelName = document.getElementById("new-channel").value;
        if (channelName == "") {
            return;
        }
        channelName = channelName;
        channelName = channelName.toLowerCase();
        document.getElementById("new-channel").value = "";
        socket.emit("create channel", channelName);
    });

    document.querySelector(".div2 input").addEventListener("keyup", function () {
        if (event.key === "Enter") {
            let channelName = document.getElementById("new-channel").value;
            if (channelName == "") {
                return;
            }
            channelName = channelName;
            channelName = channelName.toLowerCase();
            document.getElementById("new-channel").value = "";
            socket.emit("create channel", channelName);
        }
    });

    // functionality for sending a message
    document.querySelectorAll("button")[1].addEventListener("click", function () {
        let message = messageInput.value;
        if (message == "") {
            return;
        }
        messageInput.value = "";
        if (window.innerWidth > 499) {
            messageInput.focus();
        }
        socket.emit("submit msg", message, nickname, currentRoom);
    });

    messageInput.addEventListener("keyup", function () {
        if (event.key === "Enter") {
            let message = messageInput.value;
            if (message == "") {
                return;
            }
            messageInput.value = "";
            socket.emit("submit msg", message, nickname, currentRoom);
        }
    });

    socket.emit("user connected", nickname);
});

// set up any newly created channel to accept click event
socket.on("broadcast channel", function (channelName) {
    // create div for channel
    let newDiv = document.createElement("div");
    newDiv.innerText = channelName;
    leftSidebar.append(newDiv);
    // set up newly created channel to accept click event
    newDiv.addEventListener("click", function () {
        initChannel(newDiv, channelName);
    });
});

socket.on("render room", function (messages) {
    let messageList = document.querySelector("#messages");
    while (messageList.hasChildNodes()) {
        messageList.removeChild(messageList.lastChild);
    }
    for (msg of messages) {
        const nameTime = document.createElement("li");
        const text = document.createElement("li");
        var localTime = new Date(msg["timestamp"]);
        localTimeParsed = localTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        nameTime.innerHTML = `<span>${msg["nickname"]}</span> ${localTimeParsed}:`;
        text.innerText = `${msg["message"]}`;
        nameTime.classList.add("name-time");
        text.classList.add("text");

        document.querySelector("#messages").append(nameTime);
        document.querySelector("#messages").append(text);
    }
    let messageBody = document.querySelector('.div3');
    messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
});

socket.on("broadcast msg", function (message, nickname, timestamp) {
    var localTime = new Date(timestamp);
    localTimeParsed = localTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    var messageBody = document.querySelector('.div3');
    const nameTime = document.createElement("li");
    const text = document.createElement("li");
    nameTime.innerHTML = `<span>${nickname}</span> ${localTimeParsed}:`;
    text.innerText = `${message}`;
    nameTime.classList.add("name-time");
    text.classList.add("text");

    document.querySelector("#messages").append(nameTime);
    document.querySelector("#messages").append(text);
    var messageBody = document.querySelector('.div3');
    // keep chat scrolled to the bottom unless the user is scrolled up to view previous messages
    let messageHeight = messageBody.scrollTop + text.offsetHeight + nameTime.offsetHeight;
    if (messageHeight >= (messageBody.scrollHeight - messageBody.clientHeight)) {
        messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
    }
});

socket.on("on connection", function (nickname) {
    const li = document.createElement("li");
    li.innerText = `${nickname} has connected`;
    li.classList.add("connection");
    document.querySelector("#messages").append(li);
    let messageBody = document.querySelector('.div3');
    messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
});

socket.on("disconnected", function (nickname) {
    const li = document.createElement("li");
    li.innerText = `${nickname} has disconnected`;
    li.classList.add("disconnection");
    document.querySelector("#messages").append(li);
    let messageBody = document.querySelector('.div3');
    messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
});

const initChannel = function(self, channelName) {
    if (self.innerText !== currentRoom) {
        // update page title to reflect new channel
        document.title = "Flack " + self.innerText;
        // set message placeholder to reflect current channel
        messageInput.setAttribute("placeholder", "Message " + self.innerText);
        // style channels to reflect selection
        let channels = document.querySelectorAll(".div1 div");
        for (channel of channels) {
            channel.classList.remove("selected-channel");
        }
        self.classList.add("selected-channel");
        // on larger browsers, keep message box in focus regardless of channel switch
        // needed because on phones, focusing of the input brings up the keyboard
        if (window.innerWidth > 499) {
            messageInput.focus();
        }
        // join room
        socket.emit("leave", currentRoom);
        currentRoom = channelName;
        socket.emit("join", currentRoom, nickname);
    }
}
