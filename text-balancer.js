(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory(root));
    } else if (typeof exports === 'object') {
        module.exports = factory(root);
    } else {
        root.textBalancer = factory(root);
    }
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

    'use strict';

    /**
     * Variables.
     */
    var window = root; // Map window to root to avoid confusion.
    var publicMethods = {}; // Placeholder for public methods

    // Default settings.
    var defaults = {
        candidates: [],
        targetClass: 'balance-text',
        splitOnLowercase: true
    };

    /**
     * Methods.
     */

    /**
     * Merge two or more objects. Returns a new object.
     * @private
     * @param {Boolean} deep - If true, do a deep (or recursive) merge [optional].
     * @param {Object} objects - The objects to merge together.
     * @returns {Object} - Merged values of defaults and options.
     */
    var extend = function () {
        // Variables.
        var extended = {};
        var deep = false;
        var i = 0;
        var length = arguments.length;

        // Check if it's a deep merge.
        if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
            deep = arguments[0];
            i++;
        }

        // Merge the object into the extended object.
        var merge = function (obj) {
            for (var prop in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                    // If deep merge and property is an object, merge properties.
                    if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                        extended[prop] = extend(true, extended[prop], obj[prop]);
                    } else {
                        extended[prop] = obj[prop];
                    }
                }
            }
        };

        // Loop through each object and conduct a merge.
        for (; i < length; i++) {
            var obj = arguments[i];
            merge(obj);
        }

        return extended;
    };

    /**
     * Returns a function, that, as long as it continues to be invoked, will not
     * be triggered.
     * @private
     * @param {Function} func - The function to call.
     * @param {Number} wait - The time to wait before the function is called.
     * @param {Boolean} immediate - Trigger the function on the leading edge,
     *     instead of the trailing.
     * @returns {Function} - Function that gets triggered after wait.
     */
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

    /**
     * Populates our candidates array with DOM objects
     * that need to be balanced.
     * @private
     * @param {Array} selectors - Elements to be balanced.
     * @returns {Array} - NodeList of elements to be balanced.
     */
    var createSelectors = function(selectors) {
        var newSelectors = [];

        for (var i = 0; i < selectors.length; i++) {
            var currentSelectorElements = document.querySelectorAll(selectors[i].trim());

            for (var j = 0; j < currentSelectorElements.length; j++) {
                var currentSelectorElement = currentSelectorElements[j];

                newSelectors.push(currentSelectorElement);
            }
        }

        return newSelectors;
    };

    /**
     * See if our element has multiple lines.
     *
     * We achieve this by turning the first word into a span
     * and then comparing the height of that span to the height
     * of the entire headline. If the headline is bigger than the
     * span by 10px we balance the headline.
     * @private
     * @param {NodeList} element - Element to be resized
     * @returns {Boolean}
     */
    var elementIsMultipleLines = function (element) {
        var firstWordHeight;
        var elementHeight;
        var HEIGHT_OFFSET;
        var elementWords;
        var firstWord;
        var ORIGINAL_ELEMENT_TEXT;

        ORIGINAL_ELEMENT_TEXT = element.innerHTML;

        /**
         * Usually there is around a 5px discrepancy between
         * the first word and the height of the whole headline
         * so subtract the height of the headline by 10px and
         * we should be good.
         */
        HEIGHT_OFFSET = 10;

        /**
         * Get all the words in the headline as an array -- will
         * include punctuation.
         *
         * This is used to put the headline back together.
         */
        elementWords = element.innerHTML.split(' ');

        /**
         * Make a <span> for the first word and give it an ID so
         * that we can access it in the DOM.
         */
        firstWord = document.createElement('span');
        firstWord.id = 'textbalancer-element-first-word';
        firstWord.innerHTML = elementWords[0];

        /**
         * Get the entire headline as an array except the first word,
         * since we will append it to the headline after the span.
         */
        elementWords = elementWords.slice(1);

        // Empty the headline and append the span to it.
        element.innerHTML = '';
        element.appendChild(firstWord);

        // Add the rest of the element back to it.
        element.innerHTML += ' ' + elementWords.join(' ');

        // Update the first word variable in the DOM.
        firstWord = document.getElementById('textbalancer-element-first-word');

        // Get height of the first word and the full element.
        firstWordHeight = firstWord.offsetHeight;
        elementHeight = element.offsetHeight;

        // Restore the original element text.
        element.innerHTML = ORIGINAL_ELEMENT_TEXT;

        // Compare the height of the element and the height of the first word.
        return elementHeight - HEIGHT_OFFSET > firstWordHeight;
    };

    /**
     * Get the "breaking" words of an elements. This function returns the
     * last word on the first line, the first word on the second line and
     * the index of the first word on the second line.
     * @private
     * @param {NodeList} element - Element to get the breaking words from.
     * @returns {Array|null} - Array consisting of last word, first word
     *      and index or null.
     */
    var getBreakingWords = function (element) {
        // If no element is passed, return early.
        if (!element) return;

        var breakingWords = [];
        var text = element.innerHTML;
        var words = text.split(' ');

        // Set element text to first word only.
        element.innerHTML = words[0];

        // Get height of element.
        var height = element.offsetHeight;

        /**
         * We loop through each word one by one and it to the inner
         * HTML. As soon as the height increases (which means theres
         * a new line), we stop and return the words before and after
         * the line break and the index.
         */
        for (var i = 1; i < words.length; i++) {
            element.innerHTML = element.innerHTML + ' ' + words[i];

            if (element.offsetHeight > height) {
                breakingWords = [words[i-1], words[i], i];
                element.innerHTML = text;

                return breakingWords;
            }
        }

        // No line break detected.
        return;
    };

    /**
     * Check if a word starts with a lowercase letter.
     * @private
     * @param {String} word - Word to check.
     */
    var isLowercaseWord = function (word) {
        // If no word is passed, return early.
        if (!word) return;

        // Get first letter of word.
        var firstLetter = word.charAt(0);

        // Returns true if the first letter is lowercase.
        return firstLetter === firstLetter.toLowerCase();
    };

    /**
     * Get new width of element. This function is used to change the
     * width so that the first word of the second line fits onto
     * the first line.
     * @private
     * @param {NodeList} element - Element to change width.
     * @param {Number} index - Index of the first word of the second line.
     * @returns {Number} - New width of the element.
     */
    var getNewWidth = function (element, index) {
        // If no element or index is passed, return early.
        if (!element || !index) return;

        var newWidth = 0;
        var text = element.innerHTML;
        var initialDisplay = element.style.display;

        /**
         * Get the full text of the first line plus the
         * first word of the second line.
         */
        var widthText = text.split(' ').slice(0, index + 1).join(' ');

        /**
         * Add the text to the HTML of the element and reset
         * its width.
         */
        element.innerHTML = widthText;
        element.style.width = 'auto';
        element.style.maxWidth = '';
        // If it's block it will take up the full width and the function won't work.
        element.style.display = 'inline-block';

        // Get the new width.
        newWidth = element.offsetWidth;

        // Reset element back to its initial state.
        element.innerHTML = text;
        element.style.display = initialDisplay;

        return newWidth;
    };

    /**
     * Make the element as narrow as possible while maintaining
     * its current height(number of lines). Binary search.
     * @private
     * @param {NodeList} element - The element to be balanced.
     * @param {Number} originalHeight - The original height of the element.
     * @param {Number} bottomRange - Bottom range of the (potential) width.
     * @param {Number} topRange - Top range of the (potential) width.
     */
    var squeezeContainer = function (element, originalHeight, bottomRange, topRange) {
        // Set a variable for the average of the top and bottom range.
        var mid;

        /**
         * If the bottom range is equal to or larger than the top range,
         * we've found the new width of our container.
         */
        if (bottomRange >= topRange) {
            /**
             * Set new width of the container, rounding it up and adding
             * one extra pixel to avoid some edge cases.
             */
            element.style.maxWidth = Math.ceil(topRange + 1) + 'px';

            if (!settings.splitOnLowercase) {
                // Get the last word of the first line and the first word of the second line.
                var breakingWords = getBreakingWords(element);

                // Make sure breakingWords has the correct format.
                if (Array.isArray(breakingWords)) {
                    /**
                     * If last word on first line is lowercase but the word after that isn't,
                     * add extra width to make both words fit on the first line.
                     */
                    if (isLowercaseWord(breakingWords[0]) && !isLowercaseWord(breakingWords[1])) {
                        var newWidth = getNewWidth(element, breakingWords[2]);

                        element.style.maxWidth = Math.ceil(newWidth + 1) + 'px';
                    }
                }
            }

            // Return to avoid an infinite squeezing loop.
            return;
        }

        mid = (bottomRange + topRange) / 2;
        element.style.maxWidth = mid + 'px';

        if (element.clientHeight > originalHeight) {
            /**
             * We've squeezed too far and element has spilled onto
             * an additional line; recurse on wider range.
             */
            squeezeContainer(element, originalHeight, mid + 1, topRange);
        } else {
            // Element has not wrapped to another line; keep squeezing!
            squeezeContainer(element, originalHeight, bottomRange + 1, mid);
        }
    };

    /**
     * Initialize our recursive binary search.
     * @private
     * @param {NodeList} elements - Elements to be balanced.
     */
    var balanceText = function (elements) {
        var element;
        var i;

        for (i = 0; i < elements.length; i++) {
            element = elements[i];

            if (elementIsMultipleLines(element)) {
                element.style.maxWidth = '';

                squeezeContainer(element, element.clientHeight, 0, element.clientWidth);
            }
        }
    };

    /**
     * Initalize plugin.
     * @param {Object} options Options supplied by the user.
     */
    publicMethods.init = function (options) {
        // Merge user options with defaults.
        var settings = extend(defaults, options || {});

        // See if the user passed specific elements to toggle.
        if (!settings.candidates || settings.candidates.length === 0) {
            // If not, just balance all elements with the target class.
            settings.candidates = document.querySelectorAll('.' + settings.targetClass);
        } else {
            // If they did, add those specific elements to our settings.
            settings.candidates = createSelectors(settings.candidates);
        }

        balanceText(settings.candidates);

        // Listen for window resize events.
        window.addEventListener('resize', function () {
            debounce(function() {
                balanceText();
            }, 100);
        }, false);
    };

    /**
     * Public APIs
     */

    return publicMethods;

});
