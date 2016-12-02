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
var getRandomValues = require('get-random-values');
var Logdown = require('logdown');
var Proteus = require('wire-webapp-proteus');
var ProtoBuf = require('protobufjs');
var sodium = require('libsodium');

var logger = new Logdown({prefix: 'wire.core.CryptoHelper', alignOutput: true});

function arrayToBase64(array) {
  return sodium.to_base64(new Uint8Array(array), true);
}

function preKeyToJSON(id, preKeyBundle) {
  return {
    "id": id,
    "key": arrayToBase64(preKeyBundle)
  };
}

// TODO: Would be cool if this could accept multiple files
exports.loadProtocolBuffers = function (file) {
  return new Promise(function (resolve, reject) {
    ProtoBuf.loadProtoFile(file, function (error, builder) {
      if (error) {
        reject(error);
      } else {
        resolve(builder);
      }
    });
  });
};

exports.generateSignalingKeys = function () {
  return new Promise(function (resolve) {

    // TODO: Outsource this part into Proteus.js
    var randomBytes = new Uint8Array(sodium.crypto_auth_hmacsha256_KEYBYTES);
    randomBytes = getRandomValues(randomBytes);
    var hmac = sodium.crypto_auth_hmacsha256(randomBytes, sodium.crypto_hash_sha256('salt'));

    var encryptionKey = sodium.to_base64(hmac);
    var mayKey = sodium.to_base64(hmac);
    var signalingKeys = {
      enckey: encryptionKey,
      mackey: mayKey
    };
    resolve(signalingKeys);
  });
};

exports.createLastResortPreKey = function (cryptobox) {
  var id = Proteus.keys.PreKey.MAX_PREKEY_ID;
  return exports.createPreKey(cryptobox, id);
};

exports.createPreKey = function (cryptobox, id) {
  return new Promise(function (resolve) {
    cryptobox.new_prekey(id).then(function (serialisedPreKeyBundle) {
      var json = preKeyToJSON(id, serialisedPreKeyBundle);
      resolve(json);
    });
  });
};

exports.decryptMessage = function (boxInstance, event, ciphertext) {
  return new Promise(function (resolve, reject) {
    var userId = event.from;
    var clientId = event.data.sender;
    var sessionId = `${userId}@${clientId}`;

    if (ciphertext === undefined) {
      return reject(new Error('Ciphertext is missing.'));
    } else {
      var messageBytes = sodium.from_base64(ciphertext).buffer;
      boxInstance.decrypt(sessionId, messageBytes).then(resolve).catch(reject);
    }
  });
};

function sessionFromEncodedPreKeyBundle(userId, clientId, encodedPreKeyBundle, cryptoboxInstance) {
  // TODO: Use "bazinga64.Decoder.fromBase64('SGVsbG8=')"
  var decodedPreKeyBundle = sodium.from_base64(encodedPreKeyBundle);
  var sessionId = `${userId}@${clientId}`;
  return cryptoboxInstance.session_from_prekey(sessionId, decodedPreKeyBundle.buffer);
};

exports.sessionsFromPreKeyMap = function (userPreKeyMap, cryptobox) {
  var clientPreKeys;
  var cryptoboxSessionMap = {};
  var promises = [];
  var recipients = {};
  var userId;

  for (userId in userPreKeyMap) {
    recipients[userId] = {};
    clientPreKeys = userPreKeyMap[userId];
    if (cryptoboxSessionMap[userId] == null) {
      cryptoboxSessionMap[userId] = {};
    }

    var clientId;
    var preKey;
    for (clientId in clientPreKeys) {
      preKey = clientPreKeys[clientId];
      logger.log(`Creating session for user ID "${userId}" and client ID "${clientId}" with user's PreKey ID "${preKey.id}".`);
      // TODO: Surround with try-catch
      var session = sessionFromEncodedPreKeyBundle(userId, clientId, preKey.key, cryptobox);
      promises.push(session);
    }
  }

  return Promise.all(promises);
};

exports.encryptPayloadAndSaveSession = function (cryptoboxSession, genericMessage, cryptoboxInstance) {
  return new Promise(function (resolve) {
    cryptoboxInstance.encrypt(cryptoboxSession, new Uint8Array(genericMessage.toArrayBuffer()))
      .then(function (encryptedPayload) {
        var encoded = bazinga64.Encoder.toBase64(encryptedPayload);
        var genericMessageEncryptedBase64 = encoded.asString;
        resolve({
          sessionId: cryptoboxSession.id,
          encryptedPayload: genericMessageEncryptedBase64
        });
      });
  });
};
