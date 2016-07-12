/**
 Sets up all app endpoints.
 */

var auth = require('./auth');
var user = require('./data/user');

exports.createEndpoints = function () {
    var endpoints = {
        get: {},
        post: {}
    };

    var GET = 'get';
    var POST = 'post';
    var endpoint = function (name, method, path, handler) {
        var endpoint = {
            path: path,
            handler: handler
        };
        if (method == GET) {
            endpoints.get[name] = endpoint;
        } else if (method == POST) {
            endpoints.post[name] = endpoint;
        }
    };

    var loginWithSlack = endpoint('loginWithSlack', POST, '/api/login/slack', function (req, res) {
        auth.slackAuth(req.body.code, res);
    });


    // Wrapper for endpoints that needs a valid session key.
    var authEndpoint = function (name, method, path, handler) {
        endpoint(name, method, path, function (req, res) {
            auth.getUserId(req, res, function (userId) {
                if (userId == null) return;
                handler(req, res, userId);
            });
        });
    };

    var logoutUser = authEndpoint('logoutUser', POST, '/api/logout/', function (req, res, userId) {
        /** Fetch user info */
        user.logout(userId, function (userInfo) {
            res.end();
        });
    });

    var fetchUser = authEndpoint('fetchUser', GET, '/api/user/', function (req, res, userId) {
        /** Fetch user info */
        user.getUserById(userId, function (userInfo) {
            res.send(JSON.stringify(userInfo));
        });
    });

    return endpoints;
};

exports.registerEndpoints = function (app, endpoints) {
    var name;
    var endpoint;
    for (name in endpoints.get) {
        endpoint = endpoints.get[name];
        app.get(endpoint.path, endpoint.handler);
    }
    for (name in endpoints.post) {
        endpoint = endpoints.post[name];
        app.post(endpoint.path, endpoint.handler);
    }
};
