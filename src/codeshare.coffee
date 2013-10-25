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
		['nbsp', '\t']
	]
	for entity in entities
		text = text.replace new RegExp("&#{entity[0]};", 'g'), entity[1]
	text

highlightCode = (syntax, code) ->
	hljs.highlight(
		syntax,
		code
			.replace /<(?!br\s*\/?)[^>]+>/g, '' # remove html tags but br
			.replace /<br>/g, '\n' #replace br with \n
	).value

class Editor
	constructor: (syntax, theme)->
		highlightInfos = JSON.parse(fs.readFileSync(path.join(__dirname, 'static/highlight.json')))
		@syntax	 = syntax
		@content = decodeHTMLEntities highlightCode(syntax, highlightInfos.examples[syntax])
		@theme   = theme
		@syntaxes = highlightInfos.syntaxes
		@themes = highlightInfos.themes

	setContent: (content) =>
		@content = decodeHTMLEntities highlightCode(@syntax, content)


myEditor = new Editor('coffeescript', 'github')

# instantiate socket.io
io.sockets.on 'connection', (socket) ->

	socket.emit 'init', { 'editor': myEditor }

	socket.on 'changedContent', (data) ->
		socket.broadcast.emit 'changedContent', { 'new_content': myEditor.setContent(data.new_content) }

	socket.on 'changedSyntax', (data) ->
		console.log data.new_syntax
		myEditor.syntax = data.new_syntax
		socket.emit 'changedSyntax',
			'new_syntax': myEditor.syntax
			'new_content': myEditor.setContent(data.new_content)
		socket.broadcast.emit 'changedSyntax',
			'new_syntax': myEditor.syntax
			'new_content': myEditor.setContent(data.new_content)
	
	socket.on 'changedTheme', (data) ->
		myEditor.theme = data.new_theme
		socket.broadcast.emit 'changedTheme', { new_theme: myEditor.theme }

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