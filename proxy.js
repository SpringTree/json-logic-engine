function createProxy(obj, above) {
    const proxy = new Proxy(obj, {
        set: (target, prop, receiver) => {
            throw new Error('Not supported')
        },
        get: (target, prop, receiver) => {
            if(prop === '../') return above || proxy

            if(prop.indexOf && prop.indexOf('.') !== -1) {
                let cur = proxy
                let path = prop
                while(path.startsWith('../')) {
                    cur = cur['../']
                    path = path.substring(3)
                }
            
                if(!path) return cur
                const list = path.split('.')                
                while(list.length) {
                    const key = list.shift() 
                    if(key === "__proto__") throw new Error('Attempted Prototype Pollution') // Not necessary as a read
                    cur = typeof cur[key] === "object" ? cur[key] && createProxy(cur[key], cur) : cur[key]
                }
                return cur 
            }

            return typeof target[prop] === "object" ? target[prop] && createProxy(target[prop], proxy) : target[prop]
        }, 
    })
    return proxy
}



module.exports = { createProxy }