module.exports = function(grunt) {
    var config = {};

    // Initialize the grunt configuration
    grunt.initConfig(config);

    // JS minification
    config.uglify = {
        dist: {
            files: {
                'dist/js/api.js': 'js/api.js',
                'dist/js/app.js': 'js/app.js',
                'dist/js/mapapi.js': 'js/mapapi.js',
                'dist/js/registerevents.js': 'js/registerevents.js',
                'dist/bower_components/q/q.js' : 'bower_components/q/q.js'
            }
        }
    };

    // Clean task
    config.clean = {
        dist: {
            src: ['dist']
        }
    };

    // CSS minification
    config.cssmin = {
        dist: {
            files: [
                {
                    expand: true,
                    src: ['css/*.css'],
                    dest: 'dist/',
                    ext: '.css'
                },
                {
                    expand: true,
                    src: ['bower_components/bootstrap/dist/css/bootstrap.css'],
                    dest: 'dist/',
                    ext: '.css'
                },
                {
                    expand: true,
                    src: ['bower_components/css-spinners/css/spinner/spinner.css'],
                    dest: 'dist/',
                    ext: '.css'
                },
            ]
        }
    };

    // HTML minification
    config.htmlmin = {
        dist: {
            options: {
                removeComments: true,
                collapseWhitespace: true
          },
          files: {
            'dist/index.html': 'index.html'
          }
        }
    };

    // Copy resources over
    config.copy = {
        dist: {
            files: [
                {
                    expand: true,
                    src: ['img/*'],
                    dest: 'dist/'
                },
                {
                    src: ['favicon.ico'],
                    dest: 'dist/'
                },
                {
                    expand: true,
                    src: ['bower_components/handlebars/handlebars.min.js'],
                    dest: 'dist/'
                },
                {
                    expand: true,
                    src: ['bower_components/jquery/dist/jquery.min.js'],
                    dest: 'dist/'
                },
                {
                    expand: true,
                    src: ['js/vendor/knockout-3.3.0.js'],
                    dest: 'dist/'
                },
                {
                    expand: true,
                    src: ['bower_components/bootstrap/dist/fonts/*'],
                    dest: 'dist/'
                }
            ]
        }
    };

    // Web server for development
    var port = grunt.option('port') || 8000;
    config.connect = {
        server: {
            options: {
                port: port,
                base: 'dist',
                keepalive: true
            }
        }
    };

    // Load the grunt task modules
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-connect');

    /* Register tasks */
    grunt.registerTask('default', []);
    grunt.registerTask('dist', [
        'clean:dist',
        'uglify:dist',
        'cssmin:dist',
        'htmlmin:dist',
        'copy:dist',
    ]);
    grunt.registerTask('serve', ['dist', 'connect']);
};
