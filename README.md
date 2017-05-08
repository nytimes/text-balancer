# text-balancer

Text-balancer is a javascript module that seeks to eliminate typographic widows from text. It does this by setting the max-width of the dom node to the threshold that it would spill onto another line.

### How to run it

```
import textBalancer from 'text-balancer';

// Run it when you want to with any set of selectors
textBalancer.balanceText('.headline, .interactive-leadin, #horse-god');

// OR: Just run it and it will look for anything with the balance-text class
textBalancer.balanceText();
```
