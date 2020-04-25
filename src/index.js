const path = require('path')
const http = require('http')
const express = require('express')
const Filter = require('bad-words')
const socketio = require('socket.io')

const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users')
const { generateMessage, generateLocation} = require('./utils/messages')
const port = process.env.PORT || 3000

const app = express()
const server = http.createServer(app) 
const io = socketio(server)

const publicDirPath = path.join(__dirname,'../public');

app.use(express.static(publicDirPath));

app.get('', async (req, res) => {
    await res.render('index')
})

let message = 'welcome'

io.on('connection', (socket) => {
    console.log('New Connection')
    
    socket.on('join', ({username, room} , callback) => {

        const { error, user } = addUser({ id: socket.id, username, room})
        if(error){
           return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('Admin ',message))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin ',user.username + ' has joined the room'))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUserInRoom(user.room)
        })

        callback()
    })
    socket.on('sendMessage', (connectionMessage, callback) => {
        const user = getUser(socket.id)
        if(user){
            const filter = new Filter()
            if(filter.isProfane(connectionMessage)){
                return callback('Profanity is not allowed')
            }
            io.to(user.room).emit('message', generateMessage(user.username, connectionMessage))
        }
        callback('Delivered');
    })
    socket.on('sendLocation', ({ latitude , longitude}, callback) => {
        const user = getUser(socket.id)
        if(user){
            var locationURL = 'https://google.com/maps?q=' + latitude + ',' + longitude
            io.to(user.room).emit('locationMessage', generateLocation(user.username, locationURL))
        }
            //   var locationURL = 'https://google.com/maps?q=' + latitude + ',' + longitude
            // io.emit('locationMessage', generateLocation(locationURL))
        callback()
    })
    socket.on('disconnect', () => {

        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin ',user.username+' has disconnected'))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
        
    })
    
})

server.listen(port)