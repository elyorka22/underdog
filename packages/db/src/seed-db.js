import { fileURLToPath } from "node:url";
import { categories, communities } from "@underdog/shared";
import { enqueueCandidate } from "./candidates.js";
import { seedDiscoveryQueries } from "./discovery-queries.js";
import { migrate } from "./migrate.js";
import { closePool, hasDatabase, query } from "./pool.js";
import { upsertCommunity } from "./catalog.js";
import { getSettings, saveSettings } from "./settings.js";

export async function seedDatabase() {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is required for seed");
  }

  await migrate();

  for (const category of categories) {
    await query(
      `
      INSERT INTO categories (id, title, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description
      `,
      [category.id, category.title, category.description],
    );
  }

  for (const item of communities) {
    await upsertCommunity({
      ...item,
      source: "seed",
      status: "active",
    });
    await enqueueCandidate(item.username, {
      source: "seed",
      categoryHint: item.categoryId,
    });
  }

  // Mark seed candidates done so helper focuses on new ones first,
  // but keep them re-checkable later via failed/pending reset if needed.
  await query(
    `
    UPDATE candidates
    SET status = 'done', updated_at = NOW()
    WHERE source = 'seed' AND status = 'pending'
    `,
  );

  await seedDiscoveryQueries();
  await saveSettings(await getSettings());
}

async function main() {
  await seedDatabase();
  console.log(
    `Seeded ${categories.length} categories and ${communities.length} communities`,
  );
  await closePool();
}

const isDirect =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isDirect) {
  main().catch(async (error) => {
    console.error(error);
    await closePool();
    process.exit(1);
  });
}
