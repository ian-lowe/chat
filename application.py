import os
import time

from flask import Flask, render_template, request, session
from flask_session import Session
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# # Configure session to use filesystem
# app.config["SESSION_PERMANENT"] = False
# app.config["SESSION_TYPE"] = "filesystem"
# Session(app)

rooms = ["#general"]

@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")
    else:
        nickname = request.form.get("nickname")
        # session["user"] = nickname
        return render_template("index.html", nickname=nickname, rooms=rooms)

@socketio.on("submit msg")
def handle_message(message, nickname, current_room):
    # get timestamp for msg
    timestamp = time.strftime("%I:%M%p", time.localtime())
    emit("broadcast msg", (message, nickname, timestamp), broadcast=True, room=current_room)

@socketio.on("user connected")
def test_connect(nickname):
    emit("on connection", nickname, broadcast=True, include_self=False)

# doesnt create channel on server side, but broadcasts a channel name to connected clients
@socketio.on("create channel")
def create_channel(name):
    rooms.append(name)
    emit("broadcast channel", name, broadcast=True)

# joins an arbritary channel name. Doesn't have to be created before hand.
@socketio.on('join')
def on_join(room):
    join_room(room)

@socketio.on('leave')
def on_leave(room):
    leave_room(room)
