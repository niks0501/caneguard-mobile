interface MigrationJournalEntry {
  idx: number;
  tag: string;
}

interface MigrationBundle {
  journal: { entries: MigrationJournalEntry[] };
  migrations: Record<string, string>;
}

declare const migrationBundle: MigrationBundle;

export default migrationBundle;
