import { Generated, Insertable, Selectable, Updateable } from "kysely";

/**
 * Database type definitions go here. Make sure that these types stay in sync with the SQL schema
 * located in @/lib/postgres/sql manually, or automatically generate types with kysely-codegen.
 */

export interface Database {
  example: ExampleTable;
}

export interface ExampleTable {
  id: Generated<number>;
  title: string;
  count: number;
}

export type Example = Selectable<ExampleTable>;
export type NewExample = Insertable<ExampleTable>;
export type ExampleUpdate = Updateable<ExampleTable>;
