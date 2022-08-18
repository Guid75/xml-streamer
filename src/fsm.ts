import {
  createMachine,
  reduce as robotReduce,
  ReduceFunction,
  action as robotAction,
  Reducer,
  Guard,
  Action,
  state,
  transition,
  ActionFunction,
} from "robot3";

export type Writer = (str: string) => void;

function escapeAttributeContent(content: string) {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/\t/g, "&#x9;")
    .replace(/\n/g, "&#xA;")
    .replace(/\r/g, "&#xD;");
}

function escapeTextContent(content: string) {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type Context = {
  indentString?: string;
  containingChildrenLastDepth: number;
  stack: string[];
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

function trans<E>(
  event: EventName,
  state: StateName,
  ...args: (Reducer<Context, E> | Guard<Context, E> | Action<Context, E>)[]
) {
  return transition(event, state, ...args);
}

type StartEvent = {
  version: string;
  encoding: string;
  standalone: boolean;
};

type NameEvent = { name: string };

type ContentEvent = { content: string };

function reduce<E>(reduceFunction?: ReduceFunction<Context, E>) {
  return robotReduce<Context, E>(reduceFunction);
}

function action<E>(actionFunction?: ActionFunction<Context, E>) {
  return robotAction<Context, E>(actionFunction);
}

const nameRegex = /[_:A-Za-z][-._:A-Za-z0-9]*/;

function nameValidator(transformer: (name: string) => string) {
  return (name: string) => {
    if (!name.match(nameRegex)) throw Error("Invalid Parameter");
    return transformer(name);
  };
}

const xmlFragments = {
  startPI: nameValidator((name) => `<?${name}`),
  endPI: "?>",
  startAttribute: nameValidator((name) => ` ${name}="`),
  endAttribute: '"',
  endAttributes: ">",
  text: (content: string) => content,
  startElement: nameValidator((name) => `<${name}`),
  endElement: nameValidator((name) => `</${name}>`),
  endSelfClosing: "/>",
} as const;

type FragmentName = keyof typeof xmlFragments;

export function createFsm(writer: Writer, indentation?: boolean | string) {
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

  function writeXmlDeclaration({ version, encoding, standalone }: StartEvent) {
    writeXmlFragment("startPI", "xml");
    writeXmlAttribute("version", typeof version == "string" ? version : "1.0");
    if (typeof encoding == "string") {
      writeXmlAttribute("encoding", encoding);
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

  function startElement(name: string, ctx: Context): Context {
    indent(ctx);
    ctx.containingChildrenLastDepth = ctx.stack.length - 1;
    ctx.stack.push(name);
    writeXmlFragment("startElement", name);
    return ctx;
  }

  function endSelfClosing(ctx: Context): Context {
    writeXmlFragment("endSelfClosing");
    ctx.stack.pop();
    return ctx;
  }

  const darknessState = state(
    trans(
      "startDocument",
      "body",
      reduce((ctx: Context, event: StartEvent) => {
        writeXmlDeclaration(event);
        return ctx;
      })
    ),
    trans(
      "startElement",
      "attributes",
      reduce((ctx, { name }: NameEvent) => startElement(name, ctx))
    )
  );

  const attributesState = state(
    trans(
      "endAttributes",
      "body",
      action(() => writeXmlFragment("endAttributes"))
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
      action((__, { content }: ContentEvent) =>
        writeXmlFragments("endAttributes", ["text", escapeTextContent(content)])
      )
    ),
    trans("endElement", "body", reduce(endSelfClosing)),
    trans(
      "endDocument",
      "end",
      reduce((ctx) => end(endSelfClosing(ctx)))
    ),
    trans(
      "startElement",
      "attributes",
      reduce((ctx, { name }: NameEvent) => {
        writeXmlFragment("endAttributes");
        return startElement(name, ctx);
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
      action(() => writeXmlFragment("endAttribute"))
    ),
    trans(
      "endAttributes",
      "body",
      action(() => writeXmlFragments("endAttribute", "endAttributes"))
    ),
    trans(
      "endDocument",
      "end",
      reduce((ctx) => {
        writeXmlFragment("endAttribute");
        return end(endSelfClosing(ctx));
      })
    ),
    trans(
      "endElement",
      "body",
      reduce((ctx) => {
        writeXmlFragment("endAttribute");
        return endSelfClosing(ctx);
      })
    ),
    trans(
      "startElement",
      "attributes",
      reduce((ctx, { name }: NameEvent) => {
        writeXmlFragments("endAttribute", "endAttributes");
        return startElement(name, ctx);
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
      reduce((ctx, { name }: NameEvent) => startElement(name, ctx))
    )
  );

  function buildIndentString(): string | undefined {
    if (indentation) {
      return typeof indentation === "string" ? indentation : "    ";
    }
  }

  return createMachine<Record<string, unknown>, Context>(
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
      indentString: buildIndentString(),
      rawStack: [],
    })
  );
}
