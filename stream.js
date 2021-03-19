const {Readable} = require('stream');
const {EOL} = require('os');

class IterStream extends Readable {
  constructor(iter) {
    super();
    this.iter = iter;
  }
  _read() {
    for (const value of this.iter) {
      if (!(this.push(value + EOL))) {
        return;
      }
    }
    this.push(null);
  }
}
module.exports = IterStream;
