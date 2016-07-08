const toStream = require('string-to-stream')
const multistream = require('multistream')
const split = require('split2')
const stream = require('stream')
const through2 = require('through2')
const raf = require('random-access-file')
const bs58 = require('bs58')

const hyperdrive = require('hyperdrive')
const memdb = require('memdb')
const swarm = require('hyperdrive-archive-swarm')

module.exports = { addChild: addChild, children: children, listAll: listAll }

const linkFileDir = '/.link'

function addChild(archive, prefix, childArchive, cb) {
  var child = { prefix: prefix, key: childArchive.key.toString('hex') }
  var linkFile = `${linkFileDir}/link-${bs58.encode(new Buffer(prefix))}-${child.key}`
  toStream('link').pipe(archive.createFileWriteStream(linkFile)).on('finish', cb)
}

function children(archive, cb) {
  var children = []

  archive.list(function(err, entries) {
    if (err) {
      return cb(err)
    }

    entries.forEach((x) => {
      if (isLinkFile(x.name)) {
        var attrs = x.name.split(`${linkFileDir}/link-`)[1]
        var prefix = new Buffer(bs58.decode(attrs.split('-')[0])).toString()
        var key = attrs.split('-')[1]

        children.push({prefix: prefix, key: key})
      }
    })

    cb(undefined, children)
  })
}

function isLinkFile(filename) {
  return filename.startsWith(`${linkFileDir}/link-`)
}

// list all entries in archive tree
// automatically skip child metadata
function listAll(archive, opt) {
  var combineAndPrefix = through2.obj(function(chunk, enc, cb) {
    if (!isLinkFile(chunk.name)) {
      this.push(chunk)
    }

    cb()
  })
  var rootList = archive.list(opt)
  rootList.on('data', (entry) => {
    combineAndPrefix.write(entry)
  })
  children(archive, function (err, childArchives) {
    childArchives.forEach( c => {
      var drive = hyperdrive(memdb())
      var childArchive = drive.createArchive(c.key, {live: true})
      swarm(childArchive)
      var rs = childArchive.list(opt)
      rs.on('data', (entry) => {
        entry.name = c.prefix + entry.name
        combineAndPrefix.write(entry)
      })
    })
  })

  return combineAndPrefix
}
