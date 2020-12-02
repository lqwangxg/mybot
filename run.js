var shell = require('shelljs');
if (!shell.which('git')) {
  shell.echo('Sorry, this script requires git');
  shell.exit(1);
}
shell.rm('-rf', 'dist/*');
shell.exec('tsc', 'src/*');

// Copy files to release dir
shell.mkdir('-p','dist/public/css');
shell.cp('-rf', 'src/public/*.*', 'dist/public/');
shell.cp('-rf', 'src/public/css/*.*', 'dist/public/css/');

shell.mkdir('-p','dist/features/data');
shell.cp('-rf', 'src/features/*.*', 'dist/features/');
shell.cp('-rf', 'src/features/data/*.*', 'dist/features/data/');

shell.exec('git add . ');
if (shell.exec('git commit -am "Auto-commit"').code !== 0) {
  shell.echo('Error: Git commit failed');
  shell.exit(1);
}
shell.exec('git push ');
