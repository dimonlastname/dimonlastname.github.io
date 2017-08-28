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
let Navigation = new MonsieurContent({
    Disabled: true,
    Target: '.header',
    Content: `<div class="navigation row"></div>`,
    Controller: {
        Data: jObject.Navigation,
        ListElement: `<div class="element button" id="{{Id}}">{{Name}}</div>`
    }
});


// ###### COMMON
let HelloWorld = new MonsieurContent({
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
    AfterBuild: function () {
        this.Select('.s1').appendChild( BuildSample(`let hello = new MonsieurContent({
        Target: 'body',
        Content: \`<div class="sample hello">
                    <h2>Hello World!</h2>
                  </div>\`
    })`));
        this.Select('.s2').appendChild( BuildSample(`let hello = new MonsieurContent({
    Target: 'body',
    Content: \`<div class="sample hello">
                <h2>Hello {{name}}!</h2>
                <button>Hi, but I a, Alex.</button>
               </div>\`,
    Controller: {
        Data: {
            name: 'World' // Default data
        }
    },
    AfterBuild: function(){
        let self = this;
        this.Select('button').onclick = function(){
            this.remove();
            self.Data.name = 'Alex';
            self.Refresh();
            }
    }   
});`) );
    }

});
// #### More Samples
let MoreSamples = new MonsieurContent({
    Target: '.main-content',
    Type: 'content',
    Content: `<div class="content hello-world">
                <h2>Button click</h2>
                <p>If the content have to been refreshed, need set a controller. Onclick change what needs, and refresh the Controller. There are changeable fields will be rerendered only.</p>
                <div class="s1"></div>
                <br>
                <h2>Counter</h2>
                <p>Add row onclick, on increase/decrease value refresh sum.</p>
                <div class="s2"></div>
                
</div>`,
    Control:  [{Target: '#cmn-samples'}],
    AfterBuild: function () {
        this.Select('.s1').appendChild( BuildSample(`new MonsieurContent({
    Target: 'body',
    Content: \`<button class="button">'{{Name}}' was clicked {{count}} times</button>\`,
    Controller: {
        Data: {Name: "TheButton", count: 0}
    },
    OnClick: function () {
        this.Data.count++;
        this.Refresh();
        }
        
    });`));

        this.Select('.s2').appendChild( BuildSample(`new MonsieurContent({
    Target: 'body',
    Content: \`<div class="counter content-box">
                <div>Sum is : <span class="count-sum">0</span></div>
                <button class="button">Add Line</button>
                <div class="counter-lines"></div>
              </div>\`,
    Title: '.count-sum',
    Controller: {
        Target: '.counter-lines',
        ListElement: \`<div class="counter-line row element" style="display: flex">
                        <div class="c-item dec element">-</div>
                        <div class="c-item-val element">{{val}}</div>
                        <div class="c-item inc element">+</div>
                      </div>\`,
    },
    Methods: function () {
        let $this = this;
        this.CalcSum = function () {
            let sum = 0;
            $this.Data.forEach(function (item) {
                sum += item.val;
            });
            $this.Title = sum;
        }
    },
    AfterBuild: function () {
        let $this = this;
        this.Select('.button').onclick = function () {
            $this.Add({val: 0});
        };
        this.AddEventListener('click', '.c-item', function (e) {
            let it = e.currentTarget;
            let i = it.parentElement.dataset['line'];
            if (it.classList.contains('inc'))
                $this.Data[i].val++;
            else
                $this.Data[i].val--;
            $this.RefreshOne(i);
            $this.CalcSum();
        });
    }
});`,'',`.element{
    padding: 10px;
}
.dec, .inc{
    cursor:pointer;
}`));

    }
});

