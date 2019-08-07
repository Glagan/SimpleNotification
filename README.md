# SimpleNotification

*SimpleNotification* is a library to display simple yet customizable notifications.

You can find a live demo here: [https://notification.nikurasu.org/](https://notification.nikurasu.org/)

## Installation

You simply need to include ``simpleNotification.css``, ``simpleNotification.js`` and you're ready to go !

## How to use

*SimpleNotification* has static methods to display notifications, and there is 5 default templates.  
You can call each templates by their name directly on ``SimpleNotification`` without instantiating it, for example: ``SimpleNotification.succes(...)``.

| Name | Result |
|---|---|
| success | ![Success notification](screenshots/success.png) |
| info | ![Information notification](screenshots/info.png) |
| error | ![Error notification](screenshots/error.png) |
| warning | ![Warning notification](screenshots/warning.png) |
| message | ![Message notification](screenshots/message.png) |

Each functions have the same parameters:

| Name | Description |
|---|---|
| title | The title of the notification. |
| text | The content of the notification. |
| image | Add an image next to the notification content. |
| options | The parameters for this notification. |

> All parameters are optional, but at least one is required.

You can use custom classes and make your own design by using ``SimpleNotification.custom(classes, title, text, options)`` where classes is an array of CSS classes that will be added to the body of each notifications.

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
| events | See [Events](##Events) |

> If a notification is ``sticky`` and ``closeOnClick`` is disabled, ``closeButton`` is set to true to always have a way to close a notification.

## Events

There is 4 events during the process of every notifications:

### onCreate

Called when the notification *node* is created but **empty**.

The target notification object is passed as a parameter ``onCreate(notification)``.

### onDisplay

Called after the notification is added to it's wrapper.

The target notification object is passed as a parameter ``onDisplay(notification)``.

### onDeath

Called after the notification display time has passed, and before closing it.

The target notification object is passed a a parameter ``onDeath(notification)``.

> If you set the ``onDeath`` function you need to call ``notification.close()``, ``notification.remove()`` or ``notification.closeFadeout()`` or else the notification won't disappear.

### onClose

Called after the notification is closed.

The target notification object and if the notification has been manually closed are passed as parameters ``onClose(notification, fromUser)``.

## Text Tag

You can insert links, or stylize text by using tags that ressemble **Markdown**.

| Name | Description |
|---|---|
| Inline code | \`\`code\`\` |
| Header (h1) | ``# Header 1\n`` |
| Header (h2) | ``## Header 2\n`` |
| Link | ``{{title|http://www.example.org/}}`` or ``{{http://www.example.org/}}`` without title. |
| Image | ``![title|http://www.example.org/image.jpg]`` or ``![http://www.example.org/image.jpg]`` without title. |
| Bold | ``**http://www.example.org/**`` |
| Italic | ``*http://www.example.org/*`` |
| Separator | ``---\n`` |

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

* ``$content``: the content found between the ``open`` and ``close`` token, without title if there is one
* ``$title``: the title found, if there is none it is replaced by the same value as ``$content``

### Title

Tags can have a *title*. It's additional data that can be used for the result.

The title of a tag is found by using the first separator ``|``, you can avoid using a separator by adding a slash before ``\|``.  
You can also avoid using title for the tag by adding **!** before the content, the following examples are the same and will display the image ``tes|.jpg``.  
If ``title`` is not defined, set to false or not found, it will ignore the title find step.  

```
![!http://www.example.org/tes|.jpg]
![http://www.example.org/tes\|.jpg]
```
