/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { PageableHandler, RequestArgument, TYPE_PAGEABLE } from '@kapeta/sdk-rest';
import { NextFunction, Request, RequestHandler, Response } from 'express';

declare global {
    export namespace Express {
        export interface Response {
            sendError(err: RESTError | Error | string | any, statusCode?: number): void;
        }
    }
}

/**
 * Use this exception to return error to client with specific status code
 */
export class RESTError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const createRESTParameterParser = (requestArguments: RequestArgument[]): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        requestArguments.forEach((arg) => {
            const transport = arg.transport.toUpperCase();
            if (transport === 'QUERY' && arg.typeName === TYPE_PAGEABLE) {
                // Parse pageable from query params into Pageable
                // @ts-ignore
                req.query[arg.name] = PageableHandler.fromParsedQs(req.query);
            }
        });

        next();
    };
};

export const restAPIMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    res.sendError = (err: RESTError | Error | string | any, statusCode?: number) => {
        const status = statusCode ?? err?.statusCode ?? 500;
        const message = err?.message ?? err?.toString() ?? err?.name ?? 'Unknown error';
        res.status(status).json({ error: message });
    };

    next();
};
