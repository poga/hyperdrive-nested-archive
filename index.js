const toString = require('stream-to-string')

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

    rs.on('data', (data) => {
      data.toString().split("\n").forEach( x => {
        if (x === "") return

        keys.push(x)
      })
    })
    rs.on('end', () => { cb(keys) })
  })
}

// create file if not exists
function touch(archive, filename, cb) {
  archive.list(function (err, entries) {
    if (entries.find(x => { return x.name === filename })) {
      return cb()
    }

    var writer = archive.createFileWriteStream(filename)
    writer.on('finish', cb)
    writer.end('')
  })
}

function appendLine(archive, name, toAppend, cb) {
  var rs = archive.createFileReadStream(name)

  toString(rs, function (err, data) {
    archive.createFileWriteStream(name).end(data + "\n" + toAppend)
    cb()
  })
}
