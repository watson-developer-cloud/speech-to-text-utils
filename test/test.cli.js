const exec = require('child_process').exec;
const pkg = require('../package.json');

require('should');

describe('CLI()', () => {
  it('should print warning if used as node module', function(done) {
    (function(){
      const oldLog = console.log;
      console.log = function (message) {
        message.should.containEql(' is a command line tool, not a module include.');
        console.log = oldLog;
        done();
      };
      require('../index');
    })();
  });
  it('should print help when using --help', function(done) {
    exec(pkg.name + ' --help', function (error, stdout) {
      stdout.should.containEql('Usage: '+ pkg.name +' <command> [options]');
      stdout.should.containEql('Commands:');
      done();
    });
  });
  it('should print help when using -h', function(done) {
    exec(pkg.name + ' -h', function (error, stdout) {
      stdout.should.containEql('Usage: '+ pkg.name +' <command> [options]');
      stdout.should.containEql('Commands:');
      done();
    });
  });
  it('should print usage if the action does not exist', function(done) {
    exec(pkg.name + ' foo', function (error, stdout) {
      stdout.should.containEql('Usage: '+ pkg.name +' <command> [options]');
      stdout.should.containEql('Commands:');
      done();
    });
  });
  it('should print help when using an action and --help', function(done) {
    exec(pkg.name + ' base-models-list --help', function (error, stdout) {
      stdout.should.containEql('Usage: base-models-list [options]');
      stdout.should.containEql('Options:');
      done();
    });
  });
  it('should print version when using -V', function(done) {
    exec(pkg.name + ' -V', function (error, stdout) {
      stdout.should.containEql(pkg.version);
      done();
    });
  });
  it('should print version when using --version', function(done) {
    exec(pkg.name + ' --version', function (error, stdout) {
      stdout.should.containEql(pkg.version);
      done();
    });
  });
  it('should get a corpus from a workspace', function(done) {
    exec(pkg.name + ' corpus-from-workspace -w ./test/resources/workspace.json', function (error, stdout) {
      stdout.should.containEql('Are there any around here');
      done();
    });
  });
});
