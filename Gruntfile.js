module.exports = function(grunt) {

  require("load-grunt-tasks")(grunt); // npm install --save-dev load-grunt-tasks

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  grunt.initConfig({
    "babel": {
      options: {
        sourceMap: true,
        modules: 'amd'
      },
      dist: {
        files: [{
          expand: true,
          cwd: "src/",
          src: ["**/*.js"],
          dest: "dist/"
        }]
      }
    },
    "watch": {
      babel: {
        files: ['src/*.js'],
        tasks: ['babel']
      }
    }
  });

  grunt.registerTask("default", ["babel", "watch"]);

}