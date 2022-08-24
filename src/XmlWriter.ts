import { interpret } from 'xstate'

import { createFsm, Writer } from './fsm'

type ConstructorOptions = {
  indentation?: boolean | string
  callback?: Writer
}

export class XmlWriter {
  #fsm
  #output = ''

  constructor({ indentation, callback }: ConstructorOptions = {}) {
    const defaultCallback = (str: string) => {
      this.#output += str
    }

    this.#fsm = interpret(createFsm(callback ?? defaultCallback, indentation))
    this.#fsm.start()
  }

  startDocument(version?: string, encoding?: string, standalone?: boolean) {
    this.#fsm.send({ type: 'START_DOCUMENT', param: { version, encoding, standalone } })
    return this
  }

  endDocument() {
    this.#fsm.send({ type: 'END_DOCUMENT' })
    return this
  }

  writeElement(name: string, content: string) {
    return this.startElement(name).text(content).endElement()
  }

  startElement(name: string) {
    this.#fsm.send({ type: 'START_ELEMENT', param: name })
    return this
  }

  endElement() {
    this.#fsm.send({ type: 'END_ELEMENT' })
    return this
  }

  startAttribute(name: string) {
    this.#fsm.send({ type: 'START_ATTRIBUTE', param: name })
    return this
  }

  endAttribute() {
    this.#fsm.send({ type: 'END_ATTRIBUTE' })
    return this
  }

  text(content: string) {
    this.#fsm.send({ type: 'TEXT', param: content })
    return this
  }

  writeAttribute(name: string, content: string) {
    return this.startAttribute(name).text(content).endAttribute()
  }

  endAttributes() {
    this.#fsm.send({ type: 'END_ATTRIBUTES' })
    return this
  }

  writeComment(content: string) {
    return this.startComment().text(content).endComment()
  }

  startComment() {
    this.#fsm.send({ type: 'START_COMMENT' })
    return this
  }

  endComment() {
    this.#fsm.send({ type: 'END_COMMENT' })
    return this
  }

  writeCData(content: string) {
    return this.startCData().text(content).endCData()
  }

  startCData() {
    this.#fsm.send({ type: 'START_CDATA' })
    return this
  }

  endCData() {
    this.#fsm.send({ type: 'END_CDATA' })
    return this
  }

  toString(): string {
    this.#fsm.send('END_DOCUMENT')
    return this.#output
  }
}
