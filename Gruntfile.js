module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        mangle: {
          toplevel: true
        },
        compress: true,
      },
      build: {
        files: [{
          expand: true,
          cwd: 'js/',        // Source directory
          src: ['*.js'],     // Match all JS files in the 'js/' directory
          dest: 'js-min/',  // Output directory for minified files
          ext: '.js'     // Extension for the minified files
        },{
          expand: true,
          cwd: 'js/modules/',        // Source directory
          src: ['*.js'],     // Match all JS files in the 'js/' directory
          dest: 'js-min/modules/',  // Output directory for minified files
          ext: '.js'     // Extension for the minified files            
       }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['uglify']);
};
