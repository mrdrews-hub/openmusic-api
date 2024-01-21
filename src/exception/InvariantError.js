const ClientError = require('./ClientError');

module.exports = class InvariantError extends ClientError {
  constructor(message) {
    super(message);
    this.name = 'InvariantError';
  }
}
