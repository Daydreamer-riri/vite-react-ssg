import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { bold, dim, green } from 'kolorist'
import type { ViteDevServer } from 'vite'
import { printServerInfo } from './dev'

export interface CLIShortcut {
  key: string
  description: string
  action: (viteServer: ViteDevServer, server: Server<typeof IncomingMessage, typeof ServerResponse>) => void | Promise<void>
}

const SHORTCUTS: CLIShortcut[] = [
  {
    key: 'u',
    description: 'show server url',
    action(vite, _) {
      vite.config.logger.info('')
      printServerInfo(vite, true)
    },
  },
  {
    key: 'c',
    description: 'clear console',
    action(vite, _) {
      vite.config.logger.clearScreen('error')
    },
  },
  {
    key: 'q',
    description: 'quit',
    action(_, server) {
      server.close(() => process.exit())
    },
  },
]

export function bindShortcuts(
  viteServer: ViteDevServer,
  server: Server<typeof IncomingMessage, typeof ServerResponse>,
): void {
  if (!process.stdin.isTTY || process.env.CI)
    return

  viteServer.config.logger.info(
    dim(green('  ➜'))
    + dim('  press ')
    + bold('h')
    + dim(' to show help'),
  )

  const shortcuts = SHORTCUTS

  let actionRunning = false

  const onInput = async (input: string) => {
    // ctrl+c or ctrl+d
    if (input === '\x03' || input === '\x04') {
      try {
        await server.close()
      }
      finally {
        process.exit(1)
      }
      return
    }

    if (actionRunning)
      return

    if (input === 'h') {
      viteServer.config.logger.info(
        [
          '',
          bold('  Shortcuts'),
          ...shortcuts.map(
            shortcut =>
              dim('  press ')
              + bold(shortcut.key)
              + dim(` to ${shortcut.description}`),
          ),
        ].join('\n'),
      )
    }

    const shortcut = shortcuts.find(shortcut => shortcut.key === input)
    if (!shortcut)
      return

    actionRunning = true
    await shortcut.action(viteServer, server)
    actionRunning = false
  }

  process.stdin.setRawMode(true)

  process.stdin.on('data', onInput).setEncoding('utf8').resume()

  server.on('close', () => {
    process.stdin.off('data', onInput).pause()
  })
}
