import { XmlWriter } from "../src/XmlWriter";

test("blabla", () => {
  const writer = new XmlWriter();
  writer
    .startDocument("1.0", "UTF-9", true)
    .startElement("coucou")
    .startAttribute("attr")
    .text("value")
    .startElement("cici");
  expect(writer.toString()).toBe(
    '<?xml version="1.0" encoding="UTF-9" standalone="yes"?><coucou attr="value"><cici/></coucou>'
  );
});
