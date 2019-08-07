class SimpleNotification {
    constructor(events) {
        this.node = undefined;
        this.wrapper = undefined;
        // Content
        this.title = undefined;
        this.closeButton = undefined;
        this.body = undefined;
        this.image = undefined;
        this.text = undefined;
        this.buttons = undefined;
        this.progressBar = undefined;
        //
        this.duration = 0;
        this.fadeoutTime = 0;
        // Events
        this.events = {};
        Object.keys(events).forEach(key => {
            this.events[key] = events[key];
        });
        // Functions
        this.addExtinguish = this.addExtinguishFct.bind(this);
        this.removeExtinguish = this.removeExtinguishFct.bind(this);
    }

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

    static searchToken(string, token, start) {
        let found = [ start[0], start[1] ];
        for (let max = string.length; found[0] < max; found[0]++) {
            if (typeof string[found[0]] == 'string' &&
                ((found[1] = string[found[0]].indexOf(token, found[1])) > -1)) {
                return found;
            }
            found[1] = 0;
        }
        return [ -1, -1 ];
    }

    static breakString(string, tag, start, end) {
        let tagLength = { open: tag.open.length, close: tag.close.length };
        if (start[0] != end[0]) {
            let inside = { tag: tag, str: [ string[start[0]].substring(start[1]) ] };
            let c = 0;
            for (let i = start[0] + 1; i < end[0]; i++ , c++) {
                inside.str.push(string[i]);
            }
            inside.str.push(string[end[0]].substring(0, end[1]));
            inside.str = [ this.joinString(inside.str) ];
            string.splice(start[0] + 1, c, inside);
            end[0] = start[0] + 2;
            string[start[0]] = string[start[0]].substring(0, start[1] - tagLength.open);
            string[end[0]] = string[end[0]].substring(end[1] + tagLength.close);
            return [end[0], 0];
        } else {
            string.splice(start[0] + 1, 0,
                { tag: tag, str: [ string[start[0]].substring(start[1], end[1]) ] },
                string[start[0]].substring(end[1] + tagLength.close));
            string[start[0]] = string[start[0]].substring(0, start[1] - tagLength.open);
            return [start[0] + 2, 0];
        }
    }

    static joinString(arr) {
        let str = [];
        for (let i = 0, max = arr.length; i < max; i++) {
            if (typeof arr[i] == 'string') {
                str.push(arr[i]);
            } else {
                str.push(arr[i].tag.open);
                str.push(this.joinString(arr[i].str));
                str.push(arr[i].tag.close);
            }
        }
        return str.join('');
    }

    static buildNode(string, node) {
        for (let i = 0; i < string.length; i++) {
            if (typeof string[i] == 'string') {
                if (string[i].length > 0) {
                    node.appendChild(document.createTextNode(string[i]));
                }
            } else {
                let tagInfo = string[i].tag;
                let tag = document.createElement(tagInfo.type);
                if (tagInfo.type == 'a' || tagInfo.type == 'button') {
                    tag.addEventListener("click", event => {
                        event.stopPropagation();
                    });
                }
                // Content
                let title = undefined;
                let content = this.joinString(string[i].str);
                if ('title' in tagInfo && tagInfo.title && content.length > 0) {
                    if (content.indexOf('!') == 0) {
                        content = content.substring(1);
                    } else {
                        // find |
                        let foundTitleBreak = this.firstUnbreakChar(content, '|');
                        content = content.replace('\\|', '|');
                        if (foundTitleBreak > -1) {
                            title = content.substring(0, foundTitleBreak);
                            content = content.substring(foundTitleBreak + 1);
                        }
                    }
                }
                if (title == undefined) {
                    title = content;
                }
                // Set attributes
                if ('attributes' in tagInfo) {
                    Object.keys(tagInfo.attributes).forEach(attributeName => {
                        let attributeValue = tagInfo.attributes[attributeName]
                            .replace('$content', content)
                            .replace('$title', title);
                        tag.setAttribute(attributeName, attributeValue);
                    });
                }
                if ('textContent' in tagInfo && tagInfo.textContent) {
                    tag.textContent = tagInfo.textContent
                        .replace('$content', content)
                        .replace('$title', title);
                } else {
                    this.textToNode(string[i].str, tag);
                }
                // Set a class if defined
                if (tagInfo.class) {
                    if (Array.isArray(tagInfo.class)) {
                        for (let i = 0, max = tagInfo.class.length; i < max; i++) {
                            tag.classList.add(tagInfo.class[i]);
                        }
                    } else {
                        tag.className = tagInfo.class;
                    }
                }
                node.appendChild(tag);
            }
        }
        return node;
    }

    /**
     * Transform a text with tags to a DOM node
     * {open}{content}{close}
     * {open}{!|title:}{content}{close}
     * @param {string} text The text with tags
     * @param {object} node The node where the text will be added
     */
    static textToNode(text, node) {
        if (text == undefined) return;
        let string = undefined;
        if (Array.isArray(text)) {
            string = text;
        } else {
            // Normalize linebreak
            text = text.replace(/(\r?\n|\r)/gm, '\n');
            string = [ text ];
        }
        // Break string by tokens
        if (this.tokens == undefined || this.refreshTokens != undefined) {
            this.tokens = Object.keys(SimpleNotification.tags);
            this.refreshTokens = undefined;
        }
        for (let i = 0, last = this.tokens.length; i < last; i++) {
            let tag = SimpleNotification.tags[this.tokens[i]];
            let tagLength = { open: tag.open.length, close: tag.close.length };
            let continueAt = [ 0, 0 ];
            let openPos = [ 0, 0 ];
            let closePos = [ 0, 0 ];
            while((openPos = this.searchToken(string, tag.open, continueAt))[0] > -1) {
                openPos[1] += tagLength.open;
                if ((closePos = this.searchToken(string, tag.close, openPos))[0] > -1) {
                    continueAt = this.breakString(string, tag, openPos, closePos);
                } else {
                    continueAt = openPos;
                }
            }
        }
        return this.buildNode(string, node);
    }

    make(classes) {
        this.node = document.createElement('div');
        // Apply Style
        this.node.className = 'gn-notification gn-insert';
        classes.forEach(className => {
            this.node.classList.add(className);
        });
        // When fadeout end, remove the node from the wrapper
        this.node.addEventListener('animationend', event => {
            if (event.animationName == 'fadeout') {
                this.close(false);
            } else if (event.animationName == 'insert-left' ||
                event.animationName == 'insert-right') {
                this.node.classList.remove('gn-insert');
            }
        });
        if (this.events.onCreate) {
            this.events.onCreate(this);
        }
    }

    setDuration(tm) {
        this.duration = tm;
    }

    setFadeoutTime(tm) {
        this.fadeoutTime = tm;
    }

    setWrapper(wrapper) {
        if (this.wrapper != undefined &&
            this.node != undefined) {
            wrapper.appendChild(this.node);
        }
        this.wrapper = wrapper;
    }

    addCloseOnClick() {
        this.node.title = 'Click to close.';
        this.node.classList.add('gn-close-on-click');
        this.node.addEventListener('click', () => {
            this.close(true);
        });
    }

    addStartStop() {
        this.node.addEventListener('mouseenter', this.removeExtinguish);
        this.node.addEventListener('mouseleave', this.addExtinguish);
    }

    setTitle(title) {
        if (this.title == undefined) {
            this.title = document.createElement('h1');
            this.node.appendChild(this.title);
        }
        this.title.title = title;
        this.title.textContent = title;
    }

    addCloseButton() {
        let closeButton = document.createElement('span');
        closeButton.title = 'Click to close.';
        closeButton.className = 'gn-close';
        closeButton.textContent = '\u274C';
        closeButton.addEventListener('click', () => {
            this.close(true);
        });
        if (this.title) {
            closeButton.classList.add("gn-close-title");
            this.title.appendChild(closeButton);
        } else {
            this.node.insertBefore(closeButton, this.node.firstChild);
        }
    }

    addBody() {
        this.body = document.createElement('div');
        this.body.className = 'gn-content';
        this.node.appendChild(this.body);
    }

    setImage(image) {
        if (this.image == undefined) {
            this.image = document.createElement('img');
            if (this.text != undefined) {
                this.body.insertBefore(this.image, this.text);
            } else {
                this.body.appendChild(this.image);
            }
        }
        this.image.src = image;
    }

    setText(content) {
        if (this.text == undefined) {
            this.text = document.createElement('div');
            this.text.className = 'gn-text';
            this.body.appendChild(this.text);
        }
        SimpleNotification.textToNode(content, this.text);
    }

    addButton(type, value, onClick) {
        if (this.buttons == undefined) {
            this.buttons = document.createElement('div');
            this.buttons.className = 'gn-buttons';
            this.node.appendChild(this.buttons);
        }
        let button = document.createElement('button');
        SimpleNotification.textToNode(value, button);
        button.className = ['gn-button gn-', type].join('');
        button.addEventListener('click', event => {
            event.stopPropagation();
            onClick(this);
        });
        this.buttons.appendChild(button);
    }

    addProgressBar() {
        this.progressBar = document.createElement('span');
        this.progressBar.className = 'gn-lifespan';
        // Destroy the notification when the animation end
        let startFadeoutAfterShorten = event => {
            if (event.animationName == 'shorten') {
                this.progressBar.removeEventListener('animationend', startFadeoutAfterShorten);
                this.progressBar.classList.add('gn-retire');
                if (this.events.onDeath) {
                    this.events.onDeath(this);
                } else {
                    this.closeFadeout();
                }
            }
        };
        this.progressBar.addEventListener('animationend', startFadeoutAfterShorten);
        // Put the extinguish in a event listener to start when insert animation is done
        let startOnInsertFinish = event => {
            if (event.animationName == 'insert-left' || event.animationName == 'insert-right') {
                // Set the time before removing the notification
                this.progressBar.style.animationDuration = [this.duration, 'ms'].join('');
                if (document.hasFocus()) {
                    this.progressBar.classList.add('gn-extinguish');
                } else {
                    // Start the extinguish animation only when the page is focused
                    let addFocusExtinguish = () => {
                        this.progressBar.classList.add('gn-extinguish');
                        document.removeEventListener('focus', addFocusExtinguish);
                    };
                    document.addEventListener('focus', addFocusExtinguish);
                }
                // Remove event and style of insert
                this.node.removeEventListener('animationend', startOnInsertFinish);
            }
        };
        this.node.addEventListener('animationend', startOnInsertFinish);
        this.node.appendChild(this.progressBar);
    }

    display() {
        if (this.node) {
            this.wrapper.appendChild(this.node);
            if (this.events.onDisplay) {
                this.events.onDisplay(this);
            }
        }
    }

    remove() {
        if (this.node != undefined) {
            this.node.remove();
            this.node = undefined;
            return true;
        }
        return false;
    }

    close(fromUser) {
        if (this.remove() && this.events.onClose) {
            this.events.onClose(this, fromUser);
        }
    }

    /**
     * Add the class 'gn-extinguish' to the event target
     * Used in create() and closeFadeout() to be able to remove the eventListener.
     */
    addExtinguishFct() {
        this.progressBar.classList.add('gn-extinguish');
    }

    /**
     * Remove the class 'gn-extinguish' to the event target
     * Used in create() and closeFadeout() to be able to remove the eventListener.
     */
    removeExtinguishFct() {
        this.progressBar.classList.remove('gn-extinguish');
    }

    /**
     * Remove reset events and add the fadeout animation
     */
    closeFadeout() {
        // Disable buttons
        if (this.buttons) {
            for (let i = 0, max = this.buttons.childNodes.length; i < max; i++) {
                this.buttons.childNodes[i].disabled = true;
            }
        }
        // Remove the timer animation
        this.node.removeEventListener('mouseenter', this.removeExtinguish);
        this.node.removeEventListener('mouseleave', this.addExtinguish);
        // Add the fadeout animation
        this.node.style.animationDuration = [this.fadeoutTime, 'ms'].join('');
        this.node.classList.add('gn-fadeout');
        // Pause and reset fadeout on hover
        this.node.addEventListener('mouseenter', event => {
            event.target.classList.remove('gn-fadeout');
        });
        this.node.addEventListener('mouseleave', event => {
            event.target.classList.add('gn-fadeout');
        });
    }

    /**
     * Create and append a notification
     * Options: duration, fadeout, position
     * @param {array} classes Array of classes to add to the notification
     * @param {string} title The title inside the notification
     * @param {string} text The text inside the notification
     * @param {string} image Image to be displayed in the notification
     * @param {object} options The options of the notifications
     */
    static create(classes, title=undefined, text=undefined, image=undefined, buttons=undefined, notificationOptions={}) {
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
        let notification = new SimpleNotification(options.events);
        notification.setDuration(options.duration);
        notification.setFadeoutTime(options.fadeout);
        notification.make(classes);
        notification.setWrapper(SimpleNotification.wrappers[options.position]);
        // Events
        // Delete the notification on click
        if (options.closeOnClick) {
            notification.addCloseOnClick();
        }
        // Pause on hover if not sticky
        if (!options.sticky) {
            notification.addStartStop();
        }
        // Add elements
        if (hasTitle) {
            notification.setTitle(title);
        }
        if (options.closeButton) {
            notification.addCloseButton();
        }
        if (hasImage || hasText) {
            notification.addBody();
            if (hasImage) {
                notification.setImage(image);
            }
            if (hasText) {
                notification.setText(text);
            }
        }
        if (buttons) {
            if (!Array.isArray(buttons)) {
                buttons = [ buttons ];
            }
            for (let i = 0, max = buttons.length; i < max; i++) {
                notification.addButton(buttons[i].type, buttons[i].value, buttons[i].onClick);
            }
        }
        // Add progress bar if not sticky
        if (!options.sticky) {
            notification.addProgressBar();
        }
        // Display
        notification.display();
        return notification;
    }

    /**
     * Create a notification with the 'success' style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {string} image Image to be displayed in the notification
     * @param {object} options Options used for the notification
     */
    static success(title=undefined, text=undefined, image=undefined, buttons=undefined, options={}) {
        return this.create(['gn-success'], title, text, image, buttons, options);
    }

    /**
     * Create a notification with the 'info' style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {string} image Image to be displayed in the notification
     * @param {object} options Options used for the notification
     */
    static info(title=undefined, text=undefined, image=undefined, buttons=undefined, options={}) {
        return this.create(['gn-info'], title, text, image, buttons, options);
    }

    /**
     * Create a notification with the 'error' style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {string} image Image to be displayed in the notification
     * @param {object} options Options used for the notification
     */
    static error(title=undefined, text=undefined, image=undefined, buttons=undefined, options={}) {
        return this.create(['gn-error'], title, text, image, buttons, options);
    }

    /**
     * Create a notification with the 'warning' style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {string} image Image to be displayed in the notification
     * @param {object} options Options used for the notification
     */
    static warning(title=undefined, text=undefined, image=undefined, buttons=undefined, options={}) {
        return this.create(['gn-warning'], title, text, image, buttons, options);
    }

    /**
     * Create a notification with the 'message' style
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {string} image Image to be displayed in the notification
     * @param {object} options Options used for the notification
     */
    static message(title=undefined, text=undefined, image=undefined, buttons=undefined, options={}) {
        return this.create(['gn-message'], title, text, image, buttons, options);
    }

    /**
     * Make a notification with custom classes
     * @param {array} classes The classes of the notification
     * @param {string} title Title of the notification
     * @param {string} text Content of the notification
     * @param {string} image Image to be displayed in the notification
     * @param {object} options Options used for the notification
     */
    static custom(classes, title=undefined, text=undefined, image=undefined, buttons=undefined, options={}) {
        return this.create(classes, title, text, image, buttons, options);
    }

    /**
     * Add a tag for the textToNode function
     * @param {string} name The name of the tag
     * @param {object} object The values of the tag
     */
    static addTag(name, object) {
        this.tags[name] = object;
        this.refreshTokens = true;
    }
}
SimpleNotification.wrappers = {};
SimpleNotification.default = {
    position: 'top-right',
    closeOnClick: true,
    closeButton: true,
    duration: 4000,
    fadeout: 400,
    sticky: false,
    events: {
        onCreate: undefined,
        onDisplay: undefined,
        onDeath: undefined,
        onClose: undefined,
    }
};
SimpleNotification.tags = {
    code: {
        type: 'code',
        class: 'gn-code',
        open: '``',
        close: '``',
        textContent: '$content'
    },
    header2: {
        type: 'h2',
        class: 'gn-header',
        open: '## ',
        close: '\n'
    },
    header1: {
        type: 'h1',
        class: 'gn-header',
        open: '# ',
        close: '\n'
    },
    image: {
        type: 'img',
        title: true,
        attributes: {
            'src': '$content',
            'title': '$title',
        },
        textContent: false,
        open: '![',
        close: ']'
    },
    link: {
        type: 'a',
        title: true,
        attributes: {
            'href': '$content',
            'target': 'blank',
            'title': '$title',
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
    separator: {
        type: 'div',
        class: 'gn-separator',
        textContent: false,
        open: '\n---\n',
        close: ''
    },
    linejump: {
        type: 'br',
        textContent: false,
        open: '\n',
        close: '',
    }
};