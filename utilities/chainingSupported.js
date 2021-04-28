// @ts-check
'use strict'

/**
 * Checks if optional chaining is supported for the compiler
 * @returns {Boolean}
 */
const getIsOptionalChainingSupported = () => {
  try {
    // eslint-disable-next-line no-unused-vars
    const test = {}
    // eslint-disable-next-line no-eval
    const isUndefined = eval('test?.foo?.bar')
    return isUndefined === undefined
  } catch {
    return false
  }
}

module.exports = getIsOptionalChainingSupported()
