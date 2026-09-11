"""Read-only reconciliation of map content against the supplied workbook."""
import json
import sys
from collections import Counter
from pathlib import Path

import openpyxl

workbook = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
sheet = workbook['Projects by country']
dataset = json.loads((Path(__file__).resolve().parents[1] / 'src/data/country-projects-2025.json').read_text(encoding='utf-8'))
actual = Counter()
for country in dataset['countries']:
    for project in country['projects']:
        actual[(country['name'], project['division'], project['title'], project['id'])] += 1
expected = Counter()
for row in sheet.iter_rows(min_row=2, values_only=True):
    if any(value is not None for value in row):
        expected[tuple(str(row[index]).strip() for index in (3, 0, 4, 5))] += 1
assert actual == expected, 'Map content differs from the source workbook'
assert actual.total() == 107
workbook.close()
print('PASS: every country, division, project title and project number matches the source workbook.')
