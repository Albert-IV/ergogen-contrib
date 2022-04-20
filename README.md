# ergogen-contrib

Community-powered Ergogen footprints.

# Installation

Since I haven't published it on NPM yet
    
    npm install <git repo>

# Usage

In your keyboard project's package.json, add this to your scripts section:

```json
{
  "scripts": {
    "make-board": "ergogen src/my-keyboard.yaml",
    "patch": "patch-ergogen ergogen-contrib ergogen",
    "start": "npm run patch && npm run make-board"
  }
}
```

This should then patch your local ergogen footprints with the footprints in the ergogen-contrib library.  Also possible to use other people's libraries as well **DOCS TBD**.

