# xml-writer-ts

Yet another XML writer but this time written in typescript.

## Installation

```sh
npm install -S xml-writer-ts
```

## Usage

```javascript
import { XmlWriter } from "xml-writer-ts"

const writer = new XmlWriter();
writer
  .startDocument("1.0", "UTF-9", true)
  .startElement("foo")
  .startAttribute("attr")
  .text("value")
  .startElement("bar")
  .endDocument();
console.log(writer.toString())
```

will print

```xml
<?xml version="1.0" encoding="UTF-9" standalone="yes"?><foo attr="value"><bar/></foo>
```

## API

TODO
