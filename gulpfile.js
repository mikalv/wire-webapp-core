var browserSync = require('browser-sync').create();
var gulp = require('gulp');

gulp.task('default', function () {
  gulp.watch('demo/**/*.html').on('change', browserSync.reload);

  browserSync.init({
    port: 3636,
    server: {baseDir: './'},
    startPath: `/demo/index.html`
  });
});
