const toStream = require('string-to-stream')
const multistream = require('multistream')
const split = require('split2')

module.exports = { addChild: addChild, children: children }

function addChild(archive, prefix, childArchive, cb) {
  touch(archive, '/.link', function () {
    var child = { prefix: prefix, key: childArchive.key.toString('hex') }
    appendLine(archive, '/.link', JSON.stringify(child), cb)
  })
}

function children(archive, cb) {
  var children = []
  touch(archive, '/.link', function () {
    var rs = archive.createFileReadStream('/.link')
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

function appendLine(archive, name, toAppend, cb) {
  var rs = archive.createFileReadStream(name)

  multistream([rs, toStream(toAppend+"\n")]).pipe(archive.createFileWriteStream(name)).on('finish', cb)
}
