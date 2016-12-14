# hyperdrive-nested-archive

**Deprecated, use [hyperdrive-ln](https://github.com/poga/hyperdrive-ln) instead**

create nested [hyperdrive](https://github.com/mafintosh/hyperdrive) archives(archive tree), where each archive can have different owner.

## Install

`npm i hyperdrive-nested-archive`

## Synopsis

```JavaScript
const memdb = require('memdb')
const hyperdrive = require('hyperdrive')
const nested = require('hyperdrive-nested-archive')
const toStream = require('string-to-stream')

// assume we have two archive
var drive1 = hyperdrive(memdb())
var archive1 = drive1.createArchive({live: true})
var drive2 = hyperdrive(memdb())
var archive2 = drive2.createArchive({live: true})

// we can add one to another's children
nested.addChild(archive1, '/linkToChild', archive2, function(err) {
  var entries = nested.listAll(drive1, archive1, {live: true})
  entries.on('data', (entry) => {
    console.log(entry.name)
    // output:
    //    /test.txt
    //    /test2.txt
  })
})

toStream('foo').pipe(archive1.createFileWriteStream('/test.txt'))
toStream('foo').pipe(archive2.createFileWriteStream('/test2.txt'))
```

## API

#### require

`var nested = require('hyperdrive-nested-archive')`

#### nested.addChild(rootArchive, prefix, childArchive, callback(err))

add `childArchive` to `rootArchive`'s children.

#### nested.listAll(rootArchive, opts)

returns a stream which emit entries for each entry in the archive tree.

## How it works

It's pretty simple(and hacky). When we add a child to an archive, we created a file inside `/.link/` directory with name including its prefix and key.

For example, if we add a child archive with prefix `/foo` and key `abc`, a file named `/.link/link-${base58('/foo')}-${abc}` will be created.

Then this package provides a helper function to list entries from every archive in the archive tree.

## License

MIT
