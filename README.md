HTML is urgly. Use Markless.

Markless
========

Another way to create HTML/XML/DOM.

Everytime I open a text editor and want to edit a new html page, I feel uncomfortable.
Html is easy to edit, with a pure text edit. However, it is still not convienient to be edited. I must care the match of start/end tag, type infinite less than/great than marks. Also, I must care the indention, which is important to make codes readable.
One day, I got an idea. Why HTML/XML cannot be formatted with the levels be expressed in indention? Yes, they can, I told myself. They would be much easier to edit and readable without start/end tag pairs, without less than/great than marks, just using indention to indicate levels/hierarchy, like Python.
So, I made markless. 

Markless aims to create HTML/XML/DOM using its own selector-like grammar with Python-like indention.

For example:

    div#topics.topic-list
      h1 "Hello, world"
      p "This is a " > strong "paragraphy"
        "."
      p
        """This is another paragraphy. In here, you can type " and ' with no need to escape it.
    And, it's multi-line.
        """

This piece of code reperesents HTML/DOM:

    <div id="topics" class="topic-list">
      <h1>Hello, world</h1>
      <p>This is a <strong>paragraphy</strong>.</p>
      <p>This is another paragraphy. In here, you can type " and ' with no need to escape it.
    And, it's multi-line.</p>

    </div>

Look, it's easier to read and edit, isn't it?

