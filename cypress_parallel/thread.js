const { settings } = require('./settings.js')
const cypress = require('cypress')

/**
 * runs the thread for each parallel execution
 * @param {*} thread object with list of files and total weight
 * @param {*} index 
 * @returns a map of the duration and results for each test suite file
 */
async function executeThread(thread, index) {
  if (thread.list.length < 1) {
    throw new Error(`thread for index ${index} was empty before mapping`)
  }

  // legacy sleep. maybe can remove. need to test.
  // staggered start (when executed in container with xvfb ends up having a race condition causing intermittent failures)
  const specFiles = `${thread.list.map(path => path).join(',')}`;
  if (specFiles.length === '') {
    throw new Error(`list of specFiles for thread at index ${index} was empty after mapping`)
  }
  const runObj = {
    spec: specFiles,
    reporter: settings.reporter,
    reporterOptions: settings.reporterOptions,
    browser: settings.browser,
    headless: settings.headless,
    quiet: !settings.isVerbose,
    env: {
      THREAD: (index + 1).toString(),
    },
  }
  if (settings.configFile) {
    runObj['configFile'] = settings.configFile
  } else {
    runObj['config'] = { video: false }
  }
  await new Promise((resolve) => setTimeout(resolve, index * 3000))
  console.log(`starting thread with index ${index} with specFiles ${specFiles}`)
  try {
    return cypress.run(runObj)
      .then(results => {
        if (results.status === 'failed') {
          console.log(`cypress thread ${index} did not finish successfully`)
          console.error(`cypress thread ${index} had number of failures: ${results.failures}`)
          console.error(`cypress thread ${index} had failure message ${results.message}`)
        }
        return results
      })
  } catch (e) {
    console.error(e)
    console.error(`error in thread with index ${index}`)
  }

}

module.exports = {
  executeThread
};
