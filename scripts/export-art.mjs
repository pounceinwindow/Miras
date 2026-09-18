import ts from 'typescript'
import { URL } from 'node:url'
import { Buffer } from 'node:buffer'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
// Export the same vector art for Pixi textures; no remote images are required.
const source = await readFile(
  new URL('../src/components/CharacterArt.tsx', import.meta.url),
  'utf8',
)
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
})
const moduleSource = outputText.replace(
  /from "react\/jsx-runtime"/g,
  `from ${JSON.stringify(import.meta.resolve('react/jsx-runtime'))}`,
)
const { CharacterArt } = await import(
  `data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`
)
const directory = new URL('../public/entities/', import.meta.url)
await mkdir(directory, { recursive: true })
for (const id of ['shurale', 'syuyumbike', 'su-anasy', 'kereml']) {
  await writeFile(
    new URL(`${id}.svg`, directory),
    renderToStaticMarkup(createElement(CharacterArt, { id })),
  )
}
