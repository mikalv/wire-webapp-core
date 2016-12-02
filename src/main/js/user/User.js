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

var bazinga64 = require('bazinga64');
var cryptobox = require('wire-webapp-cryptobox');
var Logdown = require('logdown');
var platform = require('platform');
var WebSocket = require('ws');

var ConversationService = require('../conversation/ConversationService');
var CryptoHelper = require('../util/CryptoHelper');
var UserAPI = require('./UserAPI');
var UserService = require('./UserService');

function User(email, password) {
  this.accessToken = undefined;
  this.backendURL = 'https://prod-nginz-https.wire.com';
  this.user = undefined;
  this.clientInfo = {
    class: 'desktop',
    cookie: 'webapp@1224301118@temporary@1472638149000',
    label: `${platform.os.family}`,
    lastkey: undefined,
    model: platform.name,
    password: password,
    prekeys: undefined,
    sigkeys: undefined,
    type: 'temporary'
  };
  this.cryptobox = new cryptobox.Cryptobox(new cryptobox.store.Cache());
  this.email = email;
  this.logger = new Logdown({prefix: 'wire.core.user.User', alignOutput: true});
  this.myself = undefined;
  this.password = password;
  this.protocolBuffer = undefined;
  this.webSocket = undefined;
  this.webSocketIntervalID = undefined;
  this.service = {
    user: new UserService(this)
  };
}

User.prototype.login = function (connectSocket) {
  var connectWebSocket = connectSocket || false;
  var self = this;

  return new Promise(function (resolve) {
    CryptoHelper.loadProtocolBuffers('node_modules/wire-webapp-protocol-messaging/proto/messages.proto')
      .then(function (builder) {
        self.protocolBuffer = builder.build();
        return self.service.user.login();
      })
      .then(function (selfInfo) {
        self.myself = selfInfo;
        self.logger.log(`Successfully logged in (User ID "${self.myself.id}").`);
        self.service.conversation = new ConversationService(self);
      })
      .then(function () {
        if (connectWebSocket) {
          return self.connectToWebSocket();
        } else {
          return undefined;
        }
      })
      .then(function (webSocket) {
        self.webSocket = webSocket;
        resolve(self.service);
      });
  });
};

User.prototype.disconnectFromWebSocket = function () {
  if (this.webSocket) {
    this.logger.log("Disconnecting from WebSocket...");
    clearInterval(this.webSocketIntervalID);
    this.webSocket.close();
  } else {
    this.logger.warn("There is no WebSocket connection which can be closed.");
  }
};

// TODO: Make private
User.prototype.connectToWebSocket = function () {
  var self = this;

  return new Promise(function (resolve) {
    var url = `wss://prod-nginz-ssl.wire.com/await?access_token=${self.accessToken}&client=${self.client.id}`;

    var socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';

    socket.on('close', function close() {
      self.logger.log(`Disconnected from: "${url}".`);
    });

    socket.on('open', function open() {
      self.logger.log(`Connected WebSocket to: "${url}".`);

      function send_ping() {
        socket.send(`Wire is so much nicer with internet!`);
        self.logger.log(`Pinged...`);
      }

      self.webSocketIntervalID = setInterval(send_ping, 10000);
      resolve(socket);
    });

    socket.on('message', function message(data) {
      var notification = JSON.parse(bazinga64.Converter.arrayBufferViewToStringUTF8(data));
      var events = notification.payload;
      for (var event of events) {
        self.logger.log(`Received '${event.type}' event.`, JSON.stringify(event));

        switch (event.type) {
          case 'conversation.otr-message-add':
            var ciphertext = event.data.text;
            self.decryptMessage(event, ciphertext);
            break;
          case 'user.connection':
            self.service.user.autoConnect(event);
            break;
          default:
            self.logger.log(`Unrecognized event`, event);
        }
      }
    });

    socket.on('close', function close() {
      self.logger.log('Closed WebSocket connection.');
    });
  });
};

// TODO: Make private
User.prototype.decryptMessage = function (event, ciphertext) {
  var self = this;

  CryptoHelper.decryptMessage(self.cryptobox, event, ciphertext).then(function (decryptedMessage) {
    var genericMessage = new self.protocolBuffer.GenericMessage.decode(decryptedMessage);

    switch (genericMessage.content) {
      case 'text':
        var text = genericMessage.text.content;
        self.logger.log(`Received text: "${text}".`);
        break;
      default:
        self.logger.log(`Ignored event "${genericMessage.content}".`);
    }

  }).catch(function (error) {
    self.logger.log(`Decryption failed: ${error.message} (${error.stack})`);
  });
};

module.exports = User;
