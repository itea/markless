Markless
========

Markless aims to create DOMs easier.

Markless create DOMs using its own simple grammar.

Using markless is simple, just include it in your page:

    <script type="text/javascript" src="markless.js"></script>

This is an example using markless:

    var box = markless('div#box-1.box "hello, world"');
    document.body.append(box);

Then, there is a new element appended to body:

    <div id="box-1" class="box">hello, world</div>

You can create parent/child/grandchid in a signle string:

    var box2 = markless('span.highlight > a href="https://www.github.com/itea/markless" > strong "Click Here"');

This creates DOM:

    <span class="highlight">
        <a href="http://www.github.com/itea/markless">
            <strong>Click Here</strong>
        </a>
    </span>

Using context veriable is also supported:

    markless('h1 > $1', 'Hello');

Got:

    <h1>Hello</h1>

Markless support multi line string.
For example:

    <textarea id="input-1">
    div#topics.topic-list
      h1 "Hello, world"
      p "This is a " > strong "paragraphy"
        "."
      p
        """This is another paragraphy. In here, you can type " and ' with no need to escape it.
    And, it's multi-line.
        """
    </textarea>

    var docFrag = markless(document.getElementById('input-1').value);

This piece of code reperesents HTML/DOM:

    <div id="topics" class="topic-list">
      <h1>Hello, world</h1>
      <p>This is a <strong>paragraphy</strong>.</p>
      <p>This is another paragraphy. In here, you can type " and ' with no need to escape it.
    And, it's multi-line.</p>

    </div>


markless.markmore
========

Markless comes with an extended edition of it: Markmore.

The difference between them is: Markless create DOM directly while Markmore return a DOM like structure which could be converted to real DOM repeatly. That is, Markmore provide a template feature.

In the previous example, same effect could be done by using markmore:

    var template1 = markless.markmore(document.getElementById('input-1').value);
    var docFrag = template1.realize();
    
More details and manual about markless/markmore, please read wiki.

markless.mix
========

Markless also bring a utility making binding behaviour/event to DOM easier.

markless.mix is a function mix markless and bahaviour returning a function which could be used to create DOM binded the corresponding behaviour:

	var mix = markless.mix;
	var h1 = mix("h1", function(text) {
		var colors = ["red", "green", "blue", "gray"], i = 0;
		this.addEventListener('click', function (event) {
			this.style.color = colors[ i++ %4 ];
		});
		this.innerText = text;
	});
    document.body.appendChild(h1("Click to change color"));

Here, `mix` returned a function by invoking which, it create a H1 DOM element and initialize the element(s) by invoke the initialization function which passed to `mix`.

If the first argument passed to `mix` is a blank string(""), `mix` will create a Document Fragment instead.

In this initialization function, it bind and click event to the H1 element and set the innerText of it.

`mix` accepts one or more objects which properties would be copied to the element. For example:

    var h2 = mix("h2", {innerText: "abc"}, {colored: true}, function () {
        // initfn, but do nothing
    });

or

    var h2 = mix("h2", function () {
        // initfn, but do nothing
    }, {innerText: "abc"}, {colored: true});

Objects could be put before initialization function or after it.

Those two function `h2` both can create H2 element which innerText would be set to "abc" and `colored` property of the element/node as `true`.

Mixing function which returned by `mix` function can be invoked in two way:

Invoke it as a normal function or invoke it as a constructor. 

Both of them return an 'initialized' DOM element, and `this` in the initialization function point to the DOM node created by markless.

But there is difference between these 2 method:

For constructor invokement, properties of objects passed to `mix` will be bind to the prototype of the constructor function. Actually, this is always done when define a mixing function.

The instance created by constructor invokement will be set to `_mix` property on the DOM element returned. So, if we want to access the `colored` property, we will write code:

    var ih2 = new h2();
    console.log(ih2._mix.colored); // it print true
    console.log(ih2._mix.innerText): // it print abc
    console.log(ih2.innerText === ""); // it print true
    console.log(ih2 === ih2._mix.node): // it print true

markless.extendPesudo
========

Markess use pesudoclass to shortern long attribute expression. For example:

    markless("input:text");
    markless("input type='text'");

They are equivalent.

Markless provide a function by using which, you can define your own shortcut:

    markless.extendPesudo('css', 'type', 'text/css');
    var style = markless('style:css');
    /* style.outerHTML -> '<style type="text/css"></style>' */

There is another way to put more pesudo classes at one time:

    markless.extendPesudo({'css': ['type', 'text/css'], 'js': ['type', 'text/javascript']});

