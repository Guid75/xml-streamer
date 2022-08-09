import { createMachine, interpret, state, transition } from "robot3";

import { XmlStreamer, createXmlMachine } from "../src/XmlStreamer";

// test("should start a default document", async () => {
//   // given
//   const streamer = new XmlStreamer();

//   // when
//   streamer.startDocument();

//   // then
//   expect(streamer.toString()).toBe("ok");
// });

test("blabla", () => {
  let whole = "";
  const service = interpret(
    createXmlMachine((str) => {
      whole += str;
    }),
    (e) => {
      // if (e.machine.current === "end") {
      //   console.log("la fin !");
      // } else {
      //   console.log(e.machine.current);
      // }
    }
  );
  service.send({
    type: "startDocument",
    version: "1.0",
    encoding: "UTF-9",
    standalone: true,
  });
  service.send({
    type: "startElement",
    name: "coucou",
  });
  service.send({
    type: "startAttribute",
    name: "attr",
  });
  service.send({
    type: "text",
    content: "value",
  });
  service.send({
    type: "startElement",
    name: "cici",
  });
  // service.send({
  //   type: "startElement",
  //   name: "arg",
  // });
  // service.send({
  //   type: "startElement",
  //   name: "arg2",
  // });
  // service.send({
  //   type: "startElement",
  //   name: "arg3",
  // });
  // service.send({
  //   type: "startElement",
  //   name: "cucu",
  // });
  // // service.send({
  // //   type: "startElement",
  // //   name: "coucou2",
  // // });
  // // service.send({
  // //   type: "startAttribute",
  // //   name: "erk",
  // // });
  // service.send("endAttributes");
  // service.send({
  //   type: "text",
  //   content: "ewwwww",
  // });
  service.send("endDocument");
  // service.send({
  //   type: "endElement",
  // });
  // service.send({
  //   type: "endElement",
  // });
  // service.send({
  //   type: "endElement",
  // });
  // service.send({
  //   type: "endElement",
  // });

  console.log(whole);
});
