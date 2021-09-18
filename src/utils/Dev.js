/** Dev mode
 * https://stackoverflow.com/a/58556477
 */
import process from "process";

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

export { isDev };
