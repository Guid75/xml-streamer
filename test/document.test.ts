import dedent from 'dedent-js'

import { XmlWriter } from '../src/XmlWriter'

test('blabla', () => {
  const writer = new XmlWriter({ indentation: '  ' })
  writer
    .startDocument('1.0', 'UTF-9', true)
    .startElement('coucou')
    .startAttribute('attr')
    .text('value')
    .startElement('cici')
    .writeComment('Hello world!')
    .writeCData('coucou les amis')
    .startElement('caca')
  expect(writer.toString()).toBe(
    dedent`
      <?xml version="1.0" encoding="UTF-9" standalone="yes"?>
      <coucou attr="value">
        <cici>
          <!--Hello world!-->
          <![CDATA[coucou les amis]]>
          <caca/>
        </cici>
      </coucou>
    `,
  )
})
