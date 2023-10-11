const socket = io('wss://chesscli.azurewebsites.net/');
console.log(`ws connection: ${socket}`)
let id;

socket.on('roomcreated', (roomID) => {
    id = roomID;
    document.getElementById('connectedroom').innerHTML = `Connected to room ${id}.`;
});
socket.on('norooms', (roomID) => {
    document.getElementById('connectedroom').innerHTML = `ERROR: No rooms available!`;
});
socket.on('moveplayed', (move) => {
	// add to input feed with id 'feed'
	const li = document.createElement('li');
	li.innerHTML = `Move played: ${move}`
	document.getElementById('feed').appendChild(li);
});
socket.on('action', (actionType) => {
	// add to input feed with id 'feed'
	const li = document.createElement('li');
	li.innerHTML = `Action: ${actionType}`
	document.getElementById('feed').appendChild(li);
})

document.getElementById('createroom').addEventListener('click', function() {
    // emit to createroom
    socket.emit('createroom');
});

// Join room input
document.getElementById('idsend').addEventListener('click', function() {
    // get id from input 'roomid'
    const roomid = document.getElementById('roomid').value;

    // contact /checkroom endpoint to see if room exists
    fetch(`https://chesscli.azurewebsites.net/checkroom?id=${roomid}`)
    .then(res => res.text())
    .then(data => {
		console.log(`data checkroom endpoint: ${data}`)
        if (data == "true") {
            // emit to joinroom
            socket.emit('joinroom', roomid); // TODO - assume always successful for now
			id = roomid;
            document.getElementById('roomjoinerror').innerHTML = ``;
			document.getElementById('connectedroom').innerHTML = `Connected to room ${id}.`;
        } else {
            // tell user room does not exist
            document.getElementById('roomjoinerror').innerHTML = `Room ${roomid} does not exist!`;
        }
    })
    .catch(err => console.log(err));
});

// Send move
document.getElementById('movesend').addEventListener('click', function() {
	// get move string from input 'moveinput'
	const move = document.getElementById('moveinput').value;

	// send to ws 'movemade'
	socket.emit('movemade', JSON.stringify({id, move}));
});

// Send action
document.getElementById('actionsend').addEventListener('click', function() {
	// Get action from <select> with id 'actionselect'
	const actionType = document.getElementById('actionselect').value;
	console.log("actionType: " + actionType);

	// Send to ws 'actionmade'
	socket.emit('actionmade', JSON.stringify({actionType, roomID: id}));
});