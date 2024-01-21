# Electron File Renamer

## Why?

I've made this destop Electron App to try out something new and also my grandma wanted this app.

## How?

To use this app you first need to clone: 

``` console
$ git clone --depth 1 https://github.com/MarsTwix/electron-file-renamer.git
``` 

After cloning you need to install the dependencies with your favourite node package manager.

``` console
$ yarn
```
``` console
$ npm i
```

Now you've installed all dependencies needed, you need to run one more command to start the app:

``` console
$ yarn start
```
``` console
$ npm run start
```

The app is running! 
1. First you need to select a folder of files you want to rename.
2. Second you need to select the prefix you want the file to have.
3. Lastly press the last button and see the magic happen!

Now you see that all the files in the chosen directory have the new prefix with numbers `00000` until `99999`. (It changes max 10k files)
