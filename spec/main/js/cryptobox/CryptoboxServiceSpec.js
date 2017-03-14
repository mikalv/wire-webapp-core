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

const cryptobox = require('wire-webapp-cryptobox');
const protobuf = require('protobufjs');
const UUID = require('pure-uuid');
const wire = require('../../../../src/main/js/index');

describe('CryptoboxService', () => {

  let buffers = {};
  let cryptoboxService = undefined;

  beforeAll(function(done) {
    var file = 'node_modules/wire-webapp-protocol-messaging/proto/messages.proto';

    protobuf.load(file)
      .then(function(root) {
        buffers.GenericMessage = root.lookup('GenericMessage');
        buffers.Text = root.lookup('Text');
        done();
      })
      .catch(done.fail);
  });

  beforeEach(done => {
    const cryptoboxInstance = new cryptobox.Cryptobox(new cryptobox.store.Cache());
    cryptoboxInstance.init()
      .then(() => {
        cryptoboxService = new wire.cryptobox.CryptoboxService(cryptoboxInstance);
        done();
      })
      .catch(done.fail);
  });

  describe('encrypt', () => {

    it('encrypts a payload for multiple users', done => {
      const preKeyMap = {
        "062418ea-9b93-4d93-b59b-11aba3f702d8": {
          "a4d7fcac1e8592f2": {
            "key": "pQABARn//wKhAFgg5fwzzahXsFp99ChcRC0/0qIr4vLCujkcRSOkziiTz8gDoQChAFggaK10DY60iH38gbXc9GoOrv+SqQ0p3AEsR0WjHQLkV5kE9g==",
            "id": 1
          },
          "7c21a3ee9079660d": {
            // Invalid PreKey format
            "key": "hAEZ//9YIOxZw78oQCH6xKyAI7WqagtbvRZ/LaujG+T790hOTbf7WCDqAE5Dc75VfmYji6wEz976hJ2hYuODYE6pA59DNFn/KQ==",
            "id": 2
          },
          "9ef17f12222c2774": {
            "key": "pQABARn//wKhAFgggwna+Qib60rXrNvQn2f52InOksLLWxqsBc/IVXlPOFYDoQChAFggFrEJ3hm9E/+a2qOScPogUyP0I8MnGdbtpct5og+zqgcE9g==",
            "id": 3
          },
          "f946ad265dadb91c": {
            "key": "pQABARn//wKhAFggHEsiF1orNsaufLOh+J5FRGaBYllwZYnd0wcwjRGVElsDoQChAFggiU/dsNEE2GAYjC40GgpKZRbg4piKnL/7kefkZDLiKwoE9g==",
            "id": 4
          }
        },
        "532af01e-1e24-4366-aacf-33b67d4ee376": {
          "121c39cebc4334ce": {
            "key": "pQABARn//wKhAFgg3OpuTCUwDZMt1fklZB4M+fjDx/3fyx78gJ6j3H3dM2YDoQChAFggQU1orulueQHLv5YDYqEYl3D4O0zA9d+TaGGXXaBJmK0E9g==",
            "id": 1
          },
          "d13a2ec9b6436122": {
            "key": "pQABARn//wKhAFggNn76htcJ0aj1sDdEjEIQwhCSRA0gkaz0ffIALRQ7eecDoQChAFggHN2gpfdpD+OnqM25ri5PK0DxFDbuAAUF5M2FQMEh98kE9g==",
            "id": 2
          },
          "ae2f05b82e7d0755": {
            "key": "pQABARkM0wKhAFggpQMetn5X1/Vub+EXjfG/NeLkpbpgUzSMu5Lzko4SkP4DoQChAFggcgWVhdl2kaCK4RqL6B2cBA2NH8MvLeubjabuidaYfTwE9g==",
            "id": 3
          },
          "24964a1b2c592a79": {
            "key": "pQABARn//wKhAFggaRJhvBf2LxujctLy3cH8AvWSLDybdOz2/LqMdwEYtL0DoQChAFgg4TU/l2LeilX/Yv5BZqbcfDe4dUy4AVQ8urO50AINKvoE9g==",
            "id": 4
          },
          "985968e52706abd2": {
            "key": "pQABARn//wKhAFggw06MGG/h6RJLCa/8Pwuv74bZIlXMvBc806zOMwv8wyEDoQChAFgguDj2gHaPq9jJ9e9WjcL0M3Q9jD2MyT3YpDAvItKGaSkE9g==",
            "id": 5
          },
          "eafee410b3a12001": {
            "key": "pQABARn//wKhAFggglsfC1LFZXfh52vIPtN57ywa0DskgGqtPUjId2VL1ewDoQChAFggJAzB7xytMsVBn1qoA2huqzPd5pXRqQ/heoUHV7JqIT8E9g==",
            "id": 6
          },
          "aaaa46ec8139d90b": {
            "key": "pQABARn//wKhAFggORQ7oT8VYFaFgfEkfGeAeFAGf78RbyCJX4JBiPJbSjcDoQChAFggMV+x/zrcoZ6WXdANOqvvub82UZ2SqF3tjMJaoJAcr7kE9g==",
            "id": 7
          },
          "fd9f83493370c420": {
            "key": "pQABARn//wKhAFggUqyZIJbp3Ua1i2wjKVjrgntvD5F9Oh7Lza7PmT28ajkDoQChAFgg6Zz4mdoCqirlpy6V5EZu+dpDX50dlC7VsQwaBHbgFmcE9g==",
            "id": 65535
          }
        }
      };

      const payload = {
        messageId: new UUID(4).format(),
        text: buffers.Text.create({content: 'Hello'})
      };
      const message = buffers.GenericMessage.create(payload);
      const buffer = buffers.GenericMessage.encode(message).finish();
      const typedArray = new Uint8Array(buffer);

      cryptoboxService.encrypt(typedArray, preKeyMap)
        .then(encryptions => {
          expect(encryptions.length).toBe(12);
          done();
        })
        .catch(done.fail);
    });

  });

});
