# electron-boilerplate

There are a couple of boilerplates out there already, most of them are quite advanced like this [one here](https://github.com/szwacz/electron-boilerplate).

The boilerplate in this repo is not as advanced, this boilerplate is more like a tutorial. It shows you examples for some of the basics that you will probably be interested in when you start working with [electron](electron.atom.io):

- Creating a Menu
- Creating Multiple Windows
- Handling multiple Screens
- Creating, Editing and Saving Data to settings file
- Letting your html-pages communicate with your global app process
- Handle Drag&Drop on your app
- Handle File-Drops on you app icon
- Have a global error function that opens a new window and displays the error

After having installed all the necessary tools from electron, you will need these two commands from your command-line-interface to get going:

```
//go to the boilerplate folder
cd /to-your-folder
//execute your electron app
electron .
//package it as a real app (this here for example is an OS X app)
electron-packager /to-your-folder AppName --platform=darwin --arch=x64 --version=0.34.0
```