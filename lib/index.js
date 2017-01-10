#!/usr/bin/env node --harmony

require('colors');

const program = require('commander');
const inquirer = require('inquirer');
const pick = require('object.pick');
const Preferences = require('preferences');
const clui = require('clui');
const spinner = clui.Spinner;
var path = require('path');
var homedir = require('os-homedir')();

const print = require('./print');
const pkg = require('../package.json');
const CommandManager = require('./commands');
const prefs = new Preferences(`com.ibm.watson.${pkg.name}`);


function getCredentials(opts) {
  const creds = ['username', 'password'];
  if (opts && opts.username && opts.password) {
    return pick(opts, creds);
  } else if (program.username && program.password) {
    return pick(program, creds);
  } else if (prefs.username && prefs.password) {
    return pick(prefs, creds);
  } else {
    console.log('No Watson Speech to text credentials has been specified.'.yellow);
    console.log(`Please set one using: $ ${pkg.name} set-credentials`);
    process.exit(1);
  }
}

/**
 * Creates a command manager using the credentials provided by the user
 * or stored in preferences.
 *
 * @param  {Object} userCredentials The username and password provided in the command.
 */
function getCommands(userCredentials) {
  return new CommandManager(getCredentials(userCredentials));
}

/**
 * Prints the Error and exit the program.
 */
function processError(error) {
  let message = 'There was an error processing the request, please try again.';
  if (error) {
    if (error.error) {
      message = error.code ? `${error.code} - ` : '';
      message = message + error.error;
    } else {
      message = error.toString();
    }
  }
  console.log(message.red);
  process.exit(1);
}

/**
 * Prompt the user for username and password
 * @param  {Object} userCredentials The user provided credentials
 */
function promptForCredentials (userCredentials) {
  if (userCredentials.username && userCredentials.password) {
    return Promise.resolve(userCredentials);
  } else {
    return inquirer.prompt([{
      name: 'password',
      type: 'password',
      message: 'Enter your Speech to Text password:',
      validate: (value) => (value.length ? true : 'Please enter your Speech to Text password'),
    },{
      name: 'username',
      type: 'input',
      message: 'Enter your Speech to Text username:',
      validate: (value) => (value.length ? true : 'Please enter your Speech to Text username'),
    }]);
  }
}

program.version(pkg.version)
  .usage('<command> [options]');

program
  .command('set-credentials')
  .description('Set Speech to Text username and password')
  .option('-u, --username <username>', 'Speech to text username')
  .option('-p, --password <password>', 'Speech to text password')
  .action((cmd) => {
    promptForCredentials(cmd)
    .then((credentials) => {
      const status = new spinner('Authenticating, please wait...');
      status.start();
      return getCommands(credentials)
      .authenticate()
      .then(() => {
        Object.assign(prefs, pick(credentials, ['username', 'password']));
        status.stop();
        process.exit(0);
      }).catch((e) =>{
        status.stop();
        throw e;
      });
    })
    .catch(processError);
  });

program
  .command('base-models-list')
  .description('List all the base models')
  .option('-u, --username [username]', 'Speech to text username')
  .option('-p, --password [password]', 'Speech to text password')
  .action((cmd) => getCommands(cmd)
    .listModels()
    .then(print.printBaseModels)
    .catch(processError)
  );

program
  .command('customization-create-and-train')
  .description('Create a customization model using a Conversation workspace JSON file')
  .option('-u, --username [username]', 'Speech to text username')
  .option('-p, --password [password]', 'Speech to text password')
  .option('-w, --workspace <workspace>', 'The Conversation JSON file (workspace.json) that is to be parsed')
  .option('-n, --customization_name [name]', 'The name of the new customization')
  .option('-d, --customization_description [description]', 'The description of the new customization')
  .option('-b, --base_model_name [base_model_name]', 'The base model name. Default: en-US_BroadbandModel')
  .action((cmd) => getCommands(cmd)
    .createAndTrainCustomization(cmd)
    .then(print.printCustomization)
    .catch(processError)
  );

program
  .command('customization-list')
  .option('-u, --username [username]', 'Speech to text username')
  .option('-p, --password [password]', 'Speech to text password')
  .description('List all the customization')
  .action((cmd) => getCommands(cmd)
    .listCustomizations()
    .then(print.printCustomizations)
    .catch(processError)
  );

