var fs = require('fs');
var path = require('path');

module.exports = {
  getCurrentDirectoryBase: () => path.basename(process.cwd()),
  fileExists: (fileName) => fileName && fs.existsSync(fileName),
  readJSONFileSync: (fileName) => JSON.parse(fs.readFileSync(fileName, 'utf8')),
  readJSONFile: (fileName) =>
    new Promise((resolve, reject) =>
      fs.readFile(fileName, 'utf-8', (error, data) => {
        if (error)
          reject(error);
        else {
          try {
            const json = JSON.parse(data);
            // Hack to display the filename when calling toString()
            json.toString = () => fileName;
            resolve(json);
          }
          catch (e) { reject(new Error(`${fileName} is not a valid JSON file`)); }
        }
      })
    )
};
