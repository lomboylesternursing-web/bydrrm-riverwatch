# PhilSensors official data access plan

RiverWatch must use an approved DOST-ASTI data-sharing/API route for production near-real-time PhilSensors ingestion. Do not reverse-engineer private endpoints or present scraped values as an approved API feed.

## Request package

DOST-ASTI's current Technology Transfer page instructs data requesters to submit the following to `info@asti.dost.gov.ph`:

1. Letter of Intent/request addressed to the DOST-ASTI Director (currently Dr. Franz A. de Leon)
2. Accomplished pro-forma form and End-User License Agreement
3. Government-issued ID
4. DOST-ASTI enlistment form

Technology Licensing Office contact: `tlo@asti.dost.gov.ph`, 02-8249-8500.

## RiverWatch request scope

Request near-real-time and, if allowed, historical Water Level Monitoring System (WLMS) and WLMS+ARG observations covering Bulacan and immediately relevant upstream/downstream stations.

Requested fields, subject to DOST-ASTI's actual API schema:
- station identifier and station name
- latitude / longitude
- sensor type and operational status
- observation timestamp and timezone
- water level value and unit
- rainfall value / accumulation window when available
- official threshold classification or Alert / Alarm / Critical thresholds when available
- data quality / stale / missing indicators

## Intended use

Non-commercial disaster situational awareness for BYDRRM RiverWatch, including:
- bridge/river monitoring dashboard
- rate-of-rise display when timestamps support it
- source and data-age display
- official-threshold status display
- human-reviewed social media advisory generation

## Connector contract

The frontend consumes `official-data.json` with this normalized reading shape:

```json
{
  "stationId": 14,
  "stationName": "Salacot Bridge",
  "level": 3.42,
  "status": "WATCH",
  "time": "2026-08-09T17:30:00+08:00",
  "source": "DOST-ASTI PhilSensors",
  "officialThresholds": {
    "alert": null,
    "alarm": null,
    "critical": null
  },
  "note": "Official API observation"
}
```

The adapter must map the actual DOST-ASTI schema to this contract after access documentation is received.

## Integrity rules

- Never invent warning thresholds.
- Preserve the original source and observation timestamp.
- Treat stale or missing observations explicitly.
- Do not calculate rate-of-rise from date-only observations.
- Do not declare structural bridge safety from water-level information.
- Keep human approval before public advisory posting.
