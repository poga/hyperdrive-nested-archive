const memdb = require('memdb')
const toStream = require('string-to-stream')
const hyperdrive = require('hyperdrive')
const swarm = require('hyperdrive-archive-swarm')

const nested = require('.')

const assert = require('chai').assert

describe('hyperdrive-link', function () {
  describe('addChild()', function () {
    var drive1, drive2
    var archive1, archive2

    beforeEach(() => {
      drive1 = hyperdrive(memdb())
      archive1 = drive1.createArchive({live: true})
      drive2 = hyperdrive(memdb())
      archive2 = drive2.createArchive({live: true})
    })

    it("should create one metafile for one child", function (done) {
      nested.addChild(archive1, '/link2', archive2, function (err) {
        assert.equal(err, null)

        archive1.list(function (err, entries) {
          assert.equal(entries.length, 1)

          done()
        })
      })
    })

    it("should OK to add an archive as another archive's child", function (done) {
      nested.addChild(archive1, '/link2', archive2, function (err) {
        assert.equal(err, null)

        nested.children(archive1, function (err, keys) {
          assert.equal(err, null)
          assert.deepEqual(keys, [
            { prefix: '/link2',
              key: archive2.key.toString('hex')
            }
          ])

          done()
        })
      })
    })

    it("can add finalized child", function (done) {
      archive2.finalize(() => {
        nested.addChild(archive1, '/link2',archive2, function (err) {
          assert.equal(err, null)

          nested.children(archive1, function (err, keys) {
            assert.equal(err, null)
            assert.deepEqual(keys, [
              { prefix: '/link2',
                key: archive2.key.toString('hex')
              }
            ])

            done()
          })
        })
      })
    })
  })

  describe('multiple addChild()', function () {
    var drive
    var archive1, archive2, archive3

    beforeEach(() => {
      drive = hyperdrive(memdb())
      archive1 = drive.createArchive({live: true})
      archive2 = drive.createArchive({live: true})
      archive3 = drive.createArchive({live: true})
    })

    it("an archive can have multiple children", function (done) {
      nested.addChild(archive1, '/link2', archive2, function (err) {
        assert.equal(err, null)

        nested.addChild(archive1, '/link3', archive3, function (err) {
          assert.equal(err, null)

          archive1.list(function(err, ets) {
            assert.equal(ets.length, 2)
          })

          nested.children(archive1, function (err, keys) {
            assert.equal(err, null)
            assert.deepEqual(keys, [
              { prefix: '/link2',
                key: archive2.key.toString('hex')
              },
              { prefix: '/link3',
                key: archive3.key.toString('hex')
              }
            ])

            done()
          })
        })
      })
    })
  })

  describe('listAll()', function () {
    var drive1, drive2
    var archive1, archive2
    var sw

    beforeEach(() => {
      drive1 = hyperdrive(memdb())
      archive1 = drive1.createArchive({live: true})
      drive2 = hyperdrive(memdb())
      archive2 = drive2.createArchive({live: true})

      // replicate it out
      sw = swarm(archive2)
    })

    it('should return a stream which emit everytime the archive have new file', function (done) {
      nested.addChild(archive1, '/link2', archive2, function (err) {
        var entries = nested.listAll(archive1, {live: true})

        entries.on('data', (entry) => {
          assert.equal(entry.name, '/test.txt')
          assert.deepEqual(entry.archive.key, archive1.key)

          done()
        })

        toStream('foo').pipe(archive1.createFileWriteStream('/test.txt'))
      })
    })

    it('should return a stream which emit everytime the archive\'s child have new file', function (done) {
      nested.addChild(archive1, '/link2', archive2, function (err) {
        var entries = nested.listAll(archive1, {live: true})

        entries.on('data', (entry) => {
          assert.equal(entry.name, '/link2/test2.txt')
          assert.deepEqual(entry.archive.key, archive2.key)

          done()
        })

        toStream('foo').pipe(archive2.createFileWriteStream('/test2.txt'))
      })
    })
  })
})
