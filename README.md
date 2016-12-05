# Wire

This repository is part of the source code of Wire. You can find more information at [wire.com](https://wire.com) or by contacting opensource@wire.com.

You can find the published source code at [github.com/wireapp](https://github.com/wireapp).

For licensing information, see the attached LICENSE file and the list of third-party licenses at [wire.com/legal/licenses/](https://wire.com/legal/licenses/).

## wire-webapp-core

Wire for Web's communication core.

### Simple example

```javascript
var wire = require('wire-webapp-core');

var user = new wire.User({email: 'name@mail.com', password: 'secret'})
.login()
.then(function (service) {
  return service.conversation.sendTextMessage('conversation-id', 'Message');
});
```

### Advanced example

```javascript
var argv = require('optimist')
  .alias('c', 'conversation')
  .alias('e', 'email')
  .alias('m', 'message')
  .alias('p', 'password')
  .argv;
var cryptobox = require('wire-webapp-cryptobox');
var wire = require('wire-webapp-core');

var box = new cryptobox.Cryptobox(new cryptobox.store.Cache(), 10);
var user = new wire.User({email: argv.email, password: argv.password}, box);
var connectWebSocket = true;

user
.login(connectWebSocket)
.then(function (service) {
  return service.conversation.sendTextMessage(argv.conversation, argv.message);
})
.then(function (service) {
  return service.user.logout();
})
.catch(function (error) {
  console.log(`Error: ${error.message} (${error.stack})`);
});
```
