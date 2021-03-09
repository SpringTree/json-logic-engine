const {
  createProxy
} = require('./proxy')

const defaultMethods = require('./defaultMethods')
const Yield = require('./structures/Yield')
const EngineObject = require('./structures/EngineObject')

async function checkYield(item) {
  if (Array.isArray(item)) {
    return item.some(i=>i instanceof Yield || i instanceof EngineObject)
  }
  return item instanceof Yield || item instanceof EngineObject 
}

class AsyncLogicEngine {
  constructor (methods = defaultMethods, options = { yieldSupported: false }) {
    this.methods = methods
    this.options = options
  }

  async parse (func, data, context, above) {
    if (this.methods[func]) {
      if (typeof this.methods[func] === 'function') {
        const input = await this.run(data, context, { proxy: false, above })
        if (this.options.yieldSupported && await checkYield(input)) return input
        const result = await this.methods[func](input, context, above, this)
        return Array.isArray(result) ? createProxy(await Promise.all(result), result['../'] || above || context) : result
      }

      if (typeof this.methods[func] === 'object') {
        const { asyncMethod, method, traverse: shouldTraverse } = this.methods[func]
        const parsedData = shouldTraverse ? await this.run(data, context, { proxy: false, above }) : data
        if (this.options.yieldSupported && await checkYield(parsedData)) return parsedData
        const result = await (asyncMethod || method)(parsedData, context, above, this)
        return Array.isArray(result) ? createProxy(await Promise.all(result), result['../'] || above || context) : result
      }
    }
  }

  addMethod (name, method) {
    this.methods[name] = method
  }

  async run (logic, data = {}, options = {
    proxy: true
  }) {
    if (typeof data === 'object' && options.proxy) {
      data = createProxy(data)
    }

    const { above } = options

    if (Array.isArray(logic)) {
      const result = await Promise.all(logic.map(i => this.run(i, data, { proxy: false, above })))

      if (this.options.yieldSupported && await checkYield(result)) {
        return new EngineObject({
          result
        })
      }

      return result
    }

    if (logic && typeof logic === 'object') {
      const [func] = Object.keys(logic)
      const result = await this.parse(func, logic[func], data, above)
      if (this.options.yieldSupported && await checkYield(result)) {
        if (result instanceof Yield) {
          if (!result.logic) {
            result.logic = logic
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
}

module.exports = AsyncLogicEngine