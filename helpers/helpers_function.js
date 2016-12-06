
// Check that the test is a) defined and b) has value either 'Yes' or 'No'
var checkYesNo = function(text) {
    if ((text) &&
        ((text === 'No') || (text === 'Yes'))) {
        true;
    } else {
        false;
    }
};