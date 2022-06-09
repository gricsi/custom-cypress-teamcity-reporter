# custom-cypress-teamcity-reporter

Custom cypress teamcity reporter - Separate task after the testrun and reuse test result JSON file 

## Dependencies
- testrail-api
- typescript
- ts-node

## Steps

1. Run cypress tests 
2. Use json result

## Options

Don't forget to define those variables

- process.env["TESTRAIL_HOST"]
- process.env["TESTRAIL_USERNAME"]
- process.env["TESTRAIL_USER_ID"]
- process.env["TESTRAIL_PASSWORD"]
- process.env["APP_VERSION"]
- process.env["TESTRAIL_TEST_RUN_ID"]

Comes from API https://www.gurock.com/testrail/docs/api/reference/

**status_id**
- 1: Passed
- 2: Blocked
- 3: Untested (not allowed when adding a new result)
- 4: Retest
- 5: Failed
You can get a full list of system and custom statuses via get_statuses.

https://www.gurock.com/testrail/docs/api/reference/results/#addresult

### Test plan contains simple test run

`npx ts-node ./scripts/simple-testrun-reporter.ts ./../result.json`

### Test plan contains multiple test runs

`npx ts-node ./scripts/testplan-with-multiple-testrun-reporter.ts ./../result.json`
