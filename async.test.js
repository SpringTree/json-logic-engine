
const { AsyncLogicEngine } = require('./index')
const logic = new AsyncLogicEngine()

describe('+',  () => {
    test('it should be able to add two numbers together', async () => {
        const answer = await logic.run({ 
            '+': [1,2]
        })

        expect(answer).toBe(3)
    })

    test('it should be able to add three numbers together', async () => {
        const answer = await logic.run({ 
            '+': [1,2,3]
        })

        expect(answer).toBe(6)
    })
})

describe('-',  () => {
    test('it should be able to subtract two numbers', async () => {
        const answer = await logic.run({ 
            '-': [1,2]
        })

        expect(answer).toBe(-1)
    })

    test('it should be able to subtract three numbers', async () => {
        const answer = await logic.run({ 
            '-': [1,2,3]
        })

        expect(answer).toBe(-4)
    })
})

describe('*',  () => {
    test('it should be able to multiply two numbers', async () => {
        const answer = await logic.run({ 
            '*': [1,2]
        })

        expect(answer).toBe(2)
    })

    test('it should be able to multiply three numbers', async () => {
        const answer = await logic.run({ 
            '*': [1,2,3]
        })

        expect(answer).toBe(6)
    })
})


describe('/',  () => {
    test('it should be able to divide two numbers', async () => {
        const answer = await logic.run({ 
            '/': [1,2]
        })

        expect(answer).toBe(1/2)
    })

    test('it should be able to divide three numbers', async () => {
        const answer = await logic.run({ 
            '/': [1,2,3]
        })

        expect(answer).toBe(1/6)
    })
})

describe('%',  () => {
    test('it should be able to modulo two numbers', async () => {
        const answer = await logic.run({ 
            '%': [5 ,2]
        })

        expect(answer).toBe(5 % 2)
    })

    test('it should be able to modulo three numbers', async () => {
        const answer = await logic.run({ 
            '%': [5,3,7]
        })

        expect(answer).toBe(5 % 3 % 7)
    })
})


describe('var',  () => {
    test('it should be able to access a variable', async () => {
        const answer = await logic.run({ 
            'var': 'a'
        }, {
            a: 7
        })

        expect(answer).toBe(7)
    })

    test('it should be able to access a nested variable', async () => {
        const answer = await logic.run({ 
            'var': 'a.b'
        }, {
            a: { b: 7 } 
        })

        expect(answer).toBe(7)
    })

    test('it should be able to access a deeply nested variable', async () => {
        const answer = await logic.run({ 
            'var': 'a.b.c'
        }, {
            a: { b: { c:  7 } } 
        })

        expect(answer).toBe(7)
    })

    test('it should be able to access the entire variable', async () => {
        const answer = await logic.run({ 
            'var': ''
        }, {
            a: 7
        })

        expect(answer).toStrictEqual({a:7})
    })

    test('it should be able to access the variable in a nested command', async () => {
        const answer = await logic.run({ 
            '+': [{ var: 'a'}, {var: 'b'}]
        }, {
            a: 7,
            b: 3
        })

        expect(answer).toBe(10)
    })
})

describe('max',  () => {
    test('it should be able to get the max of two numbers', async () => {
        const answer = await logic.run({ 
            'max': [5 ,2]
        })

        expect(answer).toBe(5)
    })

    test('it should be able to get the max of three or more numbers', async () => {
        const answer = await logic.run({ 
            'max': [5,3,7]
        })

        expect(answer).toBe(7)
    })
})


describe('min',  () => {
    test('it should be able to get the min of two numbers', async () => {
        const answer = await logic.run({ 
            'min': [5 ,2]
        })

        expect(answer).toBe(2)
    })

    test('it should be able to get the min of three or more numbers', async () => {
        const answer = await logic.run({ 
            'min': [5,3,7]
        })

        expect(answer).toBe(3)
    })
})

describe('in',  () => {
    test('it should be able to tell when an item is in an array', async () => {
        const answer = await logic.run({ 
            'in': [5, [5,6,7]]
        })

        expect(answer).toBe(true)
    })

    test('it should be able to tell when an item is not in an array', async () => {
        const answer = await logic.run({ 
            'in': [7, [1,2,3]]
        })

        expect(answer).toBe(false)
    })
})

