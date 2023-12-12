/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import {NextFunction, Request, RequestHandler, Response} from "express";


declare global {
    export namespace Express {
        export interface Response {
            sendError(err:RESTError|Error|string|any, statusCode?:number):void
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


export const restAPIMiddleware:RequestHandler = (req:Request, res:Response, next:NextFunction) => {
    res.sendError = (err:RESTError|Error|string|any, statusCode?:number) => {
        const status = statusCode ?? err?.statusCode ?? 500;
        const message = err?.message ?? err?.toString() ?? err?.name ?? 'Unknown error';
        res.status(status).json({error: message});
    }

    next();
}
