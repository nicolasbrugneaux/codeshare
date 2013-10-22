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
hljs = require 'highlight.js'


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
		text = text.replace(new RegExp('&'+entity[0]+';', 'g'), entity[1])
	return text

class Editor
	constructor: () ->
		@content = "socket.on('changedSyntax', (data) ->\n    myEditor.syntax = data.new_syntax"
		@syntax	 = "coffeescript"
		@theme   = "github"
		@syntaxes = [
			"python"
			"profile"
			"ruby"
			"perl"
			"php"
			"scala"
			"go"
			"xml"
			"css"
			"markdown"
			"django"
			"json"
			"javascript"
			"coffeescript"
			"actionscript"
			"vbscript"
			"http"
			"lua"
			"delphi"
			"java"
			"cpp"
			"objectivec"
			"vala"
			"cs"
			"d"
			"rsl"
			"rib"
			"mel"
			"sql"
			"smalltalk"
			"lisp"
			"clojure"
			"ini"
			"apache"
			"nginx"
			"diff"
			"dos"
			"con", "prn"
			"bash"
			"cmake"
			"axapta"
			"1c"
			"avrasm"
			"vhdl"
			"parser3"
			"tex"
			"haskell"
			"erlang"
			"rust"
			"matlab"
			"r"
			"glsl"
			"applescript"
			"brainfuck"
		]
		@themes = [
			"arta"
			"ascetoc"
			"brown_paper"
			"dark"
			"default"
			"far"
			"github"
			"googlecode"
			"idea"
			"ir_black"
			"magula"
			"monokai"
			"pojoaque"
			"rainbow"
			"school_book"
			"solarized_dark"
			"solarized_light"
			"sunburst"
			"tomorrow-night-blue"
			"tomorrow-night-bright"
			"tomorrow-night-eighties"
			"tomorrow-night-night"
			"tomorrow"
			"vs"
			"xcode"
			"zenburn"
		]

myEditor = new Editor
# instantiate socket.io
io.sockets.on('connection', (socket) ->

	myEditor.content = decodeHTMLEntities(
		hljs.highlight(
			myEditor.syntax,
			myEditor.content
				.replace(/<(?!br\s*\/?)[^>]+>/g, "") # remove html tags but br
				.replace(/<br>/g, "\n") #replace br with \n
		).value
	)
	socket.emit('init', {editor: myEditor })

	socket.on('changedContent', (data) ->
		myEditor.content = hljs.highlight(
			myEditor.syntax,
			data.new_content
				.replace(/<(?!br\s*\/?)[^>]+>/g, "") # remove html tags but br
				.replace(/<br>/g, "\n") #replace br with \n
		).value
		socket.broadcast.emit('changedContent', {new_content: decodeHTMLEntities(myEditor.content) })
	)
	socket.on('updateContent', (data) ->
		myEditor.content = hljs.highlight(
			myEditor.syntax,
			data.new_content
				.replace(/<(?!br\s*\/?)[^>]+>/g, "") # remove html tags but br
				.replace(/<br>/g, "\n") #replace br with \n
		).value
		socket.emit('changedContent', {new_content: decodeHTMLEntities(myEditor.content) })
		socket.broadcast.emit('changedContent', {new_content: decodeHTMLEntities(myEditor.content) })
	)
	socket.on('changedSyntax', (data) ->
		myEditor.syntax = data.new_syntax
		socket.broadcast.emit('changedSyntax', {new_syntax: myEditor.syntax})
	)
	socket.on('changedTheme', (data) ->
		myEditor.theme = data.new_theme
		socket.broadcast.emit('changedSyntax', {new_theme: myEditor.theme})	)
)

###
	Routes
###
codeshare.get('/', (req, res) ->
	res.render('index', {
		title: 'Codeshare.js'
		editor: myEditor
	})
)


server.listen(codeshare.get('port'), () ->
	console.log('Express server listening on port ' + codeshare.get('port'))
)