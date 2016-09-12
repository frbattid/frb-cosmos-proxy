/**
 * Copyright 2016 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of frb-cosmos-proxy.
 *
 * frb-cosmos-proxy is free software: you can redistribute it and/or modify it under the terms of the GNU Affero
 * General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 * frb-cosmos-proy is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
 * implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with frb-cosmos-proxy. If not, see
 * http://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License please contact with
 * francisco dot romerobueno at telefonica dot com
 */

/**
 * Author: pcoello25
 */

var fs = require('fs'),
    cache = [],
    conf = require('../conf/cosmos-proxy.json');

var pathToFile = conf.cache_file;

function createEmptyFileCache() {
    return fs.closeSync(fs.openSync(pathToFile,'w'));
} // createEmptyCache

function isCacheEmpty() {
    return (cache == null || cache.length == undefined || cache.length == 0);
} // isCacheEmpty

function isInCache(reqUser) {
    if (!isCacheEmpty()) {
        for (var i=0; i<cache.length; i++) {
            for (var key in cache[i]) {
                if (cache[i].hasOwnProperty(key)) {
                    if ((key === 'user') && (cache[i][key] === reqUser)) {
                        return true;
                    } // if
                } // if
            } // for
        } // for
    } // if
    return false;
} // isInCache

function isUsersToken(reqUser, token) {
    var isCachedUser = false;
    if (!isCacheEmpty()) {
        for (var i=0; i<cache.length; i++) {
            for (var key in cache[i]) {
                if (cache[i].hasOwnProperty(key)) {
                    if ((key === 'user') && (cache[i][key] === reqUser)) {
                        isCachedUser = true;
                    } // if
                    if ((isCachedUser) && (key == 'token') && (cache[i][key] === token)) {
                        return true;
                    }
                } // if
            } // for
            isCachedUser = false;
        } // for
    } // if
    return false;
} // isInCache

function isCacheAuthenticated(reqUser, token) {
    if (isInCache(reqUser)) {
        if (isUsersToken(reqUser, token)) {
            return true;
        } // if
    } // if
    return false;
} // isCacheAuthenticated

function updateCacheFile() {
    fs.writeFileSync(pathToFile,'[' + cache + ']');
} // updateFileCache

function loadCacheData() {
    return JSON.parse(fs.readFileSync(pathToFile, 'utf8'));
} // loadCacheData

function pushNewEntry(newValue) {
    cache.push(newValue);
    updateCacheFile(pathToFile);
} // pushNewEntry

module.exports = {
    isCacheAuthenticated: isCacheAuthenticated,
    updateCacheFile: updateCacheFile,
    createEmptyFileCache: createEmptyFileCache,
    loadCacheData: loadCacheData,
    isCacheEmpty: isCacheEmpty,
    pushNewEntry: pushNewEntry
} // module.exports

