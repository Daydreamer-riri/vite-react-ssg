/* eslint-disable no-unused-expressions */
import { bold, gray, red, reset, underline } from 'kolorist'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { installGlobals } from '../pollfill'
import { build } from './build'
import { dev } from './dev'

installGlobals()

yargs(hideBin(process.argv))
  .scriptName('vite-react-ssg')
  .usage('$0 [args]')
  .command(
    'build',
    'Build SSG',
    args => args
      .option('script', {
        choices: ['sync', 'async', 'defer', 'async defer'] as const,
        describe: 'Rewrites script loading timing',
      })
      .option('mock', {
        type: 'boolean',
        describe: 'Mock browser globals (window, document, etc.) for SSG',
      })
      .option('config', {
        alias: 'c',
        type: 'string',
        describe: 'The vite config file to use',
      })
      .option('base', {
        alias: 'b',
        type: 'string',
        describe: 'The base path to render',
      }),
    async args => {
      const { config: configFile = undefined, ...ssgOptions } = args

      await build(ssgOptions, { configFile })
    },
  )
  .command(
    'dev',
    'Dev SSG',
    args => args
      .option('script', {
        choices: ['sync', 'async', 'defer', 'async defer'] as const,
        describe: 'Rewrites script loading timing',
      })
      .option('mock', {
        type: 'boolean',
        describe: 'Mock browser globals (window, document, etc.) for SSG',
      })
      .option('config', {
        alias: 'c',
        type: 'string',
        describe: 'The vite config file to use',
      })
      .option('base', {
        alias: 'b',
        type: 'string',
        describe: 'The base path to render',
      })
      .option('host', {
        type: 'boolean',
        describe: 'The host to expose',
      }),
    async args => {
      const { config: configFile = undefined, host, ...ssgOptions } = args

      await dev(ssgOptions, { configFile, server: { host } })
    },
  )
  .fail((msg, err, yargs) => {
    console.error(`\n${gray('[vite-react-ssg]')} ${bold(red('An internal error occurred.'))}`)
    console.error(`${gray('[vite-react-ssg]')} ${reset(`Please report an issue, if none already exists: ${underline('https://github.com/daydreamer-riri/vite-react-ssg/issues')}`)}`)
    yargs.exit(1, err)
  })
  .showHelpOnFail(false)
  .help()
  .argv

export {}
