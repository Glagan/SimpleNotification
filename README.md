# SimpleNotification

*SimpleNotification* is a library to display simple yet customizable notifications.

You can find a live demo here: [https://notification.nikurasu.org/](https://notification.nikurasu.org/)

## Installation

You simply need to include ``simpleNotification.css`` (or it's minified version), ``simpleNotification.js`` and you're ready to go !

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
| title | (Optional) The title of the notification. |
| text | (Optional) The content of the notification. |
| options | (Optional) The parameters for this notification. |

You can use custom classes and make your own design by using ``SimpleNotification.custom(classes, title, text, options)`` where classes is an array of CSS classes that will be added to the body of each notifications.

Both ``title`` and ``text`` are optional, but you need to set at least one of the two.  
You can jump line inside the notification content by using any linebreak character (``\r``, ``\n`` or ``\r\n``).

## Options

There is a few options that you can set by using ``SimpleNotification.options(object)`` or more specifically for a single notification on the third parameter.

| Name | Description |
|---|---|
| duration | The time that the notification is displayed. |
| fadeout | The duration of the fadeout animation when the notification display time is over. |
| position | Valid positions: ``top-left``, ``top-right``, ``bottom-left`` and ``bottom-right``. |
| sticky | If set to true, the notification will not disappear until the user click it. |
| image | Add an image next to the notification content. |

## Text Tag

You can insert links, or stylize text by using tags that ressemble **Markdown**.

| Name | Description |
|---|---|
| Inline code | \`\`code\`\` |
| Header (h2) | ``#Header 2\r\n`` |
| Header (h3) | ``##Header 3\r\n`` |
| Link | ``{{title:http://www.example.org/}}`` or ``{{!title:http://www.example.org/}}``|
| Bold | ``**http://www.example.org/**`` |
| Italic | ``*http://www.example.org/*`` |

You can add custom tags easily by adding them to ``SimpleNotification.tags`` or by using ``SimpleNotification.addTag(name, object)``.  
A tag object can have the following attributes:

```javascript
{
    type: 'span', // The node type
    set: 'attribute', // Optional attribute to set with the content as a value
    class: 'gn-class', // Optional class list to use
    title: 'attribute', // See "Title" below
    open: '{{', // The opening token - any length
    close: '}}' // The closing token - can be linebreak by using \n
}
```

### Title

Tags can have a *title*. It's additional data that can be used for the result.

The title of a tag is found by using the first separator ``:``, you can avoid using a separator by adding a slash before ``\:``.  
You can also avoid using title for the tag by adding **!** before the content, the following examples are the same and will display a link with the URL as it's displayed content.

```
{{!http://www.example.org/}}
{{http\://www.example.org/}}
```

If no title is found, the result will be the default one.  
If *title* is set to **"content"**, the content of the title will be set as the ``textContent`` of the result node, else it will be set as an attribute of the node.