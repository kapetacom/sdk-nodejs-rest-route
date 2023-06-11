import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';

export interface RouteEndpointArgument {
    name: string;
    transport: string;
}

export interface RouteEndpoint {
    method: string;
    path: string;
    description?: string;
    arguments: RouteEndpointArgument[];
    handler: (...args: any[]) => any;
}

export class RestRoute {
    private _endpoints: RouteEndpoint[] = [];

    /**
     * Validates method against specs
     */
    validateMethod(method: Function, methodName: string, argumentNames: string[]) {
        if (typeof method !== 'function') {
            throw new Error('Invalid method: ' + methodName);
        }

        const methodDefinition = method.toString();

        if (methodName !== method.name) {
            throw new Error('Unexpected method name: ' + method.name + '. Expected: ' + methodName);
        }

        if (method.length !== argumentNames.length) {
            throw new Error('Unexpected number of arguments: ' + method.length + '. Expected: ' + argumentNames.length);
        }

        //TODO: Validate argument names
    }

    /**
     * Adds endpoint to route
     * @param {RouteEndpoint} endpoint
     */
    addEndpoint(endpoint: RouteEndpoint) {
        this._endpoints.push(endpoint);
    }

    /**
     *
     * @param {request} req
     * @param {RouteEndpointArgument[]} endpointArguments
     * @return {any[]}
     * @private
     */
    _parseArguments(req: Request, endpointArguments: RouteEndpointArgument[]) {
        return endpointArguments.map((argument) => {
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
    _convertPathToExpress(path: string) {
        return path.replace(/\{([^}]+)}/g, ':$1');
    }

    /**
     * Returns expressjs Router object with all endpoints
     */
    toExpressRoute() {
        const router = express.Router();

        this._endpoints.forEach((endpoint) => {
            const method = endpoint.method.toLowerCase();

            const path = this._convertPathToExpress(endpoint.path);

            console.log('REST: Adding endpoint %s %s', method.toUpperCase(), path);

            let hasBody = false;
            const endpointArguments = endpoint.arguments;

            endpointArguments.forEach((arg) => {
                if (arg.transport?.toLowerCase() === 'body') {
                    hasBody = true;
                }
            });

            if (hasBody) {
                //Currently we only support JSON. Add more body types here (e.g. file stream)
                router.use(path, bodyParser.json());
            }

            // @ts-ignore
            router[method](path, async (req: Request, res: Response) => {
                try {
                    const parsedArguments = this._parseArguments(req, endpointArguments);

                    const responseBody = await endpoint.handler.apply(null, parsedArguments);

                    if (responseBody) {
                        res.send(responseBody);
                    } else {
                        res.status(201).send('');
                    }
                } catch (err: any) {
                    if (!err.statusCode && err.response) {
                        err = err.response;
                    }

                    if (err.statusCode) {
                        res.status(err.statusCode).send(err.response ? err.response : err.body);
                    } else {
                        console.log('%s %s failed with error: ', method, path, err && err.stack ? err.stack : err);
                        res.status(500).send({
                            error: '' + err,
                        });
                    }
                }
            });
        });

        return router;
    }
}
