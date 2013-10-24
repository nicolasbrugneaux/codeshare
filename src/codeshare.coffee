###
# codeshare
# https://github.com/nicolasbrugneaux/codeshare
#
# Copyright (c) 2013 Nicolas Brugneaux
# Licensed under the MIT license.
###

###
	Modules dependencies
###

express = require 'express'
http = require 'http'
path = require 'path'
io = require 'socket.io'
hljs = require 'highlight.js'
fs = require 'fs'


codeshare = module.exports = express()

###
	Configuration
###

codeshare.configure ->

	# all environments
	codeshare.set 'port', process.env.PORT or 8888
	codeshare.set 'views',"#{__dirname}/views"
	codeshare.set 'view engine', 'jade'
	codeshare.use express.logger('dev')
	codeshare.use express.bodyParser()
	codeshare.use express.methodOverride()
	codeshare.use express.cookieParser('I Love Cookies <3')
	MemStore = express.session.MemoryStore
	codeshare.use express.session {
		secret: 'I Love Cookies <3'
		store: MemStore {
			reapInterval: 60000 * 10
		}
	}
	codeshare.use express.static(path.join(__dirname, 'static'))
	codeshare.use '/static/public', express.static(path.join(__dirname, 'public'))
	codeshare.use codeshare.router

	# development only
	if codeshare.get('env') is 'development'
			codeshare.use express.errorHandler({ dumpExceptions: true, showStack: true })

	# production only
	if codeshare.get('env') is 'production'
			codeshare.use express.errorHandler()

#devevelopment only
if codeshare.get('env') is 'development'
  codeshare.use express.errorHandler()


# instantiate server
server = http.createServer(codeshare)
io = io.listen(server)

decodeHTMLEntities = (text) ->
	entities = [
		['apos', '\'']
		['amp', '&']
		['lt', '<']
		['gt', '>']
		['nbsp', '	']
	]
	for entity in entities
		text = text.replace new RegExp("&#{entity[0]};", 'g'), entity[1]
	text

class Editor
	constructor: ->
		@content = "class Editor\n	constructor: ->\n	@content = 'some code'\n	@syntax	 = 'coffeescript'\n	@theme   = 'github'\n	@syntaxes = fs.readFileSync(path.join(__dirname, 'static/syntaxes')).toString().split('\\n')\n	@themes = fs.readFileSync(path.join(__dirname, 'static/themes')).toString().split('\\n')"
		@syntax	 = 'coffeescript'
		@theme   = 'idea'
		@syntaxes = fs.readFileSync(path.join(__dirname, 'static/syntaxes')).toString().split('\n')
		@themes = fs.readFileSync(path.join(__dirname, 'static/themes')).toString().split('\n')

myEditor = new Editor
# instantiate socket.io
io.sockets.on 'connection', (socket) ->

	myEditor.content = decodeHTMLEntities hljs.highlight(
		myEditor.syntax,
		myEditor.content
			.replace /<(?!br\s*\/?)[^>]+>/g, '' # remove html tags but br
			.replace /<br>/g, '\n' #replace br with \n
	)
	.value
	socket.emit 'init', { editor: myEditor }

	socket.on 'changedContent', (data) ->
		myEditor.content = hljs
			.highlight(
				myEditor.syntax,
				data.new_content
					.replace /<(?!br\s*\/?)[^>]+>/g, '' # remove html tags but br
					.replace /<br>/g, '\n' #replace br with \n
			)
			.value
		socket.broadcast.emit 'changedContent', { new_content: decodeHTMLEntities(myEditor.content) }

	socket.on 'updateContent', (data) ->
		myEditor.content = hljs
			.highlight(
				myEditor.syntax,
				data.new_content
					.replace /<(?!br\s*\/?)[^>]+>/g, '' # remove html tags but br
					.replace /<br>/g, '\n' #replace br with \n
			)
			.value
		socket.emit 'changedContent', { new_content: decodeHTMLEntities(myEditor.content) }
		socket.broadcast.emit 'changedContent', { new_content: decodeHTMLEntities(myEditor.content) }

	socket.on 'changedSyntax', (data) ->
		myEditor.syntax = data.new_syntax
		socket.broadcast.emit 'changedSyntax', { new_syntax: myEditor.syntax }
	
	socket.on 'changedTheme', (data) ->
		myEditor.theme = data.new_theme
		socket.broadcast.emit 'changedSyntax', { new_theme: myEditor.theme }

###
	Routes
###
codeshare.get '/', (req, res) ->
	res.render 'index', {
			title: 'Codeshare.js'
			editor: myEditor
		}


server.listen codeshare.get('port'), ->
	console.log "Express server listening on port #{codeshare.get('port')}"