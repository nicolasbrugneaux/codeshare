class Editor

	constructor: (editor) ->
		@content = {
			dom: document.querySelector('#editor')
			raw: ""
		}
		@syntax = {
			dom: document.querySelector('#syntax')
			raw: ""
		}
		@theme = {
			dom: document.querySelector('#theme')
			raw: ""
		}
		@setContent(editor.content)
		@setTheme(editor.theme)
		@setSyntax(editor.syntax)
		@listen()

	setContent: (content) =>
		@content.raw = content
		@content.dom.innerHTML = content

	setTheme: (theme) =>
		@theme.raw = theme
		@theme.dom.innerHTML = theme

	setSyntax: (syntax) =>
		@syntax.raw = syntax
		@syntax.dom.innerHTML = syntax

	listen: () =>
		setInterval () =>
			if @content.dom.innerHTML != @content.raw
				@content.raw = @content.dom.innerHTML
				socket.emit('changedContent', { new_content: @content.raw })
		, 2000

myEditor = undefined

socket = io.connect('http://localhost')

socket.on('init', (data) ->
	myEditor = new Editor( data.editor )
	console.log myEditor.content
	console.log myEditor
)
socket.on('changedContent', (data) ->
	console.log data
	myEditor.setContent(data.new_content)
)
socket.on('changedSyntax', (data) ->
	myEditor.setTheme(data.new_theme)
)
socket.on('changedTheme', (data) ->
	myEditor.setSyntax(data.new_syntax)
)

# todo theme and syntax