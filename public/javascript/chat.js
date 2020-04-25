const socket = io()

const $messageForm = document.querySelector('#messageForm')
const $messageInput = document.querySelector('.messageInput')
const $messageButton = document.querySelector('.messageButton')
const $sendLocation = document.querySelector('#sendLocation')
const $messageDiv = document.querySelector('#message')
const $sidebar = document.querySelector('#sidebar')

const $messageTemplate = document.querySelector('#messageTemplate').innerHTML
const $locationTemplate = document.querySelector('#locationTemplate').innerHTML
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messageDiv.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    const visibleHeight = $messageDiv.offsetHeight
    const containerHeight = $messageDiv.scrollHeight
    const scrollOffset = $messageDiv.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messageDiv.scrollTop = $messageDiv.scrollHeight
    }
}

socket.on('message', (message) => {
    // console.log(message)
    const html = Mustache.render($messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm a')
    })
    $messageDiv.insertAdjacentHTML('beforeend', html)
    autoscroll()
})
socket.on('locationMessage', (url) => {
    //console.log(url)
    const html = Mustache.render($locationTemplate, {
        username:url.username,
        url:url.url,
        createdAt: moment(message.createdAt).format('hh:mm a')
    })
    $messageDiv.insertAdjacentHTML('beforeend', html)
    autoscroll()
})
socket.on('roomData' , ({ room, users }) => {
    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageButton.setAttribute('disabled', 'disabled')

    var connectionMessage = e.target.elements.message.value;
    socket.emit('sendMessage', connectionMessage, (error) => {

        $messageButton.removeAttribute('disabled')
        $messageInput.value = ' '
        $messageInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('message Delivered!')
    })
})

$sendLocation.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('geolocation is not supported by your browser')
    }
    $sendLocation.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocation.removeAttribute('disabled')
            console.log('location shared!')
        })
        // console.log(position.coords.latitude)
        // console.log(position.coords.longitude)
    })
})
socket.emit('join', { username, room }, (error) =>{
    if(error){
        alert(error)
        location.href = '/'
    } 
})