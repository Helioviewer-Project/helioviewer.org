(function() {
  var expect;

  expect = chai.expect;

  describe('starting point', function() {
    return it('should run tests', function() {
      return expect(0).to.be.equal(0);
    });
  });

}).call(this);
