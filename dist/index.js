document.addEventListener("DOMContentLoaded", () => {

	// Read parameters in the url and find a nickname from them
	const params = new URLSearchParams(window.location.search);
	var nick = params.get("nick");
	// preload the nickname into the nickname input box
	if (nick) { 
		var nickbox = document.getElementById("nickbox");
		nickbox.value = nick;
	}

	// initialise the websocket connection
	const url = `ws://${window.location.hostname}:8081`;
	const connection = new WebSocket(url);

	// define functions listening to the websocket
	connection.onopen = () => {
		
		// estimate how many lines should be requested from the client
		var lines = Math.round(window.innerHeight / 12);
		// send the initial "join" message from the client, with an initial nickname and how many messages should be preloaded
		connection.send(JSON.stringify({
			event: "join",
			nickname: nick,
			lines: lines
		}));
	}

	// define a listener for errors, to be printed to the console
	connection.onerror = error => {
		console.log(`WebSocket error: ${error}`);
	}

	// define a listener for messages
	connection.onmessage = (ev) => {
		// parse the message as a json object
		var data = JSON.parse(ev.data);
		 
		//  If the message is of type "message", we can add it to the screen
		if (data.event == "message"){
			addMessage(data.content, data.nickname);
		}
	}

	// display messages on the screen for the user
	function addMessage(content, sender) {

		// Find the "messages" box in the document
		var messagesElement = document.getElementById("messages");

		// create a new message and add it as a child to the messagesElement
		var newMessage = document.createElement("div");
		newMessage.innerText = `${sender}: ${content}`;
		messagesElement.appendChild(newMessage);

		// update the scroll, so that the client has the newest message visible
		messagesElement.scrollTop = messagesElement.scrollHeight;
	}

	// send a message to the webserver	
	function sendMessage(msg) {
		// check the nickname box for a value
		nick = document.getElementById("nickbox").value;

		// Send a json object to the websocket
		connection.send(JSON.stringify({
			content: msg,
			nickname: nick,
			event: "message"
		}));
	}

	var inputBox = document.getElementById("msgbox");
	// prefocus the input box when the page is loaded
	inputBox.focus();
	// add event listener for enter key on input box
	inputBox.addEventListener("keyup", ev => {
		if (event.keyCode == 13) {
			event.preventDefault();
			sendMessage(inputBox.value);
			inputBox.value = "";
		}
	})
});		

