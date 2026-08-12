interface MigrationJournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface MigrationBundle {
  journal: { entries: MigrationJournalEntry[] };
  migrations: Record<string, string>;
}

declare const migrationBundle: MigrationBundle;

export default migrationBundle;
