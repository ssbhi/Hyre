/**
 * The data-layer entry point. Import `repo` anywhere on the server:
 *
 *     import { repo } from "@/lib/data";
 *     const jobs = await repo.listPublishedJobs();
 *
 * The concrete adapter is chosen once, here, by the DATA_SOURCE env var. Feature
 * code never imports an adapter directly — swapping storage is a one-line change.
 */
import "server-only";

import { PrismaRepository } from "./adapters/prisma-repository";
import { SheetsRepository } from "./adapters/sheets-repository";
import type { HyreRepository } from "./repository";

function createRepository(): HyreRepository {
  const source = (process.env.DATA_SOURCE ?? "prisma").toLowerCase();
  switch (source) {
    case "sheets":
      return new SheetsRepository();
    case "prisma":
    default:
      return new PrismaRepository();
  }
}

export const repo: HyreRepository = createRepository();

export type { HyreRepository } from "./repository";
export * from "./types";
