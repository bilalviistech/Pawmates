const http = require('http')
const app = require('./app.js')
const server = http.createServer(app)
const { Server } = require("socket.io");
const io = new Server(server);

const User = require('./api/models/user.js')
const Message = require('./api/models/chatmessage.js')

const cluster = require('cluster')
const os = require('os')
const cpu = os.cpus().length


// Handle socket connection
io.on('connection', (socket) => {
    console.log('New user connected');
    // console.log(1)
    // Store socketId for connected user
    socket.on('openChat', async ({ username, recieversName }) => {
        console.log(username, recieversName )
        await User.updateOne({ username }, { socketId: socket.id });
        // Fetch unread messages for this user
        const unreadMessages = await Message.find({
            $or: [
                { sender: username, receiver: recieversName },
                { sender: recieversName, receiver: username }
            ]
        });
        console.log('thsi is unreadmesges :', unreadMessages)
        // return
        // Send unread messages to the user
        unreadMessages.forEach((message) => {
            socket.emit('receiveMessage', {
                sender: message.sender,
                receiver: message.receiver,
                message: message.message,
                timestamp: message.timestamp,
            });
        });

        // Mark messages as read
        await Message.updateMany({ receiver: username, sender: recieversName, read: false }, { $set: { read: true } });
    });
    // return
    // Listen for new messages from client side
    socket.on('sendMessage', async (data) => {
        const { sender, receiver, message } = data;
        console.log( sender, receiver, message)
        const newMessage = new Message({ sender, receiver, message });
        await newMessage.save();

        const receiverUser = await User.findOne({ name: receiver });
        if (receiverUser && receiverUser.socketId) {
            console.log('this is emit data.............',data);
            console.log(socket.id,receiverUser.socketId )
            io.to(receiverUser.socketId).emit('receiveMessage', data);
        }
    });

    // Handle user disconnect
    socket.on('disconnect', async () => {
        await User.updateOne({ socketId: socket.id }, { socketId: null });
        console.log('User disconnected');
    });
});


// console.log(cpu)
if (cluster.isPrimary) {
    for (i = 0; i < cpu; i++) {
        cluster.fork()
    }
}
else {
    server.listen(3000, () => {
        console.log(`server is running ${process.pid}`);
    })
}

