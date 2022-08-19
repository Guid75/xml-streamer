# xml-writer-ts

Yet another XML writer but this time written in typescript.

**WARNING: this package is still in early alpha stage, some features are not yet implemented**

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/guid75/xml-writer/Node.js%20CI?label=tests)

## Installation

```sh
npm install -S xml-writer-ts
```

## Usage

```javascript
import { XmlWriter } from "xml-writer-ts"

const writer = new XmlWriter({ indentation: "  " })
writer
  .startDocument("1.0", "UTF-9", true)
  .startElement("coucou")
  .startAttribute("attr")
  .text("value")
  .startElement("cici")
  .writeComment("Hello world!")
  .startElement("caca")

console.log(writer.toString())
```

will print:

```xml
<?xml version="1.0" encoding="UTF-9" standalone="yes"?>
<coucou attr="value">
  <cici>
    <!--Hello world!-->
    <caca/>
  </cici>
</coucou>
```

## API

Implemented methods (Work In Progress):

```typescript
function startDocument(version?: string, encoding?: string, standalone?: boolean) {}
function endDocument() {}

function writeElement(name: string, content: string) {}
function startElement(name: string) {}
function endElement() {}

function writeAttribute(name: string, content: string) {}
function startAttribute(name: string) {}
function endAttribute() {}

function endAttributes() {}

function writeComment(content: string) {}
function startComment() {}
function endComment() {}

function text(content: string) {}
```
