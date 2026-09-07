"""Read-only reconciliation of map content against the supplied workbook."""
import json
import sys
from pathlib import Path

import openpyxl

workbook = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
sheet = workbook['Projects by country']
dataset = json.loads((Path(__file__).resolve().parents[1] / 'src/data/country-projects-2025.json').read_text(encoding='utf-8'))
actual = {}
for country in dataset['countries']:
    for project in country['projects']:
        actual[project['sourceRow']] = (country['name'], project['division'], project['title'], project['id'])
expected = {}
for row_number, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
    if any(value is not None for value in row):
        expected[row_number] = tuple(str(row[index]).strip() for index in (3, 0, 4, 5))
assert actual == expected, 'Map content differs from the source workbook'
assert len(actual) == 107
workbook.close()
print('PASS: every country, division, project title and project number matches its workbook row.')
