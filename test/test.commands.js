
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../.env')
});

const pkg = require('../package.json');
const Commands = require('../lib/commands');

require('should');

if (process.env.SPEECH_TO_TEXT_USERNAME) {
  const cmd = new Commands({
    username: process.env.SPEECH_TO_TEXT_USERNAME,
    password: process.env.SPEECH_TO_TEXT_PASSWORD,
  });

  describe('commands()', function() {
    this.slow(1000);

    it('createCustomization()', () => {
      this.timeout(50000);
      return cmd.createCustomization({
        workspace: path.join(__dirname, './resources/workspace.json'),
        customization_name: `${pkg.name}-it`,
        customization_description: 'it test',
        base_model_name: 'en-US_BroadbandModel',
      }).then(newCustomization => cmd.deleteCustomization(newCustomization));
    });

    it('listModels()', () => cmd.listModels());

    it('authenticate()', () =>
      cmd.authenticate()
    );

    it('listCustomizations()', () => cmd.listCustomizations());

    it('getCustomization()', () =>
      cmd.getCustomization({
        customization_id: process.env.CUSTOMIZATION_ID,
      })
    );

    it('listCustomizationWords()', () =>
      cmd.listCustomizationWords({
        customization_id: process.env.CUSTOMIZATION_ID,
      })
    );

    it('listCorpora()', () =>
      cmd.listCorpora({
        customization_id: process.env.CUSTOMIZATION_ID,
      })
    );

    it('listCorpus()', () =>
      cmd.getCorpus({
        customization_id: process.env.CUSTOMIZATION_ID,
      })
    );

    // TODO: work in progress
    // it('createAndTrainCustomization()', function() {
    //   this.timeout(100000);
    //   return cmd.createAndTrainCustomization({
    //     workspace: path.join(__dirname, './resources/workspace.json'),
    //     customization_name: `${pkg.name}-it`,
    //     customization_description: 'it test',
    //     base_model_name: 'en-US_BroadbandModel',
    //   }).then(newCustomization => cmd.deleteCustomization(newCustomization));
    // });

    it('createAndTrainCustomization() without a workspace.json file', function (done) {
      this.timeout(50000);
      cmd.createAndTrainCustomization({
        workspace: './fake.json',
        customization_name: `${pkg.name}-it`,
        customization_description: 'it test',
        base_model_name: 'en-US_BroadbandModel',
      })
      .then(() => done('createCustomization() needs a valid workspace'))
      .catch((error) => {
        error.message.should.containEql('no such file or directory, open \'./fake.json\'');
        done();
      });
    });

    it('addWord()', function()  {
      this.timeout(60000);
      return cmd.addWord({
        customization_id: process.env.CUSTOMIZATION_ID,
        word: 'IEEE',
        displays_as: 'IEEE',
        sounds_like: 'IEEE,I triple three',
      });
    });

    it('addWords()', function() {
      this.timeout(60000);
      return cmd.addWords({
        customization_id: process.env.CUSTOMIZATION_ID,
        words: path.join(__dirname, './resources/words.json'),
      });
    });

  });
}
else {
  console.log('Skipping integration test. SPEECH_TO_TEXT_USERNAME is null or empty');
}
