import express from 'express'
import * as path from 'path'
import * as fs from 'fs-extra'
import * as faker from '@faker-js/faker'

export interface MockConfig {
  port?: number
  method?: 'get' | 'post' | ({} & string)
  mockDir?: string
}

const basePath = process.cwd()

export default function main(config: MockConfig) {
  const app = express()
  const { port = 3000, mockDir = 'mock', method = 'get' } = config

  fs.readdirSync(path.resolve(basePath, mockDir)).forEach(file => {
    const modulePath = path.resolve(basePath, mockDir, file)
    const module = require(modulePath)

    let config = module
    if (module.default) config = module.default(faker)
    if (typeof module === 'function') config = module(faker)

    const mockList = Array.isArray(config) ? config : [config]

    mockList.forEach(meta => {
      app[meta.method || method](meta.path, (req, res) => {
        const queryScene = req.query
        const data = meta.data.find(({ scene }) => scene === queryScene) || meta.data[0]
        const resp = typeof data.response === 'function' ? data.response(req, res) : data.response
        res.json(resp)
      })
    })
  })

  app.listen(port, () => {
    console.log(`Mock server listening on port ${port}`)
  })
}

export type MockArgs = Parameters<typeof main>;
