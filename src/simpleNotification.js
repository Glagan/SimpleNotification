class SimpleNotification {
    /**
     * Set the default options of SimpleNotification
     * @param {object} options Options object to override the defaults
     */
    static options(options) {
        SimpleNotification.default = Object.assign({}, SimpleNotification.default, options);
    }

    /**
     * Create a wrapper and add it to the wrappers object
     * Valid default position: top-right, top-left, bottom-right, bottom-left
     * @param {string} position The position of the wrapper
     */
    static makeWrapper(position) {
        let fragment = document.createDocumentFragment();
        let wrapper = document.createElement('div');
        wrapper.className = 'gn-wrapper gn-' + position;
        fragment.appendChild(wrapper);
        document.body.appendChild(fragment);
        SimpleNotification.wrappers[position] = wrapper;
    }

    /**
     * Search the first occurence of the char occurence in text that doesn't have a \ prefix
     * @param {string} text The text where to search the char in
     * @param {string} char The string to search in the text
     * @param {integer} start The position to begin to search with
     */
    static firstUnbreakChar(text, char, start=0) {
        if (start < 0) start = 0;
        let foundPos;
        while (start >= 0) {
            foundPos = text.indexOf(char, start);
            if (foundPos > 0 && text[foundPos-1] == '\\') {
                start = foundPos+1;
            } else {
                start = -1;
            }
        }
        return foundPos;
    }

    /**
     * Transform a text with tags to a DOM Tree
     * {open}content{close} {open}{!|title:}content{close}
     * @param {object} notificationText The node where the text will be added
     * @param {string} text The text with tags
     */
    static treeFromText(node, text) {
        // Normalize linebreak
        text = text.replace(/(\r?\n|\r)/gm, '\n');
        // Find tokens
        let specialNodes = [];
        let specialCount = 0;
        Object.keys(SimpleNotification.tags).forEach(tagName => {
            let tag = SimpleNotification.tags[tagName];
            let lastTokenPos = 0;
            // Tag length
            let tagLength = {open: tag.open.length, close: tag.close.length};
            // Find strings that match tag
            let foundOpenPos, foundClosePos;
            while ((foundOpenPos = text.indexOf(tag.open, lastTokenPos)) > -1) {
                foundOpenPos += tagLength.open; // Add the tag length to the found position
                // Find the closing tag
                if ((foundClosePos = text.indexOf(tag.close, foundOpenPos)) > -1 && foundOpenPos != foundClosePos) {
                    let foundResult = {
                        type: tagName,
                        content: text.substring(foundOpenPos, foundClosePos)
                    };
                    // Search for title if tag can have one
                    if ('title' in tag && tag.title && foundResult.content.length > 0) {
                        if (foundResult.content[0] == '!') {
                            foundResult.content = foundResult.content.substring(1);
                        } else {
                            // find :
                            let foundTitleBreak = SimpleNotification.firstUnbreakChar(foundResult.content, ':');
                            foundResult.content = foundResult.content.replace('\\:', ':');
                            if (foundTitleBreak > -1) {
                                foundResult.title = foundResult.content.substring(0, foundTitleBreak);
                                foundResult.content = foundResult.content.substring(foundTitleBreak + 1);
                            }
                        }
                    }
                    // Add the found tag to the list
                    specialNodes.push(foundResult);
                    // Replace the string by a token \id\
                    // Remove the tagLength from foundOpenPos to capture the tag
                    // Add the tagLength to foundClosePos to also capture the tag
                    let newText = text.substring(0, foundOpenPos-tagLength.open) + '\\' + specialCount + '\\' + text.substring(foundClosePos+tagLength.close);
                    text = newText;
                    specialCount++;
                }
                // Update lastTokenPos to reduce the string length to search
                lastTokenPos = foundOpenPos;
            }
        });
        if (specialNodes.length > 0) {
            let parts = text.split(/\\(\d+)\\/);
            let lastPart = parts.length;
            for (let i = 0; i < lastPart; i++) {
                // even index is simple text
                if (i%2 == 0) {
                    node.appendChild(document.createTextNode(parts[i]));
                } else {
                    let specialNode = specialNodes[parseInt(parts[i])];
                    let tagInfo = SimpleNotification.tags[specialNode.type];
                    let tag = document.createElement(tagInfo.type);
                    // Set attributes
                    if ('attributes' in tagInfo) {
                        Object.keys(tagInfo.attributes).forEach(attributeName => {
                            let attributeValue = tagInfo.attributes[attributeName]
                                .replace('$content', specialNode.content)
                                .replace('$title', ('title' in specialNode) ? specialNode.title : specialNode.content);
                            tag.setAttribute(attributeName, attributeValue);
                        });
                    }
                    // Text content based on tagInfo.textcontent
                    let textContent = undefined;
                    if ('textContent' in tagInfo) {
                        textContent = tagInfo.textContent
                            .replace('$content', specialNode.content)
                            .replace('$title', ('title' in specialNode) ? specialNode.title : specialNode.content);
                    } else {
                        textContent = specialNode.content;
                    }
                    tag.textContent = textContent;
                    // Set a class if defined
                    tag.className = tagInfo.class || '';
                    node.appendChild(tag);
                }
            }
        } else {
            node.textContent = text;
        }
    }

    /**
     * Add the class 'gn-extinguish' to the event target
     * Used in create() and startFadeout() to be able to remove the eventListener.
     * @param {object} event The fired event
     */
    static addExtinguish(event) {
        event.target.lastElementChild.classList.add('gn-extinguish');
    }

    /**
     * Remove the class 'gn-extinguish' to the event target
     * Used in create() and startFadeout() to be able to remove the eventListener.
     * @param {object} event The fired event
     */
    static removeExtinguish(event) {
        event.target.lastElementChild.classList.remove('gn-extinguish');
    }

    /**
     * Create and append a notification
     * Options: duration, fadeout, position, image
     * @param {array} classes Array of classes to add to the notification
     * @param {string} title The title inside the notification
     * @param {string} text The text inside the notification
     * @param {string} image Image to be displayed in the notification
     * @param {object} options The options of the notifications
     */
    static create(classes, title=undefined, text=undefined, image=undefined, notificationOptions={}) {
        let hasImage = (image != undefined && image != ''),
            hasText = (text != undefined && text != ''),
            hasTitle = (title != undefined && title != '');
        // Abort if empty
        if (!hasImage && !hasTitle && !hasText) return;
        // Merge options
        let options = Object.assign({}, SimpleNotification.default, notificationOptions);
        // If there is nothing to close a notification we force the close button
        options.closeButton = (!options.closeOnClick && options.sticky) ? true : options.closeButton;
        // Create wrapper if needed
        if (!(options.position in SimpleNotification.wrappers)) {
            SimpleNotification.makeWrapper(options.position);
        }
        // Create the notification
        let fragment = document.createDocumentFragment();
        let notification = document.createElement('div');
        // Apply Style
        notification.className = 'gn-notification gn-insert';
        classes.forEach(element => {
            notification.classList.add(element);
        });
        // Events
        // Delete the notification on click
        if (options.closeOnClick) {
            notification.classList.add('gn-close-on-click');
            notification.addEventListener('click', () => {
                notification.remove();
            });
        }
        // Pause on hover if not sticky
        if (!options.sticky) {
            notification.addEventListener('mouseenter', SimpleNotification.removeExtinguish);
            notification.addEventListener('mouseleave', SimpleNotification.addExtinguish);
        }
        // Add elements
        if (hasTitle) {
            let notificationTitle = document.createElement('h1');
            notificationTitle.title = title;
            notificationTitle.textContent = title;
            notification.appendChild(notificationTitle);
        }
        if (options.closeButton) {
            let closeButton = document.createElement('span');
            closeButton.className = 'gn-close';
            closeButton.textContent = '\u274C';
            closeButton.addEventListener('click', () => {
                notification.remove();
            });
            if (hasTitle) {
                closeButton.classList.add("gn-close-title");
                notification.firstElementChild.appendChild(closeButton);
            } else {
                notification.insertBefore(closeButton, notification.firstChild);
            }
        }
        if (hasImage || hasText) {
            let notificationContent = document.createElement('div');
            notificationContent.className = 'gn-content';
            if (hasImage) {
                let notificationImage = document.createElement('img');
                notificationImage.src = image;
                notificationContent.appendChild(notificationImage);
            }
            if (hasText) {
                let notificationText = document.createElement('p');
                SimpleNotification.treeFromText(notificationText, text);
                notificationContent.appendChild(notificationText);
            }
            notification.appendChild(notificationContent);
        }
        // Add progress bar if not sticky
        if (!options.sticky) {
            let notificationLife = document.createElement('span');
            notificationLife.className = 'gn-lifespan';
            // Destroy the notification when the animation end
            let startFadeoutAfterShorten = event => {
                if (event.animationName == 'shorten') {
                    SimpleNotification.startFadeout(notification, options.fadeout);
                    notificationLife.removeEventListener('animationend', startFadeoutAfterShorten);
                }
            };
            notificationLife.addEventListener('animationend', startFadeoutAfterShorten);
            // Put the extinguish in a event listener to start when insert animation is done
            let startOnInsertFinish = event => {
                if (event.animationName == 'insert-left' || event.animationName == 'insert-right') {
                    // Set the time before removing the notification
                    notificationLife.style.animationDuration = [options.duration, 'ms'].join('');
                    if (document.hasFocus()) {
                        notificationLife.classList.add('gn-extinguish');
                    } else {
                        // Start the extinguish animation only when the page is focused
                        let addFocusExtinguish = () => {
                            notificationLife.classList.add('gn-extinguish');
                            document.removeEventListener('focus', addFocusExtinguish);
                        };
                        document.addEventListener('focus', addFocusExtinguish);
                    }
                    // Remove event and style of insert
                    notification.classList.remove('gn-insert');
                    notification.removeEventListener('animationend', startOnInsertFinish);
                }
            };
            notification.addEventListener('animationend', startOnInsertFinish);
            // When fadeout end, remove the node from the wrapper
            notification.addEventListener('animationend', event => {
                if (event.animationName == 'fadeout') {
                    notification.remove();
                }
            });
            notification.appendChild(notificationLife);
        }
        // Display
        fragment.appendChild(notification);
        SimpleNotification.wrappers[options.position].appendChild(fragment);
    }

    /**
     * Remove reset events and add the fadeout animation
     * @param {object} notification The notification to remove
     * @param {integer} fadeoutTime The duration of the fadeout animation
     */
    static startFadeout(notification, fadeoutTime) {
        // Remove the timer animation
        notification.removeEventListener('mouseenter', SimpleNotification.removeExtinguish);
        notification.removeEventListener('mouseleave', SimpleNotification.addExtinguish);
        // Add the fadeout animation
        notification.style.animationDuration = [fadeoutTime, 'ms'].join('');
        notification.classList.add('gn-fadeout');
        // Pause and reset fadeout on hover
        notification.addEventListener('mouseenter', event => {
            event.target.classList.remove('gn-fadeout');
        });
        notification.addEventListener('mouseleave', event => {
            event.target.classList.add('gn-fadeout');
        });
    }

    /**
     * Create a notification with the 'success' style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {string} image Image to be displayed in the notification
     * @param {object} options Options used for the notification
     */
    static success(title=undefined, text=undefined, image=undefined, options = {}) {
        return SimpleNotification.create(['gn-success'], title, text, image, options);
    }

    /**
     * Create a notification with the 'info' style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {string} image Image to be displayed in the notification
     * @param {object} options Options used for the notification
     */
    static info(title=undefined, text=undefined, image=undefined, options = {}) {
        return SimpleNotification.create(['gn-info'], title, text, image, options);
    }

    /**
     * Create a notification with the 'error' style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {string} image Image to be displayed in the notification
     * @param {object} options Options used for the notification
     */
    static error(title=undefined, text=undefined, image=undefined, options = {}) {
        return SimpleNotification.create(['gn-error'], title, text, image, options);
    }

    /**
     * Create a notification with the 'warning' style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {string} image Image to be displayed in the notification
     * @param {object} options Options used for the notification
     */
    static warning(title=undefined, text=undefined, image=undefined, options = {}) {
        return SimpleNotification.create(['gn-warning'], title, text, image, options);
    }

    /**
     * Create a notification with the 'message' style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {string} image Image to be displayed in the notification
     * @param {object} options Options used for the notification
     */
    static message(title=undefined, text=undefined, image=undefined, options = {}) {
        return SimpleNotification.create(['gn-message'], title, text, image, options);
    }

    /**
     * Make a notification with custom classes
     * @param {array} classes The classes of the notification
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {string} image Image to be displayed in the notification
     * @param {object} options Options used for the notification
     */
    static custom(classes, title=undefined, text=undefined, image=undefined, options = {}) {
        return SimpleNotification.create(classes, title, text, image, options);
    }

    /**
     * Add a tag for the treeFromText function
     * @param {string} name The name of the tag
     * @param {object} object The values of the tag
     */
    static addTag(name, object) {
        SimpleNotification.tags[name] = object;
    }
}
SimpleNotification.wrappers = {};
SimpleNotification.default = {
    position: 'top-right',
    closeOnClick: true,
    closeButton: true,
    duration: 4000,
    fadeout: 750,
    sticky: false,
};
SimpleNotification.tags = {
    code: {
        type: 'code',
        class: 'gn-code',
        open: '``',
        close: '``'
    },
    header3: {
        type: 'h3',
        class: 'gn-header',
        open: '## ',
        close: '\n'
    },
    header2: {
        type: 'h2',
        class: 'gn-header',
        open: '# ',
        close: '\n'
    },
    link: {
        type: 'a',
        title: true,
        attributes: {
            'href': '$content',
            'target': 'blank',
        },
        textContent: '$title',
        open: '{{',
        close: '}}'
    },
    bold: {
        type: 'span',
        class: 'gn-bold',
        open: '**',
        close: '**'
    },
    italic: {
        type: 'span',
        class: 'gn-italic',
        open: '*',
        close: '*'
    },
};