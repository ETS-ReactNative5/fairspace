// This middleware is an extension to the zipkin-instrumentation-express middleware
// but it will record the pathname in the RPC as well
const {
    option: {Some, None},
    Instrumentation
} = require('zipkin');
const url = require('url');

function formatRequestUrl(req) {
    const parsed = url.parse(req.originalUrl);
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: parsed.pathname,
        search: parsed.search
    });
}

module.exports = function expressMiddleware({tracer, serviceName, port = 0}) {
    const instrumentation = new Instrumentation.HttpServer({tracer, serviceName, port});
    return function zipkinExpressMiddleware(req, res, next) {
        tracer.scoped(() => {
            function readHeader(header) {
                const val = req.header(header);
                if (val != null) {
                    return new Some(val);
                } else {
                    return None;
                }
            }

            const id =
                instrumentation.recordRequest(req.method, formatRequestUrl(req), readHeader);

            tracer.recordRpc(req.method + ' ' + url.parse(req.originalUrl).pathname);

            res.on('finish', () => {
                tracer.scoped(() => {
                    const error = res.statusCode >= 400 ? res.statusCode : null;

                    instrumentation.recordResponse(id, res.statusCode, error);
                });
            });

            next();
        });
    };
};
