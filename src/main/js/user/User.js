/*
 * Wire
 * Copyright (C) 2016 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

'use strict';

const bazinga64 = require('bazinga64');
const cryptobox = require('wire-webapp-cryptobox');
const Logdown = require('logdown');
const protobuf = require('protobufjs');
const WebSocket = require('ws');

const ConversationService = require('../conversation/ConversationService.js');
const CryptoboxService = require('../cryptobox/CryptoboxService');
const UserService = require('./UserService.js');

function User(credentials, cryptoboxInstance) {
  this.accessToken = undefined;
  this.backendURL = 'https://prod-nginz-https.wire.com';
  this.clientInfo = {
    class: 'desktop',
    cookie: 'webapp@1224301118@temporary@1472638149000',
    label: 'bot',
    lastkey: undefined,
    model: 'node',
    password: credentials.password,
    prekeys: undefined,
    sigkeys: undefined,
    type: 'temporary',
  };
  this.cryptobox = (cryptoboxInstance) ? cryptoboxInstance : new cryptobox.Cryptobox(new cryptobox.store.Cache());
  this.cryptoboxService = new CryptoboxService(this.cryptobox);
  this.email = credentials.email;
  this.logger = new Logdown({prefix: 'wire.core.user.User', alignOutput: true});
  this.myself = undefined;
  this.password = credentials.password;
  this.protocolBuffer = {};
  this.webSocket = undefined;
  this.webSocketIntervalID = undefined;
  this.service = {
    user: new UserService(this),
  };
  this.subscribe();
}

// TODO: Make private
User.prototype.subscribe = function() {
  let self = this;
  const topicName = cryptobox.Cryptobox.TOPIC.NEW_PREKEYS;

  function callback(data) {
    self.logger.log(`Received "${data.length}" new PreKey(s) (via "${topicName}").`);

    const serializedPreKeys = [];
    data.forEach(function(preKey) {
      const preKeyJson = self.cryptobox.serialize_prekey(preKey);
      serializedPreKeys.push(preKeyJson);
    });

    self.service.user.uploadPreKeys(serializedPreKeys)
      .then(function() {
        const ids = serializedPreKeys.map(function(serializedPreKey) {
          return serializedPreKey.id;
        }).join(', ');
        self.logger.log(`Successfully uploaded "${serializedPreKeys.length}" new PreKey(s). IDs: ${ids}`);
      })
      .catch(function(response) {
        self.logger.log('Failure during PreKey upload.', response);
      });
  }

  self.cryptobox.on(topicName, callback);
  this.logger.log(`Listening for external events on "${topicName}".`);
};

User.prototype.login = function(connectSocket) {
  const connectWebSocket = connectSocket || false;
  let self = this;

  return new Promise(function(resolve, reject) {
    // TODO: Use new Protobuf.js API

    protobuf.load('node_modules/wire-webapp-protocol-messaging/proto/messages.proto')
      .then(function(root) {
        self.protocolBuffer.GenericMessage = root.lookup('GenericMessage');
        self.protocolBuffer.Text = root.lookup('Text');
        return self.service.user.login();
      })
      .then(function(selfInfo) {
        self.myself = selfInfo;
        self.logger.log(`Successfully logged in (User ID "${self.myself.id}").`);
        self.service.conversation = new ConversationService(self);
      })
      .then(function() {
        if (connectWebSocket) {
          return self.connectToWebSocket();
        } else {
          return undefined;
        }
      })
      .then(function(webSocket) {
        self.webSocket = webSocket;
        resolve(self.service);
      })
      .catch(reject);
  });
};

User.prototype.disconnectFromWebSocket = function() {
  if (this.webSocket) {
    this.logger.log('Disconnecting from WebSocket...');
    clearInterval(this.webSocketIntervalID);
    this.webSocket.close();
  } else {
    this.logger.warn('There is no WebSocket connection which can be closed.');
  }
};

// TODO: Make private
User.prototype.connectToWebSocket = function() {
  let self = this;

  return new Promise(function(resolve) {
    const url = `wss://prod-nginz-ssl.wire.com/await?access_token=${self.accessToken}&client=${self.client.id}`;

    const socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';

    socket.on('close', function close() {
      self.logger.log(`Disconnected from: "${url}".`);
    });

    socket.on('open', function open() {
      self.logger.log(`Connected WebSocket to: "${url}".`);

      function send_ping() {
        socket.send('Wire is so much nicer with internet!');
      }

      self.webSocketIntervalID = setInterval(send_ping, 10000);
      resolve(socket);
    });

    socket.on('message', function message(data) {
      const notification = JSON.parse(bazinga64.Converter.arrayBufferViewToStringUTF8(data));
      const events = notification.payload;
      for (let event of events) {
        self.logger.log(`Received event of type "${event.type}".`, JSON.stringify(event));

        switch (event.type) {
          case 'conversation.otr-message-add':
            self.decryptMessage(event, event.data.text);
            break;
          case 'user.connection':
            self.service.user.autoConnect(event);
            break;
          default:
            self.logger.log(`Unrecognized event (${event.type})`, event);
        }
      }
    });

    socket.on('close', function close() {
      self.logger.log('Closed WebSocket connection.');
    });
  });
};

// TODO: Make private
User.prototype.decryptMessage = function(event, ciphertext) {
  let self = this;

  this.cryptoboxService.decryptMessage(event, ciphertext)
    .then(function(decryptedMessage) {
      const genericMessage = self.protocolBuffer.GenericMessage.decode(decryptedMessage);

      switch (genericMessage.content) {
        case 'text':
          self.logger.log(`Received text: "${genericMessage.text.content}".`);
          break;
        default:
          self.logger.log(`Ignored event "${genericMessage.content}".`);
      }

    })
    .catch(function(error) {
      self.logger.log(`Decryption failed: ${error.message} (${error.stack})`);
    });
};

module.exports = User;
