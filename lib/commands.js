const inquirer = require('inquirer');
const pick = require('object.pick');
const merge = require('merge');
const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
const bluebird = require('bluebird');

const pkg = require('../package.json');
const files = require('./files');

class Commands {
  constructor(options) {
    const speechServiceAsync = new SpeechToTextV1({
      version: 'v1',
      username: options.username,
      password: options.password,
      url: options.url || SpeechToTextV1.URL,
    });
    this.speechService = bluebird.promisifyAll(speechServiceAsync);
  }

  authenticate() {
    return this.listModels();
  }

  listModels(params) {
    return this.speechService.getModelsAsync(params);
  }

  listCustomizations(params) {
    return this.speechService.getCustomizationsAsync(params);
  }

  listCustomizationWords(params) {
    return promptForInput('customization_id')(params)
    .then(customization =>
      this.speechService.getWordsAsync(customization)
    );
  }

  getCustomization(params) {
    return promptForInput('customization_id')(params)
    .then(customization =>
      this.speechService.getCustomizationAsync(customization)
    );
  }

  trainCustomization(params) {
    return promptForInput('customization_id')(params)
    .then((cust) =>
      this.speechService.trainCustomizationAsync(cust)
      .then(() =>
        this.speechService.whenCustomizationReadyAsync(cust)
      )
    );
  }

  createCustomization(params) {
    return promptForCreateCustomizationParameters(this, params)
    .then((customizationParams) =>
      this.speechService.createCustomizationAsync(customizationParams)
      .then(newCustomization =>
        Promise.resolve(Object.assign(customizationParams, newCustomization))
      )
    );
  }

  createAndTrainCustomization(params) {
    return promptForCreateCustomizationParameters(this, params)
    .then((customizationParams) =>
      this.createCustomization(customizationParams)
      .then((newCustomization) =>
        buildCorpusFromWorkspace(customizationParams.workspace)
        .then(corpusFromWorkspace => {
          const newCorpus = {
            customization_id: newCustomization.customization_id,
            corpus: corpusFromWorkspace.corpus,
            name: 'corpus1',
            allow_overwrite: true,
          };
          if(params.verbose){
            console.log(newCorpus);
          }
          return this.speechService.addCorpusAsync(newCorpus);
        })
        .then(() =>
          this.speechService.whenCorporaAnalyzedAsync(newCustomization)
        )
        .then(() =>
          this.speechService.whenCustomizationReadyAsync(newCustomization)
        )
        .then(() =>
          this.trainCustomization(newCustomization)
        )
        .catch(e =>
          this.deleteCustomization(newCustomization)
          .then(() => { throw e; })
          .catch(() => { throw e; })
        )
      )
    );
  }

  getCorpusFromWorkspace(params) {
    return promptForJSONFile('workspace')(params)
    .then(workspace =>
      buildCorpusFromWorkspace(workspace)
      .then(corpusFromWorkspace => corpusFromWorkspace.corpus)
    );
  }

  deleteCustomization(params) {
    return promptForInput('customization_id')(params)
    .then(customization =>
      this.speechService.deleteCustomizationAsync(customization)
    );
  }

  listCorpora(params) {
    return promptForInput('customization_id')(params)
    .then(customization =>
      this.speechService.getCorporaAsync(customization)
    );
  }

  getCorpus(params) {
    return promptForInput('customization_id')(params)
    .then(customization =>
      promptForInput('corpus_name')(params)
      .then(corpus  =>
        this.speechService.getCorpusAsync(Object.assign({name: corpus.corpus_name}, customization))
      )
    );
  }

  addWords(params) {
    return promptForInput('customization_id')(params)
    .then(customization =>
      promptForJSONFile('words')(params)
      .then(words =>
        this.speechService.addWordsAsync(Object.assign(customization, words))
        .then(() =>
          this.speechService.whenCustomizationReadyAsync(customization)
          .then(() =>
            this.trainCustomization(customization)
          )
        )
      )
    );
  }

  addWord(params) {
    return promptForInput('customization_id')(params)
    .then(customization =>
      promptForInput('word')(params)
      .then(word =>
        promptForInput('display_as')(params)
        .then(displaysAs =>
          promptForInput('sounds_like')(params)
          .then(soundsLike =>
            this.speechService.addWordAsync({
              customization_id: customization.customization_id,
              word: word.word,
              sounds_like: soundsLike.sounds_like.split(',').map(w => w.trim()),
              display_as: displaysAs.display_as,
            })
            .then(() =>
              this.speechService.whenCustomizationReadyAsync(customization)
              .then(() =>
                this.trainCustomization(customization)
              )
            )
          )
        )
      )
    );
  }

