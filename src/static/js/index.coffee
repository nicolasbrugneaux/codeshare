socket = io.connect('http://localhost/8888')
socket.on('news', (data) ->
	console.log data
	socket.emit('my other event', { my: 'data' })
)