describe('if', () => {
    test('it should take the first branch if the first value is truthy', async () => {
        const answer = await logic.run({ 
            'if': [1, 2, 3]
        })

        expect(answer).toBe(2)
    })

    test('it should take the second branch if the first value is falsey', async () => {
        const answer = await logic.run({ 
            'if': [0, 2, 3]
        })

        expect(answer).toBe(3)
    })
})

describe('preserve',  () => {
    test('it should be able to avoid traversing data with preserve', async () => {
        const answer = await logic.run({ 
            'preserve': { '+': [1,2] }
        })

        expect(answer).toStrictEqual({ '+': [1,2] })
    })

    test('it should be able to tell when an item is not in an array', async () => {
        const answer = await logic.run({ 
            'in': [7, [1,2,3]]
        })

        expect(answer).toBe(false)
    })
})


describe('comparison operators',  () => {
    test('the comparison operators should all work', async () => {

        const vectors = [
            [0,1],
            [0,2],
            [3,7],
            [7,9],
            [9,3],
            [0,0],
            [1,1],
            [1,'1'],
            ['1','1'],
            ['0','1'],
            [0,'1']
        ]

        const operators = {
            '!=' : (a,b) => a != b,
            '!==' : (a,b) => a !== b,
            '==' : (a,b) => a == b,
            '===' : (a,b) => a === b,
            '<' : (a,b) => a < b,
            '>' : (a,b) => a > b,
            '>=' : (a,b) => a >= b,
            '<=' : (a,b) => a <= b,
            'or' : (a,b) => a || b,
            'and' : (a,b) => a && b,
            'xor' : (a,b) => a ^ b,
        }

        
        await Promise.all(Object.keys(operators).map(async i => {
            await Promise.all(vectors.map(async vector => {
                expect(await logic.run({
                    [i]: vector
                })).toBe(operators[i](...vector))
            }))
        }))
    })
})

describe('reduce',  () => {
    test('it should be possible to perform reduce and add an array', async () => {
        const answer = await logic.run({
            reduce: [[1,2,3,4,5], {
                '+': [{var: 'accumulator'}, { var: 'current' }]
            }]
        })

        expect(answer).toBe(15)
    })

    test('it should be possible to perform reduce and add an array from data', async () => {
        const answer = await logic.run({
            reduce: [{var: 'a'}, {
                '+': [{var: 'accumulator'}, { var: 'current' }]
            }]
        }, {
            'a': [1,2,3,4,5]
        })

        expect(answer).toBe(15)
    })

    test('it should be possible to perform reduce and add an array with a default value', async () => {
        const answer = await logic.run({
            reduce: [[1,2,3,4,5], {
                '+': [{var: 'accumulator'}, { var: 'current' }]
            }, 10]
        })

        expect(answer).toBe(25)
    })

    test('it should be possible to access data from an above layer in a reduce', async () => {
        const answer = await logic.run({
            reduce: [{var: 'a'}, {
                '+': [{var: 'accumulator'}, { var: 'current' }, { var: '../../adder' }]
            }]
        }, {
            'a': [1,2,3,4,5],
            'adder': 10
        })

        expect(answer).toBe(55)
    })
})


describe('iterators',  () => {
    test('some false', async () => {
        const answer = await logic.run({
            'some': [[1,2,3], { '>': [{var: ''}, 5] }]
        })

        expect(answer).toBe(false)
    })

    test('some true', async () => {
        const answer = await logic.run({
            'some': [[1,2,3], { '>': [{var: ''}, 2] }]
        })

        expect(answer).toBe(true)
    })

    test('every false', async () => {
        const answer = await logic.run({
            'every': [[1,2,3], { '>': [{var: ''}, 5] }]
        })

        expect(answer).toBe(false)
    })

    test('every true', async () => {
        const answer = await logic.run({
            'every': [[1,2,3], { '<': [{var: ''}, 5] }]
        })

        expect(answer).toBe(true)
    })

    test('map +1', async () => {
        const answer = await logic.run({
            'map': [[1,2,3], { '+': [{var: ''}, 1] }]
        })

        expect(answer).toStrictEqual([2,3,4])
    })

    test('filter evens', async () => {
        const answer = await logic.run({
            'filter': [[1,2,3], { '%': [{var: ''}, 2] }]
        })

        expect(answer).toStrictEqual([1,3])
    })
})