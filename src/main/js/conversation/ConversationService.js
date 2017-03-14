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

const ConversationAPI = require('./ConversationAPI');
const Logdown = require('logdown');
const UUID = require('pure-uuid');

/**
 * @constructor
 * @param {User} client
 */
function ConversationService(client) {
  this.client = client;
  this.conversationAPI = new ConversationAPI(client);
  this.cryptoboxService = client.cryptoboxService;
  this.logger = new Logdown({prefix: 'wire.core.conversation.ConversationService', alignOutput: true});
}

ConversationService.prototype.sendTextMessage = function(conversationId, text) {
  let self = this;

  const genericMessage = self.client.protocolBuffer.GenericMessage.create({
    messageId: new UUID(4).format(),
    text: self.client.protocolBuffer.Text.create({content: text}),
  });

  return new Promise(function(resolve, reject) {
    self.logger.log(`Constructed Generic Message (ID "${genericMessage.messageId}").`);
    self.logger.log(`Getting lists of users (and their clients) in conversation (ID "${conversationId}").`);
    self.conversationAPI.sendMessage(conversationId)
      .then(function(response) {
        self.logger.log('Received user/client map.');
        return self.conversationAPI.getPreKeys(response.body.missing);
      })
      .then(function(response) {
        self.logger.log(`Received PreKeys for "${Object.keys(response.body).length}" users (based on user/client map).`);
        const typedArray = self.client.protocolBuffer.GenericMessage.encode(genericMessage).finish();
        return self.cryptoboxService.encrypt(typedArray, response.body);
      })
      .then(function(payloads) {
        return self.conversationAPI.sendMessage(conversationId, payloads);
      })
      .then(function(response) {
        if (response.status === 400) {
          reject(new Error(response.body.message));
        } else {
          self.logger.log(`Text (${text}) has been successfully sent to conversation (${conversationId}).`);
          resolve(self.client.service);
        }
      })
      .catch(reject);
  });
};

module.exports = ConversationService;
