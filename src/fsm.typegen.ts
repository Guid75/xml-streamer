// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true
  internalEvents: {
    'xstate.init': { type: 'xstate.init' }
    'xstate.stop': { type: 'xstate.stop' }
  }
  invokeSrcNameMap: {}
  missingImplementations: {
    actions: never
    services: never
    guards: never
    delays: never
  }
  eventsCausingActions: {
    enterAttribute: 'START_ATTRIBUTE'
    enterBody: 'END_ATTRIBUTES' | 'END_COMMENT' | 'TEXT'
    enterComment: 'START_COMMENT'
    enterElement: 'END_ELEMENT' | 'START_ELEMENT'
    exitAttribute:
      | 'END_ATTRIBUTE'
      | 'END_ATTRIBUTES'
      | 'END_DOCUMENT'
      | 'END_ELEMENT'
      | 'START_COMMENT'
      | 'START_ELEMENT'
      | 'xstate.stop'
    exitElement: 'END_DOCUMENT' | 'END_ELEMENT' | 'START_ELEMENT' | 'xstate.stop'
    flush: 'END_DOCUMENT'
    leaveComment: 'END_COMMENT'
    writeAttributeText: 'TEXT'
    writeAttributesEnd: 'END_ATTRIBUTES' | 'START_COMMENT' | 'TEXT'
    writeComment: 'TEXT'
    writeXmlDeclaration: 'START_DOCUMENT'
  }
  eventsCausingServices: {}
  eventsCausingGuards: {}
  eventsCausingDelays: {}
  matchesStates:
    | 'comment'
    | 'element'
    | 'element.attributes'
    | 'element.attributes.attribute'
    | 'element.attributes.idle'
    | 'element.body'
    | 'element.comment'
    | 'end'
    | 'root'
    | 'void'
    | { element?: 'attributes' | 'body' | 'comment' | { attributes?: 'attribute' | 'idle' } }
  tags: never
}
