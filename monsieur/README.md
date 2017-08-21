# HelloWorld

```javascript
let hello = new MonsieurContent({
        Target: 'body',
        Content: `<div class="sample hello">Hello World!</div>`
    })
```
# HelloWorld2
```javascript
let hello = new MonsieurContent({
    Target: 'body',
    Content: `<div class="sample hello">
                <h1>Hello {{name}}!</h1>
                <button>i'm not ivan</button>
              </div>`,
    Controller: {
        Data: {name: 'Ivan'}
    },
    AfterBuild: function(){
        let self = this;
        this.Select('button').onclick = function(){
            self.Data.name = 'Alex';
            self.Refresh();
            }
    }   
});
```
https://jsfiddle.net/dimonlastname/toz1z405/
# Counter
https://jsfiddle.net/dimonlastname/680Lp2qn/
