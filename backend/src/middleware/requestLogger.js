
function requestLogger(req, res, next) {
    const startTime = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - startTime;
        const status = res.statusCode;
        const result = status < 400 ? "SUCCESS" : "FAILURE";
        // req.path is rewritten by mounted routers, so it only shows the
        // router-relative path ("/cart/items"). originalUrl keeps the full path.
        const path = req.originalUrl.split("?")[0];

        console.log(
            `[${result}] ${req.method} ${path} | Status: ${status} | ${duration}ms`
        );
    });

    next();
}

module.exports = requestLogger;
