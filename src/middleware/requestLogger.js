
function requestLogger(req, res, next) {
    const startTime = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - startTime;
        const status = res.statusCode;
        const result = status < 400 ? "SUCCESS" : "FAILURE";

        console.log(
            `[${result}] ${req.method} ${req.path} | Status: ${status} | ${duration}ms`
        );
    });

    next();
}

module.exports = requestLogger;
