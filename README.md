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


Markmore
========

Markless comes with an extended edition of it: Markmore.

The difference between them is simple and straight. Markless is a 'single line' edition of markmore. While Markless could only create limited elements in a single line expression. Markmore could create much more structured elements.

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

    var docFrag = markless.markmore(document.getElementById('input-1').value);

This piece of code reperesents HTML/DOM:

    <div id="topics" class="topic-list">
      <h1>Hello, world</h1>
      <p>This is a <strong>paragraphy</strong>.</p>
      <p>This is another paragraphy. In here, you can type " and ' with no need to escape it.
    And, it's multi-line.</p>

    </div>

More details and manual about markless/markmore, please read wiki.

