import "colors";

/**
 * This loads and verifies that all declared environment variables have a value.
 */
export async function loadEnv() {
  const { config } = await import("dotenv");
  const env = config().parsed;

  if (env === undefined) {
    console.error(`No environment defined`.red);
    process.exit(1);
  }

  const emptyVariableKeys = [];

  for (const [key, value] of Object.entries(env)) {
    if (!value) {
      emptyVariableKeys.push(key);
    }
  }

  if (emptyVariableKeys.length) {
    for (const key of emptyVariableKeys) {
      console.error(`Missing environment variable '${key}'`.red);
    }

    process.exit(1);
  }
}

/**
 * This checks whether the given module path matches the second CLI argument.
 * If it does, it's the main module, called like `tsx some/path/module.ts`.
 */
export function isMain(moduleUrl: string) {
  return moduleUrl.endsWith(process.argv[1]);
}
