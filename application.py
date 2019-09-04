import eventlet
# eventlet.monkey_patch()

import os
import time
import json
from collections import deque

from flask import Flask, render_template, request, session
from flask_session import Session
from flask_socketio import SocketIO, emit, join_room, leave_room


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app, async_mode="eventlet")

# # Configure session to use filesystem
# app.config["SESSION_PERMANENT"] = False
# app.config["SESSION_TYPE"] = "filesystem"
# Session(app)

rooms = {}
# each room will have a deque of messages
rooms["#general"] = deque()

@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")
    else:
        nickname = request.form.get("nickname")
        # session["user"] = nickname
        return render_template("index.html", nickname=nickname, rooms=rooms)

@socketio.on("get channels")
def get_channels():
    current_channels = list(rooms)
    emit("receive channels", current_channels)

@socketio.on("submit msg")
def handle_message(message, nickname, current_room):
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
    emit("on connection", nickname, broadcast=True, include_self=False)

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected', flush=True)
    emit("disconnected", broadcast=True)


@socketio.on("create channel")
def create_channel(name):
    rooms[name] = deque()
    emit("broadcast channel", name, broadcast=True)

@socketio.on('join')
def on_join(room):
    join_room(room)
    messages = list(rooms.get(room))
    emit("render room", messages)

@socketio.on('leave')
def on_leave(room):
    leave_room(room)

if __name__ == '__main__':
    socketio.run(app)