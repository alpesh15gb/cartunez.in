// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Medusa } = require("@medusajs/medusa");

const port = parseInt(process.env.PORT || "9000", 10);
const host = process.env.HOST || "0.0.0.0";

const app = new Medusa(process.cwd());
app.listen(port, host);
