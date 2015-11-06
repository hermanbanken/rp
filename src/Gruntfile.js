module.exports = function (grunt) {
 
  require("load-grunt-tasks")(grunt);

  grunt.initConfig({ 
    babel: {
        options: {
          sourceMap: true,
          modules: 'amd'
        },
        es6: {
            files: [
                {
                    expand: true,
                    src: ['*.es6'],
                    ext: '.js'
                }
            ]
        }
    },
    watch: {
      babel: {
        files: ['*.es6'],
        tasks: ['babel']
      }
    }
  });
    
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask('default', ['babel', 'watch']);

}