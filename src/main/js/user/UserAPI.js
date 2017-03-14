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

const Logdown = require('logdown');
const popsicle = require('popsicle');
const status = require('popsicle-status');

/**
 * @constructor
 * @param {User} user
 */
function UserAPI(user) {
  this.user = user;
  this.logger = new Logdown({prefix: 'wire.core.user.UserAPI', alignOutput: true});
}

UserAPI.prototype.login = function() {
  let self = this;

  return popsicle.request({
    method: 'POST',
    url: `${self.user.backendURL}/login?persist=false`,
    body: {
      email: self.user.email,
      password: self.user.password,
    },
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  }).use([status(), popsicle.plugins.parse('json')]);
};

UserAPI.prototype.logout = function(cookieLabel) {
  let self = this;

  // TODO: message: 'missing cookie'
  // TODO: We need to use 'withCredentials' (to send the cookie) which is not available with Node.js:
  // @see https://github.com/blakeembrey/popsicle#built-in-transports
  return popsicle.request({
    method: 'POST',
    url: `${self.user.backendURL}/access/logout`,
    body: {
      access_token: self.user.accessToken,
    },
    headers: {
      'Authorization': `Bearer ${decodeURIComponent(self.user.accessToken)}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  }).use([status(), popsicle.plugins.parse('json')]);
};

UserAPI.prototype.removeCookies = function(labels) {
  let self = this;

  return popsicle.request({
    method: 'POST',
    url: `${self.user.backendURL}/cookies/remove`,
    body: {
      email: self.user.email,
      password: self.user.password,
      labels: labels,
    },
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  }).use([status(), popsicle.plugins.parse('json')]);
};

UserAPI.prototype.registerClient = function(clientInfo) {
  let self = this;

  return popsicle.request({
    method: 'POST',
    url: `${self.user.backendURL}/clients`,
    body: clientInfo,
    headers: {
      'Authorization': `Bearer ${decodeURIComponent(self.user.accessToken)}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  }).use([status(), popsicle.plugins.parse('json')]);
};

UserAPI.prototype.getSelf = function() {
  let self = this;

  return popsicle.request({
    method: 'GET',
    url: `${self.user.backendURL}/self`,
    headers: {
      'Authorization': `Bearer ${decodeURIComponent(self.user.accessToken)}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  }).use([status(), popsicle.plugins.parse('json')]);
};

UserAPI.prototype.updateConnectionStatus = function(userId, connectionStatus) {
  let self = this;

  return popsicle.request({
    method: 'PUT',
    url: `${self.user.backendURL}/connections/${userId}`,
    body: {
      status: connectionStatus,
    },
    headers: {
      'Authorization': `Bearer ${decodeURIComponent(self.user.accessToken)}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  }).use([status(), popsicle.plugins.parse('json')]);
};

/**
 * @param {String} clientId
 * @param {Array} preKeys
 * @returns {Promise}
 * @see https://staging-nginz-https.zinfra.io/swagger-ui/#!/users/updateClient
 */
UserAPI.prototype.updateClient = function(preKeys) {
  let self = this;

  return popsicle.request({
    method: 'PUT',
    url: `${self.user.backendURL}/clients/${self.user.client.id}`,
    body: {
      prekeys: preKeys,
    },
    headers: {
      'Authorization': `Bearer ${decodeURIComponent(self.user.accessToken)}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  }).use([status(), popsicle.plugins.parse('json')]);
};

module.exports = UserAPI;
