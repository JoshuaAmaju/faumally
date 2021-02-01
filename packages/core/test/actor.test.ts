import { createActor } from "../src";
import { interpret } from "xstate";

describe("spawning field actor", () => {
  it("spawn actor without initial value", (done) => {
    const service = interpret(createActor("name", {})).start();

    expect(service.state.context.value).toBeUndefined();

    done();
  });

  it("actor should have value of John Doe on startup", (done) => {
    const service = interpret(
      createActor("name", { initialValue: "John Doe" })
    ).start();

    expect(service.state.context.value).toBe("John Doe");

    done();
  });

  it("actor should have a value of John Doe when Blur event is sent", (done) => {
    const service = interpret(createActor("name", {})).start();

    service.send({ type: "BLUR", value: "John Doe" });

    expect(service.state.value).toBe("validating");

    expect(service.state.context.value).toBe("John Doe");

    done();
  });
});
