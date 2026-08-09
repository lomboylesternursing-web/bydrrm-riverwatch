import unittest

from collect_official_data import station_id, official_status


class CollectorTests(unittest.TestCase):
    def test_station_aliases(self):
        self.assertEqual(station_id('Alejo Bridge, Bustos'), 4)
        self.assertEqual(station_id('Caniogan River, Calumpit'), 10)
        self.assertEqual(station_id('Fabian Cadiz Bridge, City of SJDM'), 18)
        self.assertEqual(station_id('Poblacion Bridge, Sta. Maria'), 17)

    def test_official_threshold_status(self):
        row = {'alert': '3.0 meters', 'alarm': '4.0 meters', 'critical': '5.0 meters'}
        self.assertEqual(official_status(row, 0.20), 'NORMAL')
        self.assertEqual(official_status(row, 3.00), 'WATCH')
        self.assertEqual(official_status(row, 4.00), 'ALARM')
        self.assertEqual(official_status(row, 5.00), 'CRITICAL')

    def test_missing_threshold_is_not_called_normal(self):
        self.assertEqual(official_status({}, 2.0), 'NO_DATA')

    def test_unmapped_official_station_is_explicit(self):
        self.assertIsNone(station_id('Meyto Bridge, Meyto, Calumpit, Bulacan'))
        self.assertIsNone(station_id('Bulusan River Bank'))


if __name__ == '__main__':
    unittest.main()
