textBalancer = (function () {

    var candidates = [];

    // pass in a string of selectors to be balanced.
    // if you didnt specify any, thats ok! We'll just
    // balance anything with the balance-text class
    var initialize = function (selectors) {

        if (!selectors) {
            candidates = document.querySelectorAll('.balance-text');
        } else {
            createSelectors(selectors);
        }

        balanceText();

        var rebalanceText = debounce(function() {
            balanceText();
        }, 100);

        window.addEventListener('resize', rebalanceText);
    }

    // HELPER FUNCTION -- initializes recursive binary search
    var balanceText = function () {
        var element;
        var i;

        for (i = 0; i < candidates.length; i += 1) {
            element = candidates[i];

            if (textElementIsMultipleLines(element)) {
                element.style.maxWidth = '';
                squeezeContainer(element, element.clientHeight, 0, element.clientWidth);
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

    // Make the headline element as narrow as possible while maintaining its current height (number of lines). Binary search.
    function squeezeContainer(headline, originalHeight, bottomRange, topRange) {
        var mid;
        if (bottomRange >= topRange) {
            headline.style.maxWidth = topRange + 'px';
            return;
        }
        mid = (bottomRange + topRange) / 2;
        headline.style.maxWidth = mid + 'px';

        if (headline.clientHeight > originalHeight) {
            // we've squoze too far and headline has spilled onto an additional line; recurse on wider range
            squeezeContainer(headline, originalHeight, mid+1, topRange);
        } else {
            // headline has not wrapped to another line; keep squeezing!
            squeezeContainer(headline, originalHeight, bottomRange+1, mid);
        }
    }

    // this populates our candidates array with dom objects
    // that need to be balanced
    var createSelectors = function(selectors) {
        selectorArray = selectors.split(',');
        for (var i = 0; i < selectorArray.length; i += 1) {
            var currentSelectorElements = document.querySelectorAll(selectorArray[i].trim());

            for (var j = 0; j < currentSelectorElements.length; j += 1) {
                var currentSelectorElement = currentSelectorElements[j];
                candidates.push(currentSelectorElement);
            }
        }
    }

    // function to see if a headline is multiple lines
    // we only want to break if the headline is multiple lines
    var textElementIsMultipleLines = function (element) {
        var elementStyles = window.getComputedStyle(element);
        var elementLineHeight = parseInt(elementStyles['line-height'], 10);
        var elementHeight = parseInt(elementStyles['height'], 10);
        return elementLineHeight < elementHeight;
    }

    return {
        initialize: initialize,
    };

})(); // end textBalancer
