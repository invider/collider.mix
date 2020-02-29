
// collection of assert functions

var asserts = {

    // assert that value is true
    assertTrue: function(value, exception) {
        if (!value){
            exception = (exception instanceof Error) ? exception: new Error(exception);
            throw exception
        }
    },

    // assert that value is not NaN
    assertNumber: function(value, exception) {
        if (isNaN(value)){
            exception = (exception instanceof Error) ? exception: new Error(exception);
            throw exception
        }
    },

    // assert that value is not empty
    notEmpty: function(value, exception){
        if (!value){
            exception = (exception instanceof Error) ? exception: new Error(exception);
            throw exception
        }
    }
};
module.exports = asserts;
