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
 * Author: frbattid
 */

var http = require('http'),
    httpProxy = require('http-proxy'),
    url = require('url'),
    idm = require('./idm.js'),
    logger = require('./logger.js'),
    conf = require('../conf/cosmos-proxy.json');

logger.info('Starting cosmos-proxy in ' + conf.host + ':' + conf.port);
var proxy = httpProxy.createProxyServer({});

function isWhiteListed(list, path) {
    for(var i = 0; i < list.length; i++) {
        if ('/webhdfs/v1/user/' + list[i] == path) {
            return true;
        } // if
    } // for

    return false;
} // isWhiteListed

http.createServer(function (req, res) {
    var path = url.parse(req.url).pathname;
    var token = req.headers['x-auth-token'];

    idm.authenticate(token, function(error, result) {
        if (error) {
            logger.error('Authentication error: ' + error);
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Authentication error: ' + error);
        } else {
            var json = JSON.parse(result);

            if (json['error']) {
                logger.error('Authentication error: ' + result);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Authentication error: ' + result);
            } else {
                logger.info('Authentication OK: ' + result);
                var whiteListed = isWhiteListed(conf.public_path_list,path);
                var user = json['id'];

                if (whiteListed) {
                    logger.info('Authorization OK: user ' + user + ' is allowed to access ' + path );
                    logger.info('Redirecting to http://' + conf.target.host + ':' + conf.target.port);
                    proxy.web(req, res, { target: 'http://' + conf.target.host + ':' + conf.target.port });
                } else {

                    if (path.indexOf('/webhdfs/v1/user/' + user) == 0) {
                        logger.info('Authorization OK: user ' + user + ' is allowed to access ' + path);
                        logger.info('Redirecting to http://' + conf.target.host + ':' + conf.target.port);
                        proxy.web(req, res, {target: 'http://' + conf.target.host + ':' + conf.target.port}); // forward to the target server
                    } else {
                        logger.error('Authorization error: user ' + user + ' is not allowed to access ' + path);
                        res.writeHead(400, {'Content-Type': 'text/plain'});
                        res.end('Authorization error: user ' + user + ' cannot access ' + path);
                    } // if else
                } // if else
            } // if else
        } // if else
    });
}).listen(conf.port);

