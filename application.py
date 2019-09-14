import eventlet
# eventlet.monkey_patch()

import os
import time
import json
from collections import deque

from flask import Flask, render_template, request, session, flash, redirect, url_for
from flask_session import Session
from flask_socketio import SocketIO, emit, join_room, leave_room


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app, async_mode="eventlet")

# Configure session to use filesystem
# app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# each room will have a deque of messages
# each message will be a list of user, timestamp, and msg text
rooms = {}
rooms["#general"] = deque()

# users dict will contain sessionIDS with nicknames as values
users = {}

# last_room dict will pair users with their last visited room
last_room = {}

@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        if session.get("user") == None:
            return render_template("login.html")
        else:
            nickname = session.get("user")
            current_room = last_room.get(nickname) or "#general"
            return render_template("index.html", nickname=nickname, has_session=True, current_room=current_room)
    else:
        nickname = request.form.get("nickname")
        if nickname in users.values():
            flash("username taken, please choose another.")
            return redirect(url_for('login'))
        current_room = "#general"
        # session["room"] = current_room
        session["user"] = nickname
        return render_template("index.html", nickname=nickname, current_room=current_room)

@socketio.on("get channels")
def get_channels():
    current_channels = list(rooms)
    emit("receive channels", current_channels)

@socketio.on("submit msg")
def handle_message(message, nickname, current_room):
    test_msg = message.strip()
    if test_msg == "":
        return
    # get timestamp for msg
    timestamp = time.strftime("%I:%M%p", time.localtime())
    # create msg object to store msg, nick, and time
    new_message = {
        "message": message,
        "nickname": nickname,
        "timestamp": timestamp,
    }
    # store 100 most recent msg objects server side
    if len(rooms[current_room]) >= 100:
        rooms[current_room].popleft()
    rooms[current_room].append(new_message)

    emit("broadcast msg", (message, nickname, timestamp), broadcast=True, room=current_room)

@socketio.on("user connected")
def connect(nickname):
    if nickname in users.values():
        # user opened another tab
        return
    else:
        users[request.sid] = nickname
        emit("on connection", nickname, broadcast=True, include_self=False)

@socketio.on('disconnect')
def test_disconnect():
    if users.get(request.sid) is not None:
        nickname = users.get(request.sid)
        users.pop(request.sid)
        emit("disconnected", nickname, broadcast=True)

@socketio.on("create channel")
def create_channel(name):
    test_name = name.strip()
    if test_name == "":
        return
    test_name = test_name.replace(" ", "-")
    if ("#" + test_name) in rooms:
        return
    rooms["#" + test_name] = deque()
    emit("broadcast channel", "#" + test_name, broadcast=True)

@socketio.on('join')
def on_join(room, nickname):
    try:
        join_room(room)
        last_room[nickname] = room
        messages = list(rooms.get(room))
        emit("render room", messages)
    except:
        print("user needs browser reset")

@socketio.on('leave')
def on_leave(room):
    leave_room(room)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')