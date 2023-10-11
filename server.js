const express = require('express');
const io = require('socket.io')(3001, {
    cors: { origin: '*' }
});
const app = express();
const port = 3000;

const currIDs = new Set();

// checkroom endpoint
app.get('/checkroom/:id', (req, res) => {
    const id = req.params.id;
    if (currIDs.has(id)) {
        console.log(`roomcheck\x1b[32m room ${id} exists\x1b[0m`);
        res.send("true");
    } else {
        console.log(`roomcheck\x1b[31m room ${id} does not exist\x1b[0m`);
        res.send("false");
    }
});

/**
 * Generates a 5-digit room ID. Returns -1 if no room ID is available.
 */
function genRoomID() {
    if (currIDs.size == 100000) {
        console.log("roomgen\x1b[31m no rooms available")
        return -1;
    }

    let id = Math.floor(Math.random() * 100000);
    while (currIDs.has(id)) {
        id = Math.floor(Math.random() * 100000);
    }

    currIDs.add(id);
    console.log(`roomgen\x1b[32m opened room ${id}\x1b[0m`);

    return id;
}

io.on('connection', (socket) => {
    console.log(`\x1b[32mconnected\x1b[0m ${socket.id}`);
    
    socket.on('movemade', (data) => {
        const {move, id} = JSON.parse(data);
        console.log(`move made \x1b[32m${move}\x1b[0m in room \x1b[33m${id}\x1b[0m`);

        // Send move to all clients in room
        socket.to(id).emit('moveplayed', move);
    });

    socket.on('joinroom', (roomID) => {
        // add socket to room
        socket.join(roomID);
        console.log(`join room \x1b[32m${socket.id}\x1b[0m joined \x1b[33m${roomID}\x1b[0m`);
        socket.emit('roomjoined', "ok");
    })

    socket.on('createroom', () => {
        const roomID = genRoomID();
        if (roomID == -1) {
            socket.emit('roomfull');
            return;
        }

        socket.join(roomID);
        console.log(`create room \x1b[32m${socket.id}\x1b[0m opened \x1b[33m${roomID}\x1b[0m`);
        socket.emit('roomcreated', roomID);
    })

    socket.on('action', ({actionType, roomID}) => {
        // actionType can be: 'resign', 'offerdraw', 'acceptdraw', 'rejectdraw'
        // Send action to all clients in room
        socket.to(roomID).emit('action', actionType);
    })
});

io.on('disconnect', (socket) => {

    // Get socket room
    const room = socket.rooms[0];

    // Send message to all clients in room
    socket.to(room).emit('playerleft');

    console.log(`\x1b[31mClosed\x1b[0m ${socket.id}`);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});