// #### Self sampple menu
let MenuSample = new MonsieurContent({
    Target: '.main-content',
    Type: 'content',
    Content: `<div class="content">
    <h2>This menu</h2>
    <p>Так построено собственнное меню слева</p>
    <pre><code class="code-js language-js"></code></pre>
</div>`,
    Control: [{Target: '#cmn-menu'}],
    AfterBuild: function () {
        this.Select('code').innerText = `let MenuTree = new MonsieurContent({
    Target: '.main-menu',
    Content: \`<div class="menu-common menu-box"></div>\`,
    Controller: {
        Type: TreeBuilder,
        Data: [
            {
                Name: 'Common',
                Common: [
                    {
                        Name: 'Hello World',
                        Id: 'cmn-hello'
                    },
                    {
                        Name: 'More Samples',
                        Id: 'cmn-samples'
                    },
                    {
                        Name: 'This menu sample',
                        Id: 'cmn-menu'
                    }
                ]
            },
            {
                Name: 'Cat 2',
                Common: [
                    {
                        Name: 'Hello World',
                        Id: 'cat1'
                    },
                    {
                        Name: 'More Samples',
                        Id: 'cat2'
                    }
                ]
            }
        ],
        ListElement: \`<div class="menu-common__item menu__element" data-type="{{$key}}">
            <div class="element head" data-type="{{$key}}" id="{{Id}}">{{Name}}</div>
        </div>\`
    }
});`;
        hljs.highlightBlock(this.Select('code'));
    }
});
// ###### CONTENT CONSTRUCTOR
let ccGeneral = new MonsieurContent({
    Target: '.main-content',
    Type: 'content',
    Content: `<div class="content general-desc">
    <h2>General</h2>
    
    <div class="table"></div>
    <br><br>
    <p>Конструктор также самозадокументирован в коде</p>
    <pre><code class="code-js language-js"></code></pre>
</div>`,
    Control: [{Target: '#cc-gen'}],
    Controller: {
        Target: '.table',
        Data: [
            {
                name: 'Target',
                desc: 'Цель рендера (куда рендерить). Необходим для корневого Компонента. Для дочерних будет приниматься как корневой ДОМ Контента родительского, если не задано иное значение.'
            },
            {
                name: 'Content',
                desc: 'Содержимое компонента. Если не задано, будет использоваться содержимое Цели'
            },
            {
                name: 'Name',
                desc:  'Имя компонента. Необходимо дочерним элементам (SubContent), для ображения к ним через this.SubComponentName, или для поиска this.GetContent(\'Name\')'
            },
            {
                name: 'Global',
                desc: 'Для дочернего компонента. Задать true если дочерний компонент (по Target) находится вне родительского'
            },
            {
                name: 'Title',
                desc: 'header element, contains name/caption/title of content'
            },
            {
                name: 'Type',
                desc: 'Если компонент является схожим с другим, и они не отображаются одновременно, необходимо задать тип Контента. Компоненты с заданным типом по умолчанию невидимы. Если необходима видимость, задате свойство Visible=true'
            },
            {
                name: 'Visible',
                desc: 'Видимость компонента после рендера'
            },
            {
                name: 'Dialog',
                desc: 'Если диалоговое окно'
            },
            {
                name: 'Shower',
                desc: 'Функция-показывалка компонента. По умолчанию задает display: "". рекомендуется для анимации показа компонента'
            },
            {
                name: 'Hider',
                desc: 'Функция-скрывалка компонента. По умолчанию задает display: "none". рекомендуется для анимации скрытия компонента'
            },
            {
                name: 'Show',
                desc: 'Функция показа объекта, вызввается после Shower. '
            },
            {
                name: 'Hide',
                desc: 'Функция скрытия объекта, вызввается после Hider. '
            },
            {
                name: 'BeforeShow',
                desc: 'Функция, вызввается до Shower и Show. Рекомендуется для загрузки данных для контроллера компонента с сервера, до его показа.'
            },
            {
                name: 'Refresh',
                desc: 'Функция-обновление компонента, по умолчанию вызывает обновление контроллера, если он есть'
            },
            {
                name: 'OnClick',
                desc: 'Функция вызваемая при клике на компонент'
            },
            {
                name: 'Controller',
                desc: 'Описание контроллера. Подробно в доке к контроллерам'
            },
            {
                name: 'Control',
                desc: 'Массив управляющих элементов. Например, кнопки, при нажатии на которые, необходимо показать компонент, и активировать нажатый контрол. Подробности отдельно.'
            },
            {
                name: 'SubContent',
                desc: 'Массив или объект полей таких же сетов конструктора для дочерних элементов. Для объекта с полями задавать свойство "Name" не нужно.'
            }
        ],
        ListElement: `<div class="row"><div class="keyword element">{{name}}</div><div class="element">{{desc}}</div></div>`
    },
    AfterBuild: function () {
        this.Select('code').innerText = `//--MonsieurContent Settings--
        Target     = null,              //{string, HTMLElement} - where to render       [by default this.Parent.Content];
        Content    = null,              //{string}  - html content string, if           [by default this.Target.innerHTML]
        Name       = null,              //{string}  - MonsieurContent's name. Need for search content by .GetContent(contentName)
        Global     = false,             //{bool}    - actual for SubContent. Set true, if SubContent is outside of Parent
        Title      = "",                //{string}  -  header element, contains name/caption/title of content
        Type       = "Untyped",         //{string}  - if has - this.Content will be invisible by default, if need be visible set next property:
        Visible    = undefined,         //{bool}    - make visible by default (if has no Type - visible by default)
        SubContent = [],                //{Array} of MonsieurContent Settings
        Dialog     = false,             //{bool} - make dialog absolute window with dialog wrapper
        DialogWrapper = true,           //{bool} - show dialog  wrapper bg
        DialogBlur = null,              //{string, jQuery, HTMLElement} target background for blur when dialog
        DialogAnimation = null,         //{string} - css animation name
        Show       = null,              //{function} - show action
        Hide       = null,              //{function} - hide action
        Shower     = function(){this.Content.style.display = '';},       //custom show handler [calls before .Show]
        Hider      = function(){this.Content.style.display = 'none';},   //custom hide handler [calls before .Hide]
        BeforeShow = function(){},      //{function} - calls before .Shower and .Show
        Refresh    = function(data, i){
            if (this.Controller)
                this.Controller.Refresh(data, i)
        },                              //{function} - refresh content, may be call on page resize for example
        OnClick    = null,              //{function} - this.Content.onclick event
        Controller = null,              //{object} contoller settings(Templator or TreeBuilder)
        Control    = null,              //{object} (help upper)


        Props      = function(){},      //{function}  - recomented for extra fields  for MonsieurContent (this.Extrafield =...)
        Methods    = function(){},      //{function}  - recomented for extra methods for MonsieurContent (this.ExtraMethod = function(){...} )
        GetSet     = {},                //{function}  - recomenter for extra getters and setters for MonsieurContent
        AfterBuild = function(){},      //{function} - calls after MonsieurContent init
        Disabled   = false,             //debugging,
        Parent     = null               //link to parent MonsieurContent of SubContent`;

        hljs.highlightBlock(this.Select('code'));
    }
});
let ccControl = new MonsieurContent({
    Target: '.main-content',
    Type: 'content',
    Content: `<div class="content control-desc">
    <h2>Control</h2>   
    <div class="table"></div>
    <br><br>
    <p>Пример использования нескольких контролов</p>
    <pre><code class="code-js language-js"></code></pre>
</div>`,
    Control: [{Target: '#cc-control'}],
    Controller: {
        Target: '.table',
        Data: [
            {
                name: 'Target',
                desc: 'Цель/выделение контрола. CSS-селектор или ДОМ-объект.'
            },
            {
                name: 'Global',
                desc: 'Если контрол создается динамически или переопределяется, необходимо задать true, для глобальной его прослушки'
            },
            {
                name: 'OnClick',
                desc: 'Функция при клике контрола. Если не задать, будет вызван component.Show(); Внутри функции this === ваш компонент'
            },
            {
                name: 'OnChange',
                desc: 'Функция при изменении контрола.  Внутри функции this === ваш компонент. Не рекомендуется к использованию.'
            },
        ],
        ListElement: `<div class="row"><div class="keyword element">{{name}}</div><div class="element">{{desc}}</div></div>`
    },
    AfterBuild: function () {
    this.Select('code').innerText = `let c = new MonsieurContent({
    Target: 'body',
    Content: \`<div></div>\`
    Control: [
        {
            Target: '.button',
            Global: True,
            OnClick: function(){
                this.Content.innerHTML = "test";
                this.Show();
            }
        },
        {
            Target: '#textbox',
            OnChange: function(e){
                this.Content.innerHTML = e.currentTarget.value;
                this.Show();
            }
        }
    ]
    });`;

    hljs.highlightBlock(this.Select('code'));
}
});

