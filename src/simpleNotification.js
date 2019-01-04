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
        let wrapper = document.createElement("div");
        wrapper.className = "gn-wrapper gn-" + position;
        fragment.appendChild(wrapper);
        document.body.appendChild(fragment);
        SimpleNotification.wrappers[position] = wrapper;
    }

    /**
     * Transform a text with tags to a DOM Tree
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
                    // Add the found tag to the list
                    specialNodes.push({
                        type: tagName,
                        content: text.substring(foundOpenPos, foundClosePos)
                    });
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
                    // Set an attribute is 'set' is defined
                    if (tagInfo.set != undefined) {
                        tag.setAttribute(tagInfo.set, specialNode.content);
                    }
                    tag.textContent = specialNode.content;
                    // Set a class if defined
                    tag.className = tagInfo.class || "";
                    node.appendChild(tag);
                }
            }
        } else {
            node.textContent = text;
        }
    }

    /**
     * Add the class "gn-extinguish" to the event target
     * Used in create() and destroy() to be able to remove the eventListener.
     * @param {object} event The fired event
     */
    static addExtinguish(event) {
        event.target.lastElementChild.classList.add("gn-extinguish");
    }

    /**
     * Remove the class "gn-extinguish" to the event target
     * Used in create() and destroy() to be able to remove the eventListener.
     * @param {object} event The fired event
     */
    static removeExtinguish(event) {
        event.target.lastElementChild.classList.remove("gn-extinguish");
    }

    /**
     * Create and append a notification
     * Options: duration, fadeout, position, image
     * @param {array} classes Array of classes to add to the notification
     * @param {string} text The title inside the notification
     * @param {string} text The text inside the notification
     * @param {object} options The options of the notifications
     */
    static create(classes, title, text, notificationOptions) {
        // Abort if empty
        if ((title == undefined || title == "") && (text == undefined || text == ""))
            return;
        // Merge options
        let options = Object.assign({}, SimpleNotification.default, notificationOptions);
        // Create wrapper if needed
        if (SimpleNotification.wrappers[options.position] == undefined) {
            SimpleNotification.makeWrapper(options.position);
        }
        // Create the notification
        let fragment = document.createDocumentFragment();
        let notification = document.createElement("div");
        // Events
        // Delete the notification on click
        notification.addEventListener("click", () => {
            SimpleNotification.destroy(notification, 0);
        });
        // Pause on hover if not sticky
        if (!options.sticky) {
            notification.addEventListener("mouseenter", SimpleNotification.removeExtinguish);
            notification.addEventListener("mouseleave", SimpleNotification.addExtinguish);
        }
        // Apply Style
        notification.className = "gn-notification";
        classes.forEach(element => {
            notification.classList.add(element);
        });
        // Add elements
        if (title != undefined && title != "") {
            let notificationTitle = document.createElement("h1");
            notificationTitle.textContent = title;
            notification.appendChild(notificationTitle);
        }
        let hasImage = options.image != undefined && options.image != "";
        let hasText = text != undefined && text != "";
        if (hasImage || hasText) {
            let notificationContent = document.createElement("div");
            notificationContent.className = "gn-content";
            if (hasImage) {
                let notificationImage = document.createElement("img");
                notificationImage.src = options.image;
                notificationContent.appendChild(notificationImage);
            }
            if (hasText) {
                let notificationText = document.createElement("p");
                SimpleNotification.treeFromText(notificationText, text);
                notificationContent.appendChild(notificationText);
            }
            notification.appendChild(notificationContent);
        }
        // Add progress bar if not sticky
        let notificationLife;
        if (options.sticky == undefined || options.sticky == false) {
            notificationLife = document.createElement("span");
            notificationLife.className = "gn-lifespan";
            // Set the time before removing the notification
            notificationLife.style.animationDuration = options.duration + "ms";
            if (document.hasFocus()) {
                notificationLife.classList.add("gn-extinguish");
            } else {
                let addExtinguish = () => {
                    notificationLife.classList.add("gn-extinguish");
                    document.removeEventListener("focus", addExtinguish);
                };
                document.addEventListener("focus", addExtinguish);
            }
            // Destroy the notification when the animation end
            notificationLife.addEventListener("animationend", event => {
                if (event.animationName == "shorten") {
                    SimpleNotification.destroy(notification, options.fadeout);
                }
            });
            notification.appendChild(notificationLife);
        }
        // Display
        fragment.appendChild(notification);
        SimpleNotification.wrappers[options.position].appendChild(fragment);
    }

    /**
     * Add a tag for the treeFromText function
     * @param {string} name The name of the tag
     * @param {object} object The values of the tag
     */
    static addTag(name, object) {
        SimpleNotification.tags[name] = object;
    }

    /**
     * Remove a notification from the screen
     * @param {object} notification The notification to remove
     */
    static destroy(notification, fadeout) {
        if (fadeout == 0) {
            notification.parentElement.removeChild(notification);
        }
        // Remove the timer animation
        notification.removeEventListener("mouseenter", SimpleNotification.removeExtinguish);
        notification.removeEventListener("mouseleave", SimpleNotification.addExtinguish);
        // Add the fadeout animation
        notification.style.animationDuration = fadeout + "ms";
        notification.classList.add("gn-fadeout");
        // Pause and reset fadeout on hover
        notification.addEventListener("mouseenter", event => {
            event.target.classList.remove("gn-fadeout");
        });
        notification.addEventListener("mouseleave", event => {
            event.target.classList.add("gn-fadeout");
        });
        // When fadeout end, remove the node from the wrapper
        notification.addEventListener("animationend", event => {
            if (event.animationName == "fadeout") {
                notification.parentElement.removeChild(notification);
            }
        });
    }

    /**
     * Create a notification with the "success" style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {object} options Options used for the notification
     */
    static success(title, text, options = {}) {
        return SimpleNotification.create(["gn-success"], title, text, options);
    }

    /**
     * Create a notification with the "info" style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {object} options Options used for the notification
     */
    static info(title, text, options = {}) {
        return SimpleNotification.create(["gn-info"], title, text, options);
    }

    /**
     * Create a notification with the "error" style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {object} options Options used for the notification
     */
    static error(title, text, options = {}) {
        return SimpleNotification.create(["gn-error"], title, text, options);
    }

    /**
     * Create a notification with the "warning" style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {object} options Options used for the notification
     */
    static warning(title, text, options = {}) {
        return SimpleNotification.create(["gn-warning"], title, text, options);
    }

    /**
     * Create a notification with the "message" style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {object} options Options used for the notification
     */
    static message(title, text, options = {}) {
        return SimpleNotification.create(["gn-message"], title, text, options);
    }

    /**
     * Make a notification with custom classes
     * @param {array} classes The classes of the notification
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {object} options Options used for the notification
     */
    static custom(classes, title, text, options) {
        return SimpleNotification.create(classes, title, text, options);
    }
}
SimpleNotification.wrappers = {};
SimpleNotification.default = {
    image: undefined,
    position: "top-right",
    duration: 4000,
    fadeout: 750,
    sticky: false
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
        open: '##',
        close: "\n"
    },
    header2: {
        type: 'h2',
        class: 'gn-header',
        open: '#',
        close: "\n"
    },
    link: {
        type: 'a',
        set: 'href',
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