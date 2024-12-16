import { db } from ".";
import { sql } from "kysely";
import _ from "lodash";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";

export async function loadSchema() {
  const schema = buildSchema();
  await sql.raw(schema).execute(db);
}

function buildSchema() {
  const schemaDir = path.join(
    path.dirname(url.fileURLToPath(import.meta.url)),
    "sql",
  );
  const schemaFiles = fs.readdirSync(schemaDir);

  const schemaFileOrder: string[] = ["zip", "acs_metric"];

  if (!_.isEqual([...schemaFiles].sort(), [...schemaFileOrder].sort())) {
    throw new Error(`Schema file mismatch`);
  }

  let schema = "";

  for (const fileName of schemaFileOrder) {
    const filePath = path.join(schemaDir, fileName);
    const sql = templateReplace(filePath);
    schema += sql;
  }

  return schema;
}

function templateReplace(filePath: string) {
  let content = fs.readFileSync(filePath, "utf-8");

  const replacements: { [key: string]: Record<string, string> } = {
    // Put replacement spreads here.
    //
    // Example:
    //
    // "{{ Role }}": _Role,
    // "{{ CustomerKind }}": _CustomerKind,
    // "{{ AuthStatus }}": _AuthStatus,
  };

  const tagRegEx = /\{\{\s*(?<name>.*?)\s*\}\}/;

  for (const [tag, obj] of Object.entries(replacements)) {
    // Precompile regex for object tag.
    const tagMatch = tag.match(tagRegEx);
    const objectName = tagMatch?.groups?.name;

    if (!objectName) {
      throw new Error(`Invalid tag '${tag}'`);
    }

    // Collect properties and generate replacements.
    const props = Object.entries(obj).map(([key, val]) => [
      `{{ ${objectName}.${key} }}`,
      `'${val}'`,
    ]) as [string, string][];

    const spreadRegEx = new RegExp(`'?${_.escapeRegExp(tag)}'?`, "g");

    // Replace object spread.
    const spread = Object.values(obj)
      .map((val) => `'${val}'`)
      .join(", ");
    content = content.replace(spreadRegEx, spread);

    // Replace property tags.
    for (const [propTag, value] of props) {
      const propRegEx = new RegExp(`'?${_.escapeRegExp(propTag)}'?`, "g");
      content = content.replace(propRegEx, value);
    }
  }

  const unknownTags = [...content.matchAll(/\{\{[^\}]*\}\}/g)];
  if (unknownTags.length) {
    throw new Error(
      `Unknown tags: ${unknownTags.map((match) => match[0]).join(", ")}`,
    );
  }

  return content;
}