let ccSubContent = new MonsieurContent({
    Target: '.main-content',
    Type: 'content',
    Content: `<div class="content subcontn-desc">
    <h2>SubContent</h2>   
    <p>3 способа создания дочерних Контентов(компонентов)</p>
    <p>1 - в массив SubContent</p>
    <p>2 - в Объект SubContent</p>
    <p>3 - непосредственно в поле Компонента.</p>
    <p>В любом случае обращение к дочерним элементам: content.Child1.Refresh();</p>
    <pre><code class="code-js language-js"></code></pre>
</div>`,
    Control: [{Target: '#cc-subcontent'}],
    AfterBuild: function () {
        this.Select('code').innerText = `//1. Array []
let content = new MonsieurContent({
    Target: '.body',
    Content: \`<div class="content"></div>\`,
    SubContent: [
        {
            Name: 'Child1',
            Content: \`<div></div>\`,
        },
        {
            Name: 'Child2',
            Content: \`<div></div>\`,
        }
    ]
});
//2. Object {}
let content = new MonsieurContent({
    Target: '.body',
    Content: \`<div class="content"></div>\`,
    SubContent: {
        Child1: {
            Content: \`<div></div>\`,
        },
        Child2: {
            Content: \`<div></div>\`,
        },
    }
});
// 3. set property
let content = new MonsieurContent({
    Target: '.body',
    Content: \`<div class="content"></div>\`,
    Props: function () {
        this.Child1 = new MonsieurContent({
            Content: \`<div></div>\`,
            Parent: this
        });
        this.Child2 = new MonsieurContent({
            Content: \`<div></div>\`,
            Parent: this
        })
    }
});`;

        hljs.highlightBlock(this.Select('code'));
    }
});

