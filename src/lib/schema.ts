import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";

// --- Auth ---
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  password: text("password"), // null för OAuth-användare
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Resor ---
export const resor = pgTable("resor", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  destination: text("destination").notNull(),
  land: text("land").notNull(),
  startDatum: text("start_datum").notNull(),
  slutDatum: text("slut_datum").notNull(),
  beskrivning: text("beskrivning"),
  omslagsbild: text("omslagsbild"),
  skapadAt: timestamp("skapad_at").defaultNow().notNull(),
  uppdateradAt: timestamp("uppdaterad_at").defaultNow().notNull(),
});

// --- Dagboksinlägg ---
export const dagbokInlagg = pgTable("dagbok_inlagg", {
  id: uuid("id").primaryKey().defaultRandom(),
  resaId: uuid("resa_id")
    .notNull()
    .references(() => resor.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  datum: text("datum").notNull(),
  titel: text("titel").notNull(),
  innehall: text("innehall").notNull(),
  skapadAt: timestamp("skapad_at").defaultNow().notNull(),
});

// --- Packlista ---
export const packlistaItems = pgTable("packlista_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  resaId: uuid("resa_id")
    .notNull()
    .references(() => resor.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  namn: text("namn").notNull(),
  kategori: text("kategori").notNull(),
  packad: boolean("packad").notNull().default(false),
  skapadAt: timestamp("skapad_at").defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type Resa = typeof resor.$inferSelect;
export type DagbokInlagg = typeof dagbokInlagg.$inferSelect;
export type PacklistaItem = typeof packlistaItems.$inferSelect;
