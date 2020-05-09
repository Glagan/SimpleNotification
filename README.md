# SimpleNotification

*SimpleNotification* is a library to display simple yet customizable notifications. 
You can stylize text with a simple syntax, add buttons to make the notifications interactable and add callbacks for some events during the life of a notification. 

*SimpleNotification* weighs **11.12 Kb** (**3.57 Kb** gzipped), with no dependencies.

You can find a live demo here: [https://notification.nikurasu.org/](https://notification.nikurasu.org/)

## Installation

You simply need to include ``simpleNotification.css``, ``simpleNotification.js`` (or the minified versions) and you're ready to go!

## How to use

*SimpleNotification* has static methods to display notifications with 5 default templates. 
You can call each of the templates by their name directly on ``SimpleNotification`` without instantiating it, like so: ``SimpleNotification.success(...)``.  

The five templates are ``success``, ``error``, ``info``, ``warning`` and ``message``.

<p align="center">
    <img width="320" height="92" src="screenshots/success.png">
</p>

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
setType(type), setTitle(title), setImage(image), setText(text), addButton(button), removeButtons(), disableButtons()
```

You can use custom classes and make your own design by using ``SimpleNotification.custom(classes, content, options)`` where classes is an array of CSS classes that will be added to the body of each notification.

You can jump lines inside the notification content by using any linebreak character (``\r``, ``\n`` or ``\r\n``).

## Options

There are a few options that you can set by using ``SimpleNotification.options(object)`` or more specifically for a single notification on the third parameter.

| Name | Description | Default |
|---|---|---|
| duration | The time (in ms) that the notification is displayed. | 4000 |
| position | Valid positions: ``top-left``, ``top-center``, ``top-right``, ``bottom-left``, ``bottom-center`` and ``bottom-right``. | "top-right" |
| sticky | If true, the notification will not disappear until the user clicks it or its close button. | false |
| closeButton | If true, a close button will be added either on the title or the content. | true |
| closeOnClick | If true, clicking anywhere in the notification will close it. | true |
| removeAllOnDisplay | If true, all notifications will be cleared before the new one is added to the screen. | false |
| maxNotifications | If >0, notifications (starting with oldest) will clear out until the number displayed is less than or equal to the specified option. | 0 |
| events | Object with events functions, see [Events](#Events). |
| insertAnimation | Object with CSS class name and duration, see [Animations](#Animations). | ``{ name: 'default-insert', duration: 250 }`` |
| removeAnimation | Object with CSS class name and duration, see [Animations](#Animations). | ``{ name: 'fadeout', duration: 400 }`` |
| display | Display the notification when creating it. | true |

> If a notification is ``sticky`` and ``closeOnClick`` is disabled, ``closeButton`` is set to true to always have a way to close a notification.

## Events

There are four events during the process of displaying every notification:

* ``onCreate(notification)`` called when the notification *node* is created but **empty**.
* ``onDisplay(notification)`` called when the notification *node* is appended to its wrapper.
* ``onDeath(notification)`` called when the duration timer has expired.
    * If you set the ``onDeath`` function you need to call ``notification.close()``, ``notification.remove()`` or ``notification.closeFadeout()`` or else the notification won't disappear.
* ``onDisplay(notification)`` after the notification has been closed.

## Animations

<p align="center">
    <img width="320" height="92" src="screenshots/success.png">
</p>

You can customize the **insert** and **remove** animations of a notification by giving a value to the ``insertAnimation`` (or ``removeAnimation``) option.
The option take an object like the following:

```javascript
{
    name: "default-insert", // See the list below
    duration: 250 // In ms
}
```

The **insert** animations are: ``insert-[left|top|right|bottom]``, ``fadein``, ``scalein`` and ``rotatein``.

> By default the animation is ``default-insert`` which is a special value that automatically choose the corresponding insert animation after the notification position.

The **remove** animations are: ``fadeout``, ``scaleout`` and ``rotateout``.

You can add your own animations by adding them in your own CSS files and setting the name of the animation as the parameter.

## Markdown-*like* tags

You can insert links, images and stylize text by using tags that resemble **Markdown**. 
Most of these tags can be nested to combine their effects.

| Name | Description |
|---|---|
| Inline code | \`\`code\`\` |
| Header (h1) | ``# Header 1\n`` |
| Header (h2) | ``## Header 2\n`` |
| Link | ``{{title\|http://www.example.org/}}`` or ``{{http://www.example.org/}}`` without title. |
| Image | ``![title\|http://www.example.org/image.jpg]`` or ``![http://www.example.org/image.jpg]`` without title. |
| Bold | ``**http://www.example.org/**`` |
| Italic | ``*http://www.example.org/*`` |
| Separator | ``\n---\n`` |

Tags work by looking for an open token, an optional separator if there is a title, and the close token.  
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

There are two usable *variables* inside attribute values textContent and title:

* ``$content``: the content found between the ``open`` and ``close`` token, without the title if there is one.
* ``$title``: the title found, if there is none it is replaced by the same value as ``$content``.