// ###### CONTROLLERS

let CTemplatorMain = new MonsieurContent({
    Target: '.main-content',
    Type: 'content',
    Content: `<div class="content subcontn-desc">
        <h2>Templator</h2>   
        <p>Встроенный шаблонизатор. Имеент 2 способа применения:</p>
        <p>1 - обновление компонента по объекту</p>
        <p>2 - перестроение компонента по массиву объектов</p>
        <br><br>
        `,
    Control: [{Target: '#mt-main'}],
    SubContent: [
        {
            Name: 'Variables',
            Content: `<div class="table">
                        <div class="element">Переменные</div>
                      </div>`,
            Controller: {
                Data: [
                    {
                        name: '$item',
                        desc: 'Всегда i-ый элемент массива элементов. Доступен в любом месте шаблона'
                    },
                    {
                        name: '$this',
                        desc: 'Текущий элемент объекта внутри цикла. Либо Data[i], либо Data.ArrayProperty[j] в пространстве #EACH'
                    },
                    {
                        name: 'i',
                        desc: 'Индекс глобального цикла'
                    },
                    {
                        name: 'j',
                        desc: 'Индекс текущего цикла'
                    },
                    {
                        name: '$num',
                        desc: 'Индексация с единицы. i+1'
                    },
                    {
                        name: '$denum',
                        desc: 'Индексация с конца. DataArray.length - i.'
                    },
                    {
                        name: '&',
                        desc: 'Выход на цикл выше из #each'
                    },

                ],
                ListElement: `<div class="row"><div class="keyword element">{{name}}</div><div class="element">{{desc}}</div></div>`
            },
        },
        {
            Name: 'Opers',
            Content: `<div class="table">
                        <div class="element">Операторы</div>
                      </div>`,
            Controller: {
                Data: [
                    {
                        name: '{{#if condition}} ... {{#endif}}',
                        desc: 'condition - обычное js-условие типа (fieldAge > 6). Содержимое будет отрендерено, если условие выполнено'
                    },
                    {
                        name: '{{#each Field}} ... {{#endeach}}',
                        desc: 'Field === $this.Field - поле(массив) текущего объекта. Если массив пуст или не существует то рендера не будет'
                    },
                    {
                        name: '{{#if (condition)? |yes|:|no|}}',
                        desc: 'Инлайн, локальное условие. Внутри используется js сравнениею Например {{#if (o.Age > 80)? |is old|: o.Age}} - где o === $this, Вернет сроку "is old" если возраст больше 80, и вернет возраст если не больше. Знак | заменят кавычки '
                    },

                ],
                ListElement: `<div class="row"><div class="keyword element">{{name}}</div><div class="element">{{desc}}</div></div>`
            },
        }
    ],

    });
