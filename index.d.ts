interface RouteEndpoint {
    method: string,
    path: string,
    description: string,
    arguments: RouteEndpointArgument[],
    handler: Function
}

interface RouteEndpointArgument {
    name: string,
    transport: string
}