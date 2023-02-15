const a = await import('../package.json', { assert: { type: 'json' } })
console.log(a)
