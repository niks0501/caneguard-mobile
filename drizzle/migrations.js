// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_complex_johnny_blaze.sql';
import m0001 from './0001_loving_amazoness.sql';
import m0002 from './0002_talented_kat_farrell.sql';
import m0003 from './0003_careful_marauders.sql';
import m0004 from './0004_sour_namora.sql';
import m0005 from './0005_tricky_the_santerians.sql';
import m0006 from './0006_curvy_piledriver.sql';
import m0007 from './0007_familiar_old_lace.sql';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
    m0005,
    m0006,
    m0007,
  },
};
