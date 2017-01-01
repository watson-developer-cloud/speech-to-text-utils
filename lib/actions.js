var fs = require('fs');

/**
 * Get all the intent examples and entities that are to be trained
 * @type {Object} params The workspace and the file where the examples are to be saved
 */
var getExamples = function(params, callback) {
  fs.readFile(params.workspace, function(err, data) {
    if (err) {
      return console.log(err);
    }
    workspace = JSON.parse(data.toString());
    var fd = fs.openSync(params.examples, 'w');
    writeIntentsToFile(fd, workspace);
    writeEntitiesToFile(fd, workspace);
    fs.closeSync(fd);
    callback(null);
  });
};

/**
* Write intent examples to a file
* @type {Object} params file descriptor and workspace
*/
var writeIntentsToFile = function(fd, workspace) {
  var sep = '';
  workspace.intents.forEach(function(item) {
    item.examples.forEach(function(item) {
      item.text = item.text.replace(/i.|.i.|.i/g, function myFunction(x) {
        if (x === ' i ')
          x = ' I ';
        else if (x === 'i ')
          x = 'I ';
        else if (x === ' i')
          x = ' I';
        return x;
      });
      fs.writeSync(fd, sep + item.text);
      if (!sep) {
        sep = '\n';
      }
    });
  });
};

/**
* Write entities to a file
* @type {Object} params file descriptor and workspace
*/
var writeEntitiesToFile = function(fd, workspace) {
  var sep = '\n';
  workspace.entities.forEach(function(item) {
    item.values.forEach(function(item) {
      item.value = item.value.replace(/i.|.i.|.i/g, function myFunction(x) {
        if (x === ' i ')
          x = ' I ';
        else if (x === 'i ')
          x = 'I ';
        else if (x === ' i')
          x = ' I';
        return x;
      });
      fs.writeSync(fd, sep + item.value);
    });
  });
};

/**
* Create a custom model and train it
* @type {Object} params Model description and workspace that is to be used to setup the custom model
*/
var create_and_train = function(params, callback) {
  const speech_to_text = require('./stt.js')(params);
  getExamples(params, function(error) {
    if (error) {
      console.log(error);
    } else {
      console.log('1. The intent examples and entities were extracted successfully from the workspace!\n')
      return new Promise((resolve, reject) => {
        speech_to_text.createCustomization(params).then((customization_id) => {
          console.log('2. Model customization_id: ', customization_id, '\n');
          fs.readFile(params.examples, function(error, data) {
            if (error) {
              callback(error, null);
            } else {
              return speech_to_text.addCorpus({'customization_id': customization_id, 'corpus': data, 'name': 'corpus1'}).then((addCorpusResponse) => {
                console.log('3. Adding corpus file returns: ', addCorpusResponse.statusCode, '\n');
                console.log('4.1 Checking status of corpus analysis... Please wait...');
                return speech_to_text.whenCorporaAnalyzed({'customization_id': addCorpusResponse.customization_id}).then((corporaAnalysisResponse) => {
                  console.log('4.2 Corpus status: ', corporaAnalysisResponse.status);
                  console.log('4.3 Corpus analysis done!\n');
                  return speech_to_text.getWords(corporaAnalysisResponse).then((getWordsResponse) => {
                    console.log('5. Below is the list of Out of Vocabulary words ->');
                    console.log(getWordsResponse.words, '\n');
                    console.log('6.1 Checking status of model... Please wait...');
                    return speech_to_text.whenCustomizationReady(getWordsResponse).then((customizationStatusResponse) => {
                      console.log('6.2 Model status: ', customizationStatusResponse.status);
                      console.log('6.3 Model is ready to be trained!\n');
                      return speech_to_text.getWords(customizationStatusResponse).then((getWordsResponse) => {
                        console.log('7. Below is the list of Out of Vocabulary words ->');
                        console.log(getWordsResponse.words, '\n');
                        return speech_to_text.trainCustomization(getWordsResponse).then((trainingResponse) => {
                          console.log('8.1 Training request sent, returns: ', trainingResponse.status);
                          console.log('8.2 Checking status of model... Please wait...');
                          return speech_to_text.whenCustomizationReady(trainingResponse).then((customizationStatusResponse) => {
                            console.log('8.3 Model status: ', customizationStatusResponse.status);
                            console.log('8.4 Training complete!\n');
                            resolve({done: true});
                          });
                        })
                      })
                    })
                  })
                })

              })
            }
          })

        }).catch((error) => {
          console.log('ERROR: Could not create a model and train it');
          console.log(error);
          reject(error);
        });
      });
    }
  });
}

/**
* Add a word to corpus
* @type {Object} params customization id and word to be added
*/
var add_word = function(params, callback) {
  const speech_to_text = require('./stt.js')(params);
  return new Promise((resolve, reject) => {
    speech_to_text.addWord(params).then((addWordResponse) => {
      console.log('Adding single word returns: ', addWordResponse.status, '\n');
      return speech_to_text.trainCustomization(addWordResponse).then((trainingResponse) => {
        console.log('1.1 Training request sent, returns: ', trainingResponse.status);
        console.log('1.2 Checking status of model... Please wait...');
        return speech_to_text.whenCustomizationReady(trainingResponse).then((customizationStatusResponse) => {
          console.log('1.3 Model status: ', customizationStatusResponse.status);
          console.log('1.4 Training complete!\n');
          resolve({done: true});
        });
      })
    }).catch((error) => {
      console.log('ERROR: Could not add a word');
      console.log(error);
      reject(error);
    });
  });
};

/**
* Add multiple words to corpus
* @type {Object} params customization id and words.json to be added
*/
var add_words = function(params, callback) {
  const speech_to_text = require('./stt.js')(params);
  fs.readFile(params.words, function(error, data) {
    if (error) {
      callback(error);
    } else {
      params.words = JSON.parse(data.toString());
      console.log(params.words);
      return new Promise((resolve, reject) => {
        speech_to_text.addWords(params).then((addWordsResponse) => {
          console.log('1.1 Adding multiple words returns: ', addWordsResponse.status, '\n');
          console.log('1.2 Checking status of model... Please wait...');
          return speech_to_text.whenCustomizationReady(addWordsResponse).then((customizationStatusResponse) => {
            console.log('1.3 Model status: ', customizationStatusResponse.status);
            console.log('1.4 Model is ready to be trained!\n');
            return speech_to_text.getWords(customizationStatusResponse).then((getWordsResponse) => {
              console.log('2.1 Below is the list of Out of Vocabulary words ->');
              console.log(getWordsResponse.words, '\n');
              return speech_to_text.trainCustomization(getWordsResponse).then((trainingResponse) => {
                console.log('3,1 Training request sent, returns: ', trainingResponse.status);
                console.log('3.2 Checking status of model... Please wait...');
                return speech_to_text.whenCustomizationReady(trainingResponse).then((customizationStatusResponse) => {
                  console.log('3.3 Model status: ', customizationStatusResponse.status);
                  console.log('3.4 Training complete!\n');
                  resolve({done: true});
                });
              })
            })
          })
        }).catch((error) => {
          console.log('ERROR: Could not add multiple words');
          console.log(error);
          reject(error);
        });
      });
    }
  });
};

module.exports = {
  getExamples: getExamples,
  create_and_train: create_and_train,
  list_customizations: list_customizations,
  delete_customization: delete_customization,
  corpus_status: corpus_status,
  model_status: model_status,
  show_oovs: show_oovs,
  add_word: add_word,
  add_words: add_words
};
