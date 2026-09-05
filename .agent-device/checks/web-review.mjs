// Cross-repository Web fixture through Chrome DevTools AXI's real commands.
// Prerequisite: already signed into http://localhost:5173 as disposable staff.
// REPORT_UUID identifies the exact Mobile-produced case; no database seeding
// substitutes for Mobile submission or for this browser review/assignment.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const uuid = process.env.REPORT_UUID;
assert.match(uuid ?? '', /^[0-9a-f-]{36}$/i, 'Set REPORT_UUID from Mobile sync evidence');
const mode = process.argv[2] ?? 'assign';
assert.ok(['assign', 'verify-completion'].includes(mode));
const run = (...args) => execFileSync('chrome-devtools-axi', args, {
  encoding: 'utf8', timeout: 90_000,
  env: { ...process.env, CHROME_DEVTOOLS_AXI_BROWSER_URL: 'http://127.0.0.1:9222' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const snapshot = () => run('snapshot', '--full');
const target = (role, label) => {
  const lines = snapshot().split('\n').filter(line => line.includes(` ${role} "${label}"`));
  assert.equal(lines.length, 1, `Expected one ${role}: ${label}`);
  return '@' + lines[0].match(/uid=(\S+)/)[1];
};
const choose = (optionText) => {
  run('eval', `() => {
    const matches = Array.from(document.querySelectorAll('option')).filter(o => o.text === ${JSON.stringify(optionText)});
    if (matches.length !== 1) throw new Error('Expected exactly one picker option');
    const option = matches[0]; option.parentElement.value = option.value;
    option.parentElement.dispatchEvent(new Event('change', {bubbles:true}));
    return 'Selected';
  }`);
  assert.ok(snapshot().includes(`value="${optionText}"`), 'Selected value must render');
};
run('open', `http://localhost:5173/reports/${uuid}`);
run('wait', 'Field image');
const before = snapshot();
assert.ok(before.includes(`url="http://localhost:5173/reports/${uuid}"`));
for (const expected of ['T10 Phase 1 Block', '1.58 ha', '58%', 'Wawa', 'Nasugbu', 'Batangas',
  'Possible rust', 'Consistent with the possible AI result']) {
  assert.ok(before.includes(`"${expected}"`), `Missing submitted evidence: ${expected}`);
}
if (mode === 'assign') {
  choose('Assign field validation');
  choose(process.env.REPORTER_NAME ?? 'Live confirmation fixture');
  run('click', target('radio', 'Advisory provided Record guidance provided to the field contact.'));
  run('fill', target('textbox', 'Review notes Use neutral, observable language. Notes are saved with the review.'),
    'Intent review: visit the field and document visible symptoms.');
  run('click', target('button', 'Save explicit review'));
  run('wait', 'Action recorded: Advisory provided.');
  run('open', `http://localhost:5173/reports/${uuid}`);
  run('wait', 'Field image');
  const after = snapshot();
  assert.ok(after.includes('"Needs field validation"'));
  assert.ok(after.includes('Intent review: visit the field and document visible symptoms.'));
  console.log('PASS: exact Mobile case reviewed and assigned on Web');
} else {
  const after = snapshot();
  for (const expected of ['Intent offline observation', 'Intent field finding', 'Intent field action']) {
    assert.ok(after.includes(expected), `Missing synchronized field evidence: ${expected}`);
  }
  console.log('PASS: exact Mobile case and synchronized visit evidence visible on Web');
}
