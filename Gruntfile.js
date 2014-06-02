'use strict';
module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-release');
  grunt.loadNpmTasks('grunt-karma');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      ci: {
        singleRun: true,
        preprocessors: {'src/*.js': 'coverage'},
        reporters: ['progress', 'coverage'],
        coverageReporter: {dir : 'coverage/', type: 'lcov'}
      },
      dev: {
        background: true
      }
    },
    connect: {
      options: {
        livereload: true,
        port: 9000,
        open: 'http://localhost:<%= connect.options.port %>/demo/angular-debounce.html'
      },
      server: {
      }
    },
    jshint: {
      src: {
        options: {
          jshintrc: '.jshintrc'
        },
        files: {
          src: ['src/*.js', 'Gruntfile.js']
        }
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        files: {
          src: ['test/*.js']
        }
      }
    },
    watch: {
      options: {
        livereload: true
      },
      tests: {
        files: ['src/*.js', 'test/**/*.js', '{demo,css,images}/*.*'],
        tasks: ['karma:dev:run']
      }
    },
    release: {
      options: {
        file: 'bower.json',
        npm: false
      }
    },
    uglify: {
      dist: {
        options: {
          banner: ['/*',
            ' * <%= pkg.name %>',
            ' * <%= pkg.homepage %>',
            ' *',
            ' * @version: <%= pkg.version %>',
            ' * @license: <%= pkg.license %>',
            ' */\n'
            ].join('\n')
          },
        files: {
          'dist/angular-debounce.min.js': ['src/angular-debounce.js']
        }
      }
    }
  });

  grunt.registerTask('default', ['jshint', 'karma:ci', 'uglify']);

  //run tests only once (continuous integration mode)
  grunt.registerTask('test', ['karma:ci']);

  //to debug tests during 'grunt serve', open: http://localhost:8880/debug.html
  grunt.registerTask('serve', ['karma:dev', 'connect', 'watch']);
};
