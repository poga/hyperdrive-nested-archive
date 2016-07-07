const memdb = require('memdb')
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
      nested.addChild(archive1, archive2, function (err) {
        assert.equal(err, null)

        nested.childKeys(archive1, function (keys) {
          assert.equal(err, null)
          assert.deepEqual(keys, [archive2.key.toString('hex')])

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
        nested.addChild(archive1, archive2, function (err) {
          assert.equal(err, null)

          nested.childKeys(archive1, function (keys) {
            assert.equal(err, null)
            assert.deepEqual(keys, [archive2.key.toString('hex')])

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
      nested.addChild(archive1, archive2, function (err) {
        assert.equal(err, null)

        nested.addChild(archive1, archive3, function (err) {
          assert.equal(err, null)

          nested.childKeys(archive1, function (keys) {
            assert.equal(err, null)
            assert.deepEqual(keys, [archive2.key.toString('hex'),archive3.key.toString('hex')])

            done()
          })
        })
      })
    })
  })
})
