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

var Logdown = require('logdown');
var ConversationAPI = require('./ConversationAPI.js');
var CryptoHelper = require('../util/CryptoHelper.js');
var UUID = require('pure-uuid');

/**
 * @constructor
 * @param {User} client
 */
function ConversationService(client) {
  this.client = client;
  this.conversationAPI = new ConversationAPI(client);
  this.logger = new Logdown({prefix: 'wire.core.conversation.ConversationService', alignOutput: true});
}

ConversationService.prototype.sendTextMessage = function(conversationId, text) {
  var self = this;

  var genericMessage = new self.client.protocolBuffer.GenericMessage(new UUID(4).format());
  genericMessage.set('text', new self.client.protocolBuffer.Text(text));

  return new Promise(function(resolve, reject) {
    self.logger.log(`Constructed Generic Message (ID "${genericMessage.message_id}").`);
    self.logger.log(`Getting lists of users (and their clients) in conversation (ID "${conversationId}").`);
    self.conversationAPI.sendMessage(conversationId)
      .then(function(response) {
        self.logger.log(`Received user/client map.`);
        return self.conversationAPI.getPreKeys(response.body.missing);
      })
      .then(function(response) {
        self.logger.log(`Received PreKeys (based on user/client map).`);
        return CryptoHelper.sessionsFromPreKeyMap(response.body, self.client.cryptobox);
      })
      .then(function(cryptoboxSessions) {
        self.logger.log(`Established "${cryptoboxSessions.length}" sessions.`);
        var promises = [];

        cryptoboxSessions.forEach(function(cryptoboxSession) {
          var payloadInfo = CryptoHelper.encryptPayloadAndSaveSession(cryptoboxSession, genericMessage, self.client.cryptobox);
          promises.push(payloadInfo);
        });

        return Promise.all(promises);
      })
      .then(function(payloads) {
        return self.conversationAPI.sendMessage(conversationId, payloads);
      })
      .then(function() {
        self.logger.log(`Text (${text}) has been successfully sent to conversation (${conversationId}).`);
        resolve(self.client.service);
      })
      .catch(reject);
  });
};

module.exports = ConversationService;
