/*!
 * Nextlist v0.1
 * https://github.com/kishang/nextlist
 *
 * Copyright 2013, Kishan Gupta
 * Licensed under the MIT license.
 * https://github.com/kishang/nextlist#licensing
 *
 */

/* --- Options for JSHint (compatible with JSLint) --- */

/*jslint sloppy: true */ // ASP.NET's JS framework doesn't like strict mode (http://bugs.jquery.com/ticket/13335)
/*jslint plusplus: true */
/*global jQuery, Nextweb */

/* --- Plug-in code starts here --- */

(function ($, undef) {

    /* Strict mode disabled for reasons explained above */
    //"use strict";

    /* --- Private Variables --- */

    var defaults = {

        nextwebSession: null,
        nextwebNodeAddress: null,
        nextwebNodeSecret: null,
        autoStartMonitoring: true,
        nextwebMonitorInterval: 'FAST',
        listItemClassName: 'ui-state-default',
        listItemPrefix: '',
        listItemSuffix: ''
    },

        // Container for public plug-in methods
        methods = {};

    /* --- Private Methods --- */
    // No checks are performed for illegal arguments, etc., since these methods are used internally

    /* Simple function to handle errors */
    function throwError(message) {

        // Ask jQuery to throw an error if debug mode in enabled
        if ($.fn.nextlist.debugMode) {
            $.error('Nextlist: ' + message);
        }
    }

    /* Adds an item to a list */
    function addItem(item, $list, position) {
        var settings = $list.data('nextlist.settings'),
            $li = $($.parseHTML('<li>')),
            $itemText = $($.parseHTML('<span class="nextlist-item-text">'));

        // Store the Nextweb Node object
        $li.data('nextlist.nextwebNode', item);

        // Add a class name if required
        $li.addClass(settings.listItemClassName);

        // Add the prefix
        if (settings.listItemPrefix) {
            $li.append($.parseHTML(settings.listItemPrefix));
        }

        // Add the item text

        $itemText.text(item.getValue());
        $li.append($itemText);

        // Add the suffix
        if (settings.listItemSuffix) {
            $li.append($.parseHTML(settings.listItemsuffix));
        }

        // If a position is specified, add the item at that position.
        // Else, add it to the end of the list

        if (position !== undef) {
            $list.children().eq(position).before($li);
        } else {
            $list.append($li);
        }
    }

    /* Commits changes made to a list and fires the following events -
       1) nextlist.change - Fired immediately, indicating that unsaved changes have been made
       2) nextlist.commit - Fired when all changes have been saved */
    function commitChanges($list, callback) {
        var nPendingChanges = $list.data('nextlist.nPendingChanges') || 0;

        nPendingChanges++;
        $list.data('nextlist.nPendingChanges', nPendingChanges);

        // Fire change event
        $list.trigger('nextlist.change');

        $list.data('nextlist.settings').nextwebSession.commit().get(function () {
            // Get the number of pending changes again, since more changes might have been made
            var nPendingChanges = $list.data('nextlist.nPendingChanges') || 0;

            nPendingChanges--;
            $list.data('nextlist.nPendingChanges', Math.max(nPendingChanges, 0));

            if (nPendingChanges <= 0) {
                // Fire commit event if there are absolutely no pending changes
                $list.trigger('nextlist.commit');

                // Refresh the list in case another user made changes
                refreshItems($list);
            }

            if (callback !== undef && $.isFunction(callback)) {
                callback.call($list);
            }
        });
    }


    /* Inserts an item into Nextweb. Changes are _not_ committed automatically */
    function insertNode(text, position, parentNode, session) {
        var seed = session.seed();

        seed.setValue(text);
        parentNode.insert(seed, position);

        return seed;
    }

    /* Refreshes jQuery UI Sortable to make any newly added items sortable */
    function refreshUISortable($list) {
        $list.sortable('refresh');
    }

    /* Removes any existing list items and adds list items fetched from Nextweb */
    function refreshItems($list, callback) {
        var settings = $list.data('nextlist.settings');

        // Fetch the Nextweb node representing the list
        settings.nextwebSession.node(settings.nextwebNodeAddress, settings.nextwebNodeSecret).get(function (node) {

            // Store the Node object
            $list.data('nextlist.nextwebNode', node);

            // Get all items and add them to the list
            node.selectAll().get(function (itemList) {
                $list.empty();

                itemList.each(function (item) {
                    addItem(item, $list);
                });

                refreshUISortable($list);

                if (callback !== undef && $.isFunction(callback)) {
                    callback.call($list);
                }
            });
        });
    }

    /* Starts monitoring for changes */
    function enableMonitoring($list, interval) {
        var settings = $list.data('nextlist.settings'),
            monitor;

        // If there is already an active monitor, disable it
        if ($list.data('nextlist.nextwebNode')) {
            disableMonitoring($list);
        }

        // Make a new Nextweb monitor

        monitor = $list.data('nextlist.nextwebNode').monitor();

        monitor.addListener(function () {

            // Refresh the list if no other changes are pending
            if ($list.data('nextlist.nPendingChanges') <= 0) {
                refreshItems($list);
            }
        });

        // If an interval has been specified, store that value. Else, load the pervious value

        if (interval !== undef) {
            settings.nextwebMonitorInterval = interval;
            $list.data('nextlist.settings', settings);
        } else {
            interval = settings.nextwebMonitorInterval;
        }

        monitor.setInterval(interval);

        monitor.get(function (m) {

            // Store the monitor
            $list.data('nextlist.nextwebMonitor', m);
        });
    }

    /* Disables monitoring for changes */
    function disableMonitoring($list) {
        var monitor = $list.data('nextlist.nextwebMonitor');

        // If a monitor has been set up, stop it

        if (monitor) {
            $list.data('nextlist.nextwebMonitor', false);

            monitor.stop().get();
        }
    }

    /* --- Public Methods --- */

    // These methods are invoked in the context of the list concerned, i.e.,
    // "this" inside these methods would point to a jQuery object that
    // references the <ul> or <ol> element concerned

    /* Removes any existing list items and adds list items from the specified Nextweb node */
    methods.load = function (address, secret) {
        var settings;

        if (!address) {
            throwError('Invalid Nextweb node address specified');
            return;
        }

        if (!secret) {
            throwError('Invalid Nextweb node secret specified');
            return;
        }

        // Get the settings object, modify it as needed and store it back

        settings = this.data('nextweb.settings');
        settings.nextwebNodeAddress = address;
        settings.nextwebNodeSecret = secret;
        this.data('nextweb.settings', settings);

        refreshItems(this);

        // If a monitor has been set, remove it and set up a new one
        if (this.data('nextlist.nextwebMonitor')) {
            disableMonitoring(this);
            enableMonitoring(this);
        }
    };

    /* Reloads items from Nextweb */
    methods.reload = function () {
        refreshItems(this);
    };

    /* Returns the Nextweb session object being used */
    methods.getSession = function () {
        return this.data('nextlist.settings').nextwebSession;
    };

    /* Enables regular monitoring for changes */
    methods.startMonitor = function (interval) {
        enableMonitoring(this, interval);
    };

    /* Disables regular monitoring for changes */
    methods.stopMonitor = function () {
        disableMonitoring(this);
    };

    /* --- Plug-in Declaration --- */

    $.fn.nextlist = function (optionsOrMethod) {
        var settings,

            // Only apply the plug-in to the first element, and only if it a <ul> or an <ol> element
            $list = this.eq(0).filter('ul:data(ui-sortable), ol:data(ui-sortable)');

        if (!$list.length) {
            throwError('Invalid selection. The first element must be either an <ul> or an <ol> element and must have jQuery UI Sortable initialized');
            return;
        }

        if (methods[optionsOrMethod]) {

            if (!$list.data('nextlist.settings')) {
                throwError('Cannot invoke method before Nextlist initialization');
                return;
            }

            // Invoke the public plug-in method using all but the first argument
            // (which contains the name of the method itself)
            return methods[optionsOrMethod].apply($list, Array.prototype.slice.call(arguments, 1));
        }

        if ($list.data('nextlist.settings')) {
            throwError('Nextlist has already been initialized for this element');
            return;
        }

        // Merge options and defaults
        settings = $.extend({}, defaults, optionsOrMethod);

        if (!settings.nextwebSession && (!Nextweb || !Nextweb.createSession)) {
            throwError('Nextweb object not found');
        } else if (settings.nextwebSession && !settings.nextwebSession.seed) {
            throwError('A valid Nextweb session was not sepcified');
        } else if ($.fn.sortable === undef) {
            throwError('jQuery UI Sortable is not available');
        } else if (!settings.nextwebNodeAddress) {
            throwError('A valid Nextweb node address was not specified');
        } else if (!settings.nextwebNodeSecret) {
            throwError('A valid Nextweb node secret was not specified');
        } else {
            if (!settings.nextwebSession) {
                settings.nextwebSession = Nextweb.createSession();
            }

            $list.data({
                'nextlist.settings': settings,
                'nextlist.nPendingChanges': 0
            });

            refreshItems($list, function () {
                if (settings.autoStartMonitoring) {
                    enableMonitoring($list);
                }
            });

            // Set up event handlers

            $list.on({

                // "sortstart" is fired when the user starts dragging an item

                sortstart: function (event, ui) {
                    ui.item.data({

                        // The original list to which the item belongs
                        // (used when moving items from one list to another)
                        'nextlist.originalParent': ui.item.parents('ul').get(0),

                        // The position of the item in the list
                        'nextlist.originalIndex': ui.item.index()
                    });
                },

                // "sortstop" is fired when the user drops an item into the list

                sortstop: function (event, ui) {

                    // Make sure the item didn't come from another list
                    // (the "sortreceive" event handler handles connected lists)
                    if (ui.item.data('nextlist.originalParent') === ui.item.parents('ul').get(0)) {
                        var parentNode = $list.data('nextlist.nextwebNode'),
                            newNode;

                        // Don't do anything if the position didn't change
                        if (ui.item.data('nextlist.originalIndex') === ui.item.index()) {
                            return;
                        }

                        parentNode.shield().remove(ui.item.data('nextlist.nextwebNode'));

                        newNode = insertNode(ui.item.find('span.nextlist-item-text').text(), ui.item.index(), parentNode, $list.data('nextlist.settings').nextwebSession);

                        commitChanges($list, function () {

                            // Store the new Nextweb Node object
                            ui.item.data('nextlist.nextwebNode', newNode.get());
                        });
                    }
                },

                // "sortremove" is fired when the user drops an item from
                // this list into another one

                sortremove: function (event, ui) {
                    if (!$(ui.item.parents('ul').get(0)).data('nextlist.settings')) {
                        throwError('Nextlist has not been initialized for the destination list');
                    }
                },

                // "sortreceive" is fired when the user drops an item from
                // another list into this one

                sortreceive: function (event, ui) {
                    // Note: $list inside this function refers to the
                    // destination list that the item was moved into

                    var $originalList = $(ui.item.data('nextlist.originalParent')),
                        newNode;

                    if (!$originalList.data('nextlist.settings')) {
                        throwError('Nextlist has not been initialized for the source list');
                        return;
                    }

                    $originalList.data('nextlist.nextwebNode').remove(ui.item.data('nextlist.nextwebNode'));

                    newNode = insertNode(ui.item.find('span.nextlist-item-text').text(), ui.item.index(), $list.data('nextlist.nextwebNode'), $list.data('nextlist.settings').nextwebSession);

                    commitChanges($originalList);

                    commitChanges($list, function () {

                        // Store the new Nextweb Node object
                        ui.item.data('nextlist.nextwebNode', newNode.get());
                    });
                }
            });
        }

        // Return the current selection to support chainability
        return this;
    };

    /* --- Public Settings --- */

    // Errors are silenced if set to false
    $.fn.nextlist.debugMode = false;
}(jQuery));