program
  .command('customization-train')
  .description('Train a customization')
  .option('-u, --username [username]', 'Speech to text username')
  .option('-p, --password [password]', 'Speech to text password')
  .option('-i, --customization_id <customization_id>', 'The customization identifier')
  .action((cmd) => getCommands(cmd)
    .trainCustomization(cmd)
    .then(print.printCustomization)
    .catch(processError)
  );

program
  .command('customization-status')
  .description('Get customization status')
  .option('-u, --username [username]', 'Speech to text username')
  .option('-p, --password [password]', 'Speech to text password')
  .option('-i, --customization_id <customization_id>', 'The customization identifier')
  .action((cmd) => getCommands(cmd)
    .getCustomization(cmd)
    .then(print.printCustomization)
    .catch(processError)
  );

program
  .command('customization-delete')
  .description('Delete a customization')
  .option('-u, --username [username]', 'Speech to text username')
  .option('-p, --password [password]', 'Speech to text password')
  .option('-i, --customization_id <customization_id>', 'The customization identifier')
  .action((cmd) => getCommands(cmd)
    .deleteCustomization(cmd)
    .then(() => console.log('Customization deleted'))
    .catch(processError)
  );

program
  .command('customization-list-words')
  .description('List all out-of-vocabulary(OOV) words for a customization')
  .option('-u, --username [username]', 'Speech to text username')
  .option('-p, --password [password]', 'Speech to text password')
  .option('-i, --customization_id <customization_id>', 'The customization identifier')
  .option('-t, --word_type [word_type]', 'The type of words to be listed from the custom language customization\'s words', /^(all|user|corpora)$/i, 'user')
  .action((cmd) => getCommands(cmd)
    .listCustomizationWords(cmd)
    .then(print.printWords)
    .catch(processError)
  );

program
  .command('corpus-list')
  .description('Lists information about all corpora for a customization model')
  .option('-u, --username [username]', 'Speech to text username')
  .option('-p, --password [password]', 'Speech to text password')
  .option('-i, --customization_id <customization_id>', 'The customization identifier')
  .action((cmd) => getCommands(cmd)
    .listCorpora(cmd)
    .then(print.printCorpora)
    .catch(processError)
  );

program
  .command('corpus-status')
  .description('Lists information about all corpora for a customization model')
  .option('-u, --username [username]', 'Speech to text username')
  .option('-p, --password [password]', 'Speech to text password')
  .option('-i, --customization_id <customization_id>', 'The customization identifier')
  .option('-c, --corpus_name <corpus_name>', 'The corpus name')
  .action((cmd) => getCommands(cmd)
    .getCorpus(cmd)
    .then(print.printCorpus)
    .catch(processError)
  );

program
  .command('corpus-add-words')
  .description('Add a group of words from a file into a corpus')
  .option('-u, --username [username]', 'Speech to text username')
  .option('-p, --password [password]', 'Speech to text password')
  .option('-i, --customization_id <customization_id>', 'The customization identifier')
  .option('-w, --words <words>', 'The JSON file with the words to add to the corpus')
  .action((cmd) => getCommands(cmd)
    .addWords(cmd)
    .then(() => console.log('Words added'))
    .catch(processError)
  );

program
  .command('corpus-add-word')
  .description('Add a single word to the corpus')
  .option('-i, --customization_id <customization_id>', 'The customization identifier')
  .option('-w, --word <word>', 'The word')
  .option('-s, --sounds_like [sounds_like]', 'The pronunciation of the word')
  .option('-d, --display_as [display_as]', 'How the word is displayed')
  .action((cmd) => getCommands(cmd)
    .addWord(cmd)
    .then(() => console.log('Word added'))
    .catch(processError)
  );

program
  .command('corpus-delete-word')
  .description('Delete a single word from a corpus')
  .option('-i, --customization_id <customization_id>', 'The customization identifier')
  .option('-w, --word <word>', 'The word')
  .action((cmd) => getCommands(cmd)
    .deleteWord(cmd)
    .then(() => console.log('Word deleted'))
    .catch(processError)
  );

program
  .command('corpus-from-workspace')
  .description('Build a Speech to text corpus from a Conversation workspace')
  .option('-w, --workspace <workspace>', 'The Conversation JSON file (workspace.json) that is to be parsed')
  .action((cmd) => getCommands(cmd)
    .getCorpusFromWorkspace(cmd)
    .then(console.log)
    .catch(processError)
  );

// Match all the other commands and display the default help
program.command('*', '', { noHelp: true })
  .action(() => program.outputHelp());

// if no arguments, display default help
if (!process.argv.slice(2).length) {
  program.outputHelp();
} else {
  program.parse(process.argv);
}
