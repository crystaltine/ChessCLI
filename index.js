const express = require('express');
const http = require('http');

const cors = require('cors');
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: '*', }
});

const port = process.env.PORT || 8080;

const currIDs = new Set();

// checkroom endpoint
app.get('/checkroom', (req, res) => {
    const id = req.query.id;
    if (currIDs.has(Number.parseInt(id))) {
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
        
        // if no id, disallow
        if (!id) {
            console.log('no id\x1b[31m movemade request rejected\x1b[0m')
            return;
        }

        console.log(`move made \x1b[32m${move}\x1b[0m in room \x1b[33m${id}\x1b[0m`);

        // Send move to all clients in room
        io.to(Number.parseInt(id)).emit('moveplayed', move);
    });

    socket.on('joinroom', (roomID) => {

        // remove socket from all rooms
        for (const room of socket.rooms) {
            console.log(`(join) leave room\x1b[36m ${socket.id}\x1b[0m left \x1b[33m${room}\x1b[0m`)
            socket.leave(room);
        }

        // add socket to room
        socket.join(Number.parseInt(roomID));
        console.log(`join room \x1b[32m${socket.id}\x1b[0m joined \x1b[33m${roomID}\x1b[0m`);
        socket.emit('roomjoined', "ok");
    })

    socket.on('createroom', () => {
        const roomID = genRoomID();
        if (roomID === -1) {
            socket.emit('norooms');
            return;
        }

        // remove socket from all rooms
        for (const room of socket.rooms) {
            console.log(`(create) leave room\x1b[36m ${socket.id}\x1b[0m left \x1b[33m${room}\x1b[0m`)
            socket.leave(room);
        }

        currIDs.add(roomID);
        socket.join(roomID);
        console.log(`create room \x1b[32m${socket.id}\x1b[0m opened \x1b[33m${roomID}\x1b[0m`);
        socket.emit('roomcreated', roomID);
    })

    socket.on('actionmade', (data) => {

        const {actionType, roomID} = JSON.parse(data);

        // if no roomID, disallow
        if (!roomID) {
            console.log('no id\x1b[31m actionmade request rejected\x1b[0m')
            return;
        }
        // actionType can be: 'resign', 'offerdraw', 'acceptdraw', 'rejectdraw'
        // Send action to all clients in room
        console.log(`action made\x1b[32m ${actionType}\x1b[0m in room \x1b[33m${roomID}\x1b[0m`);
        io.to(Number.parseInt(roomID)).emit('action', actionType);
    })
});

io.on('disconnect', (socket) => {

    // Get socket room
    const room = socket.rooms[0];

    // Send message to all clients in room
    socket.to(Number.parseInt(room)).emit('playerleft');

    console.log(`\x1b[31mClosed\x1b[0m ${socket.id}`);
});

server.listen(port, () => {
    console.log(`HI! Server listening on port ${port}`);
});