const memdb = require('memdb')
const toStream = require('string-to-stream')
const hyperdrive = require('hyperdrive')

const nested = require('.')

const assert = require('chai').assert

describe('hyperdrive-link', function () {
  describe('addChild()', function () {
    var drive1 = hyperdrive(memdb())
    var archive1 = drive1.createArchive({live: true})
    var drive2 = hyperdrive(memdb())
    var archive2 = drive2.createArchive({live: true})

    it("should OK to add an archive as another archive's child", function (done) {
      nested.addChild(archive1, '/link2', archive2, function (err) {
        assert.equal(err, null)

        nested.children(archive1, function (keys) {
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

  describe('add finalized Child()', function () {
    var drive1 = hyperdrive(memdb())
    var archive1 = drive1.createArchive({live: true})
    var drive2 = hyperdrive(memdb())
    var archive2 = drive2.createArchive()

    it("can add finalized child", function (done) {
      archive2.finalize(() => {
        nested.addChild(archive1, '/link2',archive2, function (err) {
          assert.equal(err, null)

          nested.children(archive1, function (keys) {
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
    var drive1 = hyperdrive(memdb())
    var archive1 = drive1.createArchive({live: true})
    var drive2 = hyperdrive(memdb())
    var archive2 = drive2.createArchive({live: true})
    var drive3 = hyperdrive(memdb())
    var archive3 = drive3.createArchive({live: true})

    it("an archive can have multiple children", function (done) {
      nested.addChild(archive1, '/link2', archive2, function (err) {
        assert.equal(err, null)

        nested.addChild(archive1, '/link3', archive3, function (err) {
          assert.equal(err, null)

          nested.children(archive1, function (keys) {
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
    var drive1 = hyperdrive(memdb())
    var archive1 = drive1.createArchive({live: true})
    var drive2 = hyperdrive(memdb())
    var archive2 = drive2.createArchive({live: true})

    it('should return a stream which emit everytime the archive have new file', function (done) {
      nested.addChild(archive1, '/link2', archive2, function (err) {
        var entries = nested.listAll(drive1, archive1, {live: true})

        entries.on('data', (entry) => {
          assert.equal(entry.name, '/test.txt')

          done()
        })

        toStream('foo').pipe(archive1.createFileWriteStream('/test.txt'))
      })
    })

    it('should return a stream which emit everytime the archive\'s child have new file', function (done) {
      nested.addChild(archive1, '/link2', archive2, function (err) {
        var entries = nested.listAll(drive1, archive1, {live: true})

        entries.on('data', (entry) => {
          assert.equal(entry.name, '/test.txt')

          done()
        })

        toStream('foo').pipe(archive2.createFileWriteStream('/test.txt'))
      })
    })
  })
})
