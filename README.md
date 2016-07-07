# hyperdrive-nested-archive

create nested [hyperdrive](https://github.com/mafintosh/hyperdrive) archives.

## Install

`npm i hyperdrive-nested-archive`

## Synopsis

```
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

## How it works

It's pretty simple(and hacky). When we add a child to an archive, we created a file called `/.link` into the root archive, which the content is a list of child archive's key.

Then this package provides a helper function to list entries from every archive in the archive tree.

## License

MIT
