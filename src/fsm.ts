import { createMachine } from 'xstate'

export type Writer = (str: string) => void

function escapeAttributeContent(content: string) {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/\t/g, '&#x9;')
    .replace(/\n/g, '&#xA;')
    .replace(/\r/g, '&#xD;')
}

function escapeTextContent(content: string) {
  return content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

type Context = {
  indentString?: string
  containingChildrenLastDepth: number
  stack: string[]
  rawStack: string[]
  hasBody: boolean
}

type DocumentDeclaration = {
  version?: string
  encoding?: string
  standalone?: boolean
}

type GenericEvent<T> = { type: T }
type GenericParamEvent<T, TParam = string> = { type: T; param: TParam }

type Event =
  | GenericParamEvent<'START_DOCUMENT', DocumentDeclaration>
  | GenericEvent<'END_DOCUMENT'>
  | GenericParamEvent<'START_ELEMENT'>
  | GenericEvent<'END_ELEMENT'>
  | GenericEvent<'END_ATTRIBUTES'>
  | GenericParamEvent<'START_ATTRIBUTE'>
  | GenericEvent<'END_ATTRIBUTE'>
  | GenericEvent<'START_COMMENT'>
  | GenericEvent<'END_COMMENT'>
  | GenericEvent<'START_CDATA'>
  | GenericEvent<'END_CDATA'>
  | GenericParamEvent<'TEXT'>

const DEFAULT_INDENTATION = '    '

const nameRegex = /[_:A-Za-z][-._:A-Za-z0-9]*/

function nameValidator(transformer: (name: string) => string) {
  return (name: string) => {
    if (!name.match(nameRegex)) throw Error('Invalid Parameter')
    return transformer(name)
  }
}

const xmlFragments = {
  PIStart: nameValidator((name) => `<?${name}`),
  PIEnd: '?>',
  attributeStart: nameValidator((name) => ` ${name}="`),
  attributeEnd: '"',
  attributesEnd: '>',
  text: (content: string) => content,
  elementStart: nameValidator((name) => `<${name}`),
  elementEnd: nameValidator((name) => `</${name}>`),
  selfClosingEnd: '/>',
  commentStart: '<!--',
  commentEnd: '-->',
  cdataStart: '<![CDATA[',
  cdataEnd: ']]>',
} as const

type FragmentName = keyof typeof xmlFragments

export function createFsm(writer: Writer, indentation?: boolean | string) {
  function writeXmlFragment(fragmentName: FragmentName, content?: string) {
    const fragment = xmlFragments[fragmentName]
    if (typeof fragment === 'string') {
      writer(fragment)
    } else {
      writer(fragment(content || ''))
    }
  }

  function writeXmlFragments(...fragments: (FragmentName | [FragmentName, string?])[]) {
    for (const fragment of fragments) {
      if (typeof fragment === 'string') {
        writeXmlFragment(fragment)
      } else {
        writeXmlFragment(...fragment)
      }
    }
  }

  function writeXmlAttribute(name: string, value: string) {
    writeXmlFragments(['attributeStart', name], ['text', value], 'attributeEnd')
  }

  function writeXmlDeclaration({ version, encoding, standalone }: DocumentDeclaration) {
    writeXmlFragment('PIStart', 'xml')
    writeXmlAttribute('version', typeof version == 'string' ? version : '1.0')
    if (typeof encoding == 'string') writeXmlAttribute('encoding', encoding)
    if (standalone) writeXmlAttribute('standalone', 'yes')
    writeXmlFragment('PIEnd')
  }

  function indent({ indentString, stack }: Context) {
    if (indentString) {
      writer('\n')
      for (let i = 0; i < stack.length; i++) {
        writer(indentString)
      }
    }
  }

  function buildIndentString(): string | undefined {
    if (indentation) {
      return typeof indentation === 'string' ? indentation : DEFAULT_INDENTATION
    }
  }

  return createMachine(
    {
      predictableActionArguments: true,
      tsTypes: {} as import('./fsm.typegen').Typegen0,
      schema: {
        context: {} as Context,
        events: {} as Event,
      },
      initial: 'void',
      context: {
        containingChildrenLastDepth: -1,
        stack: [],
        indentString: buildIndentString(),
        rawStack: [],
        hasBody: false,
      },
      id: 'root',
      states: {
        void: {
          on: {
            START_DOCUMENT: { actions: 'writeXmlDeclaration', target: 'root' },
            START_ELEMENT: 'element',
            START_COMMENT: 'comment',
          },
        },
        root: {
          on: {
            START_ELEMENT: 'element',
            START_COMMENT: 'comment',
            END_DOCUMENT: 'end',
          },
        },
        element: {
          id: 'element',
          entry: 'enterElement',
          exit: 'exitElement',
          on: {
            START_ELEMENT: 'element',
            END_ELEMENT: 'element',
            END_DOCUMENT: 'end',
          },
          initial: 'attributes',
          states: {
            attributes: {
              initial: 'idle',
              states: {
                idle: {
                  on: {
                    START_ATTRIBUTE: 'attribute',
                  },
                },
                attribute: {
                  entry: 'enterAttribute',
                  exit: 'exitAttribute',
                  on: {
                    END_ATTRIBUTE: 'idle',
                    TEXT: { actions: 'writeAttributeText' },
                  },
                },
              },
              on: {
                END_ATTRIBUTES: { actions: 'writeAttributesEnd', target: 'body' },
                START_COMMENT: { actions: 'writeAttributesEnd', target: 'comment' },
                START_CDATA: { actions: 'writeAttributesEnd', target: 'cdata' },
                TEXT: { actions: 'writeAttributesEnd', target: 'body' },
              },
            },
            body: {
              entry: 'enterBody',
              on: {
                TEXT: 'body',
                START_COMMENT: 'comment',
                START_CDATA: 'cdata',
              },
            },
            comment: {
              entry: 'enterComment',
              on: {
                END_COMMENT: { actions: 'leaveComment', target: 'body' },
                TEXT: { actions: 'writeComment' },
              },
            },
            cdata: {
              entry: 'enterCData',
              on: {
                END_CDATA: { actions: 'leaveCData', target: 'body' },
                TEXT: { actions: 'writeCData' },
              },
            },
          },
        },
        comment: {
          entry: 'enterComment',
          on: {
            END_COMMENT: { actions: 'leaveComment', target: 'root' },
            TEXT: { actions: 'writeComment' },
          },
        },
        end: {
          entry: 'flush',
          type: 'final',
        },
      },
    },
    {
      actions: {
        writeXmlDeclaration: (__, event) => writeXmlDeclaration(event.param),
        enterElement: (ctx, event) => {
          if (event.type === 'START_ELEMENT') {
            const tagName = event.param
            indent(ctx)
            ctx.hasBody = false
            ctx.containingChildrenLastDepth = ctx.stack.length - 1
            ctx.stack.push(tagName)
            writeXmlFragment('elementStart', tagName)
          } else {
            ctx.hasBody = true
          }
          return ctx
        },
        exitElement: (ctx, event) => {
          if (event.type === 'START_ELEMENT' && !ctx.hasBody) {
            writeXmlFragment('attributesEnd')
            return
          }
          if (event.type !== 'END_ELEMENT' && event.type !== 'END_DOCUMENT') return
          if (ctx.hasBody) {
            if (ctx.stack.length === 0) return ctx
            const name = ctx.stack.pop()
            if (ctx.stack.length === ctx.containingChildrenLastDepth) {
              indent(ctx)
            }
            ctx.containingChildrenLastDepth = ctx.stack.length - 1
            writeXmlFragment('elementEnd', name)
          } else {
            ctx.stack.pop()
            writeXmlFragment('selfClosingEnd')
          }
          return ctx
        },
        writeAttributesEnd: (__) => writeXmlFragment('attributesEnd'),
        enterAttribute: (__, { param }) => writeXmlFragment('attributeStart', param),
        exitAttribute: () => writeXmlFragment('attributeEnd'),
        enterBody: (ctx, event) => {
          ctx.hasBody = true
          if (event.type === 'TEXT') {
            writeXmlFragment('text', escapeTextContent(event.param))
          }
          return ctx
        },
        enterComment: (ctx) => {
          indent(ctx)
          writeXmlFragment('commentStart')
        },
        leaveComment: () => writeXmlFragment('commentEnd'),
        // TODO escape the comment
        writeComment: (__, { param: comment }) => writeXmlFragment('text', comment),
        enterCData: (ctx) => {
          indent(ctx)
          writeXmlFragment('cdataStart')
        },
        leaveCData: () => writeXmlFragment('cdataEnd'),
        writeCData: (__, { param: cdata }) => writeXmlFragment('text', cdata),
        writeAttributeText: (__, { param }) =>
          writeXmlFragment('text', escapeAttributeContent(param)),
        flush: (ctx) => {
          while (ctx.stack.length) {
            const name = ctx.stack.pop()
            if (ctx.stack.length === ctx.containingChildrenLastDepth) indent(ctx)
            ctx.containingChildrenLastDepth = ctx.stack.length - 1
            writeXmlFragment('elementEnd', name)
          }
          return ctx
        },
      },
    },
  )
}
