let perf1 = performance.now();
let jObject = {
    Navigation: [
        {
            Name: 'Common',
            Id: 'nav-monsieur'
        },
        {
            Name: 'MonsieurContent',
            Id: 'nav-monsieur-content'
        },
        {
            Name: 'Monsieur Templators',
            Id: 'nav-monsieur-mtmtb'
        },
        {
            Name: 'MonsieurLoading',
            Id: 'nav-monsieur-load'
        },
        {
            Name: 'MonsieurTutor',
            Id: 'nav-monsieur-tutor'
        },
        {
            Name: 'MonsieurTooltip',
            Id: 'nav-monsieur-tooltip'
        }
    ]
};
let Navigation = new Lure.Content({
    Disabled: true,
    Target: '.header',
    Content: `<div class="navigation row"></div>`,
    Controller: {
        Data: jObject.Navigation,
        ListElement: `<div class="element button" id="{{Id}}">{{Name}}</div>`
    }
});


// ###### COMMON
let HelloWorld = new Lure.Content({
    Target: '.main-content',
    Type: 'content',
    Visible: true,
    Content: `<div class="content hello-world">
                <h2>Hello World</h2>
                <p>Everybody likes to show own useless helloworlds, so, I'll show too.</p>
                <div class="s1"></div>
                <br>
                <p>Okay, this is too easy and too useless. Let is try again</p>
                <div class="s2"></div>
                <br>
                <p>This content uses a Controller (Templator by default), who changes name by button click. Changeable elements wrap to &lt;span/&gt;</p>
            </div>`,
    Control: [{Target: '#cmn-hello'}],
});




/*--------*/
let x = new Lure.Content({
    Target: 'main',
    Content: `<div class="sample">
<h2>{{title}}</h2>
<div class="element">
    <button class="button element">refresh</button>
</div>
<p>Random value here is {{number}}</p>
</div>`,
    Controller: {
        Data: {title: 'Refresh test', number: 0}
    },
    AfterBuild: function () {
        let self = this;

        this.Select('.button').onclick = function () {
            self.Data.number = Math.round(Math.random()*100);
            self.Refresh();
        }
    }
});

let xx = new Lure.Content({
    Target: 'main',
    Content: `<div class="counter content-box">
                <div>Sum is : <span class="count-sum">0</span></div>
                <button class="button">Add Line</button>
                <div class="counter-lines"></div>
              </div>`,
    Title: '.count-sum',
    Controller: {
        Target: '.counter-lines',
        ListElement: `<div class="counter-line row element" style="display: flex">
                        <div class="c-item dec element">-</div>
                        <div class="c-item-val element">{{val}}</div>
                        <div class="c-item inc element">+</div>
                      </div>`,
    },
    Methods: function () {
        this.CalcSum = function () {
            let sum = 0;
            this.Data.forEach(function (item) {
                sum += item.val;
            });
            this.Title = sum;
        }.bind(this);
    },
    AfterBuild: function () {
        this.Select('.button').onclick = function () {
            this.Add({val: 0});
        }.bind(this);
        this.AddEventListener('click', '.c-item', function (e) {
            let it = e.currentTarget;
            let i = it.parentElement.dataset['line'];
            if (it.classList.contains('inc'))
                this.Data[i].val++;
            else
                this.Data[i].val--;
            this.RefreshOne(i);
            this.CalcSum();
        }.bind(this));
    }
});


/*Sample timer*/
let timr = new Lure.Content({
    Disabled: true,
    Target: 'main',
    Content: `<div class="b">This example was started <strong>{{time}} seconds</strong> ago</div>`,
    Controller: {
        Data: {}
    },
    AfterBuild: function () {
        let $this = this;
        this.StartTime = new Date();
        this.Timer = setInterval(function () {
            $this.Data.time = (Math.round((new Date() - $this.StartTime)/100)/10).toFixed(1);
            $this.Refresh();
        }, 100);

    }
});

Lure.Perf(perf1, 'doc.js');