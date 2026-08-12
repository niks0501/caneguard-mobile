interface MigrationJournalEntry {
  idx: number;
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
