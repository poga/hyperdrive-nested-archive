const toStream = require('string-to-stream')
const multistream = require('multistream')
const split = require('split2')
const stream = require('stream')
const through2 = require('through2')

module.exports = { addChild: addChild, children: children, listAll: listAll }

const metafile = '/.link'

function addChild(archive, prefix, childArchive, cb) {
  touch(archive, metafile, function () {
    var child = { prefix: prefix, key: childArchive.key.toString('hex') }
    appendLine(archive, metafile, JSON.stringify(child), cb)
  })
}

function children(archive, cb) {
  var children = []
  touch(archive, metafile, function () {
    var rs = archive.createFileReadStream(metafile)
    rs.pipe(split(JSON.parse))
      .on('data', (child) => {
        children.push(child)
      })

      .on('end', () => { cb(children) })
  })
}

// create file if not exists
function touch(archive, filename, cb) {
  archive.list(function (err, entries) {
    if (entries.find(x => { return x.name === filename })) {
      return cb()
    }

    toStream('').pipe(archive.createFileWriteStream(filename)).on('finish', cb)
  })
}

// list all entries in archive tree
// automatically skip child metadata
function listAll(drive, archive, opt) {
  var combined = through2.obj(function(chunk, enc, cb) {
    if (chunk.name !== metafile) {
      this.push(chunk)
    }

    cb()
  })
  var rootList = archive.list(opt)
  var streams = [rootList]
  children(archive, function (childArchives) {
    childArchives.forEach( c => {
      var childArchive = drive.createArchive(c.key)
      streams.push(childArchive.list(opt))
    })
  })

  streams.forEach(s => { s.pipe(combined) })
  return combined
}

function appendLine(archive, name, toAppend, cb) {
  var rs = archive.createFileReadStream(name)

  multistream([rs, toStream(toAppend+"\n")]).pipe(archive.createFileWriteStream(name)).on('finish', cb)
}
