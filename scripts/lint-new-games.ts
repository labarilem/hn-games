import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "fs";
import path from "path";

// Paths
const SCHEMA_PATH = path.join(__dirname, "../.vscode/game-schema.json");
const DATA_PATH = path.join(__dirname, "data/new.json");

// Load schema and data
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf-8"));
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

// Initialize AJV validator with format support
const ajv = new Ajv({ allowUnionTypes: true });
addFormats(ajv);
const validate = ajv.compile(schema);

// Validate data
const valid = validate(data);

// Output results
if (valid) {
  console.log("valid");
  process.exit(0);
} else {
  // Output errors in a format the LLM can parse
  console.log(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}
