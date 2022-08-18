import { XmlStreamer } from "../src/XmlStreamer";

test("blabla", () => {
  const xmlStream = new XmlStreamer();
  xmlStream
    .startDocument("1.0", "UTF-9", true)
    .startElement("coucou")
    .startAttribute("attr")
    .text("value")
    .startElement("cici");
  expect(xmlStream.toString()).toBe(
    '<?xml version="1.0" encoding="UTF-9" standalone="yes"?><coucou attr="value"><cici/></coucou>'
  );
});
