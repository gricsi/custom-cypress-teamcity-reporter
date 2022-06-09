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

console.log("start")
console.log("TESTRAIL_TEST_RUN_ID: " + process.env["TESTRAIL_TEST_RUN_ID"])

traverse(report)

console.log("end")


function traverse(o) {
    for (let i in o) {
        if (o[i] !== null && typeof o[i] == "object") {
            if (o[i].title != null && o[i].state != null) {
                uploadResult(o[i])
            } else {
                traverse(o[i])
            }
        }
    }
}

function uploadResult(test) {
    let testRunId = process.env["TESTRAIL_TEST_RUN_ID"]
    let content
    let state = test.state
    let title = test.title

    if (state === "passed") {
        if (title.startsWith("RC")) {
            content = {
                comment: `${title} Success! Execution time: ${test.duration}`,
                status_id: 4, //retest
            }
        } else {
            content = {
                comment: `${title} Success! Execution time: ${test.duration}`,
                status_id: 1, //passed
            }
        }
    }
    if (state === "failed") {
        const error = test["err"]
        content = {
            comment: title + "\n" + error["message"],
            // version: "Build#1",
            // defects: "DSS-123",
            status_id: 5, //fail
        }
    }

    if (state === "pending") {
        content = {
            comment: title + " pending",
            status_id: 4, //retest
        }
    }

    if (state === "skipped") {
        content = {
            comment: title + " skipped",
            status_id: 4, //retest
        }
    }
    const caseIds = titleToCaseIds(title)

    content["version"] = version
    content["assignedto_id"] = testrailUserId

    caseIds.forEach((caseId) => {

        testrail.addResultForCase(Number(testRunId), parseInt(caseId), content, function (err, response, testrailUploadResult) {
            const testData = testRunId + " - " + caseId + " -> " + content.comment

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
    })
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
