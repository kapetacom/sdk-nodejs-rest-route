const express = require('express');
const _ = require('lodash');
const bodyParser = require('body-parser');

class RestRoute {

    constructor() {
        /**
         *
         * @type {RouteEndpoint[]}
         * @private
         */
        this._endpoints = [];
    }

    /**
     * Validates method against specs
     * @param {Function} method
     * @param {string} methodName
     * @param {string[]} argumentNames
     * @throws Error if not valid
     * @return void
     */
    validateMethod(method, methodName, argumentNames) {

    }


    /**
     * Adds endpoint to route
     * @param {RouteEndpoint} endpoint
     */
    addEndpoint(endpoint) {
        this._endpoints.push(endpoint);
    }

    /**
     *
     * @param {request} req
     * @param {RouteEndpointArgument[]} endpointArguments
     * @return {any[]}
     * @private
     */
    _parseArguments(req, endpointArguments) {
        return endpointArguments.map(argument => {
            switch (argument.transport.toLowerCase()) {
                case 'path':
                    return req.params[argument.name];
                case 'query':
                    return req.query[argument.name];
                case 'header':
                    return req.headers[argument.name.toLowerCase()];
                case 'body':
                    return req.body;
                default:
                    throw new Error('Invalid transport: ' + argument.transport);
            }
        });
    }

    /**
     * Converts paths from /some/path/{id}/{type} to /some/path/:id/:type
     * @param path
     * @return {*}
     * @private
     */
    _convertPathToExpress(path) {
        return path.replace(/\{([^\}]+)\}/g, ':$1');
    }

    /**
     * Returns expressjs Router object with all endpoints
     */
    toExpressRoute() {
        const router = new express.Router();

        this._endpoints.forEach((endpoint) => {

            const method = endpoint.method.toLowerCase();

            const path = this._convertPathToExpress(endpoint.path);

            console.log('REST: Adding endpoint %s %s', method.toUpperCase(), path);

            let hasBody = false;
            const endpointArguments = endpoint.arguments;

            endpointArguments.forEach((arg) => {
                if (arg.transport === 'body') {
                    hasBody = true;
                }
            });

            if (hasBody) {
                //Currently we only support JSON. Add more body types here (e.g. file stream)
                router.use(path, bodyParser.json());
            }

            router[method](path, async (req, res) => {
                try {

                    const parsedArguments = this._parseArguments(req, endpointArguments);

                    const responseBody = await endpoint.handler.apply(null, parsedArguments);

                    if (responseBody) {
                        res.send(responseBody);
                    } else {
                        res.status(201).send('');
                    }

                } catch(err) {
                    if (err.statusCode) {
                        res.status(err.statusCode).send(err.response);
                    } else {
                        console.log('%s %s failed with error: ', method, path, err.stack);
                        res.status(500).send({
                            error: '' + err
                        });
                    }
                }
            });
        });

        return router;
    }
}


module.exports = RestRoute;