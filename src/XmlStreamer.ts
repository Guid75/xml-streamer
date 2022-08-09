import {
  createMachine,
  reduce as robotReduce,
  ReduceFunction,
  action as robotAction,
  interpret,
  state,
  transition,
  ActionFunction,
} from "robot3";

type Textable = string | number | Function;

function toText(content?: Textable): string {
  if (typeof content == "string") {
    return content;
  }
  if (typeof content == "number") {
    return content + "";
  }
  if (typeof content == "function") {
    return content();
  }
  throw Error("Bad Parameter");
}

function escapeAttributeContent(content?: Textable) {
  return toText(content)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/\t/g, "&#x9;")
    .replace(/\n/g, "&#xA;")
    .replace(/\r/g, "&#xD;");
}

function escapeTextContent(content?: Textable) {
  return toText(content)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type Context = {
  indentString?: string;
  containingChildrenLastDepth: number;
  stack: string[];
  writerEncoding?: string;
  rawStack: string[];
};

type EventName =
  | "startDocument"
  | "endDocument"
  | "startElement"
  | "endElement"
  | "endAttributes"
  | "startAttribute"
  | "endAttribute"
  | "text";

type StateName = "body" | "attributes" | "attribute" | "end";

// TODO type the args
function trans(event: EventName, state: StateName, ...args: any[]) {
  return transition(event, state, ...args);
}

type StartEvent = {
  version: string;
  encoding: string;
  standalone: boolean;
};

type NameEvent = {
  name: string;
};

type ContentEvent = {
  content: Textable;
};

function reduce<E>(reduceFunction?: ReduceFunction<Context, E>) {
  return robotReduce<Context, E>(reduceFunction);
}

function action<E>(actionFunction?: ActionFunction<Context, E>) {
  return robotAction<Context, E>(actionFunction);
}

const nameRegex = /[_:A-Za-z][-._:A-Za-z0-9]*/;

type Writer = (str: string) => void;

const xmlFragments = {
  startPI: (name: string) => `<?${name}`,
  endPI: "?>",
  startAttribute: (name: string) => ` ${name}="`,
  endAttribute: '"',
  endAttributes: ">",
  text: (content: string) => content,
  startElement: (name: string) => `<${name}`,
  endElement: (name: string) => `</${name}>`,
  endSelfClosing: "/>",
} as const;

type FragmentName = keyof typeof xmlFragments;

export function createXmlMachine(writer: Writer) {
  function writeXmlFragment(fragmentName: FragmentName, content?: string) {
    const fragment = xmlFragments[fragmentName];
    if (typeof fragment === "string") {
      writer(fragment);
    } else {
      writer(fragment(content || ""));
    }
  }

  function writeXmlFragments(
    ...fragments: (FragmentName | [FragmentName, string?])[]
  ) {
    for (const fragment of fragments) {
      if (typeof fragment === "string") {
        writeXmlFragment(fragment);
      } else {
        writeXmlFragment(...fragment);
      }
    }
  }

  function writeXmlAttribute(name: string, value: string) {
    writeXmlFragments(
      ["startAttribute", name],
      ["text", value],
      "endAttribute"
    );
  }

  function writeXmlDeclaration(
    ctx: Context,
    { version, encoding, standalone }: StartEvent
  ) {
    writeXmlFragment("startPI", "xml");
    writeXmlAttribute("version", typeof version == "string" ? version : "1.0");
    if (typeof encoding == "string") {
      writeXmlAttribute("encoding", encoding);
      ctx.writerEncoding = encoding;
    }
    if (standalone) {
      writeXmlAttribute("standalone", "yes");
    }
    writeXmlFragment("endPI");
  }

  function indent({ indentString, stack }: Context) {
    if (indentString) {
      writer("\n");
      for (let i = 0; i < stack.length; i++) {
        writer(indentString);
      }
    }
  }

  function end(ctx: Context): Context {
    while (ctx.stack.length) {
      const name = ctx.stack.pop();
      if (ctx.stack.length === ctx.containingChildrenLastDepth) {
        indent(ctx);
      }
      ctx.containingChildrenLastDepth = ctx.stack.length - 1;
      writeXmlFragment("endElement", name);
    }
    return ctx;
  }

  const darknessState = state(
    trans(
      "startDocument",
      "body",
      reduce((ctx, startEvent: StartEvent) => {
        writeXmlDeclaration(ctx, startEvent);
        return ctx;
      })
    ),
    trans(
      "startElement",
      "attributes",
      reduce((ctx, { name }: NameEvent) => {
        ctx.stack.push(name);
        ctx.containingChildrenLastDepth = ctx.stack.length - 1;
        // TODO indenter
        indent(ctx);
        writeXmlFragment("startElement", name);
        return ctx;
      })
    )
  );

  const attributesState = state(
    trans(
      "endAttributes",
      "body",
      action(() => {
        writeXmlFragment("endAttributes");
      })
    ),
    trans(
      "startAttribute",
      "attribute",
      action((__, { name }: NameEvent) =>
        writeXmlFragment("startAttribute", name)
      )
    ),
    trans(
      "text",
      "body",
      action((__, { content }: ContentEvent) => {
        writeXmlFragments("endAttributes", [
          "text",
          escapeTextContent(content),
        ]);
      })
    ),
    trans(
      "endElement",
      "body",
      reduce((ctx) => {
        writeXmlFragments("endSelfClosing");
        ctx.stack.pop();
        return ctx;
      })
    ),
    trans(
      "endDocument",
      "end",
      reduce((ctx) => {
        writeXmlFragments("endSelfClosing");
        ctx.stack.pop();
        return end(ctx);
      })
    ),
    trans(
      "startElement",
      "attributes",
      reduce((ctx, { name }: NameEvent) => {
        writeXmlFragment("endAttributes");
        indent(ctx);
        ctx.containingChildrenLastDepth = ctx.stack.length - 1;
        ctx.stack.push(name);
        writeXmlFragment("startElement", name);
        return ctx;
      })
    )
  );

  const attributeState = state(
    trans(
      "text",
      "attribute",
      action((__, { content }: ContentEvent) =>
        writeXmlFragment("text", escapeAttributeContent(content))
      )
    ),
    trans(
      "endAttribute",
      "attributes",
      action(() => {
        writeXmlFragment("endAttribute");
      })
    ),
    trans(
      "endAttributes",
      "body",
      action(() => {
        writeXmlFragments("endAttribute", "endAttributes");
      })
    ),
    trans(
      "endDocument",
      "end",
      reduce((ctx) => {
        writeXmlFragments("endAttribute", "endSelfClosing");
        ctx.stack.pop();
        return end(ctx);
      })
    ),
    trans(
      "endElement",
      "body",
      reduce((ctx) => {
        writeXmlFragments("endAttribute", "endSelfClosing");
        ctx.stack.pop();
        return ctx;
      })
    ),
    trans(
      "startElement",
      "attributes",
      reduce((ctx, { name }: NameEvent) => {
        writeXmlFragments("endAttribute", "endAttributes");
        indent(ctx);
        ctx.containingChildrenLastDepth = ctx.stack.length - 1;
        ctx.stack.push(name);
        writeXmlFragment("startElement", name);
        return ctx;
      })
    )
  );

  const bodyState = state(
    trans(
      "text",
      "body",
      action((__, { content }: ContentEvent) =>
        writeXmlFragment("text", escapeTextContent(content))
      )
    ),
    trans(
      "endElement",
      "body",
      reduce((ctx) => {
        if (ctx.stack.length === 0) return ctx;
        const name = ctx.stack.pop();
        if (ctx.stack.length === ctx.containingChildrenLastDepth) {
          indent(ctx);
        }
        ctx.containingChildrenLastDepth = ctx.stack.length - 1;
        writeXmlFragment("endElement", name);
        return ctx;
      })
    ),
    trans("endDocument", "end", reduce(end)),
    trans(
      "startElement",
      "attributes",
      reduce((ctx, { name }: NameEvent) => {
        indent(ctx);
        ctx.containingChildrenLastDepth = ctx.stack.length - 1;
        ctx.stack.push(name);
        writeXmlFragment("startElement", name);
        return ctx;
      })
    )
  );

  return createMachine<{}, Context>(
    {
      darkness: darknessState,
      attributes: attributesState,
      attribute: attributeState,
      body: bodyState,
      end: state(),
    },
    () => ({
      containingChildrenLastDepth: -1,
      stack: [],
      indentString: "  ",
      rawStack: [],
    })
  );
}

type ConstructorOptions = {
  indent?: boolean | string;
  callback?: Function;
};

type StartDocumentOptions = {
  version?: string;
  encoding?: string;
  standalone?: boolean;
};

export class XmlStreamer {
  #fsm;
  #mustIndent: boolean;
  #indentString?: string;
  #output: string = "";
  #currentDepth = 0;

  constructor({ indent, callback }: ConstructorOptions = {}) {
    this.#mustIndent = Boolean(indent);
    if (this.#mustIndent) {
      this.#indentString = typeof indent === "string" ? indent : "    ";
    }
    this.#fsm = interpret(
      createXmlMachine((e) => {
        console.log(e);
      })
    );
  }

  toString(): string {
    this.#flush();
    return this.#output;
  }

  #flush() {
    //TODO
  }

  startDocument(
    { version, encoding, standalone }: StartDocumentOptions = { version: "1.0" }
  ): XmlStreamer {
    if (this.#currentDepth > 0) {
      return this;
    }

    return this;
  }

  endDocument(): XmlStreamer {
    // if (this.attributes) this.endAttributes();
    return this;
  }
}
