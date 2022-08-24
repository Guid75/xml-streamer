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
    enterBody: 'END_ATTRIBUTES' | 'END_CDATA' | 'END_COMMENT' | 'TEXT'
    enterCData: 'START_CDATA'
    enterComment: 'START_COMMENT'
    enterElement: 'END_ELEMENT' | 'START_ELEMENT'
    exitAttribute:
      | 'END_ATTRIBUTE'
      | 'END_ATTRIBUTES'
      | 'END_DOCUMENT'
      | 'END_ELEMENT'
      | 'START_CDATA'
      | 'START_COMMENT'
      | 'START_ELEMENT'
      | 'TEXT'
      | 'xstate.stop'
    exitElement: 'END_DOCUMENT' | 'END_ELEMENT' | 'START_ELEMENT' | 'xstate.stop'
    flush: 'END_DOCUMENT'
    leaveCData: 'END_CDATA'
    leaveComment: 'END_COMMENT'
    writeAttributeText: 'TEXT'
    writeAttributesEnd: 'END_ATTRIBUTES' | 'START_CDATA' | 'START_COMMENT' | 'TEXT'
    writeCData: 'TEXT'
    writeComment: 'TEXT'
    writeXmlDeclaration: 'START_DOCUMENT'
  }
  eventsCausingServices: {}
  eventsCausingGuards: {}
  eventsCausingDelays: {}
  matchesStates:
    | 'cdata'
    | 'comment'
    | 'element'
    | 'element.attributes'
    | 'element.attributes.attribute'
    | 'element.attributes.idle'
    | 'element.body'
    | 'element.cdata'
    | 'element.comment'
    | 'end'
    | 'root'
    | 'void'
    | {
        element?:
          | 'attributes'
          | 'body'
          | 'cdata'
          | 'comment'
          | { attributes?: 'attribute' | 'idle' }
      }
  tags: never
}
