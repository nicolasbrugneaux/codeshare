###
 * codeshare
 * https://github.com/nicolasbrugneaux/codeshare
 *
 * Copyright (c) 2013 Nicolas Brugneaux
 * Licensed under the MIT license.
###

###
	Modules dependencies
###

express = require 'express'
routes = require './routes'
http = require 'http'
path = require 'path'
io = require 'socket.io'

codeshare = module.exports = express()

###
	Configuration
###

codeshare.configure( () ->

	# all environments
	codeshare.set('port', process.env.PORT or 8888)
	codeshare.set('views', __dirname + '/views')
	codeshare.set('view engine', 'jade')
	codeshare.use(express.logger('dev'))
	codeshare.use(express.bodyParser())
	codeshare.use(express.methodOverride())
	codeshare.use(express.cookieParser('I Love Cookies <3'))
	MemStore = express.session.MemoryStore
	codeshare.use(express.session({secret: 'I Love Cookies <3', store: MemStore({
		reapInterval: 60000 * 10
	})}))
	codeshare.use(express.static(path.join(__dirname, 'static')))
	codeshare.use('/static/public', express.static(path.join(__dirname, 'public')))
	codeshare.use(codeshare.router)

	# development only
	if codeshare.get('env') is 'development'
			codeshare.use(express.errorHandler({ dumpExceptions: true, showStack: true }))

	# production only
	if codeshare.get('env') is 'production'
			codeshare.use(express.errorHandler())
)

#devevelopment only
if codeshare.get('env') is 'development'
  codeshare.use(express.errorHandler())


###
	Routes
###

#	serve index
codeshare.get('/', routes.index)

# instantiate server
server = http.createServer(codeshare)
io = io.listen(server)

# instantiate socket.io
io.sockets.on('connection', (socket) ->
	socket.broadcast.emit('news', {hello: 'world'})
	socket.on('my other event', (data) ->
		console.log data
	)
)

server.listen(codeshare.get('port'), () ->
	console.log('Express server listening on port ' + codeshare.get('port'))
)
