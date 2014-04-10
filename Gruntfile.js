module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-browserify');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            build: {
                files: {
                    'build/main.js': ['main.js']
                }
            }
        }
    });

    grunt.registerTask('build', ['browserify:build']);

};