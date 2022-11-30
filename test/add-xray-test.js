const test = require("tape");
const addXray = require("../src");

test("test using promises", function (t) {
	t.ok(addXray, "lib exists");
	t.end();
});
