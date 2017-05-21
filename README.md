# text-balancer

Text-balancer is a javascript module that seeks to eliminate typographic widows from text. It does this by setting the max-width of the dom node to the threshold that it would spill onto another line.

### Setup instructions

Install it into your project via npm

`npm install text-balancer --save`

https://www.npmjs.com/package/text-balancer

We use bramstein's Font Face Observer to check when our fonts have loaded: https://github.com/bramstein/fontfaceobserver

We run our text-balancer once our fonts load.

### How to run it

```javascript
import textBalancer from 'text-balancer';

// Run it when you want to with any set of selectors
textBalancer.balanceText('.headline, .interactive-leadin, #horse-god');

// OR: Just run it and it will look for anything with the balance-text class
textBalancer.balanceText();
```

### Tests

No tests right now, but we're working on them! It's being used on nytimes.com and has been debugged and tested extensively on that.
