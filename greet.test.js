const assert = require("assert");
const { greet } = require("./greet");

assert.strictEqual(greet("Alice"), "Hello, Alice!");
assert.strictEqual(greet(), "Hello, stranger!");
assert.strictEqual(greet(""), "Hello, stranger!");

console.log("All greet() tests passed.");
