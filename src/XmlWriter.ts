import { interpret } from "robot3";

import { createFsm, Writer } from "./fsm";

type ConstructorOptions = {
  indentation?: boolean | string;
  callback?: Writer;
};

type SimpleRelay = () => XmlWriter;
type NameRelay = (name: string) => XmlWriter;

export class XmlWriter {
  #fsm;
  #output = "";

  endDocument: SimpleRelay;
  startAttribute: NameRelay;
  endAttribute: SimpleRelay;
  endAttributes: SimpleRelay;
  startElement: NameRelay;
  endElement: SimpleRelay;
  startComment: SimpleRelay;
  endComment: SimpleRelay;

  constructor({ indentation, callback }: ConstructorOptions = {}) {
    const defaultCallback = (str: string) => {
      this.#output += str;
    };

    this.#fsm = interpret(
      createFsm(callback ?? defaultCallback, indentation),
      () => {
        // do nothing
      }
    );
    this.endDocument = this.#fsmRelay("endDocument");
    this.startAttribute = this.#fsmRelayName("startAttribute");
    this.endAttribute = this.#fsmRelay("endAttribute");
    this.endAttributes = this.#fsmRelay("endAttributes");
    this.startElement = this.#fsmRelayName("startElement");
    this.endElement = this.#fsmRelay("endElement");
    this.startComment = this.#fsmRelay("startComment");
    this.endComment = this.#fsmRelay("endComment");
  }

  #fsmRelay(tagName: string): SimpleRelay {
    return () => {
      this.#fsm.send(tagName);
      return this;
    };
  }

  #fsmRelayName(tagName: string): NameRelay {
    return (name: string) => {
      this.#fsm.send({ type: tagName, name });
      return this;
    };
  }

  startDocument(version?: string, encoding?: string, standalone?: boolean) {
    this.#fsm.send({ type: "startDocument", version, encoding, standalone });
    return this;
  }

  writeElement(name: string, content: string) {
    return this.startElement(name).text(content).endElement();
  }

  text(content: string) {
    this.#fsm.send({ type: "text", content });
    return this;
  }

  writeAttribute(name: string, content: string) {
    return this.startAttribute(name).text(content).endAttribute();
  }

  writeComment(content: string) {
    return this.startComment().text(content).endComment();
  }

  toString(): string {
    this.#fsm.send("endDocument");
    return this.#output;
  }
}
