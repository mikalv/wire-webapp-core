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

const Logdown = require('logdown');
const UserAPI = require('./UserAPI.js');

/**
 * @constructor
 * @param {User} user
 */
function UserService(user) {
  this.user = user;
  this.userAPI = new UserAPI(user);
  this.logger = new Logdown({prefix: 'wire.core.user.UserService', alignOutput: true});
}

UserService.prototype.login = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    self.userAPI.login()
      .then(function(response) {
        // TODO: Such things should be handles with a "catch" block
        if (response.status === 429) {
          self.logger.warn(`Logins are too frequent. We need to logout the user on all clients...`);
          self.userAPI.removeCookies()
            .then(function() {
              return self.userAPI.login();
            });
        } else {
          return response;
        }
      })
      .then(function(response) {
        self.user.accessToken = response.body.access_token;
        self.logger.log(`Access Token is "${self.user.accessToken}".`);
        return self.user.cryptobox.init();
      })
      .then(function(initialPreKeys) {
        var fingerprint = self.user.cryptobox.identity.public_key.fingerprint();
        self.logger.log(`Public fingerprint is "${fingerprint}".`);

        // Serialize last resort PreKey
        self.user.clientInfo.lastkey = self.user.cryptobox.serialize_prekey(self.user.cryptobox.lastResortPreKey);

        // Serialize all other PreKeys
        var serializedPreKeys = [];
        initialPreKeys.forEach(function(preKey) {
          var preKeyJson = self.user.cryptobox.serialize_prekey(preKey);
          if (preKeyJson.id !== 65535) {
            serializedPreKeys.push(preKeyJson);
          }
        });

        self.user.clientInfo.prekeys = serializedPreKeys;
      })
      .then(function() {
        self.logger.log(`Creating signaling keys...`);
        return self.user.cryptoboxService.generateSignalingKey();
      })
      .then(function(signalingKey) {
        self.user.clientInfo.sigkeys = signalingKey;
        self.logger.log(`Created signaling key.`);
        self.logger.log(`Registering new "${self.user.clientInfo.type}" client of type "${self.user.clientInfo.class}/${self.user.clientInfo.model}/${self.user.clientInfo.label}" with cookie ID "${self.user.clientInfo.cookie}"...`);
        return self.userAPI.registerClient(self.user.clientInfo);
      })
      .then(function(response) {
        self.user.client = response.body;
        self.logger.log(`Registered Client (ID "${self.user.client.id}").`);
        return self.userAPI.getSelf(self.user.accessToken);
      })
      .then(function(response) {
        resolve(response.body);
      })
      .catch(reject);
  });
};

/**
 * A logout removes the cookie being used on the backend.
 * @returns {Promise}
 */
UserService.prototype.logout = function() {
  var self = this;

  return new Promise(function(resolve) {
    self.logger.log(`Logging out User with ID "${self.user.myself.id}".`);
    self.userAPI.removeCookies([self.user.clientInfo.cookie])
      .then(function(response) {
        if (response.status === 200) {
          self.user.disconnectFromWebSocket();
          resolve(self.user.service);
        }
      });
  });
};

UserService.prototype.autoConnect = function(event) {
  var self = this;

  return new Promise(function(resolve) {
    var involved = [event.connection.from, event.connection.to];
    var myIndex = involved.indexOf(self.user.myself.id);
    if (myIndex > -1) {
      involved.splice(myIndex, 1);
    }
    var otherUserID = involved.pop();

    if (event.connection.status === 'pending') {
      self.userAPI.updateConnectionStatus(self.user.accessToken, otherUserID, 'accepted')
        .then(function(response) {
          self.logger.log('Auto-Connection successful', response);
          resolve(self.user.service);
        })
        .catch(function(error) {
          self.logger.log('Auto-Connection failed', error);
        });
    }
  });
};

UserService.prototype.uploadPreKeys = function(preKeys) {
  var self = this;

  return new Promise(function(resolve, reject) {
    self.logger.log(`Uploading "${preKeys.length}" new PreKey(s) to the backend...`, preKeys);
    self.userAPI.updateClient(preKeys)
      .then(function(response) {
        if (response.status === 200) {
          resolve(response.body);
        } else {
          reject(response);
        }
      });
  });
};

module.exports = UserService;
