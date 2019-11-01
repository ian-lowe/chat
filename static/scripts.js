const socket = io();

const msgInput = document.querySelector(".div4 input");
const channelInput = document.getElementById("new-channel");
const leftSideBar = document.querySelector(".div1");
const channels = document.querySelectorAll(".div1 div");
const messageList = document.querySelector("#messages");
const chatBody = document.querySelector('.div3');

// nickname and current_room taken from index.html

// set up chat room on initial visit
socket.on("connect", function () {
    //reload page if navigated to page through history
    if(performance.navigation.type == 2){
        location.reload();
    }

    socket.emit("join", current_room, nickname);
    msgInput.setAttribute("placeholder", "Message " + current_room);

    socket.emit("get channels");
    socket.on("receive channels", function (current_channels) {
        for (let i = 0; i < current_channels.length; i++) {
            let new_div = document.createElement("div");
            new_div.innerText = current_channels[i];
            leftSideBar.append(new_div);
            new_div.addEventListener("click", function () {
                if (new_div.innerText !== current_room) {
                    // update page title to reflect new channel
                    document.title = "Flack " + this.innerText;
                    // set message placeholder to reflect current channel
                    msgInput.setAttribute("placeholder", "Message " + this.innerText);
                    // style channels to reflect selection
                    for (channel of channels) {
                        channel.classList.remove("selected-channel");
                    }
                    this.classList.add("selected-channel");
                    // on larger browsers, keep message box in focus regardless of channel switch
                    // needed because on phones, focusing of the input brings up the keyboard
                    if (window.innerWidth > 499) {
                        msgInput.focus();
                    }
                    // join room
                    socket.emit("leave", current_room);
                    current_room = current_channels[i];
                    socket.emit("join", current_room, nickname);
                }
            });
        }

        for (channel of channels) {
            if (channel.innerText == current_room) {
                channel.classList.add("selected-channel");
            }
        }
    });

    // functionality for channel creation
    document.querySelectorAll("button")[0].addEventListener("click", function () {
        let channel_name = channelInput.value;
        if (channel_name == "") {
            return;
        }
        channel_name = channel_name.toLowerCase();
        channelInput.value = "";
        socket.emit("create channel", channel_name);
    });

    channelInput.addEventListener("keyup", function () {
        if (event.key === "Enter") {
            let channel_name = channelInput.value;
            if (channel_name == "") {
                return;
            }
            channel_name = channel_name.toLowerCase();
            channelInput.value = "";
            socket.emit("create channel", channel_name);
        }
    });

    // functionality for sending a message
    document.querySelectorAll("button")[1].addEventListener("click", function () {
        let message = msgInput.value;
        if (message == "") {
            return;
        }
        msgInput.value = "";
        if (window.innerWidth > 499) {
            msgInput.focus();
        }
        socket.emit("submit msg", message, nickname, current_room);
    });

    msgInput.addEventListener("keyup", function () {
        if (event.key === "Enter") {;
            let message = msgInput.value;
            if (message == "") {
                return;
            }
            msgInput.value = "";
            socket.emit("submit msg", message, nickname, current_room);
        }
    });

    socket.emit("user connected", nickname);
});

// set up any newly created channel to accept click event
socket.on("broadcast channel", function (channel_name) {
    // create div for channel
    let new_div = document.createElement("div");
    new_div.innerText = channel_name;
    leftSideBar.append(new_div);
    // set up newly created channel to accept click event
    new_div.addEventListener("click", function () {
        if (new_div.innerText !== current_room) {
            // update page title to reflect new channel
            document.title = "Flack " + this.innerText;
            // set message placeholder to reflect current channel
            msgInput.setAttribute("placeholder", "Message " + this.innerText);
            // style channels to reflect selection
            for (channel of channels) {
                channel.classList.remove("selected-channel");
            }
            this.classList.add("selected-channel");
            // on larger browsers, keep message box in focus regardless of channel switch
            // needed because on phones, focusing of the input brings up the keyboard
            if (window.innerWidth > 499) {
                msgInput.focus();
            }
            // join room
            socket.emit("leave", current_room);
            current_room = channel_name;
            socket.emit("join", current_room, nickname);
        }
    });
});

socket.on("render room", function (messages) {
    while (messageList.hasChildNodes()) {
        messageList.removeChild(messageList.lastChild);
    }
    for (msg of messages) {
        const name_time = document.createElement("li");
        const text = document.createElement("li");
        var local_time = new Date(msg["timestamp"]);
        local_time_parsed = local_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        name_time.innerHTML = `<span>${msg["nickname"]}</span> ${local_time_parsed}:`;
        text.innerText = `${msg["message"]}`;
        name_time.classList.add("name-time");
        text.classList.add("text");

        messageList.append(name_time);
        messageList.append(text);
    }
    chatBody.scrollTop = chatBody.scrollHeight - chatBody.clientHeight;
});

socket.on("broadcast msg", function (message, nickname, timestamp) {
    var local_time = new Date(timestamp);
    local_time_parsed = local_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    const name_time = document.createElement("li");
    const text = document.createElement("li");
    name_time.innerHTML = `<span>${nickname}</span> ${local_time_parsed}:`;
    text.innerText = `${message}`;
    name_time.classList.add("name-time");
    text.classList.add("text");

    document.messageList.append(name_time);
    document.messageList.append(text);
    // keep chat scrolled to the bottom unless the user is scrolled up to view previous messages
    let message_height = chatBody.scrollTop + text.offsetHeight + name_time.offsetHeight;
    if (message_height >= (chatchatBody.scrollHeight -chatBody.clientHeight)) {
       chatBody.scrollTop = chatBody.scrollHeight -chatBody.clientHeight;
    }
});

socket.on("on connection", function (nickname) {
    const li = document.createElement("li");
    li.innerText = `${nickname} has connected`;
    li.classList.add("connection");
    document.messageList.append(li);
    chatBody.scrollTop = chatBody.scrollHeight - chatBody.clientHeight;
});

socket.on("disconnected", function (nickname) {
    const li = document.createElement("li");
    li.innerText = `${nickname} has disconnected`;
    li.classList.add("disconnection");
    document.messageList.append(li);
    chatBody.scrollTop = chatBody.scrollHeight - chatBody.clientHeight;
});