  deleteWord(params) {
    return promptForInput('customization_id')(params)
    .then(customization =>
      promptForInput('word')(params)
      .then(word =>
        this.speechService.deleteWord({
          customization_id: customization.customization_id,
          word: word.word,
        })
      )
    );
  }
}

/**
 * Builds a Speech to Text corpus using a Conversation workspace.
 * Intents and Entities are reduce to an array of strings
 * @param  {Object} workspace The IBM Watson Conversation workspace
 * @return {Promise} The promise that resolves into an array of strings
 */
function buildCorpusFromWorkspace(workspace) {
  try {
    const intentExamples = workspace.intents
      .reduce((k, l) => k.concat(l.examples.map(e => e.text.replace(/\bi\b/g, 'I'))), []);

    const entityValues = workspace.entities
      .reduce((k, l) => k.concat(l.values.map(e => e.value.replace(/\bi\b/g, 'I'))), []);

    const entitySynonyms = workspace.entities
      .reduce((k, l) => k.concat(l.values.reduce((a,b) => a.concat(b.synonyms.map(c => c.replace(/\bi\b/g, 'I'))), [])), []);

    let corpus = intentExamples.concat(entityValues, entitySynonyms);

    corpus = corpus.sort() // sort
      .filter((e, i) => corpus.indexOf(e) === i); // remove duplicates

    return Promise.resolve({ corpus: corpus.join('\n'), name: `corpus-${workspace.name}` });
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Prompt for create customization parameters
 * @param {Object} service The SpeechToTextCommands
 * @param {Object} params The parameters
 */
function promptForCreateCustomizationParameters(service, _params) {
  const params = pick(_params, ['base_model_name', 'workspace', 'customization_name', 'customization_description']);

  if (typeof(_params.workspace) === 'string') {
    try {
      _params.workspace = files.readJSONFileSync(_params.workspace);
    } catch(e) {
      return Promise.reject(e);
    }
  }

  if (_params.customization_name)
    params.name = _params.customization_name;

  if (_params.customization_description)
    params.description = _params.customization_description;

  const fields = [{
    name: 'workspace',
    type: 'input',
    message: 'Enter the path to the workspace JSON file:',
    filter: (fileName) => files.readJSONFile(fileName),
  },{
    name: 'customization_name',
    type: 'input',
    default: `My Customization - ${Date.now()}`,
    message: 'Enter your customization name:',
    validate: (value) => (value.length ? true : 'Please enter your customization name'),
  },{
    name: 'customization_description',
    type: 'input',
    default: `Created using ${pkg.name} v${pkg.version}`,
    message: 'Enter your customization description:',
    validate: (value) => (value.length ? true : 'Please enter your customization description'),
  },{
    name: 'base_model_name',
    type: 'list',
    choices: () => service.listModels().then(res => res.models.map(m => m.name)),
    default: 1,
    message: 'Select the base model',
  }].filter(f => !Object.keys(params).includes(f.name));

  if (fields.length === 0){
    return Promise.resolve(params);
  } else {
    return inquirer.prompt(fields).then(function(response){
      return merge(response, params);
    });
  }
}

/**
 * Prompt for a user input using key as parameter name
 * @param {String} key The parameter name
 * @param {String} def the default value
 */
function promptForInput(key, def) {
  return function(params) {
    if (params[key]) {
      return Promise.resolve(params);
    } else {
      return inquirer.prompt([{
        name: key,
        type: 'input',
        default: def ? def : undefined,
        message: `Enter the ${key}:`,
        validate: (value) => (value.length ? true : `Please enter the ${key}`),
      }]);
    }
  };
}

/**
 * Prompt for a file path using key as file name
 * @param {String} key The parameter name where the file path is
 */
function promptForJSONFile(key) {
  return function(params) {
    if (params[key]) {
      return Promise.resolve(files.readJSONFileSync(params[key]));
    } else {
      return inquirer.prompt([{
        name: key,
        type: 'input',
        message: `Enter the path to the ${key} file:`,
        filter: (fileName) => files.readJSONFile(fileName),
      }]).then(function(response){
        return response.words;
      });
    }
  };
}

module.exports = Commands;
