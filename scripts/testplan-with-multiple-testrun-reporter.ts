// @ts-ignore
const report = require(process.argv[2])
const Testrail = require("testrail-api")

// API https://www.gurock.com/testrail/docs/api/reference/

const host: string = process.env["TESTRAIL_HOST"]
const username: string = process.env["TESTRAIL_USERNAME"]
const testrailUserId = process.env["TESTRAIL_USER_ID"]
const password: string = process.env["TESTRAIL_PASSWORD"]
const version: string = process.env["APP_VERSION"] || "master"

const testrail = new Testrail({
    host: host,
    user: username,
    password: password,
})

class NameId {
    id
    name

    constructor(id, name) {
        this.id = id
        this.name = name
    }
}

console.log('start')
let testPlanId = process.env["TESTRAI_TEST_PLAN_ID"]
console.log("testPlanId: " + testPlanId)


// comes from the GET index.php?/api/v2/get_plan/:plan_id
testrail.getPlan(testPlanId, function (err, response, result) {
    if (response) {
        let runNameIdList = []

        let obj = JSON.parse(response.body)

        obj["entries"]?.forEach(function (key) {
            const runs = key["runs"][0]
            runNameIdList.push(new NameId(runs["id"], runs["name"]))
        })

        parseResult(runNameIdList)
    } else {
        console.log(err)
    }
    console.log('end')
})

function parseResult(runNameIdList) {
    for (let result of report) {

        for (let suites of result.suites) {
            for (let test of suites.tests) {
                let content
                let state = test.state
                let title = test.title

                if (state === "passed") {
                    if (title.startsWith("RC")) {
                        content = {
                            comment: `${title} Success! Execution time: ${test.duration}`,
                            status_id: 4 //retest
                        }
                    } else {
                        content = {
                            comment: `${title} Success! Execution time: ${test.duration}`,
                            status_id: 1 //passed
                        }
                    }
                }
                if (state === "failed") {
                    const error = test["err"]
                    content = {
                        comment: title + "\n" + error["message"],
                        status_id: 5 //fail
                    }
                }

                if (state === "pending") {
                    content = {
                        comment: title + " pending",
                        status_id: 4 //retest
                    }
                }

                if (state === "skipped") {
                    content = {
                        comment: title + " skipped",
                        status_id: 4 //retest
                    }
                }
                content["version"] = version
                content["assignedto_id"] = testrailUserId

                const caseIds = titleToCaseIds(title)

                runNameIdList.forEach(nameId => {
                    caseIds.forEach(caseId => {
                        if (test.fullTitle.includes(nameId.name)) {

                            testrail.addResultForCase(parseInt(nameId.id), parseInt(caseId), content, function (err, response, testrailUploadResult) {
                                const testData = nameId.id + " - " + caseId + " -> " + content.comment

                                if (testrailUploadResult) {
                                    if (err) {
                                        console.log(testData)
                                        console.log(err)
                                    } else {
                                        console.log("Uploaded " + testData)
                                    }
                                    console.log("-------")
                                }
                            })
                        }
                    })
                })
            }
        }
    }
}

function titleToCaseIds(title) {
    let caseIds = []

    let testCaseIdRegExp = /\bR?C(\d+)\b/g
    let m
    while ((m = testCaseIdRegExp.exec(title)) !== null) {
        let caseId = parseInt(m[1])
        caseIds.push(caseId)
    }
    return caseIds
}
