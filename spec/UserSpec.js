const wire = require('../src/main/js/index');

describe('User', function() {
  describe('constructor', function() {
    it('constructs a new user', function() {
      const credentials = {
        email: 'test@wire.com',
        password: 'secret'
      };
      const cryptobox = undefined;
      const user = new wire.User(credentials, cryptobox);
      expect(user.clientInfo.password).toBe(credentials.password);
    });
  });
});
