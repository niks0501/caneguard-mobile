import copy
import json
import unittest

from scripts.verify_guard_v1_assets import CONTRACT, contract_mismatches


class GuardContractVerificationTests(unittest.TestCase):
    def setUp(self):
        self.contract = json.loads(CONTRACT.read_text(encoding="utf-8"))

    def test_rejects_resize_text_that_only_mentions_no_letterbox(self):
        candidate = copy.deepcopy(self.contract)
        candidate["input"]["resize"] = "NO LETTERBOX is unsupported; use center padding"
        self.assertIn("input", contract_mismatches(candidate))

    def test_rejects_unchecked_input_and_output_semantics(self):
        changes = [
            ("input", "color_order", "BGR"),
            ("input", "range", [-1, 1]),
            ("input", "orientation", "ignore EXIF"),
            ("input", "normalization", "outside model"),
            ("output", "meaning", "disease class"),
            ("labels", "1", "not_sugarcane"),
        ]
        for section, field, value in changes:
            with self.subTest(section=section, field=field):
                candidate = copy.deepcopy(self.contract)
                candidate[section][field] = value
                self.assertIn(section, contract_mismatches(candidate))


if __name__ == "__main__":
    unittest.main()