let CTemplatorSimpleRefresh = new MonsieurContent({
    Target: '.main-content',
    Type: 'content',
    Content: `<div class="content subcontn-desc">
        <h2 class="title">Templator. Simple Refresh value = <span>{{number}}</span></h2>   
        <p>Обновляет элементы компонента в соответствии с Объектом данных. Обновляемые значения завернутся в span.</p>
        <p>Если нужно к обновляемому компоненту обновлять значение вне компонента, например у родителя, необходимо добавить поле контроллеру:</p>
        <p>this.Controller.FieldAdd(HTMLElement);</p>
        <pre><code class="code-js language-js"></code></pre>
        <div class="pre-preview"><div class="preview"></div></div>`,
    Control: [{Target: '#mt-simplerefresh'}],
    Props: function () {
        this.Simple = new MonsieurContent({
            Target: '.preview',
            Parent: this,
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
                this.Controller.FieldAdd(this.Parent.Select('.title span'));
                this.Select('.button').onclick = function () {
                    self.Data.number = Math.round(Math.random()*100);
                    self.Refresh();
                }
            }
        });
    },
    AfterBuild: function () {
        this.Simple.Refresh();
        this.Select('code').innerText = `let Simple = new MonsieurContent({
            Target: '.preview',
            Content: \`<div class="sample">
            <h2>{{title}}</h2>
        <div class="element">
            <button class="button element">refresh</button>
            </div>
            <p>Random value here is {{number}}</p>
        </div>\`,
            Controller: {
                Data: {title: 'Refresh test', number: 0}
            },
            AfterBuild: function () {
                let self = this;
                this.Controller.FieldAdd(this.Parent.Select('.title span'));
                this.Select('.button').onclick = function () {
                    self.Data.number = Math.round(Math.random()*100);
                    self.Refresh();
                }
            }
        });`;

        hljs.highlightBlock(this.Select('code'));
    }
});



/*--------*/

/*
let x = new MonsieurContent({
    Target: '.preview',
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
});*/




/*Sample timer*/
let timr = new MonsieurContent({
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







let isPrime = function(n){
    if (n < 2)
        return false;
    for (let i = 2; i< Math.ceil(Math.sqrt(n)); i++){
        if (n%i === 0 && i !== n)
            return false
    }
    return true;
};

let factorial = function (n){
    let sum = 1;
    for (let i = 1; i <= n; i++){
        sum *= i;
    }
    return sum;
};

let fib = function (n) {
    let num = 1;
    let prev = 0;
    let temp;
    for (let i = 1 ; i <n; i++){
        temp = prev;
        prev = num;
        num += temp;
    }
    return num;
};

function isSorted(arr){
    for (let i = 1; i < arr.length; i++){
        if (arr[i] < arr[i-1])
            return false;
    }
    return true;
}

function filter(arr, func){
    for (let i = 0; i < arr.length; i++){
        if (!func(arr[i]))
        {
            arr.splice(i, 1);
            i--;
        }
    }
    return arr;
}
function reverse(str){
    let out = '';
    for (let i = str.length-1; i >=0; i--){
        out +=str[i];
    }
    return out;
}
function isPalindrome(str){
    str = str.toLowerCase().replace(/\s/g, '');
    let out = '';
    for (let i = str.length-1; i >=0; i--){
        out +=str[i];
    }
    return out === str;
}
function missing(arr){
    let length = arr.length;
    if (length < 1)
        return undefined;
    let min = arr[0];
    for (let i = 1; i < length; i++){
        min = arr[i] < min ? arr[i] : min;
    }
    let res = [];
    for (let i = 0; i < length-1; i++){
        min++;
        if (arr.indexOf(min) === -1)
            return min;
    }
    return undefined;

}



mr.PerformanceNow(perf1, 'doc.js');





