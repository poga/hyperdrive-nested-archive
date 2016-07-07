const toStream = require('string-to-stream')
const multistream = require('multistream')
const split = require('split')

module.exports = { addChild: addChild, childKeys: childKeys }

function addChild(archive, childArchive, cb) {
  touch(archive, '/.link', function () {
    appendLine(archive, '/.link', childArchive.key.toString('hex'), cb)
  })
}

function childKeys(archive, cb) {
  var keys = []
  touch(archive, '/.link', function () {
    var rs = archive.createFileReadStream('/.link')
    rs.pipe(split())
      .on('data', (line) => {
        var x = line.toString()
        if (x === "") return

        keys.push(x)
      })
      .on('end', () => { cb(keys) })
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

  multistream([rs, toStream("\n" + toAppend)]).pipe(archive.createFileWriteStream(name)).on('finish', cb)
}
