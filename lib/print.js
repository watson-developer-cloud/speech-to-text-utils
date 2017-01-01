const columnify = require('columnify');

const printWords = function(params) {
  const table = columnify(params.words, {
    columns: ['word', 'display_as', 'sounds_like', 'source', 'count', 'error']
  });

  if (params.words.length > 0) {
    console.log(table);
  } else {
    console.log('No words found');
  }

};

const printCorpus = corpus => console.log(columnify(corpus));

const printCorpora = function(params) {
  const table = columnify(params.corpora, {
    columns: ['name', 'total_words', 'out_of_vocabulary_words', 'status', 'error']
  });

  if (params.corpora.length > 0) {
    console.log(table);
  } else {
    console.log('No corpora found');
  }
};

const printCustomizations = function(params) {
  const table = columnify(params.customizations, {
    columns: ['customization_id', 'name', 'status','progress', 'base_model_name', 'created', 'warnings']
  });

  if (params.customizations.length > 0) {
    console.log(table);
  } else {
    console.log('No customizations found');
  }
};

const printCustomization = (customization) => console.log(columnify(customization));


const printBaseModels = function(params) {
  const table = columnify(params.models, {
    columns: ['name', 'rate', 'description']
  });
  if (params.models.length > 0) {
    console.log(table);
  } else {
    console.log('No models found');
  }
};

module.exports = {
  printWords,
  printBaseModels,
  printCorpus,
  printCorpora,
  printCustomizations,
  printCustomization,
};
