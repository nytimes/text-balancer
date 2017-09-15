var candidates = [];

// pass in a string of selectors to be balanced.
// if you didnt specify any, thats ok! We'll just
// balance anything with the balance-text class
var textBalancer = function (selectors, fraction=1.0) {

    if (!selectors) {
        candidates = document.querySelectorAll('.balance-text');
    } else {
        createSelectors(selectors);
    }
    fraction = +fraction;
    if ((typeof fraction) != 'number' || isNaN(fraction)) {
        fraction = 1.0;
    } else {
        fraction = Math.max(0.0, Math.min(1.0, fraction))
        if (fraction == 0.0) return;
    }

    balanceText(fraction);

    var rebalanceText = debounce(function() {
        balanceText(fraction);
    }, 100);

    window.addEventListener('resize', rebalanceText);
}

// this populates our candidates array with dom objects
// that need to be balanced
var createSelectors = function(selectors) {
    var selectorArray = selectors.split(',');
    for (var i = 0; i < selectorArray.length; i += 1) {
        var currentSelectorElements = document.querySelectorAll(selectorArray[i].trim());

        for (var j = 0; j < currentSelectorElements.length; j += 1) {
            var currentSelectorElement = currentSelectorElements[j];
            candidates.push(currentSelectorElement);
        }
    }
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
var debounce = function (func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};


// HELPER FUNCTION -- initializes recursive binary search
var balanceText = function (fraction) {
    var element;
    var i;

    for (i = 0; i < candidates.length; i += 1) {
        element = candidates[i];
        clearMaxWidth(element);
        var computedStyle = getComputedStyle(element, null);
        if (computedStyle.textAlign === 'start') { // only squeeze left-aligned elements
            // In an n-line element, at most roughly 1/n'th of the horizontal width
            // can be "visually recoverable," so half is our starting minimum
            // (minus a fudge factor, with a minimum of 50).
            var bottomRange = Math.max(50, element.offsetWidth / 2 - 10);
            squeezeContainerLeft(element, element.clientHeight, element.offsetWidth, bottomRange, element.clientWidth, fraction);
        }
    }
}

var clearMaxWidth = function (element) {
    // For now, this library assumes it is the keeper of all maxWidth
    // values in its DOM elements. If this element has a computed style
    // of 'center' (or anything besides 'start' aka left), that must
    // be because the window was shrunk and we responsively made it
    // left-justified and this library assigned it a maxWidth. If we
    // expand the window again, we need to reevaluate all maxWidths.
    // We start by erasing our previous work.
    element.style.maxWidth = '';
}

// Make the element as narrow as possible (by leaving the left side anchored and
// reducing the width) while maintaining its current height (number of lines). Binary search.
var squeezeContainerLeft = function (element, originalHeight, originalWidth, bottomRange, topRange, fraction) {
    // If we get within 5 pixels that's close enough, we don't need to
    // do the last 2 iterations. Call topRange the new minimum width.
    if (bottomRange + 5 >= topRange) {
        element.style.maxWidth = Math.round(originalWidth - fraction*(originalWidth-topRange)).toString() + 'px';
        return;
    }

    // Otherwise, pick the midpoint (maybe fractional) and squeeze to that size.

    var mid = (bottomRange + topRange) / 2;
    element.style.maxWidth = mid + 'px';

    if (element.clientHeight > originalHeight) {
        // we've squoze too far and element has spilled onto an additional line; recurse on wider range
        squeezeContainerLeft(element, originalHeight, originalWidth, mid+1, topRange, fraction);
    } else {
        // element has not wrapped to another line; keep squeezing!
        squeezeContainerLeft(element, originalHeight, originalWidth, bottomRange+1, mid, fraction);
    }
}

exports.balanceText = textBalancer;
