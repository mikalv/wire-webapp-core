'use strict';

const bazinga64 = require('bazinga64');

class CryptoboxService {
  constructor(cryptobox) {
    this.cryptobox = cryptobox;
  }

  _constructSessionId(userId, clientId) {
    return `${userId}@${clientId}`;
  }

  _encrypt(sessionId, typedArray, decodedPreKeyBundle) {
    return Promise.resolve()
      .then(() => {
        return this.cryptobox.encrypt(sessionId, typedArray, decodedPreKeyBundle.buffer);
      })
      .then(encryptedPayload => bazinga64.Encoder.toBase64(encryptedPayload).asString)
      .catch(error => '💣')
      .then(encryptedPayload => ({
        sessionId,
        encryptedPayload,
      }));
  }

  decryptMessage(event, ciphertext) {
    return new Promise((resolve, reject) => {
      const sessionId = this._constructSessionId(event.from, event.data.sender);

      if (ciphertext === undefined) {
        return reject(new Error('Ciphertext is missing.'));
      } else {
        const messageBytes = bazinga64.Decoder.fromBase64(ciphertext).asBytes;
        this.cryptobox.decrypt(sessionId, messageBytes.buffer)
          .then(resolve)
          .catch(reject);
      }
    });
  }

  encrypt(typedArray, preKeyMap) {
    const recipients = {};
    const encryptions = [];

    for (let userId in preKeyMap) {
      recipients[userId] = {};
      for (let clientId in preKeyMap[userId]) {
        const preKeyPayload = preKeyMap[userId][clientId];
        const preKey = preKeyPayload.key;


        const sessionId = this._constructSessionId(userId, clientId);
        const decodedPreKeyBundle = bazinga64.Decoder.fromBase64(preKey).asBytes;

        encryptions.push(this._encrypt(sessionId, typedArray, decodedPreKeyBundle));
      }
    }

    return Promise.all(encryptions);
  }

  generateSignalingKey() {
    return Promise.resolve()
      .then(() => ({
        enckey: 'Wuec0oJi9/q9VsgOil9Ds4uhhYwBT+CAUrvi/S9vcz0=',
        mackey: 'Wuec0oJi9/q9VsgOil9Ds4uhhYwBT+CAUrvi/S9vcz0=',
      }));
  }
}

module.exports = CryptoboxService;
