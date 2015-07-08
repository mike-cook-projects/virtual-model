var Assign = require("object-assign");
var React = require("react");
var Falcor = require("./falcor/falcor");

var Test = React.createClass({
    render() {
        return <div>{JSON.stringify(this.props)}</div>
    }
});

var testAssign = Assign({}, { test: true });
React.render(<Test testProp={testAssign}/>, document.body);