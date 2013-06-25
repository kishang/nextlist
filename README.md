#Nextlist - Easy Nextweb synchronization for jQuery UI Sortable

Nexlist is a jQuery plug-in that makes it incredibly easy to make your jQuery UI Sortable lists synchronized with Nextweb. It was designed to be easy to use and flexible.

##Licensing

Nextlist is licensed under the [MIT license](https://github.com/kishang/test-nextlist/blob/master/MIT-LICENSE.txt).

##Demos

* [Basic Demo](http://slicnet.com/contact/contact/apps/textsync/files/nextlist-basic-demo.value.html) - Basic usage
* [Advanced Demo](http://slicnet.com/contact/contact/apps/textsync/files/nextlist-advanced-demo.value.html) - Connected lists
* [To-Do List Demo](http://slicnet.com/contact/contact/apps/textsync/files/nextlist-to-do-list-demo.value.html) - Connected lists and extending Nextlist

##Getting Started

Using Nextlist on your jQuery UI Sortable list is extremely easy. Just include the jquery.nextlist.js file in your HTML page, create a &lt;ul&gt; or &lt;ol&gt; element and add the following code:

```javascript
$('ul#yourList').sortable().nextlist({
    nextwebNodeAddress: '<node address>',
    nextwebNodeSecret: '<node secret>'
});
```

Simple as that!

See the following sections to know about Nextlist [dependencies](#dependencies), [usage](#usage), [options](#options), [methods](#methods), [events](#events) and [debugging](#debugging). The [Under The Hood](#under-the-hood) section briefly explains how Nextlist works.

##Dependencies

The following JavaScript libraries are required by Nextlist

* jQuery
* jQuery UI Sortable
* The Nextweb JavaScript client

##Usage

Nextlist was designed to be versatile, and hence, can be used in a number of ways. Check out the [demos](#demos) for usage examples.

###Setting Up jQuery UI Sortable And Nextlist Separately

Although the Getting Started section shows jQuery UI Sortable and Nextlist being set up in one statement, you are free to set up Nextlist whenever you want to. Just be sure to set up jQuery UI Sortable first.

###Customizing jQuery UI Sortable

You are free to customize jQuery UI Sortable and bind to its event. You can even use other plug-ins that interact with jQuery UI Sortable. Nextlist tries not to interfere with third-party plug-ins.

###Using Nextlist For Multiple Lists

Nextlist was designed to work with any number of lists. You can use it for a single list, selectively use it for some lists or use it for all the lists in your page. Lists that don't use Nextlist are unaffected by it.

Keep in mind that Nextlist must be set up separately for each list. Setting up multiple lists in a single statement does not work. Only the first list in your selection would be used. This is because it doesn't make sense for multiple lists to use the same Nextweb node.

For example, the following code does __not__ work as you might expect:
```javascript
$('ul#firstList, ul#secondList, ul.myLists').nextlist({ /* options */ });
```

This is the correct way to set up Nextlist for multiple lists:
```javascript
$('ul#firstList').nextlist({ /* options */ });
$('ul#secondList').nextlist({ /* options */ });
// ...
```

###Connected Lists

Nextlist fully supports jQuery UI Sortable's ```connectWith``` option, as long as both the source list and the destination list use Nextlist.

##Options

###Required

Option | Description
--- | ---
nextwebNodeAddress | The URI of the Nextweb node representing the list. Use the [seed()](http://nextweb.io/docs/nextweb-seed.value.html) operation to create one.
nextwebNodeSecret | The Nextweb node secret

###Optional

Option | Default Value | Description
--- | :---: | ---
nextwebSession | - | The Nextweb Session object to use.<br>If a session is not specified, Nextlist creates one automatically with `Nextweb.createSession()`.
autoStartMonitoring | `true` | If set to `true`, Nextlist automatically monitors the Nextweb node for changes.<br>If changes are detected, the list is updated accordingly.
nextwebMonitorInterval | `'FAST'` | Nextweb monitoring interval. Refer the [API documentation](http://nextweb.io/docs/nextweb-monitor.value.html) for the full list of accepted values.<br> Note that Nextlist does not validate this setting and passes the value directly to Nextweb.
listItemClassName | `'ui-state-default'` | The CSS class to be added to &lt;li&gt; elements.
listItemPrefix | `''` | HTML to be inserted before the item text. Useful for jQuery UI icons.<br>Do not pass DOM nodes or jQuery objects. Only a string with HTML and/or text is accepted.
listItemSuffix | `''` | HTML to be inserted after the item text.<br>Do not pass DOM nodes or jQuery objects. Only a string with HTML and/or text is accepted.

##Methods

* <h3><code>nextlist('load', address, secret)</code></h3>

    Removes any existing items from the list and loads items from the specified node address. Subsequently, Nextlist will use the specified node for all operations.

* <h3><code>nextlist('reload')</code></h3>

    Reloads the list from Nextweb.

* <h3><code>nextlist('startMonitor', [interval])</code></h3>

    Starts monitoring for changes to the Nextweb node. Not required if [autoStartMonitoring](#optional) has been enabled.
    
	If the `interval` parameter is omitted, Nextlist uses the value used in the previous call, if any, or the value of the `nextwebMonitorInterval` configuration option.

    The `interval` parameter can have any of the values listed in the [API documentation](http://nextweb.io/docs/nextweb-monitor.value.html). Nextlist does not check the value, so watch out for exceptions thrown by Nextweb if your value is not valid!

* <h3><code>nextlist('stopMonitor')</code></h3>

    Stops monitoring for changes to the Nextweb node.

* <h3><code>nextlist('getSession')</code></h3>

    Returns the Nextweb Session object being used for the list.

##Events

Nextweb fires the following events on the list element (&lt;ul&gt; or &lt;ol&gt;) concerned.

* <h3><code>nextlist.change</code></h3>

    Indicates that changes have been made to the list and those changes are not yet saved on Nextweb.

* <h3><code>nextlist.commit</code></h3>

    Indicates that all pending changes have been committed to Nextweb.

Since ```nextlist.commit``` is only fired when all pending changes have been committed, you may sometimes see multiple ```nextlist.change``` events followed by a single ```nextlist.commit``` event.

##Debugging

By default, Nextlist does not throw any `Error`s by itself. If Nextlist encounters a problem, it simply stops the current operation silently. To make problems more easily detectable, especially while testing, you can enable debug mode with a single line of code:

```javascript
$.fn.nextlist.debugMode = true;
```

This tells Nextlist that you want it to throw an `Error` via `jQuery.error()` if needed.

Note that jQuery, jQuery UI, Nextweb and other JavaScript libraries in your page are *not* affected by this.

##Under The Hood

If you are interested in the inner workings of Nextlist, you are encouraged to take a look at the code in `jquery.nextlist.js`.

For quick reference, here's a brief explanation of things that might concern a JavaScript developer.

###Integration With jQuery UI Sortable

Nextlist binds to the `sortstart`, `sortstop` and `sortreceive` events of jQuery UI Sortable. Other than this, the only other direct interaction that Nextlist has with jQuery UI Sortable is calling the `sortable('refresh')` method when new items are added to a list. This is why Nextlist can be safely used with jQuery UI and other libraries/plug-ins.

###List Items

Nextlist uses the following template to create &lt;li&gt; elements for list items:

```HTML
<li class="[listItemClassName]">[listItemPrefix]<span class="nextlist-item-text">[Item text]</span>[listItemSuffix]</li>
```

Nextlist does not store a copy of the item's text. It simply reads the text from the DOM using `jQuery.text()`. Because of this, a &lt;span&gt; element is used, to allow you to customize list items without interfering with Nextlist's functions.

###Data Storage

Using `jQuery.data()`, Nextlist stores all relevant list data in the &lt;ul&gt; or &lt;ol&gt; element concerned and list item data in the &lt;li&gt; element concerned.

###Namespacing

Nextlist does not pollute the global JavaScript namespace. Its code resides in `jQuery.fn.nextlist`.

Additionally, all of Nextlist's data and events use the prefix "nextlist." to avoid conflict with other code.
