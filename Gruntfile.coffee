'use strict'

module.exports = (grunt) ->
	# load all grunt tasks
	require('matchdep').filterDev('grunt-*').forEach (contrib) ->
		grunt.log.ok ["#{contrib} is loaded"]
		grunt.loadNpmTasks(contrib)

	config = 
		dist: 'dist'
		src: 'src'
		distTest: 'test/dist'
		srcTest: 'test/src'

	# Project configuration.
	grunt.initConfig
		config: config
		clean:
			dist:
				files: [
					dot: true
					src: [
						'<%= config.dist %>/*'
						'<%= config.distTest %>/*'
						'!<%= config.dist %>/.git*'
					]
				]
		coffee:
			dist:
				files: [
					{
						expand: true,
						cwd: '<%= config.src %>'
						src: '{,*/}*.coffee'
						dest: '<%= config.dist %>'
						ext: '.js'
					},
					{
						expand: true,
						cwd: '<%= config.src %>'
						src: 'static/js/{,*/}*.coffee'
						dest: '<%= config.dist %>'
						ext: '.js'
					}
				]
			test:
				files: [
					expand: true
					cwd: '<%= config.srcTest %>'
					src: '{,*/}*.spec.coffee'
					dest: '<%= config.distTest %>'
					ext: '.spec.js'
				]

		jshint:
			options:
				jshintrc: '.jshintrc'
			gruntfile:
				src: 'Gruntfile.js'

		watch:
			gruntfile:
				files: '<%= jshint.gruntfile.src %>'
				tasks: ['jshint:gruntfile']
			dist:
				files: [
					'<%= config.src %>/*'
					'<%= config.src %>/static/js/*'
					'<%= config.src %>/static/css/*'
				]
				tasks: ['coffee:dist', 'simplemocha:backend', 'less:development']
			test:
				files: '<%= config.srcTest %>/specs/*'
				tasks: ['coffee:test', 'simplemocha:backend']

		simplemocha:
			options:
				globals: [
					'sinon'
					'chai'
					'should'
					'expect'
					'assert'
					'AssertionError'
				]
				timeout: 3000
				ignoreLeaks: false
				# grep: '*.spec'
				ui: 'bdd'
				reporter: 'spec'

			backend:
				src: [
					# add chai and sinon globally
					'test/support/globals.js'

					# tests
					'test/dist/**/*.spec.js'
				]
		less:
			development:
				options:
					paths: ['<%= config.src %>/static/css/']
					yuicompress: false
				
				files: 
					'<%= config.dist %>/static/css/style.css': '<%= config.src %>/static/css/style.less'
			
			production:
				options:
					paths: ['<%= config.src %>/static/css/']
					yuicompress: true
				files:
					'<%= config.dist %>/static/css/style.min.css': '<%= config.src %>/static/css/style.less'


	grunt.registerTask 'coverageBackend', 'Test backend files as well as code coverage.', () ->
		done = @async()

		path = './test/support/runner.js'

		options =
			cmd: 'istanbul'
			grunt: false
			args: [
				'cover'
				'--default-excludes'
				'-x', 'app/**'
				'--report', 'lcov'
				'--dir', './coverage/backend'
				path
			]
			opts:
				# preserve colors for stdout in terminal
				stdio: 'inherit'

		doneFunction = (error, result) ->
			if (result && result.stderr)
				process.stderr.write(result.stderr)

			if (result && result.stdout)
				grunt.log.writeln(result.stdout)

			# abort tasks in queue if there's an error
			done(error)

		grunt.util.spawn(options, doneFunction)

	# Default task.
	grunt.registerTask 'default', ['coffee', 'jshint', 'less:development']
	grunt.registerTask 'test', ['clean', 'coffee', 'less:development', 'simplemocha:backend']
	grunt.registerTask 'coverage', ['clean', 'coffee', 'less', 'coverageBackend']