# Flack - a single page web application built for real time communication

Live link: https://chat-flack.herokuapp.com

## About

Flack is an online messaging service, similar in spirit to Slack. Users are able to sign into the site with a display name, create channels (i.e. chatrooms) to communicate in, as well as see and join existing channels. Once a channel is selected, users are able to send and receive messages with one another in real time.

#### Challenges and accomplishments:
* planning, implementing, and testing of a full stack application from a list of business specifications
* displaying proper timezone information based on user location
* real time connection and disconnection events
* storing messages and channels server side and performantly displaying them
* responsive styling utilizing CSS Grid
* gained comfort with the Socket.IO library, both in Python and JavaScript
* utilized AJAX and websockets for full duplex communication
* deployment to Heroku
 
### Dependencies
* Flask
* Flask_session
* Flask-SocketIO
* eventlet

### What's included:

**`application.py`** - server side logic

**`/templates/`** - folder containing HTML files
* template.html - template for web app pages
* login.html - landing page where user can choose a nickname
* index.html - primary html file

**`/static/`** - folder containing stylesheets, scripts, and images
* styles.css - main stylesheet
* scripts.js - main client side logic




