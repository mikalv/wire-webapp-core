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

exports.loadProtocolBuffers = function () {
  return new Promise(function (resolve) {
    // TODO: Load directly from npm package "wire-webapp-protocol-messaging": "1.18.0" using method "loadProtoFile"
    var builder = ProtoBuf.loadJson('{ "package": null, "options": { "java_package": "com.waz.model" }, "messages": [ { "name": "GenericMessage", "fields": [ { "rule": "required", "type": "string", "name": "message_id", "id": 1 }, { "rule": "optional", "type": "Text", "name": "text", "id": 2, "oneof": "content" }, { "rule": "optional", "type": "ImageAsset", "name": "image", "id": 3, "oneof": "content" }, { "rule": "optional", "type": "Knock", "name": "knock", "id": 4, "oneof": "content" }, { "rule": "optional", "type": "LastRead", "name": "lastRead", "id": 6, "oneof": "content" }, { "rule": "optional", "type": "Cleared", "name": "cleared", "id": 7, "oneof": "content" }, { "rule": "optional", "type": "External", "name": "external", "id": 8, "oneof": "content" }, { "rule": "optional", "type": "ClientAction", "name": "clientAction", "id": 9, "oneof": "content" }, { "rule": "optional", "type": "Calling", "name": "calling", "id": 10, "oneof": "content" }, { "rule": "optional", "type": "Asset", "name": "asset", "id": 11, "oneof": "content" }, { "rule": "optional", "type": "MessageHide", "name": "hidden", "id": 12, "oneof": "content" }, { "rule": "optional", "type": "Location", "name": "location", "id": 13, "oneof": "content" }, { "rule": "optional", "type": "MessageDelete", "name": "deleted", "id": 14, "oneof": "content" }, { "rule": "optional", "type": "MessageEdit", "name": "edited", "id": 15, "oneof": "content" }, { "rule": "optional", "type": "Confirmation", "name": "confirmation", "id": 16, "oneof": "content" }, { "rule": "optional", "type": "Reaction", "name": "reaction", "id": 17, "oneof": "content" }, { "rule": "optional", "type": "Ephemeral", "name": "ephemeral", "id": 18, "oneof": "content" } ], "oneofs": { "content": [ 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 ] } }, { "name": "Ephemeral", "fields": [ { "rule": "required", "type": "int64", "name": "expire_after_millis", "id": 1 }, { "rule": "optional", "type": "Text", "name": "text", "id": 2, "oneof": "content" }, { "rule": "optional", "type": "ImageAsset", "name": "image", "id": 3, "oneof": "content" }, { "rule": "optional", "type": "Knock", "name": "knock", "id": 4, "oneof": "content" }, { "rule": "optional", "type": "Asset", "name": "asset", "id": 5, "oneof": "content" }, { "rule": "optional", "type": "Location", "name": "location", "id": 6, "oneof": "content" } ], "oneofs": { "content": [ 2, 3, 4, 5, 6 ] } }, { "name": "Text", "fields": [ { "rule": "required", "type": "string", "name": "content", "id": 1 }, { "rule": "repeated", "type": "Mention", "name": "mention", "id": 2 }, { "rule": "repeated", "type": "LinkPreview", "name": "link_preview", "id": 3 } ] }, { "name": "Knock", "fields": [ { "rule": "required", "type": "bool", "name": "hot_knock", "id": 1, "options": { "default": false } } ] }, { "name": "LinkPreview", "fields": [ { "rule": "required", "type": "string", "name": "url", "id": 1 }, { "rule": "required", "type": "int32", "name": "url_offset", "id": 2 }, { "rule": "optional", "type": "Article", "name": "article", "id": 3, "oneof": "preview" }, { "rule": "optional", "type": "string", "name": "permanent_url", "id": 5 }, { "rule": "optional", "type": "string", "name": "title", "id": 6 }, { "rule": "optional", "type": "string", "name": "summary", "id": 7 }, { "rule": "optional", "type": "Asset", "name": "image", "id": 8 }, { "rule": "optional", "type": "Tweet", "name": "tweet", "id": 9, "oneof": "meta_data" } ], "oneofs": { "preview": [ 3 ], "meta_data": [ 9 ] } }, { "name": "Tweet", "fields": [ { "rule": "optional", "type": "string", "name": "author", "id": 1 }, { "rule": "optional", "type": "string", "name": "username", "id": 2 } ] }, { "name": "Article", "fields": [ { "rule": "required", "type": "string", "name": "permanent_url", "id": 1 }, { "rule": "optional", "type": "string", "name": "title", "id": 2 }, { "rule": "optional", "type": "string", "name": "summary", "id": 3 }, { "rule": "optional", "type": "Asset", "name": "image", "id": 4 } ] }, { "name": "Mention", "fields": [ { "rule": "required", "type": "string", "name": "user_id", "id": 1 }, { "rule": "required", "type": "string", "name": "user_name", "id": 2 } ] }, { "name": "LastRead", "fields": [ { "rule": "required", "type": "string", "name": "conversation_id", "id": 1 }, { "rule": "required", "type": "int64", "name": "last_read_timestamp", "id": 2 } ] }, { "name": "Cleared", "fields": [ { "rule": "required", "type": "string", "name": "conversation_id", "id": 1 }, { "rule": "required", "type": "int64", "name": "cleared_timestamp", "id": 2 } ] }, { "name": "MessageHide", "fields": [ { "rule": "required", "type": "string", "name": "conversation_id", "id": 1 }, { "rule": "required", "type": "string", "name": "message_id", "id": 2 } ] }, { "name": "MessageDelete", "fields": [ { "rule": "required", "type": "string", "name": "message_id", "id": 1 } ] }, { "name": "MessageEdit", "fields": [ { "rule": "required", "type": "string", "name": "replacing_message_id", "id": 1 }, { "rule": "optional", "type": "Text", "name": "text", "id": 2, "oneof": "content" } ], "oneofs": { "content": [ 2 ] } }, { "name": "Confirmation", "fields": [ { "rule": "required", "type": "string", "name": "message_id", "id": 1 }, { "rule": "required", "type": "Type", "name": "type", "id": 2 } ], "enums": [ { "name": "Type", "values": [ { "name": "DELIVERED", "id": 0 }, { "name": "READ", "id": 1 } ] } ] }, { "name": "Location", "fields": [ { "rule": "required", "type": "float", "name": "longitude", "id": 1 }, { "rule": "required", "type": "float", "name": "latitude", "id": 2 }, { "rule": "optional", "type": "string", "name": "name", "id": 3 }, { "rule": "optional", "type": "int32", "name": "zoom", "id": 4 } ] }, { "name": "ImageAsset", "fields": [ { "rule": "required", "type": "string", "name": "tag", "id": 1 }, { "rule": "required", "type": "int32", "name": "width", "id": 2 }, { "rule": "required", "type": "int32", "name": "height", "id": 3 }, { "rule": "required", "type": "int32", "name": "original_width", "id": 4 }, { "rule": "required", "type": "int32", "name": "original_height", "id": 5 }, { "rule": "required", "type": "string", "name": "mime_type", "id": 6 }, { "rule": "required", "type": "int32", "name": "size", "id": 7 }, { "rule": "optional", "type": "bytes", "name": "otr_key", "id": 8 }, { "rule": "optional", "type": "bytes", "name": "mac_key", "id": 9 }, { "rule": "optional", "type": "bytes", "name": "mac", "id": 10 }, { "rule": "optional", "type": "bytes", "name": "sha256", "id": 11 } ] }, { "name": "Asset", "fields": [ { "rule": "optional", "type": "Original", "name": "original", "id": 1 }, { "rule": "optional", "type": "NotUploaded", "name": "not_uploaded", "id": 3, "oneof": "status" }, { "rule": "optional", "type": "RemoteData", "name": "uploaded", "id": 4, "oneof": "status" }, { "rule": "optional", "type": "Preview", "name": "preview", "id": 5 } ], "oneofs": { "status": [ 3, 4 ] }, "messages": [ { "name": "Original", "fields": [ { "rule": "required", "type": "string", "name": "mime_type", "id": 1 }, { "rule": "required", "type": "uint64", "name": "size", "id": 2 }, { "rule": "optional", "type": "string", "name": "name", "id": 3 }, { "rule": "optional", "type": "ImageMetaData", "name": "image", "id": 4, "oneof": "meta_data" }, { "rule": "optional", "type": "VideoMetaData", "name": "video", "id": 5, "oneof": "meta_data" }, { "rule": "optional", "type": "AudioMetaData", "name": "audio", "id": 6, "oneof": "meta_data" }, { "rule": "optional", "type": "string", "name": "source", "id": 7 }, { "rule": "optional", "type": "string", "name": "caption", "id": 8 } ], "oneofs": { "meta_data": [ 4, 5, 6 ] } }, { "name": "Preview", "fields": [ { "rule": "required", "type": "string", "name": "mime_type", "id": 1 }, { "rule": "required", "type": "uint64", "name": "size", "id": 2 }, { "rule": "optional", "type": "RemoteData", "name": "remote", "id": 3 }, { "rule": "optional", "type": "ImageMetaData", "name": "image", "id": 4, "oneof": "meta_data" } ], "oneofs": { "meta_data": [ 4 ] } }, { "name": "ImageMetaData", "fields": [ { "rule": "required", "type": "int32", "name": "width", "id": 1 }, { "rule": "required", "type": "int32", "name": "height", "id": 2 }, { "rule": "optional", "type": "string", "name": "tag", "id": 3 } ] }, { "name": "VideoMetaData", "fields": [ { "rule": "optional", "type": "int32", "name": "width", "id": 1 }, { "rule": "optional", "type": "int32", "name": "height", "id": 2 }, { "rule": "optional", "type": "uint64", "name": "duration_in_millis", "id": 3 } ] }, { "name": "AudioMetaData", "fields": [ { "rule": "optional", "type": "uint64", "name": "duration_in_millis", "id": 1 }, { "rule": "optional", "type": "bytes", "name": "normalized_loudness", "id": 3 } ] }, { "name": "RemoteData", "fields": [ { "rule": "required", "type": "bytes", "name": "otr_key", "id": 1 }, { "rule": "required", "type": "bytes", "name": "sha256", "id": 2 }, { "rule": "optional", "type": "string", "name": "asset_id", "id": 3 }, { "rule": "optional", "type": "string", "name": "asset_token", "id": 5 } ] } ], "enums": [ { "name": "NotUploaded", "values": [ { "name": "CANCELLED", "id": 0 }, { "name": "FAILED", "id": 1 } ] } ] }, { "name": "External", "fields": [ { "rule": "required", "type": "bytes", "name": "otr_key", "id": 1 }, { "rule": "optional", "type": "bytes", "name": "sha256", "id": 2 } ] }, { "name": "Reaction", "fields": [ { "rule": "optional", "type": "string", "name": "emoji", "id": 1 }, { "rule": "required", "type": "string", "name": "message_id", "id": 2 } ] }, { "name": "Calling", "fields": [ { "rule": "required", "type": "string", "name": "content", "id": 1 } ] } ], "enums": [ { "name": "ClientAction", "values": [ { "name": "RESET_SESSION", "id": 0 } ] } ] }', 'messages.proto');
    resolve(builder);
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
