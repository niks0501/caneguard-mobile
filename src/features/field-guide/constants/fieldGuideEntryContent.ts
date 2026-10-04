import type { FieldGuideLaunchEntryId } from '../domain/fieldGuideTypes';

export type FieldGuideEntryContent = {
  shortName: string;
  summary: string;
  signs: readonly string[];
  whereToLook: string;
  impact: string;
  management: readonly string[];
  detail: string;
  /** Content revision, for the "last updated" line and for cache invalidation. */
  contentVersion: string;
  /** Null for the bundled seed; ISO date once refreshed from the office. */
  updatedAt: string | null;
};

/**
 * Reading content for the launch set.
 *
 * This is the office's draft baseline, written as short plain sentences so the
 * office booklet can correct it as a content edit rather than a rewrite. It
 * teaches recognition, monitoring, sanitation and reporting only: no active
 * ingredient, no dose and no product brand name belongs here, and the
 * forbidden-pattern test in `__tests__/fieldGuideEntries.test.ts` enforces
 * that mechanically.
 *
 * Sources behind each entry are recorded in the report that produced this
 * seed (cg-young-farmer-gallery-plan-20261004, section 6). They are
 * deliberately not part of the entry data, because provenance and citations
 * never reach the reading surface.
 */
export const fieldGuideEntryContent: Record<FieldGuideLaunchEntryId, FieldGuideEntryContent> = {
  healthy: {
    shortName: 'Healthy',
    summary: 'A vigorous plant with no visible sign of disease or pest damage.',
    signs: [
      'An upright clump of several strong shoots.',
      'Long, evenly green leaves with a normal green midrib, about ten green leaves on a mature stalk.',
      'Leaves alternating up the stalk, with sheaths fitting closely.',
      'New leaves unfurling normally at the growing point, not twisted or bunched.',
      'Internode spacing normal for the variety.',
    ],
    whereToLook:
      'Look at the whole stool: the growing point at the top first, then the middle and lower leaves.',
    impact:
      'This is the baseline you compare every other plant against. Knowing what a clean plant looks like makes the other entries easier to judge, and it stops a healthy field being treated for nothing.',
    management: [
      'Keep the field well drained and free of weeds.',
      'Walk the field every month so change is noticed early.',
      'Use planting material from a healthy block.',
      'Ask your agriculture officer if cane looks healthy but a whole block is yielding poorly.',
    ],
    detail:
      'Stalk colour is not a health test. Healthy cane can be green, red or purple depending on the variety and how much sun it gets, so judge the plant by its shape, its leaves and how evenly it is growing rather than by colour alone. Some diseases cannot be seen at all, or cannot be ruled out, just by looking.',
    contentVersion: '1.0.0',
    updatedAt: null,
  },
  mosaic: {
    shortName: 'Mosaic',
    summary:
      'Irregular light-and-dark green mottling on the leaf, most obvious on young leaves.',
    signs: [
      'Contrasting islands or streaks of normal green among paler green or yellowish areas.',
      'Mottling strongest on young leaves, and often toward the leaf base.',
      'Weaker growth and thinner stalks in susceptible varieties.',
      'Leaf colour visibly uneven from plant to plant across a block.',
    ],
    whereToLook: 'Young leaves, especially near the base of the leaf blade.',
    impact:
      'Mosaic reduces how much the plant can grow and how much sugar it makes. There is no spray that cures an infected plant.',
    management: [
      'Plant a recommended variety suited to your area.',
      'Take planting material from a clean seed source, never from a block that has mosaic.',
      'Remove badly affected plants early and destroy them.',
      'Keep weeds down around the field, because they can shelter the aphids that carry the virus.',
      'Ask the office before replacing a block, because the right variety matters more than anything else.',
    ],
    detail:
      'Mosaic is caused by viruses carried from plant to plant by aphids, and also by planting infected cane. Cold injury and some other problems can look similar, so do not treat a mottled leaf as proof on its own. Because it spreads through planting material, the single most useful thing a farmer can do is to keep seed cane clean and separate from production fields.',
    contentVersion: '1.0.0',
    updatedAt: null,
  },
  rust: {
    shortName: 'Rust',
    summary: 'Oval orange to cinnamon-brown pustules, mostly on the underside of the leaf.',
    signs: [
      'Tiny yellow flecks first, then oval pustules about 2 to 10 mm long on the leaf underside.',
      'Orange spore dust that rubs off.',
      'Pustules clustering in patches and merging into scorched, dead leaf tissue.',
      'In a bad year, the canopy looks burnt from the bottom up.',
    ],
    whereToLook:
      'The underside of the leaf, easiest to see on younger, upper leaves.',
    impact:
      'Heavy rust kills leaf area the plant needs to grow, which lowers both tonnage and sugar content. In susceptible varieties, losses can be severe.',
    management: [
      'Plant a recommended resistant variety.',
      'Spread your varieties rather than putting one variety over the whole farm, because the fungus can change and beat a resistance.',
      'Walk the field during warm, wet spells and look at leaf undersides.',
      'Report a sudden severe outbreak to your agriculture officer, because timing decides whether anything can be done.',
      'Do not expect clean planting material alone to solve rust, because the fungus arrives on the wind and infects leaves.',
    ],
    detail:
      'Two rusts occur in sugarcane, and they look alike. Orange rust has fresher orange pustules that are usually shorter, clustered and nearer the leaf base. Brown rust is darker, longer, more evenly spread and nearer the leaf tip. If you are unsure which one you have, say so when you report it, because the distinction changes what the office recommends. Some varieties are resistant to one and not the other.',
    contentVersion: '1.0.0',
    updatedAt: null,
  },
  smut: {
    shortName: 'Smut',
    summary:
      'A long dark whip growing out of the growing point — the clearest sign of smut.',
    signs: [
      'A thin whip-like growth from the top of a shoot or from a side shoot, usually 25 to 150 cm long.',
      'The whip is greyish at first, then releases a mass of black powdery spores.',
      'Plants that look like grass, with many thin shoots growing from one stool.',
      'Narrow, stiff, upright leaves, with thin stalks and shortened internodes.',
      'In a ratoon crop, a stool that is falling apart into many small shoots.',
    ],
    whereToLook:
      'The growing point and the top of the cane, and the side shoots of older stalks.',
    impact:
      'Smut lives inside the plant and cannot be cured once a plant has it. Each whip can release an enormous number of spores, and those spores move on the wind to neighbouring fields. A badly affected block can lose much of its yield and will keep infecting the next crop if it is kept as ratoon.',
    management: [
      'Plant a resistant, recommended variety.',
      'Take planting material only from a clean, inspected source, never from a block with smut.',
      'Check new plantings often and pull out any plant with a whip early.',
      'Cover the whip with a bag before you remove it, so the spores do not blow away.',
      'Do not ratoon a badly affected block. Replant with clean material.',
      'Clean tools and footwear when you move between fields.',
    ],
    detail:
      'Because the fungus lives inside the plant, smut is a whole-farm problem rather than a single-plant one. Removing whips promptly reduces the spores in the air, but the plants around them may already be infected. That is why resistant varieties and clean planting material do most of the work, and why pulling out whips alone is not enough once a block is heavily affected.',
    contentVersion: '1.0.0',
    updatedAt: null,
  },
  rssi: {
    shortName: 'RSSI',
    summary:
      'Red-Striped Soft Scale Insect: a sap-sucking pest that builds up on the lower leaves and coats them in sticky honeydew and black mold.',
    signs: [
      'Small insects with red stripes, in young and adult stages, on the lower leaves first, then moving upward.',
      'Yellowing leaves, especially toward the base.',
      'Sticky honeydew on the leaf surface.',
      'A black sooty mold growing on the honeydew, which makes the cane look dirty.',
      'Leaves drying and, in a heavy infestation, dying.',
    ],
    whereToLook:
      'The underside of the lower leaves first. Check the underside of each leaf rather than the top, because that is where the colony sits, and sooty mold may not appear until the infestation is already established.',
    impact:
      'The insect removes sap and the mold blocks light, so the plant grows less and stores less sugar. It spreads quickly from field to field, and moving infested planting material is a known way it travels. It is hard to see early, which is why weekly checking matters.',
    management: [
      'Walk the field every week and look at the undersides of the lower leaves.',
      'Remove and destroy heavily infested leaves, including any covered in black mold, as directed locally.',
      'Do not move cane plants or planting material out of an affected block.',
      'Clean tools and footwear after working in an affected area.',
      'Report a suspected infestation to the Sugar Regulatory Administration, the Department of Agriculture, PHILSURIN or your local agriculture officer straight away, because official records and sample testing matter here and the area-wide response matters more than one farm acting alone.',
      'Keep the field edges and grassy weeds under control, because several weeds can host the insect.',
      'Ask the office before any chemical treatment rather than treating on your own.',
    ],
    detail:
      'RSSI was first detected in Pampanga in 2022 and confirmed in parts of Negros in early 2025. It is treated as an area problem, not a single-farm problem: treating one field while the neighbours are infested invites reinvasion, so the Philippine response uses coordinated surveillance and reporting. Natural enemies, including parasitoid wasps and beneficial fungi, already help suppress it, which is one reason repeated broad-spectrum spraying is discouraged. The scientific name is shown as Pulvinaria sp., because more than one name for this insect is still in circulation.',
    contentVersion: '1.0.0',
    updatedAt: null,
  },
};
