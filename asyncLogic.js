// @ts-check
'use strict'

const checkYield = require('./utilities/checkYield')
const defaultMethods = require('./defaultMethods')
const Yield = require('./structures/Yield')
const EngineObject = require('./structures/EngineObject')
const LogicEngine = require('./logic')
const asyncPool = require('./asyncPool')
const { Sync, isSync } = require('./constants')
const declareSync = require('./utilities/declareSync')
const { buildAsync } = require('./compiler')

/**
 * An engine capable of running asynchronous JSON Logic.
 */
class AsyncLogicEngine {
  /**
   *
   * @param {Object} methods An object that stores key-value pairs between the names of the commands & the functions they execute.
   * @param {{ yieldSupported?: Boolean, disableInline?: Boolean }} options
   */
  constructor (methods = defaultMethods, options = { yieldSupported: false, disableInline: false }) {
    this.methods = methods
    this.options = options
    this.disableInline = options.disableInline
    this.async = true
    this.fallback = new LogicEngine(methods, options)
  }

  /**
   * An internal method used to parse through the JSON Logic at a lower level.
   * @param {String} func The name of the function being executed
   * @param {*} data The data to traverse / execute upon
   * @param {*} context The context of the logic being run (input to the function.)
   * @param {*} above The context above (can be used for handlebars-style data traversal.)
   * @returns {Promise}
   */
  async _parse (func, data, context, above) {
    if (this.methods[func]) {
      if (typeof this.methods[func] === 'function') {
        const input = await this.run(data, context, { above })
        if (this.options.yieldSupported && await checkYield(input)) return input
        const result = await this.methods[func](input, context, above, this)
        return Array.isArray(result) ? await Promise.all(result) : result
      }

      if (typeof this.methods[func] === 'object') {
        const { asyncMethod, method, traverse: shouldTraverse } = this.methods[func]
        const parsedData = shouldTraverse ? await this.run(data, context, { above }) : data
        if (this.options.yieldSupported && await checkYield(parsedData)) return parsedData
        const result = await (asyncMethod || method)(parsedData, context, above, this)
        return Array.isArray(result) ? await Promise.all(result) : result
      }
    }
  }

  /**
   *
   * @param {String} name The name of the method being added.
   * @param {Function|{ traverse?: Boolean, method?: Function, asyncMethod?: Function, deterministic?: Function | Boolean }} method
   * @param {{ deterministic?: Boolean, yields?: Boolean, useContext?: Boolean, async?: Boolean, sync?: Boolean }} annotations This is used by the compiler to help determine if it can optimize the function being generated.
   */
  addMethod (name, method, { deterministic = false, async = true, sync = !async, yields = false, useContext = false } = {}) {
    Object.assign(method, { yields, deterministic, useContext })
    this.methods[name] = declareSync(method, sync)
  }

  /**
   *
   * @param {*} logic The logic to be executed
   * @param {*} data The data being passed in to the logic to be executed against.
   * @param {{ above?: any }} options Options for the invocation
   * @returns {Promise}
   */
  async run (logic, data = {}, options = {}) {
    const { above = [] } = options

    if (Array.isArray(logic)) {
      const result = await Promise.all(logic.map(i => this.run(i, data, { above })))

      if (this.options.yieldSupported && await checkYield(result)) {
        return new EngineObject({
          result
        })
      }

      return result
    }

    if (logic && typeof logic === 'object') {
      const [func] = Object.keys(logic)
      const result = await this._parse(func, logic[func], data, above)
      if (this.options.yieldSupported && await checkYield(result)) {
        if (result instanceof Yield) {
          if (result._input) {
            result._logic = { [func]: result._input }
          }
          if (!result._logic) {
            result._logic = logic
          }
          return result
        }

        return new EngineObject({
          result: { [func]: result.data.result }
        })
      }
      return result
    }

    return logic
  }

  /**
   *
   * @param {*} logic The logic to be built.
   * @param {{ top?: Boolean, above?: any, max?: Number }} options
   * @returns {Promise<Function>}
   */
  async build (logic, options = {}) {
    const { above = [], max = 100, top = true } = options

    if (top) {
      const constructedFunction = await buildAsync(logic, { engine: this, above, async: true, state: {} })

      const result = declareSync((...args) => {
        if (top === true) {
          try {
            const result = typeof constructedFunction === 'function' ? constructedFunction(...args) : constructedFunction
            return Promise.resolve(result)
          } catch (err) {
            return Promise.reject(err)
          }
        }
        const result = typeof constructedFunction === 'function' ? constructedFunction(...args) : constructedFunction
        return result
      }, (top !== true) && (isSync(constructedFunction)))

      // we can avoid the async pool if the constructed function is synchronous since the data
      // can't be updated :)
      if (top === true && constructedFunction && !constructedFunction[Sync]) {
        // we use this async pool so that we can execute these in parallel without having
        // concerns about the data.
        return asyncPool({
          free: [result],
          max,
          create: () => this.build(logic, { ...options, above })
        })
      } else {
        return typeof constructedFunction === 'function' || top === true ? result : constructedFunction
      }
    }

    return logic
  }
}

module.exports = AsyncLogicEngine
