import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const handler = require("../server.js");

export default handler;
