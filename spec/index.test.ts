import { Request } from 'express';
import { RestRoute } from '../index';
import {
  createRequest, createResponse, MockRequest, MockResponse,
} from 'node-mocks-http';

describe('_parseArguments', () => {
  const req = createRequest({
    method: 'GET',
    url: '/',
    params: {
      id: '123',
    },
    query: {
      page: '1',
      limit: '10',
    },
    headers: {
      'X-Kapeta-Tags': 'tag1,tag2',
    },
    body: {
      name: 'John Doe',
      email: 'john.doe@example.com',
    }
  });

  it('should parse path arguments correctly', () => {
    const endpointArguments = [
      {
        name: 'id',
        transport: 'path',
      },
    ];

    const result = new RestRoute()._parseArguments(req, endpointArguments);

    expect(result).toEqual(['123']);
  });

  it('should parse query arguments correctly', () => {
    const endpointArguments = [
      {
        name: 'page',
        transport: 'query',
      },
      {
        name: 'limit',
        transport: 'query',
      },
    ];

    const result = new RestRoute()._parseArguments(req, endpointArguments);

    expect(result).toEqual(['1', '10']);
  });

  it('should parse header arguments correctly', () => {
    const endpointArguments = [
      {
        name: 'X-Kapeta-Tags',
        transport: 'header',
      },
    ];

    const result = new RestRoute()._parseArguments(req, endpointArguments);

    expect(result).toEqual(['tag1,tag2']);
  });

  it('should parse body arguments correctly', () => {
    const endpointArguments = [
      {
        name: '',
        transport: 'body',
      },
    ];

    const result = new RestRoute()._parseArguments(req, endpointArguments);

    expect(result).toEqual([
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
    ]);
  });

  it('should throw an error for invalid transport', () => {
    const endpointArguments = [
      {
        name: 'id',
        transport: 'invalid',
      },
    ];

    expect(() => new RestRoute()._parseArguments(req, endpointArguments)).toThrow(
      'Invalid transport: invalid'
    );
  });
});