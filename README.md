# Speech to Text CLI

Speech to text CLI that helps you manage speech customizations.


## Getting Started

Make sure you read the documentation for [Speech to Text][docs] before using this library.

```bash
npm install watson-speech-to-text-utils -g
```

## Usage

```none
$ watson-speech-to-text-utils

Usage:  <command> [options]


Commands:

  set-credentials [options]                  Set Speech to Text username and password
  base-models-list [options]                 List all the base models
  customization-create-and-train [options]   Create a customization model using a Conversation workspace JSON file
  customization-list [options]               List all the customization
  customization-train [options]              Train a customization
  customization-status [options]             Get customization status
  customization-delete [options]             Delete a customization
  customization-list-words [options]         List all out-of-vocabulary(OOV) words for a customization
  corpus-list [options]                      Lists information about all corpora for a customization model
  corpus-status [options]                    Lists information about all corpora for a customization model
  corpus-add-words [options]                 Add a group of words from a file into a corpus
  corpus-add-word [options]                  Add a single word to the corpus
  corpus-delete-word [options]               Delete a single word from a corpus
  corpus-from-workspace [options]            Build a Speech to text corpus from a Conversation workspace

Options:

  -h, --help     output usage information
  -V, --version  output the version number
```

### Getting Started

All the commands need an Speech to Text `username` and `password`. Take a look at the [Getting Credentials][getting-credentials] page to learn how to get credentials for the Watson services.


### How to get the `workspace.json` file
  - Navigate to your Bluemix console and open the Conversation service instance where you imported the workspace.
  - Click the menu icon in the upper-right corner of the workspace tile, and then select `Download as JSON`.

### Adding multiple words to a customization

```none
Usage: watson-speech-to-text-utils corpus-add-words [options]

  Add a group of words from a file into a corpus

  Options:

    -h, --help                                 output usage information
    -u, --username [username]                  Speech to text username
    -p, --password [password]                  Speech to text password
    -i, --customization_id <customization_id>  The customization identifier
    -w, --words <words>                        The JSON file with the words to add to the corpus
```

The words JSON file should look like:

```json
{
  "words": [{
    "display_as": "could",
    "sounds_like": [ "could" ],
    "word": "culd"
  }, {
    "display_as": "closeby",
    "sounds_like": [ "closeby" ],
    "word": "closeby"
  }, {
    "display_as": "cya",
    "sounds_like": [ "cya", "see ya" ],
    "word": "cya"
  }]
}
```

### Adding a single word to a customization


```
Usage: watson-speech-to-text-utils corpus-add-word [options]

  Add a single word to the corpus

  Options:

    -h, --help                                 output usage information
    -i, --customization_id <customization_id>  The customization identifier
    -w, --word <word>                          The word
    -s, --sounds_like [sounds_like]            The pronunciation of the word
    -d, --displays_as [displays_as]            How the word is displayed

```

For example:

```bash
watson-speech-to-text-utils corpus-add-word -i 67f35b00-8c0d-12e6-8ac8-6333954f158e -w cya -d cya -s "cya, see ya"
```

## License

This sample code is licensed under Apache 2.0.

## Contributing

See [CONTRIBUTING](.github/CONTRIBUTING.md).

## Open Source @ IBM
Find more open source projects on the [IBM Github Page](http://ibm.github.io/)

[docs]: http://www.ibm.com/watson/developercloud/doc/speech-to-text/index.shtml
[getting-credentials]: http://www.ibm.com/watson/developercloud/doc/getting_started/gs-credentials.shtml#getCreds
