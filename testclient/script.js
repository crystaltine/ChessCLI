const socket = io('ws://localhost:3001');
console.log("Should have connected again")

socket.on('re', (data) => {
    // Add to <ul> with id 'messages'
    const li = document.createElement('li');
    li.innerHTML = data;
    document.getElementById('messages').appendChild(li);
});

document.getElementById('submit').addEventListener('click', function() {

    // Get room id from the 'roomid' input
    const roomid = document.getElementById('roomid').value;

    console.log(`sending message ${document.getElementById('input').value}`)

    // Send to websocket at ws://localhost:3001
    socket.emit('movemade', JSON.stringify({
        id: roomid,
        move: document.getElementById('input').value
    }));
});

