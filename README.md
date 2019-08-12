# SimpleNotification

*SimpleNotification* is a library to display simple yet customizable notifications.  
You can stylize text with a simple syntax, add buttons to make the notifications interactable and add callbacks for some events during the life of a notification.  
*SimpleNotification* weight **9.98 Kb** (**3.38Kb** gziped), with no dependencies.

You can find a live demo here: [https://notification.nikurasu.org/](https://notification.nikurasu.org/)

## Installation

You simply need to include ``simpleNotification.css``, ``simpleNotification.js`` (or they minified version) and you're ready to go !

## How to use

*SimpleNotification* has static methods to display notifications with 5 default templates.  
You can call each templates by their name directly on ``SimpleNotification`` without instantiating it, for example: ``SimpleNotification.success(...)``.  
The five templates are ``success``, ``error``, ``info``, ``warning`` and ``message``.

![Success notification](screenshots/success.png)

```javascript
SimpleNotification.success({
    title: 'Title', // The title of the notification
    image: 'url', // Optional image displayed inside the notification
    text: 'Content', // Content of the notification
    // Optional list of buttons to interact with the notification
    buttons: [{
        value: 'Confirm', // The text inside the button
        type: 'success', // The type of the button, same as for the notifications
        onClick: (notification) => {
            // The onClick function receive the notification from which the button has been clicked
            // You can call notification.remove(), notification.close() or notification.closeFadeout()
            // if you wish to remove the notification by clicking on  the buttons
        }
    }]
}, options);
```

> All keys in the first parameter are optional, but at least one is required.

You can still update the content and state of any notification after it's been created with these functions:

```
setPosition(position), setType(type), setTitle(title), setImage(image), setText(text), addButton(button), removeButtons()
```

You can use custom classes and make your own design by using ``SimpleNotification.custom(classes, content, options)`` where classes is an array of CSS classes that will be added to the body of each notifications.

You can jump line inside the notification content by using any linebreak character (``\r``, ``\n`` or ``\r\n``).

## Options

There is a few options that you can set by using ``SimpleNotification.options(object)`` or more specifically for a single notification on the third parameter.

| Name | Description |
|---|---|
| duration | The time that the notification is displayed. |
| fadeout | The duration of the fadeout animation when the notification display time is over. |
| position | Valid positions: ``top-left``, ``top-right``, ``bottom-left`` and ``bottom-right``. |
| sticky | If set to true, the notification will not disappear until the user click it or it's close button. |
| closeButton | If set to true, a close button will be added, on the title or on the content. |
| closeOnClick | If set to true, clicking anywhere in the notificaton will close it. |
| events | Object with events functions, see [Events](##Events) |
| display | Display the notification when creating it (default to **true**). |

> If a notification is ``sticky`` and ``closeOnClick`` is disabled, ``closeButton`` is set to true to always have a way to close a notification.

## Events

There is 4 events during the process of every notifications:

* ``onCreate(notification)`` called when the notification *node* is created but **empty**.
* ``onDisplay(notification)`` called when the notification *node* is appended to it's wrapper.
* ``onDeath(notification)`` called when the duration timer has expired.  
    * If you set the ``onDeath`` function you need to call ``notification.close()``, ``notification.remove()`` or ``notification.closeFadeout()`` or else the notification won't disappear.
* ``onDisplay(notification)`` after the notification has been closed.

## Markdown *like* tags

You can insert links, images and stylize text by using tags that ressemble **Markdown**.  
Most of these tags can be nested to combine their effects.

| Name | Description |
|---|---|
| Inline code | \`\`code\`\` |
| Header (h1) | ``# Header 1\n`` |
| Header (h2) | ``## Header 2\n`` |
| Link | <code>{{title\|http://www.example.org/}}</code> or ``{{http://www.example.org/}}`` without title. |
| Image | <code>![title\|http://www.example.org/image.jpg]</code> or ``![http://www.example.org/image.jpg]`` without title. |
| Bold | ``**http://www.example.org/**`` |
| Italic | ``*http://www.example.org/*`` |
| Separator | ``\n---\n`` |

Tags works by looking for an open token, an optional separator if there is a title and the close token.  
If the tag can have a *title* you need to use ``|`` as the separator with the *content*.

You can add custom tags easily by adding them to ``SimpleNotification.tags`` or by using ``SimpleNotification.addTag(name, object)``.  
A tag object can have the following properties:

```javascript
{
    type: 'span', // The node type, e.g <span>
    class: ['class1', 'class2'], // Optional class list as an array or string to use
    attributes: {
        name: value
    }, // Optional attributes to set
    textContent: "$content", // textContent of the created node, see below for variables
                             // If textContent is defined and not false the content cannot have childs (nested other tags)
    title: false, // See "Title" below
    open: '{{', // The opening token - any length
    close: '}}' // The closing token - can be linebreak by using \n - can also be empty
}
```

### Variables

There is 2 usable *variables* inside attributes values, textContent and title:

* ``$content``: the content found between the ``open`` and ``close`` token, without the title if there is one.
* ``$title``: the title found, if there is none it is replaced by the same value as ``$content``.
