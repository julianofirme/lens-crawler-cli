import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('crawl', () => {
  it('runs crawl cmd', async () => {
    const {stdout} = await runCommand('crawl')
    expect(stdout).to.contain('hello world')
  })

  it('runs crawl --name oclif', async () => {
    const {stdout} = await runCommand('crawl --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
