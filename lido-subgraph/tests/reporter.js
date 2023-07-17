import { VerboseReporter } from '@jest/reporters'

/**
This reporter will output console.log only when a test fails.
For example, when shares test fails, we will see the address with wrong shares.
Also very useful for tests debugging.
**/

class Reporter extends VerboseReporter {
  constructor() {
    super(...arguments)
  }

  printTestFileHeader(_testPath, _config, result) {
    const console = result.console

    if (result.numFailingTests === 0 && !result.testExecError) {
      result.console = null
    }

    super.printTestFileHeader(...arguments)

    result.console = console
  }
}

export default Reporter
