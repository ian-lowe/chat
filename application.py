import os

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

counter = 0
rooms = ["rm1", "rm2"]

@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")
    else:
        nickname = request.form.get("nickname")
        # session["user"] = nickname
        return render_template("index.html", nickname=nickname, rooms=rooms)

@socketio.on("my event")
def handle_message(nickname, count):
    global counter
    global rooms
    counter += count
    emit("my response", (nickname, counter), broadcast=True, room=rooms[0])

@socketio.on("user connected")
def test_connect(nickname):
    emit("on connection", nickname, broadcast=True, include_self=False)

@socketio.on("create channel")
def create_channel(name):
    emit("broadcast channel", name, broadcast=True)


@socketio.on('join')
def on_join(room):
    join_room(room)
