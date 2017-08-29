//
// Lure Framework v0.9.1 [29.08.2017]
//
//<utils>;
if (!Date.prototype.format){
    Date.prototype.format = function (format) {
        return Lure._DateFormat(this, format);
    }
}
//</utils>
let Lure = (function(){
    class LureClass {
        constructor() {
            this.Plugin = {};
            let $this = this;
            this.Debug = false;
            this.isEditableEventsEnabled = false;
            //regexes
            const regexEach = new RegExp(/{{#each\s+([^}]+)}}/g);
            const regexIfOuter = new RegExp(/{{#if\s+([^}]+)}}([\s\S]*?){{#endif}}/g);
            const regexIfInner = new RegExp(/{{#if([\s\S]*?)}}/g);
            const regexExpressions = new RegExp(/{{([^#}]+)}}/g);
            const regexEditable = new RegExp(/<[^>]+class=['"][\w\d\s-]*(editable)[\w\d\s-]*['"][^>]*>([^<]*)<[^>]*>/g);
            //compile helpers
            const spaces = "    ";
            const preCompileIfOuter = function(s){
                s = s
                    .replace(/#IF/g, '#if')
                    .replace(/#ENDIF/g, '#endif')
                    .replace(regexIfOuter, function (bkt, condition, expression ) {
                        return `\`+
/* OUTER "IF" */
(function($this){
    if (${preParseObjectChecker(condition)}) {
        return \`${expression}\`;
    }
    return '';
})($this)+\``;
                    });
                return s;
            };
            const preCompileIfInner = function(s){
                s = s.replace(regexIfInner, function (s, condition) {
                    condition = condition
                        .replace(/&gt;/g,  ">")
                        .replace(/&lt;/g,  "<")
                        .replace(/#less/g, " < ")
                        .replace(/#more/g, " > ")
                        .replace(/&amp;/g, "&")
                        .replace(/\|/g,    '"');
                    return `\`+
    /* LOCAL "IF" */
    (function(){
        return (${condition}); 
        return '';})()+\``;
                });
                return s;
            };
            const preCompileEach = function(s){
                s = s
                    .replace(/{{#EACH/g, "{{#each")
                    .replace(/{{#ENDEACH/g, "{{#endeach");
                let EachList = s.match(regexEach);
                let lvl = 0;
                if (EachList !== null){
                    for (let i = EachList.length-1; i >= 0; i--){
                        let current = EachList[i];
                        let isInnerEach = false;
                        lvl++;
                        let StartPoint = s.indexOf(current);
                        let EndPoint   = s.indexOf("{{#endeach}}", StartPoint);

                        let prevStarts = s.slice(0, StartPoint).match(regexEach);
                        prevStarts = prevStarts!==null ? prevStarts.length: 0;
                        let prevEnds = s.slice(0, StartPoint).match(/{{#endeach}}/g);
                        prevEnds = prevEnds!==null ? prevEnds.length: 0;
                        if ( (prevStarts > prevEnds ))
                        {
                            isInnerEach = true;
                            lvl = 0;
                        }
                        ////
                        let string_Each = s.slice(StartPoint, EndPoint+12);
                        let expression  = string_Each.slice(current.length, string_Each.length-12);
                        let ObjectName = current.replace(/{{#each\s+([\s\S]+)}}/, function(a,name){
                            return name;
                        });
                        ObjectName = preParseObjectChecker(ObjectName);
                        //the each template
                        let eachComplied = '`+' +
                            spaces.repeat(lvl)+'/* EACH */(function(inner, $parent){                                                                   \r\n' +
                            spaces.repeat(lvl)+'    if (!inner || (Object.keys(inner).length === 0 && inner.constructor === Object && isNaN(inner)))   \r\n' +
                            spaces.repeat(lvl)+'        return "";                                                                                     \r\n' +
                            spaces.repeat(lvl)+'    let string_result= "";                                                                             \r\n' +
                            spaces.repeat(lvl)+'    for(let j = 0; j < inner.length; j++){                                                             \r\n' +
                            spaces.repeat(lvl)+'        let $this = inner[j];                                                                          \r\n' +
                            spaces.repeat(lvl)+'        let o = inner[j];                                                                              \r\n' +
                            spaces.repeat(lvl)+'        string_result = string_result + \`'+preParse(expression) + '\`;                                \r\n' +
                            spaces.repeat(lvl)+'    }                                                                                                  \r\n' +
                            spaces.repeat(lvl)+'    return string_result;                                                                              \r\n' +
                            spaces.repeat(lvl)+'})('+ObjectName+', {$parent: typeof $parent !== "undefined"?$parent:null, $this: $this, i: i} ) +`         ';
                        s = s.replace(string_Each, eachComplied)

                    }
                }
                return s;
            };
            const preCompileEditable = function(s){
                return  s.replace(regexEditable, function (match, editable, content) {
                    match = match.replace(/<[\s\S]+?(>)/, function (a, b) {
                        return a.replace(b, ` data-line="{{i}}" data-property="${content.replace('{{','').replace('}}','')}">`);
                    });
                    return match.replace(content, `<div class="editable-helper editable-value">${content}</div><div class="editable-helper editable-icon"></div>`);
                });

            };
            const preParseObjectChecker = function (ObjectName) {
                //ok check if it's expression
                if (ObjectName.indexOf('Available + Dis')>-1)
                    ;//debugger;
                function checking(c) {

                    let s = c.replace(/\s/g, "");
                    let containsSpecialObject = (s.indexOf('$item')> -1 || s.indexOf('$this') > -1 || s.indexOf('$parent') > -1 ) ;
                    let containsSpecialObjectTreeBuiler = (s.indexOf('$index')> -1 || s.indexOf('$j')> -1 || s.indexOf('$key') > -1 || s.indexOf('$lvl') > -1 || s.indexOf('$g.') > -1 ) ;
                    let isSpecialSymbol = (s === "?" || s.indexOf("=") > -1 || s.indexOf(">") > -1|| s.indexOf("<") > -1);
                    let isString = s.match(/^["'\\][\s\S]*["'\\]$/) !== null;
                    let isIterator = s === "i" || s === "j";
                    let isNumber = !isNaN(s);
                    if (containsSpecialObject || containsSpecialObjectTreeBuiler || isIterator || isNumber || isString ||isSpecialSymbol){
                        if (s.indexOf('$g.') > -1){ //if global object
                            return s.replace('$g.', '');
                        }
                        return c;
                    }
                    return "o."+s;
                }
                ObjectName = ObjectName.replace(/[^\-+\/%()*]+/g, function (c) {
                    let parent = c.match(/&/g);
                    if (parent !== null){
                        for (let i = 0; i < parent.length; i++){
                            if (i < parent.length-1)
                                c = c.replace('&', "$parent");
                            else
                                c = c.replace('&', "$parent.$this");
                        }
                        return c;
                    }
                    else {
                        return checking(c);
                    }
                });
                ObjectName = ObjectName.replace(/\\'/g,"'");
                ObjectName = "("+ObjectName+")"; //fucking concatenation shell
                return ObjectName;
            };
            const preParse = function(c, isCheckExpression = true){
                return c.replace(regexExpressions, function(bkt, expression){
                    if (isCheckExpression)
                        return '${'+preParseObjectChecker(expression)+'}';
                    else
                        return '${'+expression+'}';
                });
            };
            /**
             * Template compiler
             * @param {string} DomString
             * @param {boolean} isListElement
             * @return {Function}
             * @constructor
             */
            this.Compile = function(DomString, isListElement) {
                DomString = DomString.replace(/[\n]+/g, " ").replace(/[ ]{3,}/g, '');
                //shell '
                DomString = DomString.replace(/'/g, "\\'");
                //.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
                if (isListElement)
                {
                    DomString = preCompileEditable(DomString);
                    DomString = preCompileIfOuter(DomString);
                    DomString = preCompileEach(DomString);
                }

                DomString = preParse(DomString);
                DomString = preCompileIfInner(DomString);
                let string_Function = `
let $this = o;
let $item = o;
let $num = i+1;
let $denum = length-i;
//treebuilder's
let $index;
let $key;
let $lvl;
let $j;
if (extra){
    $index = extra.$index;
    $key = extra.$key;
    $lvl = extra.$lvl;
    $j = extra.$j;
}
let string_Result = "";
if (o === undefined || (Object.keys(o).length === 0 && o.constructor === Object && isNaN(o)) ) 
    return '';
return \``;
                string_Function += DomString +'`;';
                //if ie
                //let isUnbrowser = true;
                //if (isUnbrowser){
                    string_Function = string_Function
                        .replace(/`/g, `'`)
                        .replace(/\$\{([^}]*)\}/g, function(match, val){
                        return `'+${val}+'`
                    });
                //}

                let function_f;
                try {
                    function_f = new Function('o', 'i', 'length', 'extra', string_Function);
                }
                catch (e){
                    console.info(string_Function);
                    console.error(e);
                }
                //console.log('Compiled:');
                //console.log(f);
                return function_f;
            };
            this._EditablesEventListenerRun = function(content){
                $this.AddEventListenerGlobal('dblclick', '.editable', function (e) {
                    $this.Editable.RemoveEdits();
                    $this.Editable.AddEdits(e.currentTarget);
                }, content);
                $this.AddEventListenerGlobal('click', '.editable-icon', function (e) {
                    $this.Editable.RemoveEdits();
                    $this.Editable.AddEdits(e.currentTarget.closest('.editable'));
                }, content);
                $this.AddEventListenerGlobal('dblclick', '.editable', function (e) {
                    $this.Editable.RemoveEdits();
                    $this.Editable.AddEdits(e.currentTarget);
                }, content);
                //editing
                $this.AddEventListenerGlobal('change', '.editable-editor', function (e) {
                    let val = e.currentTarget.value;
                    let valPrev = e.currentTarget.parentElement.dataset['value'];
                    if (val !== valPrev)
                        e.currentTarget.parentElement.classList.add('editable-waiting');
                    else
                        e.currentTarget.parentElement.classList.remove('editable-waiting');
                }, content);

                $this.AddEventListenerGlobal('keyup', '.editable-textbox', function (e) {
                    if(e.keyCode === 13) {
                        $this.Editable.Save(e.currentTarget.closest('.editable'),  e.currentTarget.value);
                        return false;
                    }

                    let val = e.currentTarget.value;
                    let valPrev = e.currentTarget.parentElement.dataset['value'];
                    if (val !== valPrev)
                        e.currentTarget.parentElement.classList.add('editable-waiting');
                    else
                        e.currentTarget.parentElement.classList.remove('editable-waiting');

                }, content);

                //save
                $this.AddEventListenerGlobal('click', '.editable-save-button', function (e) {
                    let EditableElement = e.currentTarget.closest('.editable');
                    $this.Editable.Save(e.currentTarget.closest('.editable'),  EditableElement.querySelector('.editable-editor').value);
                }, content);



                if ($this.isHasEditablesEventsEnabled)
                    return;
                document.addEventListener('click', function (e) {
                    if ( e.target.classList.contains('editable-helper') && document.querySelectorAll('.editable-helper, .editable-editing') !== null)
                    {
                        return;
                    }
                    $this.Editable.RemoveEdits();
                });
                $this.isHasEditablesEventsEnabled = true;
            };
            /**
             *
             * @param {string} string
             * @param {string} ownerTagName
             * @return {DocumentFragment}
             * @constructor
             */
            this.CreateElementFromString = function(string, ownerTagName = "div"){
                let frag = document.createDocumentFragment();
                let elem = document.createElement(ownerTagName);
                elem.innerHTML = string;
                while (elem.childNodes[0]) {
                    frag.appendChild(elem.childNodes[0]);
                }
                return frag.childNodes[0];
            };
            /**
             *
             * @param {string} string
             * @param {string} ownerTagName
             * @return {Array}
             * @constructor
             */
            this.CreateElementsFromString = function(string, ownerTagName = "div"){
                let frag = document.createDocumentFragment();
                let elem = document.createElement(ownerTagName);
                elem.innerHTML = string;
                while (elem.childNodes[0]) {
                    frag.appendChild(elem.childNodes[0]);
                }
                if (frag.childNodes.length > 0)
                {
                    let nodes = [];
                    for (let i = 0; i < frag.childNodes.length; i++)
                        nodes.push(frag.childNodes[i]);
                    return nodes;
                }
                return null;
            };
            /**
             *
             * @param {css, HTMLElement} query
             * @param parent
             * @return {HTMLElement}
             * @constructor
             */
            this.Select = function(query, parent = document){
                if (query === '' || query === null)
                    return null;
                return query instanceof Node ? query : parent.querySelector(query);
            };
            /**
             *
             * @param {string} Selector
             * @param {HTMLElement} parent
             * @return {NodeList}
             * @constructor
             */
            this.SelectAll = function(Selector, parent = document){
                if (typeof Selector === 'undefined')
                    return [];
                if (typeof Selector.tagName !== 'undefined' || Selector === document)
                    return [Selector];
                return parent.querySelectorAll(Selector);
            };
            /**
             *
             * @param {string} eventName
             * @param {string} selector
             * @param {function} handler
             * @param {HTMLElement} parent
             * @param {Lure.Content} thisArg
             * @constructor
             */
            this.AddEventListenerGlobal = function(eventName, selector, handler, parent = document, thisArg){
                parent.addEventListener(eventName, function(e) {
                    let target = e.target;
                    let isIt = false;
                    let event = Lure._EventClone(e);
                    let elems = parent.querySelectorAll(selector);
                    if (elems[0] === target)
                    {
                        event.currentTarget = target;
                        isIt = true;
                    }
                    if (!isIt){
                        for (let i = 0; i < elems.length; i++){
                            if (elems[i].contains(target)){
                                isIt = true;
                                event.currentTarget = target.closest(selector);
                                break;
                            }
                        }
                    }
                    if (isIt){
                        handler.call(thisArg? thisArg : event.currentTarget, event);
                    }
                });
            };
            /**
             *
             * @param {HTMLElement} HTMLElement
             * @return {boolean}
             */
            this.isVisible = function (HTMLElement){
                //check invisible state;
                let isVisibleSelf = function(element){
                    let ContentStyle = window.getComputedStyle(element);
                    if ( (ContentStyle.display === "none") || (ContentStyle.opacity === "0") || (ContentStyle.visibility === "hidden") )
                        return false;
                    //check for null-size
                    if ( (parseInt(ContentStyle.minWidth) === 0 || ContentStyle.minWidth === "auto")  && parseInt(ContentStyle.width) === 0)
                        return false;
                    if ( (parseInt(ContentStyle.minHeight) === 0 || ContentStyle.minHeight === "auto") && parseInt(ContentStyle.height) === 0)
                        return false;
                    return true;
                };
                let isVisibleParent = function (element) {
                    while (element.parentElement){
                        if (!isVisibleSelf(element.parentElement))
                        {
                            return false;
                        }
                        element = element.parentElement;
                    }
                    return true;
                };
                if (!isVisibleSelf(HTMLElement))
                {
                    return false;
                }

                return isVisibleParent(HTMLElement);

                return true;
            };
            /**
             *
             * @param e
             * @return {ClonedEvent}
             * @constructor
             */
            this._EventClone = function(e) {
                function ClonedEvent() {}
                let clone=new ClonedEvent();
                for (let p in e) {
                    let d = Object.getOwnPropertyDescriptor(e, p);
                    if (d && (!d.writable || !d.configurable || !d.enumerable || d.get || d.set)) {
                        Object.defineProperty(clone, p, d);
                    }
                    else {
                        clone[p] = e[p];
                    }
                }
                Object.setPrototypeOf(clone, e);
                return clone;
            };

            this.GetFileText = function (url) {
                return new Promise(function (resolve, reject) {
                    let xhr = new XMLHttpRequest();
                    xhr.onload = function () {
                        resolve( xhr.response);
                    };
                    xhr.onerror = function () {
                        reject(new Error(
                            'XMLHttpRequest Error: '+this.statusText));
                    };
                    if (url.indexOf('..') > -1)
                        url = url.replace('..', document.location.protocol + "//" + document.location.host);
                    else {
                        url = document.location.href.substring(0, document.location.href.lastIndexOf('/')+1) + url;
                    }
                    console.log('Lure.GetFileText', url);
                    xhr.open('GET', url);
                    //xhr.setRequestHeader('Content-Type',"text/plain; charset=x-user-defined");
                    xhr.send();
                });


            };
            this.GetInlineSize = function(elem, fontSize='1rem'){
                const hiddenStyle = "left:-10000px;top:-10000px;height:auto;width:auto;position:absolute;";
                const clone = document.createElement('div');
                for (let k in elem.style) {
                    try {
                        if ((elem.style[k] !== '') && (elem.style[k].indexOf(":") > 0)) {
                            clone.style[k] = elem.style[k];
                        }
                    } catch (e) {}
                }
                document.all ? clone.style.setAttribute('cssText', hiddenStyle) : clone.setAttribute('style', hiddenStyle);
                clone.style.fontSize = fontSize;
                clone.innerHTML = elem.innerHTML;
                parent.document.body.appendChild(clone);
                const sizes = {width:clone.clientWidth,height:clone.clientHeight};
                parent.document.body.removeChild(clone);
                return sizes;
            };
            this.isNumeric = function(n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            };
            //this.Content = Lure.Content;
            //this.Templator = Templator;
            /*editable*/
            //this.Editables = '.editable-waiting';
            this._DateFormat = function (date, format = "DD.MM.YYYY HH:mm:ss") {
                if (date === null || typeof date === 'undefined')
                    return '';
                let data = date.getDate();
                let mo = date.getMonth();
                let year = date.getFullYear();
                let hour = date.getHours();
                let min = date.getMinutes();
                let sec = date.getSeconds();

                return format
                    .replace('DD', data.toString().length < 2? `0${data}`: data )
                    .replace('D', data )
                    .replace('MMM', $this.Culture.MonthNames[mo] )
                    .replace('MM', mo.toString().length < 2 ? `0${mo}`:mo )
                    .replace('M', mo )
                    .replace('YYYY',year )
                    .replace('YY',year.toString().substring(2,2) )
                    .replace('Y',year )
                    .replace('HH',hour.toString().length < 2 ? `0${hour}`:hour )
                    .replace('hh',hour )
                    .replace('mm',min.toString().length < 2 ? `0${min}`:min )
                    .replace('ss',sec.toString().length < 2 ? `0${sec}`:sec );
            };
            this.Editable = {
                EditMode: false,
                RemoveWaiting(){
                    let waiedites = document.querySelectorAll('.editable-waiting');
                    waiedites.forEach(function (item) {
                        item.classList.remove('editable-waiting');
                    });
                },
                RemoveEdits(){
                    if ($this.Editable.EditMode)
                        return;
                    let editables = document.querySelectorAll('.editable-editing');
                    editables.forEach(function (item) {
                        item.innerHTML = item._innerHTML;
                        item.classList.remove('editable-editing');
                    });
                    $this.Editable.RemoveWaiting();
                },
                AddEdits(EditableElement){
                    EditableElement._innerHTML = EditableElement.innerHTML;
                    let ValuePrev = EditableElement.querySelector('.editable-value').innerHTML;
                    EditableElement.classList.add('editable-editing');
                    EditableElement.dataset['value'] = ValuePrev;
                   // EditableElement.style.paddingBottom = '0px';
                    //EditableElement.style.paddingTop = '0px';
                    let SaveButton = $this.Editable.EditMode? '': `<div class="editable-helper editable-save-button"></div>`;
                    if (!EditableElement.dataset['object']) //if no selectable data, just text editor is needed
                    {
                        let EditType = EditableElement.dataset['type'];
                        if (typeof EditType === 'undefined')
                            EditType = 'text';
                        EditableElement.innerHTML = `<input class="textbox editable-helper editable-editor editable-textbox" type="${EditType}" value="${ValuePrev}"> ${SaveButton}`;
                        EditableElement.querySelector('.editable-editor').focus();
                        EditableElement.querySelector('.editable-editor').select();
                    }
                    else    //selectable data
                    {
                        let string_Select = `<select class="select editable-helper editable-editor editable-select">`;
                        let SelectData = eval(EditableElement.dataset['object']);
                        //console.log('-SelectData data-', SelectData);
                        let Property = EditableElement.dataset['property'];
                        let SelectOptions = '';
                        SelectData.forEach(function (item) {
                            //SelectOptions += ``
                            let attributes = '';
                            if (typeof item === typeof {}){
                                for (let key in item)
                                {
                                    attributes += ` data-property_${key}="${item[key]}"`;
                                }
                                string_Select += `<option class="editable-helper" ${attributes}>${item[Property]}</option>`;
                            }
                            else{
                                string_Select += `<option class="editable-helper" ${(item === ValuePrev)? "selected":""}>${item}</option>`;
                            }
                        });
                        string_Select += `</select>${SaveButton}</div>`;
                        //let Select = Lure.CreateElementFromString(string_Select);
                        //Select.value = ValuePrev;
                        EditableElement.innerHTML = string_Select;

                    }


                },
                Save(EditableElement, ValueNew){
                    let Content = EditableElement.closest('.mt-content');
                    let Controller = Content.MonsieurController;
                    let i = EditableElement.dataset['line'];
                    let Property = EditableElement.dataset['property'];
                    let DataObject = Controller.Data[i];
                    if (ValueNew === '' || ValueNew === null || typeof ValueNew === 'undefined'){
                        console.info('New Value is empty');
                        Lure.ErrorHint(EditableElement, "Пустое поле или неправильные данные");
                        return;
                    }
                    EditableElement.innerHTML = EditableElement._innerHTML;
                    EditableElement.dataset['value'] = ValueNew;
                    EditableElement.querySelector('.editable-value').innerHTML = ValueNew;
                    EditableElement.classList.remove('editable-editing');
                    if (Property !== '$this' && Property !== "$item")
                        DataObject[Property] = ValueNew;
                    else
                        DataObject = ValueNew;


                    //so server now
                    Controller.LineSave(i, Property, ValueNew, function () {
                        Lure.Editable.RemoveWaiting();
                        if (Property !== '$this' && Property !== "$item")
                            Controller.Data[i][Property] = ValueNew;
                        else
                            Controller.Data[i] = ValueNew;
                    });
                }
            };
            ///
            this.Settings = {
                DialogBlur: null,                    //{string, jQuery, HTMLElement} - where blur on dialog
                DialogAnimation: 'lure-animation-dialog', //{string} -  css-animation class
                EditableClass:  'editable',
                EditableWaiting:  'editable-waiting',
            };
            this.Culture = {
                MonthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
                MonthNamesShort: ["янв.", "фев.", "мар.", "апр.", "май", "июн.", "июл.", "авг.", "сен.", "окт.", "ноя.", "дек."],
                WeekDays: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
                WeekDaysShort: ["пн", "вт", "ср", "чт", "пт", "сб", "вс"],
            };
            this.TemplatorList = [];
            this.ContentList = {};

            /////
            this._DialogCount = 0;
        };

        Perf(perfStart, text='Perf'){
            const x = Math.floor((window.performance.now()-perfStart)*100)/100;
            console.info("[" + text + "]: " + x + "ms");
            return x;
        }

        /**
         * Confirmation dialog
         * @param Caption
         * @param Message
         * @param CaptionColor
         * @param CaptionBackground
         * @param OnAgree
         * @param OnCancel
         * @constructor
         */
        Confirm(Caption  = "Achtung", Message = '', {
            CaptionColor =  '',
            CaptionBackground = '',
            OnAgree = () => {},
            OnCancel = null
        } = {})
        {

            document.activeElement.blur();


            let dialog = document.createElement('div');
            dialog.classList.add('lure-confirm');
            if (Lure.Settings.DialogAnimation)
                dialog.classList.add(Lure.Settings.DialogAnimation);
            //###title
            let title = document.createElement("div");
            title.classList.add('cd-caption');
            title.innerHTML = Caption;
            title.style.color = CaptionColor;
            title.style.background = CaptionBackground;
            dialog.appendChild(title);
            //###message field
            let msg = document.createElement("div");
            msg.classList.add('cd-text');
            msg.innerHTML = Message;
            dialog.appendChild(msg);
            //###buttonfield
            let buttons = document.createElement("div");
            buttons.classList.add("cd-buttons");
            dialog.appendChild(buttons);
            //###button confirm
            let btnOk = document.createElement("div");
            btnOk.classList.add("button", "cd-button", "btn-diag-confirm");
            btnOk.innerHTML = "Ok";
            btnOk.onclick = function(){
                Lure._DialogCount--;
                if (OnAgree !== null && OnAgree !== undefined)
                    OnAgree();
                if (Lure.Settings.DialogBlur && Lure._DialogCount < 1 )
                    Lure.Select(Lure.Settings.DialogBlur).classList.remove('lure-blur');
                //$(Lure.Settings.DialogBlur).removeClass('lure-blur');
                wrap.remove();
                dialog.remove();

            };
            dialog.getElementsByClassName("cd-buttons")[0].appendChild(btnOk);
            //###button cancel
            if (OnCancel !== null)
            {
                let btnCancel = document.createElement("div");
                btnCancel.classList.add("button", "cd-button", "btn-diag-cancel");
                btnCancel.innerHTML = "Отмена";
                btnCancel.onclick = function(){
                    Lure._DialogCount--;
                    if (OnCancel !== null)
                        OnCancel();
                    if (Lure.Settings.DialogBlur  && Lure._DialogCount < 1)
                        Lure.Select(Lure.Settings.DialogBlur).classList.remove('lure-blur');
                    //$(Lure.Settings.DialogBlur).removeClass('lure-blur');
                    wrap.remove();
                    dialog.remove();

                };
                dialog.getElementsByClassName("cd-buttons")[0].appendChild(btnCancel);
            }
            //### Dialog-Wrapper
            let wrap = document.createElement("div");
            wrap.classList.add('ConfirmDialog-wrapper');
            document.body.appendChild(wrap);
            document.body.appendChild(dialog);
            Lure._DialogCount++;
            if (Lure.Settings.DialogBlur)
            {
                wrap.style.background = 'none';
                Lure.Select(Lure.Settings.DialogBlur).classList.add('lure-blur');
                //$(Lure.Settings.DialogBlur).addClass('lure-blur');
            }
        }
        //Confirmation dialog teamplate just
        NoFeature(name = ""){
            if (name !== "")
                name = "\""+name+"\"";
            this.Confirm(
                "Error",
                "Sorry, function "+name+" is not available yet"
            )
        }

        /**
         *
         * @param object
         * @param msg
         * @constructor
         */
        ErrorHint(object, msg) {
            if (!msg)
                msg = "Поле не может быть пустым";
            let div = document.createElement('div');
            div.classList.add('lure-error-hint');
            div.innerHTML = msg;
            object.parentElement.style.position = 'relative';
            object.parentElement.appendChild(div);
            div.style.display = 'block';
            try {
                div.animate({opacity: [0, 1]}, {duration : 300});
            }
            catch (e){}

            setTimeout(function(){

                try {
                    div.animate({opacity: [1, 0]}, {duration : 300})
                        .onfinish = ()=>{div.style.display = 'none'};
                }
                catch (e){
                    div.style.display = 'none';
                }
                //TODO CHECK FADEIN FADEOUT
                setTimeout(function(){
                    object.parentElement.style.position = '';
                    div.remove();
                }, 500)
            }, 2000)
        }
    }
    return new LureClass();
})();
//sets = {
//  SubContent: [
//      {sets},                             -same object to create subs
// ],
//
// Controller:{                                   - if needs some Template master
//    Type: Templator,                                    - class link [optional] Templator by default
//    Target: {string|HTMLElement}                        -[optional] if Controller.Target is undefined, Controller.Target = sets.Target
//    Data: {array|object},                               - data array [optional] Data === [] by default
//    ListElement: {string|HTMLElement},                  - repeated element
//    EmptyMessage: "no items",                           - render if Data.length === 0;

//  Control: {
//    Target: {string, jQuery, HTMLElement},
//    Global: {bool}                               - set global event listener. Set true if control renders after init or it renders dynamicly
//    OnClick: {function}                          - here this === current Lure.Content
//    OnChange: {function}                         - here this === current Lure.Content
// },}

Lure.Plugin.Content = {
    Version: '0.9.1',
    Content: class LureContent {
        constructor({                       //--Lure.Content Settings--
                        Target     = null,              //{string, HTMLElement} - where to render       [by default this.Parent.Content];
                        Content    = null,              //{string}  - html content string, if           [by default this.Target.innerHTML]
                        CSS        = '',                //{string}  - css classes string
                        Name       = null,              //{string}  - Lure.Content's name. Need for search content by .GetContent(contentName)
                        Global     = false,             //{bool}    - actual for SubContent. Set true, if SubContent is outside of Parent
                        Title      = "",                //{string}  -  header element, contains name/caption/title of content
                        Type       = "Untyped",         //{string}  - if has - this.Content will be invisible by default, if need be visible set next property:
                        Visible    = undefined,         //{bool}    - make visible by default (if has no Type - visible by default)
                        SubContent = [],                //{Array} of Lure.Content Settings
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
                        Sorting    = false,             //{object}   - sort controls by field like 'field' -> '{css|HTMLElement}'  ex.: { count: '.head .count'}
                        Filtering  = false,             //{object}   - like sorting, but fast filter textbox would be
                        OnClick    = null,              //{function} - this.Content.onclick event
                        Controller = null,              //{object} contoller settings(Templator or TreeBuilder)
                        Control    = null,              //{object} (help upper)


                        Props      = function(){},      //{function}  - recomented for extra fields  for Lure.Content (this.Extrafield =...)
                        Methods    = function(){},      //{function}  - recomented for extra methods for Lure.Content (this.ExtraMethod = function(){...} )
                        GetSet     = {},                //{function}  - recomenter for extra getters and setters for Lure.Content
                        AfterBuild = function(){},      //{function} - calls after Lure.Content init
                        Disabled   = false,             //debugging,
                        Parent     = null               //link to parent Lure.Content of SubContent
                    })

        {
            if (Disabled)
                return;
            let $this = this;
            this.isContent = true;
            this.isActive = true;
            if (Name  === 'Tooltipchek')
                ;//debugger;

            this.Parent = Parent;
            if (Parent !== null){
                this.Target = Global? Lure.Select(Target) : Lure.Select(Target, this.Parent.Content);
                if (this.Target === null)
                    this.Target = this.Parent.Content;
            }
            else if (Target !== null){
                this.Target = Lure.Select(Target);
            }
            // debugger;
            ////
            if (Content === null){
                this.Content = this.Target;
                construct.call($this);
            }else{
                if (Content.match(/<[^>]+>/) === null) {//if not dom string
                    console.log('get load');
                    Lure.GetFileText(Content).then(x => {
                        // debugger;
                        //     console.log('x', x);
                        MakeContent.call($this, x);
                        construct.call($this);
                    });
                }else {
                    MakeContent.call($this, Content);
                    construct.call($this);
                }


            }
            function MakeContent(Content){
                if (Controller === null || Array.isArray(Controller.Data))
                {
                    this.Content = Lure.CreateElementFromString(Content);
                }
                else if (Controller !== null && !Array.isArray(Controller.Data))
                {
                    /*Content = Content.replace(/<[^>]+>([^<]*{{([^#}]+)}}[^<]*)<[^>]+>/g, function (match, group) {
                     let newGroup = group.replace(/{{[^#}]+}}/g, function (match) {
                     return match.replace(match, `<span>${match}</span>`);
                     });
                     return  match.replace(group, newGroup);
                     });*/
                    Content = Content.replace(/>[^>]*({{[^#}]+}})[^>]*</g, function (match, group) {
                        /*let newGroup = group.replace(/{{[^#}]+}}/g, function (match) {
                         return match.replace(match, `<span>${match}</span>`);
                         });*/
                        const x = match.replace(/{{[^#}]+}}/g, function (matche) {
                            return `<span>${matche}</span>`
                        });
                        return x;// match.replace(group, `<span>${group}</span>`);
                    });
                    this.Content = Lure.CreateElementFromString(Content);
                }
                //this._Content = Content;
                this.Target.appendChild(this.Content);
            }

            /////
            if (this.Content === null || this.Target === null)
            {
                this.isContent = false;
                return;
            }




            //### CONSTRUCTION
            if (CSS !== ''){
                let node = document.createElement('style');
                node.innerHTML = CSS;
                document.body.appendChild(node);
            }
            function construct(){
                this.Type = Type;
                this.Name = Name;
                this.AllContents = Lure.ContentList;


                //### METHODS
                /**
                 * @param {object} Data
                 * @param {int} index
                 */
                this.Refresh = Refresh.bind(this);
                /**
                 *
                 * @param {selector|HTMLElement} s
                 * @returns {HTMLElement}
                 * @constructor
                 */
                this.Select = function(s){
                    return Lure.Select(s, $this.Content)
                };
                /**
                 *
                 * @param {selector|HTMLElement} s
                 * @returns {NodeList}
                 * @constructor
                 */
                this.SelectAll = function(s){
                    return Lure.SelectAll(s, $this.Content)
                };
                /**
                 *
                 * @param {string}stringName
                 * @constructor
                 * @returns {Lure.Content}
                 */
                this.GetParent = function(stringName='root'){
                    let content = $this;
                    while (content.Parent !== null && content.Name !== stringName)
                        content = content.Parent;
                    return content;
                };
                /**
                 *
                 * @param {string}stringName
                 * @constructor
                 * @returns {Lure.Content}
                 */
                this.GetContent = function (stringName='root') {
                    let parent = this.GetParent(stringName);
                    if (parent.Name === stringName)
                        return parent;
                    // let root = parent;
                    let found = parent;
                    if (stringName === 'root')
                        return found;
                    let searcher0 = function (content) {
                        if (content.isContent && content.__private.ContentNames)

                            for( let i = 0; i < content.__private.ContentNames.length; i++){
                                let name = content.__private.ContentNames[i];
                                if (name === stringName)
                                    return content[name];
                                found = searcher(content[name])
                            }
                        return found;
                    };
                    let searcher = function (content) {
                        // debugger;
                        for(let key in content){
                            if (key !== "Parent" && !!content[key] && content[key].isContent){

                                if (content[key].Name === stringName)
                                    return content[key];
                                found = searcher(content[key]);
                            }

                        }
                        return found;
                    };
                    return searcher(found);

                };
                /**
                 *
                 * @param {HTMLElement|string} HTMLElement
                 * @returns {number|Number}
                 * @constructor
                 */
                this.GetIndex = function (HTMLElement) {
                    HTMLElement = $this.Select(HTMLElement);
                    return Array.prototype.slice.call( HTMLElement.parentElement.children ).indexOf(HTMLElement);
                };
                /**
                 *
                 * @param {string} eventName
                 * @param {string} selector
                 * @param {function} func
                 * @constructor
                 */
                this.AddEventListener = function (eventName, selector, func) {
                    Lure.AddEventListenerGlobal(eventName,selector,func, $this.Content, $this);
                };
                /**
                 *
                 * @param {string|HTMLElement} buttonTutorStarter
                 * @constructor
                 */
                this.AddTutor = function (buttonTutorStarter) {
                    $this.MonsieurTutor = new MonsieurTutor($this.Select(buttonTutorStarter), $this.Content);
                };
                //private
                this._SortBy = function(f, data, isSorted = false){
                    if (data.length < 2)
                        return;
                    console.log('sort by', f);
                    data.sort(function (a, b) {
                        if      ((a[f] < b[f]) && $this._Sorting[f].Sorted)
                            return 1;
                        else if ((a[f] > b[f]) && $this._Sorting[f].Sorted)
                            return -1;
                        else if ((a[f] < b[f]) && !$this._Sorting[f].Sorted)
                            return -1;
                        else if ((a[f] > b[f]) && !$this._Sorting[f].Sorted)
                            return 1;
                        return 0;
                    });
                    $this._Sorting[f].Sorted = !$this._Sorting[f].Sorted;
                    for (let kf in $this._Sorting){
                        if ($this._Sorting.hasOwnProperty(kf) && kf !== '_sorter'){
                            $this._Sorting[kf].Target.classList.remove('mt-sorting-up');
                            $this._Sorting[kf].Target.classList.remove('mt-sorting-down');
                            if (f !==kf)
                                $this._Sorting[kf].Sorted = false;
                        }
                    }
                    $this._Sorting[f].Target.classList.add($this._Sorting[f].Sorted ? 'mt-sorting-down':'mt-sorting-up');
                    $this.Refresh();
                };
                this._FilterBy = function () {
                    let p = performance.now();
                    let filters = 0;
                    let _d = $this._Filter._DataDefault.slice(0);
                    for (let f in $this._Filter){
                        if ($this._Filter.hasOwnProperty(f) && $this._Filter[f].Filter && $this._Filter[f].Filter !==''){
                            _d = _d.filter(x=>x[f].toString().toLowerCase().indexOf($this._Filter[f].Filter) > -1);
                            filters++;
                        }
                    }
                    console.log(_d);
                    if (filters === 0)
                    {
                        if ($this._Sorting._sorter){
                            $this._Sorting[$this._Sorting._sorter].Sorted = !$this._Sorting[$this._Sorting._sorter].Sorted;
                            $this._SortBy($this._Sorting._sorter, $this.Controller._Data);
                        }
                        $this.Controller.Refresh();
                    }
                    else
                    {
                        if ($this._Sorting._sorter){
                            $this._Sorting[$this._Sorting._sorter].Sorted = !$this._Sorting[$this._Sorting._sorter].Sorted;
                            $this._SortBy($this._Sorting._sorter, _d);
                        }
                        $this.Controller.PageSize = $this._PageSize;
                        $this.Controller._PageCursor = 0;
                        $this.Controller._Rebuilder(_d);

                    }

                    mr.PerformanceNow(p, 'FilterBy')
                };

                //extra properties
                Props.call(this);
                //extra getters/setters
                for(let k in GetSet){
                    Object.defineProperty($this, k, Object.getOwnPropertyDescriptor(GetSet, k));
                }
                //extra methods
                Methods.call(this);
                //--
                this.Show = function(e) {
                    this.isActive = true;
                    if (this.Control)
                        this.Control.Active();
                    let style = window.getComputedStyle($this.Content);
                    let duration = eval(style.transitionDuration.replace('ms', '*1').replace('s', '*1000'));
                    let durationAni = eval(style.animationDuration.replace('ms', '*1').replace('s', '*1000'));
                    if (duration < durationAni)
                        duration = durationAni;
                    duration++;
                    if ($this.Type !== "Untyped" && !$this.isVisible)
                    {
                        Lure.ContentList[$this.Type].forEach((item) =>
                        {
                            if ((item) !== $this && item.isActive)
                                item.Hide();
                        });
                    }
                    if (Dialog){
                        Lure._DialogCount++;
                        $this.Content.classList.add('lure-dialog');
                        //    console.log('DialogWrapper', DialogWrapper);
                        if (DialogWrapper){
                            $this.DialogWrapper = Lure.CreateElementFromString('<div class="dialog-wrapper">');
                            document.body.appendChild($this.DialogWrapper);
                            $this.DialogWrapper.onclick = $this.Hide.bind($this);

                            let zIndexWrapper = parseInt(window.getComputedStyle($this.DialogWrapper).zIndex);
                            let zIndexContent = parseInt(window.getComputedStyle($this.Content).zIndex);
                            if (Number.isNaN(zIndexContent) || zIndexContent < zIndexWrapper)
                                $this.Content.style.zIndex = zIndexWrapper+1;
                        }

                        if (DialogBlur)
                        {
                            $this.DialogWrapper.style.background = 'none';
                            Lure.Select(DialogBlur).classList.add('lure-blur');
                        }
                        if (DialogAnimation){
                            $this.Content.classList.add(DialogAnimation);
                        }
                    }
                    BeforeShow.call($this, e);
                    Shower.call($this, e);
                    $this.Content.style.display = '';
                    clearTimeout($this.__private.ToggleTimer);
                    //this.Content.addEventListener('transitionend', Show.bind($this, e));
                    if (Show !== null) {
                        $this.__private.ToggleTimer = setTimeout(function() {
                            Show.call($this, e);
                        },duration);
                    }
                };
                this.Hide = function(e) {
                    this.isActive = false;
                    if (this.Control)
                        this.Control.Disactive();
                    let style = window.getComputedStyle($this.Content);
                    let duration = eval(style.transitionDuration.replace('ms', '*1').replace('s', '*1000'));
                    let durationAni = eval(style.animationDuration.replace('ms', '*1').replace('s', '*1000'));
                    if (duration < durationAni)
                        duration = durationAni;
                    duration++;
                    if (Dialog)
                    {
                        Lure._DialogCount--;
                        if ($this.DialogWrapper)
                            $this.DialogWrapper.remove();
                        if (DialogBlur  && Lure._DialogCount < 1)
                            Lure.Select(DialogBlur).classList.remove('lure-blur');
                    }

                    Hider.call($this, e);
                    clearTimeout($this.__private.ToggleTimer);
                    if (Hide !== null)
                        $this.__private.ToggleTimer = setTimeout(function () {
                            Hide.call($this, e);
                        }, duration);

                };
                this.Toggle = function(e){
                    if ($this.isVisible)
                        $this.Hide(e);
                    else
                        $this.Show(e);
                };

                this.__private = {};
                this.__private.ToggleTimer = null;
                this.Control = new Lure.Plugin.Content.Control(Control, $this);
                this.Content.onclick = OnClick? OnClick.bind($this) : null;
                //SubContent
                if (Array.isArray(SubContent)){
                    for (let i = 0; i < SubContent.length; i++){
                        {
                            if (!SubContent[i].Parent)
                                SubContent[i].Parent = $this;
                            //  $this.__private.ContentNames.push(SubContent[i].Name);
                            $this[SubContent[i].Name] = new Lure.Content( SubContent[i] );
                        }
                    }
                }
                else {
                    for (let cname in SubContent){
                        SubContent[cname].Parent = $this;
                        SubContent[cname].Name = cname;
                        //       $this.__private.ContentNames.push(cname);
                        $this[cname] = new Lure.Content(SubContent[cname]);
                    }
                }
                //title
                this.TitleContent = Lure.Select(Title, this.Content);

                if ( (Type === "Untyped" && Visible !== false) && !Dialog)
                    Visible = true;
                else if ( (Type !== "Untyped" && Visible !== true) || ( Dialog && Visible !== true) )
                    Visible = false;
                //if (Typed) Content is Visible
                if (Visible){
                    this.Content.style.display = '';
                    if (this.Control)
                        this.Control.Active();
                }
                else { //not undefined
                    this.isActive = false;
                    this.Content.style.display = 'none';
                }
                if (Controller){
                    if (Controller.isController){
                        this.Controller = Controller;
                        this.Controller.Parent = this;
                    }
                    else{
                        if (!Controller.Target)
                            Controller.Target = this.Content;
                        if (!Controller.Type)
                            Controller.Type = "Templator";
                        Controller.Parent = this;
                        this.Controller = new Lure.Plugin.Content.Controller[Controller.Type](Controller);
                    }
                    if (this.Controller.isHasEditable)
                    {
                        Lure._EditablesEventListenerRun($this.Content);
                    }
                }

                if (Sorting){
                    $this._Sorting = {};
                    $this._Sorting._sorter = null;
                    for (let f in Sorting){
                        if (Sorting.hasOwnProperty(f) && f !== '_sorter'){
                            $this._Sorting[f] = {
                                Target: $this.Select(Sorting[f]),
                                Sorted: false,
                            };
                            $this._Sorting[f].Target.classList.add('mt-sorting');
                            $this._Sorting[f].Target.addEventListener('click', function () {
                                $this._Sorting._sorter = f;
                                $this._SortBy(f, $this.Controller._Data);
                            })
                        }
                    }
                    console.info('mt-sortable', $this._Sorting);
                }
                if (Filtering){
                    $this._Filter = {};
                    $this._Filter._DataDefault = $this.Controller._Data.slice(0);
                    for (let f in Filtering){
                        if (Filtering.hasOwnProperty(f) && f !== '_format'){
                            $this._Filter[f] = {
                                Target: $this.Select(Filtering[f]),
                                Filter: '',
                            };
                            $this._Filter[f].Target.classList.add('mt-filtering');
                            $this._Filter[f].Target.innerHTML = '<input type="text" class="mt-filtering-input">';
                            $this._Filter[f].Target.querySelector('.mt-filtering-input').addEventListener('keyup', function (e) {
                                //$this._SortBy(f);
                                $this._Filter[f].Filter = e.target.value.toLowerCase();
                                $this._FilterBy();

                            })
                        }
                    }
                }
                if (!Lure.ContentList[$this.Type]) //if list is empty, create it, else just add
                    Lure.ContentList[$this.Type] = [];
                Lure.ContentList[$this.Type].push(this);

                //close button
                Array.from(this.Content.children).forEach(function(item){
                    if (item.classList.contains("close"))
                        item.onclick = function (e) {
                            $this.Hide(e);
                        }
                });

                setTimeout(function () {
                    AfterBuild.call($this);
                }, 1);
            }

        }
        get isVisible(){
            return Lure.isVisible(this.Content);
        }
        get Title(){
            return this.TitleContent.innerHTML;
        }
        set Title(t){
            this.TitleContent.innerHTML = t;
        }
        get Data(){
            if (this.Controller)
                return this.Controller.Data;
            return null;
        }
        set Data(data){
            if (this.Controller)
                this.Controller.Data = data;
        }
        get Items(){
            if (this.Controller)
                return this.Controller.Items;
            return null;
        }
        RefreshOne(i){
            if (this.Controller)
                this.Controller.RefreshOne(i);
        }
        Remove(i, removeData){
            if (this.Controller)
                this.Controller.Remove(i, removeData);
        }
        Add(itemData, extraclass = false, isPrepend = false, addData = true){
            if (this.Controller)
                this.Controller.Add(itemData, extraclass, isPrepend, addData);
        }

        /**
         *
         * @param {object} itemData
         * @param {int} index
         * @constructor
         */
        Edit(itemData, index){
            if (this.Controller)
                this.Controller.Edit(itemData, index);
        }
        Dispose(){
            this.Content.remove();
            this.Control.Disactive();
            delete this.Controller;
            delete this.Control;
        }
    },
    Control: class LureControl{
        constructor(control, owner){
            if (control === null)
                return;
            if (control.length > 0) //if control list not empty
            {
                let controls = this;
                for (let i = 0; i < control.length; i++)
                {
                    if (!control[i].Name)
                        control[i].Name = "unnamed_" + Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
                    controls[control[i].Name] = {
                        Content: Lure.SelectAll(control[i].Target),
                        _Content: control[i].Target,
                        Type: control[i].Type ? control[i].Type : "Untyped",
                        isGlobal: control[i].Global,
                        OnClick: control[i].OnClick ? control[i].OnClick : owner.Show,
                        OnChange: control[i].OnChange,
                        Active: function(){
                            Lure.SelectAll(control[i].Target).forEach(function (item) {
                                item.classList.add('active');
                            })
                        },
                        Disactive: function(){
                            Lure.SelectAll(control[i].Target).forEach(function (item) {
                                item.classList.remove('active');
                            });
                        }

                    };
                    //onclick
                    controls[control[i].Name].Content.forEach(function (item) {
                        item.classList.add('pointer');
                    });
                    if (control[i].Global){

                        Lure.AddEventListenerGlobal('click', control[i].Target, function (e) {
                            Lure.SelectAll(control[i].Target).forEach(function (item) {
                                item.classList.remove('active');
                            });
                            e.target.classList.add('active');
                            if (controls[control[i].Name].OnClick)
                                controls[control[i].Name].OnClick.call(owner, e);
                        });
                    }
                    else{
                        controls[control[i].Name].Content.forEach(function (item) {
                            item.onclick = function (e) {
                                Lure.ContentList[owner.Type].forEach((item) =>
                                {
                                    if ((item) !== owner)
                                    {
                                        if (item.Control)
                                            item.Control.Disactive();
                                    }
                                });
                                //console.log('remover', e);
                                controls[control[i].Name].Content.forEach(function (item) {
                                    item.classList.remove('active');
                                });
                                e.currentTarget.classList.add('active');
                                controls[control[i].Name].OnClick.call(owner, e);
                            };

                        })
                    }

                    if (control[i].OnChange)
                    {
                        if (control[i].Global){
                            Lure.AddEventListenerGlobal('change', control[i].Target, function (e) {
                                control[i].OnChange.call(owner, e);
                            } )
                        }
                        else{
                            controls[control[i].Name].Content.forEach(function (item) {
                                item.onchange = function (e) {
                                    control[i].OnChange.call(owner, e);
                                };
                            })
                        }
                    }
                }
            }
        }
        Active(type = "Untyped"){
            for (let k in this)
                if (this[k].Type === type)
                    this[k].Content.forEach(function (item) {
                        item.classList.add('active')
                    })
        }
        Disactive(type = "Untyped"){
            for (let k in this)
                if (this[k].Type === type)
                {
                    this[k].Content.forEach(function (item) {
                        item.classList.remove('active');
                    });
                    if (this[k].isGlobal)
                        Lure.SelectAll(this[k]._Content).forEach(function(item){
                            item.classList.remove('active');
                        })
                }

        }
    },
    Controller: {
        Templator: class Templator{
            constructor(
                {
                    Target = null,                              //{HTMLelement}
                    Data = [],                                  // {object}, {array} - if object Templator would be refresh, if array - rebuild
                    ListElement = ".list_element",              //{string} - css selector or dom string
                    //ListElementOnClick = null,                //{function} -
                    EmptyMessage = "",
                    EmptyHide = false,      //{bool} - Templator.Content would be hidden if Data.length = 0
                    //DataType = "untyped",  //--BAD EXPERIENCE-- ODO when refresh one of typed Templator, would be refreshed/added/removed all of same type Templators (exclude untyped ofcourse)

                    PageSize = -1,
                    DataCount = -1,         //if > 0 PageGet is requied!!!
                    PageGet = null,         //{function} - requied if DataCount > 0

                    ShowAllButton = true,

                    LineSave = function(line, property, newValue, callback=()=>{}){setTimeout(()=>{callback()}, 500)},            // callback would remove editable-waiting css class;
                    LineAdd = function(dataObject, callback=()=>{}){setTimeout(()=>{ callback()}, 500)},                     // callback would remove editable-waiting css class;
                    EditModeSwitch = null,     //checkbox, which toggle to edit mode
                    DataSaveAll = function(){},//TODO

                    //Sortable = false, //sort data columns

                    NoAnimation = false,    //TODO
                    NoBuild = false,

                    BeforeBuild = function(){},
                    AfterBuild = function(){},
                    AfterAdd = function(){},
                    Parent = null           //Lure.Content, which owns this Controller

                } = {})
            {
                //### DEFINES
                let $this = this;
                this.isController = true;
                if (Parent !== null)
                    this.Content = Lure.Select(Target, Parent.Content);
                else
                    this.Content = Lure.Select(Target);
                this.Target = this.Content;
                this._Data = Data;
                this.EmptyMessage = EmptyMessage;
                this.ListElement = "";

                this.BeforeBuild = BeforeBuild.bind(this);
                this.AfterBuild = AfterBuild.bind(this);
                this.AfterAdd = AfterAdd.bind(this);
                this.Parent = Parent;
                //paginating
                this.PageSize = PageSize;
                this._PageSize = PageSize;
                this._DataCount = DataCount > 0 ? DataCount : this._Data.length ;
                this._PageCursor = 0;
                this._PageGet = PageGet;

                //server handling
                this.LineAdd = LineAdd;
                this.LineSave = LineSave;
                this.Type = null; // Refresh or ItemList

                //settings
                this.isShowAllButton = ShowAllButton;
                this.isNoAnimaton = NoAnimation;
                this.isEmptyHide = EmptyHide;

                //fields to refresh (for refresh type)
                let Dictionary = [];
                this._Dictionary = Dictionary;
                const Refresher = function () {
                    //TODO refresh only changes
                    if (!$this._Data)
                        $this._Data = {};
                    for (let i = 0; i < Dictionary.length; i++)
                    {

                        for (let j = 0; j < Dictionary[i].fields.length; j++)
                        {
                            let isAttribute = Dictionary[i].fields[j].Target.indexOf('attributes') > -1;
                            let NewValue = Dictionary[i].fields[j].BuildValue($this._Data);
                            if (isAttribute)
                            {

                                Dictionary[i].obj.attributes[Dictionary[i].fields[j].Target.split(".")[1]].value = NewValue;
                            }
                            else {
                                Dictionary[i].obj[Dictionary[i].fields[j].Target] = Dictionary[i].fields[j].BuildValue($this._Data);
                            }

                        }
                    }
                };
                this._Rebuilder = function (data = $this._Data) {
                    let lines = "";
                    //$this.Content.style.display = '';
                    if ($this._PageCursor === 0 )
                        $this.Content.querySelectorAll('.mt-line, .mt-paginator, .mt-empty').forEach(function(item) {item.remove();});
                    //pagination check
                    let NextCount;
                    //let line;
                    let Limit = data.length;
                    $this._DataCount = DataCount > 0 ? DataCount : Limit ;
                    if ($this.PageSize > 0)
                    {
                        //  debugger;
                        $this._DataCount = $this._DataCount > 0 ? $this._DataCount : data.length ;
                        let paginator = $this.Content.querySelector('.mt-paginator');
                        if (paginator !== null)
                            paginator.remove();
                        Limit = parseInt($this._PageCursor) + parseInt($this.PageSize);
                        if (Limit > $this._DataCount && $this._DataCount > 0)
                            Limit = $this._DataCount;
                        //how much will be load in next step
                        NextCount = $this._DataCount - Limit;
                        if (NextCount > $this.PageSize)
                            NextCount = $this.PageSize;
                    }
                    if ($this.Type === "ItemList" && data.length === 0 && $this.EmptyMessage !== "" && !$this.isEmptyHide)
                    {
                        let tag = $this.ListElement.match(/\s?([\w]+) /)[0].replace(/\s/g, "");
                        let empty = document.createElement(tag);
                        empty.classList.add('mt-empty');
                        empty.innerHTML = $this.EmptyMessage;
                        $this.Content.appendChild(empty);
                        return;
                    }
                    else if ($this.Type === "ItemList" && data.length === 0 && $this.isEmptyHide){
                        $this.Content.style.display = 'none';
                        return;
                    }
                    else if (data.length === 0) {
                        return;
                    }
                    //linebuilding
                    for (let i = $this._PageCursor; i < Limit; i++)
                        lines += $this._LineBuilder(data[i], i, data.length);
                    //appending
                    //   debugger;
                    if ($this.Content.children.length < 1)
                    {
                        $this.Content.innerHTML = lines;
                    }
                    else{
                        lines = Lure.CreateElementsFromString(lines, $this.Content.tagName);
                        if (lines !== null)
                            lines.forEach(function (item) {
                                $this.Content.appendChild(item);
                            });
                    }
                    /*{
                     lines += $this._LineBuilder(data[i], i, data.length);
                     //if should to save changed class list after rebuild
                     if (data[i] && data[i].$classlist)
                     {
                     line = $(line);
                     line.attr('class', data[i].$classlist);
                     lines +=line[0].outerHTML;
                     }
                     else{
                     lines += line;
                     }
                     }*/
                    //save cursor index
                    if ($this.PageSize > 0)
                        $this._PageCursor = Limit;
                    //PAGINATION BUILD
                    //limit data case
                    if ($this.PageSize > 0 && $this._PageCursor < $this._DataCount){
                        let also;
                        let showAll = `<span>  (Не загружено ${($this._DataCount- $this._PageCursor)}) </span>`;
                        if ($this.isShowAllButton)
                        {
                            showAll = `<span> или </span><span class="mt-btn-nextAll dotted pointer"> Все ( ${($this._DataCount - $this._PageCursor)} )</span>`;
                        }
                        let isTable = $this.Content.tagName === 'table' || $this.Content.tagName === 'thead' || $this.Content.tagName === 'tbody';
                        if (isTable)
                        {
                            let colspan = $this.Content.querySelector("tr:first-child th").length + 1;

                            also = `<tr class="mt-paginator"><td colspan="${colspan}" class="element block-head"><span class="tpltr-next dotted pointer">Показать еще ${NextCount}</span>${showAll}</td></tr>`;
                            also = Lure.CreateElementFromString(also, $this.Content.tagName);
                        }
                        else {
                            also = Lure.CreateElementFromString(`<div class='mt-paginator'><span class="mt-btn-next dotted pointer">Показать еще ${NextCount}</span>${showAll}</div>`);

                        }
                        let btnNext = also.querySelector('.mt-btn-next');
                        //console.log('btnNext', btnNext);
                        btnNext.onclick = function(){
                            if ($this._PageCursor >= data.length)
                                $this._PageGet($this._PageCursor, $this.PageSize, BuildWithIt);
                            else
                                Build();

                        };
                        let btnNextAll = also.querySelector('.mt-btn-nextAll');
                        btnNextAll.onclick = function(){
                            $this.PageSize = $this._DataCount;
                            if ($this._PageGet !== null)
                                $this._PageGet($this._PageCursor, ($this._DataCount - $this._PageCursor), BuildWithIt);
                            else
                                Build();
                        };
                        $this.Content.appendChild(also);

                    }

                };
                const Build = function () {
                    $this.BeforeBuild();

                    if ($this.Type === "Refresh")
                        Refresher();
                    else if ($this.Type === "ItemList"/* && $this._Data.length > 0*/)
                        $this._Rebuilder();


                    $this.AfterBuild();
                };
                const BuildWithIt = function (data) {
                    for (let i = 0; i < data.length; i++)
                        $this._Data.push(data[i]);
                    Build();
                };
                // = Rebuild1er;

                //#### METHODS
                this.FieldAdd = function (element) {
                    let elemAttributes = element.attributes;
                    let fields = [];
                    let WhatFields = -1; // 0-att only, 1-innerHTML only, 2-both
                    //find fields in attributes
                    for (let i = 0; i < elemAttributes.length; i++)
                    {
                        if (elemAttributes[i].value.indexOf("{{") > -1)
                        {
                            if (elemAttributes[i].name !== 'value')
                                fields.push({
                                    Target: 'attributes.'+elemAttributes[i].name,
                                    BuildValue: Lure.Compile(elemAttributes[i].value)
                                });
                            else {
                                fields.push({
                                    Target: elemAttributes[i].name,
                                    BuildValue: Lure.Compile(elemAttributes[i].value)
                                });
                            }
                            WhatFields = 0;
                        }
                    }
                    //innerHTML check
                    if (element.childNodes.length < 2)
                    {
                        if (element.innerHTML.indexOf("{{") > -1)
                        {
                            fields.push({
                                Target: "innerHTML",
                                BuildValue: Lure.Compile(element.innerHTML)
                            });
                            WhatFields = WhatFields !==0 ? 1:2; //1 if no att, 2 if att exists

                        }

                    }
                    if (WhatFields > -1)
                    {
                        Dictionary.push( {
                            obj: element,
                            fields: fields
                        } );
                    }
                };
                this.Refresh = function(data = null, index = null){
                    $this.PageSize = $this._PageSize;
                    $this._PageCursor = 0;
                    if (data !== null)
                        $this._Data = data;
                    $this.PageCursor = 0;
                    if (index === null)
                        Build();
                    else
                        $this.RefreshOne(index);
                };
                this.RefreshOne = function (i) {
                    let newItem = Lure.CreateElementFromString($this._LineBuilder($this._Data[i], i, $this._Data.length), $this.Content.tagName);
                    let itemOld = $this.Items[i];
                    $this.Items[i].parentNode.replaceChild(newItem, itemOld);
                };
                this.Add = function(item, extraclass = false, isPrepend = false, addData = true){
                    if ($this._Data.length === 0 && $this.Content.querySelector(".mt-empty") !== null)
                        $this.Content.querySelector(".mt-empty").remove();
                    let fragment = document.createDocumentFragment();
                    let elem = document.createElement($this.Content.tagName);
                    let i;
                    if (!isPrepend)
                    {
                        i = $this._Data.length;
                        if (!addData)
                            i--;
                        elem.innerHTML = $this._LineBuilder(item, i, i+1);
                        while (elem.childNodes[0]) {
                            fragment.appendChild(elem.childNodes[0]);
                        }
                        if (extraclass)
                            fragment.children[0].classList.add(extraclass);
                        if (addData)
                            $this._Data.push(item);
                        $this.Content.appendChild(fragment);
                    }
                    else{
                        i = 0;
                        //change data-line attributes
                        $this.Items.forEach(function (item) {
                            console.log(item);
                            console.log(item.dataset['line']);
                            item.dataset['line'] =  parseInt( item.dataset['line'] ) + 1;
                        });
                        //TODO rendered indexes not changings

                        elem.innerHTML =  $this._LineBuilder(item, 0, $this._Data.length+1);
                        while (elem.childNodes[0]) {
                            fragment.appendChild(elem.childNodes[0]);
                        }
                        if (extraclass)
                            fragment.children[0].classList.add(extraclass);
                        if (addData)
                            $this._Data.unshift(item);
                        $this.Content.prepend(fragment);
                    }
                    //server saver
                    if ($this.LineAdd !== null)
                    {
                        $this.LineAdd(item, function () { //remove extraclass callback
                            let x = $this.Content.querySelector('.'+extraclass);
                            if (x)
                                x.classList.remove(extraclass);
                        });
                    }
                    $this.AfterAdd(item, i);
                };
                this.Edit = function (itemData, i){
                    console.log('edit itemData', i, itemData);
                    Array.from($this.Items).filter(x => parseInt(x.dataset['line'])===i)[0].classList.add('editable-waiting');
                    $this.LineSave(i, '$this', itemData,
                        function () {
                            $this._Data[i] = itemData;
                            $this.RefreshOne(i);
                        });

                };
                /**
                 *
                 * @param {int} index
                 * @param {bool} removeData
                 * @constructor
                 */
                this.Remove = function(index, removeData = true){
                    //TODO rendered indexes not changings
                    $this.Content.querySelector(`.mt-line[data-line="${index}"]`).remove();
                    for (let j = index; j < $this.Items.length; j++){
                        $this.Items[j].dataset['line'] =  parseInt( $this.Items[j].dataset['line'] ) - 1;
                        $this.Items[j].querySelectorAll('[data-line]').forEach(function (item) {
                            item.dataset['line'] = parseInt( item.dataset['line'] ) - 1;
                        })
                    }
                    if (removeData)
                        $this._Data.splice(index, 1);
                    if ($this._Data.length === 0)
                        $this.Refresh();
                };
                this.SwitchToEditMode = function () {
                    Lure.Editable.EditMode = true;
                    Lure.SelectAll('.editable', $this.Content).forEach(function (item) {
                        // console.log(item);
                        Lure.Editable.AddEdits(item);
                    });
                };

                //### CONSTRUCTOR
                if ( Array.isArray(this._Data) ){
                    this.Type = "ItemList";
                    const isListElementCssSelector = ListElement.match(/^[a-zA-Z0-9.,\-_ *#]+$/g) !== null;
                    if (isListElementCssSelector){
                        let element = this.Content.querySelector(ListElement);
                        element.classList.add('mt-line');
                        ListElement = element.outerHTML;
                        element.remove();
                    }
                    else{
                        let list_element = ListElement.match(/<[^>]+>/)[0];
                        let list_elementClassed;
                        let pos = list_element.indexOf('class="');
                        if (pos < 0)
                        {
                            list_elementClassed = list_element.substr(0,list_element.length - 1) + ' class="mt-line"' + list_element.substr(list_element.length-1);
                        }
                        else
                        {
                            pos = list_element.indexOf('"', pos+8);
                            list_elementClassed = list_element.substr(0,pos) + " mt-line" + list_element.substr(pos);
                        }
                        ListElement = ListElement.replace(list_element, list_elementClassed);
                    }
                    //add data-line attribute
                    ListElement = ListElement.replace(/<[\s\S]+?(>)/, function (a, b) {
                        return a.replace(b, ' data-line="{{i}}">')
                    });
                    this.ListElement = ListElement;
                    this._LineBuilder = Lure.Compile(ListElement, true);
                    if (ListElement.match(/<[^>]+class=['"][\w\d\s-]*(editable)[\w\d\s-]*['"][^>]*>([^<]*)<[^>]*>/) !== null)
                    {
                        this.isHasEditable = true;
                        if (EditModeSwitch !== null)
                            Lure.Select(EditModeSwitch).addEventListener('change', function (e) {
                                if ( e.currentTarget.checked ){
                                    $this.SwitchToEditMode();
                                }
                                else{
                                    Lure.Editable.EditMode = false;
                                    document.body.click();
                                }
                            });
                    }
                    this.Content.MonsieurController = this;
                    this.Content.classList.add('mt-content');

                }
                else {
                    this.Type = "Refresh";
                    let AllChildren = Array.prototype.slice.call( this.Content.querySelectorAll('*:not(g):not(path):not(clipPath):not(text):not(br)'));
                    AllChildren.push( this.Content);
                    AllChildren.forEach(function (item) {
                        $this.FieldAdd(item);
                    })
                }
                Lure.TemplatorList.push(this);
                if (!NoBuild)
                    Build();
            }
            get Data(){
                return this._Data;
            }
            set Data(data){
                this._Data = data;
            }
            get Items(){
                return this.Content.querySelectorAll('.mt-line');
            }
        },
        TreeBuilder: class TreeBuilder{
            constructor(
                {
                    Target = null,                          //{string, HTMLElement}
                    Data = [],
                    ListElement = null,
                    Drop = false,                       //{bool}   - horisontal menu with drop down subtrees;
                    SubSelector = null,                 //{string} - cssselector of element, where put branches
                    SubSelectorHandler = function(){},  //{function} - click handle on SubSelector Element (hide/show branch for exaple)

                    BeforeBuild = function(){},
                    AfterBuild = function(){},

                    Parent = null               //Lure.Content, which owns this Controller
                }
            )
            {
                //### DEFINES
                this.isController = true;
                this.Content = Lure.Select(Target);
                this.Target = this.Content;
                this.Parent = Parent;
                this._Data = Data;
                this.SubSelector = SubSelector;
                this.SubSelectorHandler = SubSelectorHandler.bind(this);
                this.BeforeBuild = BeforeBuild.bind(this);
                this.AfterBuild = AfterBuild.bind(this);
                let SubTreeClass = Drop ? 'mtb-sub_tree dropable':'mtb-sub_tree';
                let Lvl = 0;
                let Branch = ListElement === null ? this.Content.innerHTML : ListElement;
                if (this.SubSelector === null){
                    this.SubSelector = '.mtb-sub_tree';
                    Branch = Branch.replace(/^([\s\S]*)(<\/\w+>)$/, function (match, html, entag) {
                        entag = `<div class="${SubTreeClass}"></div>${entag}`;
                        return html+entag
                    })
                }
                this.LineBuilder = Lure.Compile(Branch, true);
                let $this = this;

                let Index = 0;          //unque serial number of branch

                let BuildElement = function(obj, key, indexJ) {
                    Index++;
                    let extra = {
                        $lvl: Lvl,
                        $key: key,
                        $index: Index,
                        $j: indexJ
                    };
                    let line = Lure.CreateElementFromString($this.LineBuilder(obj, Index, null, extra));
                    line.classList.add('mtb-branch');
                    for (let key in obj)
                    {
                        let ObjItem = obj[key];
                        if (Array.isArray(ObjItem))
                        {
                            Lvl++;
                            for (let i = 0; i < ObjItem.length; i++)
                            {
                                if ($this.SubSelector === null)
                                {
                                    line.appendChild(  BuildElement(ObjItem[i], key, i) );
                                }
                                else
                                {
                                    line.classList.add('mtb-has_tree');
                                    if (Drop)
                                        line.classList.add('dropable');
                                    let sub = line.querySelector($this.SubSelector);
                                    sub.appendChild(  BuildElement(ObjItem[i], key, i) );
                                }
                            }
                            Lvl--;
                        }
                    }
                    return line;
                };
                let Build = function () {
                    $this.BeforeBuild();
                    if (Array.isArray($this._Data))
                    {
                        $this.Content.innerHTML = '';
                        Lvl++;
                        for (let j = 0; j < $this._Data.length; j++)
                            $this.Content.appendChild(  BuildElement($this._Data[j], "root", 0) );
                        Lvl--;
                    }
                    else{
                        $this.Content.appendChild(BuildElement($this._Data, "root", 0));
                    }
                    Lvl = 0;
                    Index = 0;
                    $this.AfterBuild();

                };

                Build(this._Data);

                //### METHODS
                this.Refresh = function (data=$this._Data) {
                    $this._Data = data;
                    Build();
                }

            }
            get Data(){
                return this._Data;
            }
            set Data(data){
                this._Data = data;
            }
        }
    }
};
//register plugin
Lure.Content = Lure.Plugin.Content.Content;








//Lure.Content = Lure.Content;


//Tutorial
//TargetButton = {string, HTMLElement} - button who start the tutor
//TargetContent = {string, HTMLElement} - select/element where search tutors
Lure.Plugin.Tutor = class MonsieurTutor{
    /**
     *
     * @param {HTMLElement} TargetButton
     * @param {HTMLElement} TargetContent
     */
    constructor(TargetButton = null, TargetContent = null){
        //### DEFINES
        let $this = this;
        this.TargetButton = Lure.Select(TargetButton);
        this.TargetContent = Lure.Select(TargetContent);
        const MT = `<div class="lure-tutor">
                        <div class="cd-caption">
                            <span>Шаг </span>
                            <span class="lure-tutor_step"></span>
                        </div>
                        <div class="lure-tutor_desc"></div>
                        <div class="lure-tutor_btns">
                            <button class="button btn-tutor btn-tutor-stop">Прервать обучение</button>
                            <button class="button btn-tutor btn-tutor-next">Далeе →</button></div>
                   </div>`;
        this.Content = Lure.CreateElementFromString(MT);
        this.ContentBG = Lure.CreateElementFromString('<div class="lure-tutor-bg dialog-wrapper"></div>');
        this.Content.style.display = 'none';
        this.ContentBG.style.display = 'none';
        this._Description = this.Content.querySelector('.lure-tutor_desc');
        this._Step = this.Content.querySelector('.lure-tutor_step');
        this._ButtonNext = this.Content.querySelector('.btn-tutor-next');
        this._ButtonStop = this.Content.querySelector('.btn-tutor-stop');

        $this.Data = [];
        const ButtonNextText = this._ButtonNext.innerHTML;
        let TutorPosition = 0;
        /*get transparent*/
        let temp = document.createElement('div');
        temp.style.display = 'none';
        document.body.appendChild(temp);
        const ColorTransparent = window.getComputedStyle(temp).backgroundColor;
        temp.remove();
        //---
        const ElemCssRestore = function () {
            let Element = $this.Data[TutorPosition-1].obj;
            if (Element.tagName.toLowerCase() !== 'tr')
            {
                Element.style.zIndex = '';
                Element.style.position = '';
                Element.style.outline = '';
                Element.style.display = '';
                Element.style.backgroundColor = '';
                return;
            }
            let nElements = Element.querySelectorAll('th, td');
            nElements.forEach(function (elem) {
                elem.style.position = '';
                elem.style.zIndex = '';
            });
        };
        const ElemCssSet = function (Element) {
            if (Element.tagName.toLowerCase() !== 'tr')
            {
                Element.style.zIndex = '11';
                Element.style.position = 'relative';
                Element.style.outline = '5px #bee0ff solid';
                let style = window.getComputedStyle(Element);
                if (style.backgroundColor === ColorTransparent)
                    Element.style.backgroundColor = "#fff";
                if (!Lure.isVisible(Element) )
                {
                    if (Element.tagName.toLowerCase() !== "table" )
                        Element.style.display = 'block';
                    else
                        Element.style.display = 'table';
                }
                /* if (Element.length > 1)
                 Element.eq(1).css({zIndex: '', outline: ''});*/
                return;
            }
            let nElements = Element.querySelectorAll('th, td');
            nElements.forEach(function (elem) {
                elem.style.zIndex = "11";
                elem.style.position = "relative";
                let style = window.getComputedStyle(elem);
                if (style.backgroundColor === ColorTransparent){
                    elem.style.backgroundColor = "#fff";
                }
            });
            /* if (Element.length > 1)
             Element.eq(1).css({zIndex: '', outline: ''});*/
        };
        const Run = function () {
            console.log("tutor run");
            if ($this.TargetContent === null)
                return;
            let Items = $this.TargetContent.querySelectorAll('*[data-tutor]:not([data-line]), *[data-tutor][data-line="0"]');
            if (Items.length < 1){
                Lure.Confirm("Сообщение", "На этом экране нет подсказок");
                return;
            }
            // document.body.style.position = 'relative';

            Items.forEach(function (item) {
                $this.Data.push({
                    obj: item,
                    desc: item.dataset['tutor']
                })
            });
            $this.Content.style.display = '';
            $this.ContentBG.style.display = '';
            GoStep();
        };
        const GoStep = function () {
            //restore prev element's css
            if (TutorPosition > 0)
                ElemCssRestore();
            if (TutorPosition === $this.Data.length)
            {
                Stop();
                return;
            }
            //select next elem
            let Element = $this.Data[TutorPosition].obj;
            let ElementDesc = $this.Data[TutorPosition].desc;
            // check for invisible parent
            let ElemParent = ElementDesc.match(/{([\s\S]+)}/);
            if (ElemParent !== null)
            {
                ElemParent = ElemParent[1];
                ElementDesc = ElementDesc.replace(/{([\s\S]+)}/, '');
                Element = Element.closest(ElemParent);
                $this.Data[TutorPosition].obj = Element;
                //Element.push( );
            }
            //set element visible
            ElemCssSet(Element);
            //write new element title and desc
            $this._Step.innerHTML = (TutorPosition+1) + "/"+$this.Data.length;
            $this._Description.innerHTML = ElementDesc;
            //caption next button
            if ((TutorPosition+1) === $this.Data.length)
            {
                $this._ButtonNext.innerHTML = 'Завершить';
                $this._ButtonStop.style.opacity = '0';
            }

            //move tutor desc box
            let posX = Element.offsetLeft + Element.clientWidth + 10;
            let posY = Element.offsetTop - $this.Content.clientHeight - 10;
            if (posY < 10)
                posY = 10;
            if ( (posX + $this.Content.clientWidth) > window.innerWidth )
            {
                posX = Element.offsetLeft - $this.Content.clientWidth - 10;
                if (window.innerWidth < $this.Content.clientWidth + Element.clientWidth)
                {
                    posX = Element.offsetLeft + Element.clientWidth - $this.Content.clientWidth - 20;
                }

            }
            if (document.documentElement.scrollTop  > posY || document.documentElement.scrollTop + window.innerHeight < Element.offsetTop + Element.offsetHeight)
            {
                //$('html, body').animate({scrollTop: posY - 10}, 300);
                document.documentElement.scrollTop =  (posY - 10)  +'px';
            }
            if (posX < 10)
                posX = 10;
            $this.Content.style.left = posX +'px';
            $this.Content.style.top = posY +'px';

            TutorPosition++;
        };
        const Stop = function () {
            //     document.body.style.position = '';
            ElemCssRestore();
            $this.Content.style.display = 'none';
            $this.ContentBG.style.display = 'none';
            $this._ButtonNext.innerHTML = ButtonNextText;
            $this._ButtonStop.style.opacity = '';
            TutorPosition = 0;
            $this.Data = [];
        };
        //### CONSTRUCT

        this.TargetButton.onclick = Run;
        this._ButtonNext.onclick = GoStep;
        this._ButtonStop.onclick = Stop;

        document.body.appendChild(this.Content);
        document.body.appendChild(this.ContentBG);

        //### METHODS
        this.Run = Run;

    }
};




Lure.Plugin.Load = class MonsieurLoading{
    constructor(
        {
            Target = 'body'
        } = {}
    ){
        this.Target = Lure.Select(Target);
        this.Target.style.position = 'relative';
        this.Content = Lure.CreateElementFromString(`<div class="ajax-loading" style="display: none"></div>`);
        let cx = 60; //diameter
        let cy = 60;
        let _DoArc = function(radius, maxAngle){
            let d = " M "+ (cx + radius) + " " + cy;
            for (let angle = 0; angle < maxAngle; angle++)
            {
                let rad = angle * (Math.PI / 180);  //deg to rad
                let x = cx + Math.cos(rad) * radius;
                let y = cy + Math.sin(rad) * radius;
                d += " L "+x + " " + y;
            }
            return d;
        };
        let svg = `<svg xmlns="http://www.w3.org/2000/svg">
                     <path d="${_DoArc(45, 160)}" class="lure-arc1" fill="none" stroke="#449b22" stroke-width="5"></path>
                     <path d="${_DoArc(40, 130)}" class="lure-arc2" fill="none" stroke="#61c8de" stroke-width="5"></path>
                     <path d="${_DoArc(35, 100)}" class="lure-arc3" fill="none" stroke="#761c19" stroke-width="5"></path>
                     <path d="${_DoArc(30, 70)}"  class="lure-arc4" fill="none" stroke="#333333" stroke-width="5"></path>
                   </svg>`;
        this.Target.appendChild(this.Content);
        this.Content.innerHTML = svg;
        this.Timeout = null;
    }
    Show(){
        let $this = this;
        this.Content.style.display = '';
        clearTimeout(this.TimeoutHide);
        this.Timeout = setTimeout(function(){
            $this.Content.style.display = 'block';
        }, 70);
    }
    Hide(){
        let $this = this;
        clearTimeout(this.Timeout);
        this.TimeoutHide = setTimeout(function(){
            $this.Content.style.display = 'none';
        }, 250); //hide may be called in same time as the show()
    }
};

Lure.Plugin.Tooltip = class MonsieurTooltip{
    constructor({
                    Target    = document,           //Target-listener (global document by default)
                    Attribute = "data-tooltip",     // data-tooltip="Help text here"
                    Delay     = 400,                //delay before tooltip show
                    Time      = 1100,               //showing time
                    Cursor    = "help",             //item:hover cursor
                    Custom    = `<div class="lure-tooltip">`,               //custom html of tooltip
                    AfterBuild = function(){}

                })
    {
        let $this = this;
        this.ToolTip = Lure.CreateElementFromString(Custom);
        let Timer = null;
        let Destr = null;
        this.Target = Lure.Select(Target);
        const Show = function (text){
            this.ToolTip.innerHTML = text;
            $this.Target.appendChild(this.ToolTip);

        }.bind(this);
        Lure.AddEventListenerGlobal('mouseover', `[${Attribute}]`, function (e) {
            let text = e.currentTarget.dataset[Attribute.replace('data-', '')];
            clearTimeout(Destr);
            Timer = setTimeout(function(){
                Show(text);
            }, Delay);
        }, this.Target);
        Lure.AddEventListenerGlobal('mouseout', `[${Attribute}]`, function (e) {
            clearTimeout(Timer);
            Destr = setTimeout(function () {
                //$this.ToolTip.remove();
            }, Time)
        }, this.Target);
        setTimeout(function () {
            AfterBuild.bind($this);
        }, 0)
    }

};



Lure.Tutor = Lure.Plugin.Tutor;
Lure.Load = Lure.Plugin.Load;
Lure.Tooltip = Lure.Plugin.Tooltip;



Lure.Plugin.Chart = {
    Core: '',
    Chart: class LureChart{
        constructor(
            Target = null,      //where render chart
            {
                Type = 'Line',  //Line Bar Pie
                Title = '',
                Labels = {
                    Rotation: 'auto',
                    Data: []
                },
                Series = [
                    {Data: [], Type: '', OwnAxis: false, Color: '#eee'},
                    {Data: [], Type: '', OwnAxis: [0, 100], Color: '#eee'},
                ],
                Tooltip = {
                    Template: 'Name: {{Name}}<br>Value: {{Value}}',
                },
                AxisY = {
                    Scale: ['auto', 'auto', 'auto'],
                    Visible: true,
                },
                Height = 400,
                SeriesOptions = {},
            }={},
        ){
            /// <DEFAULTS>
            //const Colors = ['red', 'green', 'blue'];
            const ColorsDefault = ['red', 'green', 'cornflowerblue', 'purple', 'palevioletred', 'orange'];
            //const DefaultPoint = {
            //    Visible: true,
            //    Radius: 4
            //};
            /// </DEFAULTS>
            ///
            let chart = this;
            this.Content = Lure.Select(Target);
            this.Content.classList.add('mt-chart'); // mt
            this.Content.style.position = 'relative';

            this.isGraph = true;//(Series.filter(x=>x.Type?x.Type.toLowerCase():x.Type === 'line' || x.Type?x.Type.toLowerCase():x.Type === 'bar')).length === Series.length;

            let Buffer = {
                Legend: '',
                AxisX: '',
                AxisY: '',
                Grid: '',
                Svg: '',



                Height: 0,
                Width: 0,
                Abscissa: null,
                SeriesPoints: [],

                ParametersAxisX: null,

            };

            this._Series = Series;
            //define Series
            this.__InitSeries = function (){
                let Se = [];

                for (let i = 0; i < this._Series.length; i++){
                    let ep = {};
                    ep.Name    = this._Series[i].Name ? this._Series[i].Name                : 'Unnamed';
                    ep.Data    = this._Series[i].Data;
                    ep.OwnAxis = this._Series[i].OwnAxis;
                    ep.Title   = this._Series[i].Title? this._Series[i].Title               : ep.Name;
                    ep.Type    = this._Series[i].Type ? this._Series[i].Type.toLowerCase()  : (Type?Type.toLowerCase():'line');
                    ep.Color   = this._Series[i].Color? this._Series[i].Color: ColorsDefault[i]?ColorsDefault[i]:'#000';
                    ep.Width   = this._Series[i].Width? this._Series[i].Width               : 2;

                    ep.Point   = Series[i].Point;
                    ep.Point   = Lure.Chart.GetSeriePointOptions(ep);

                    Buffer.Legend += Lure.Chart.MakeLegend(ep, i);
                    Se.push(ep)
                }
                return Se;
            }.bind(this);

            this.Options = {
                //Type: Type? Type.toLowerCase(): 'line',
                Title: Title? Title: '',
                Labels: {
                    Visible: (typeof Labels.Visible === 'undefined' || Labels.Visible),
                    Rotation: Labels.Rotation? Labels.Rotation: 'auto',
                    Data: Labels.Data? Labels.Data: [],
                },
                Series: this.__InitSeries(),
                SeriesOptions: {
                    BarStack: false,
                    BarGradient: true
                },
                AxisY: {
                    Scale: AxisY.Scale? ([Lure.isNumeric(AxisY.Scale[0])? AxisY.Scale[0]:'auto', Lure.isNumeric(AxisY.Scale[1])? AxisY.Scale[1]:'auto', Lure.isNumeric(AxisY.Scale[2])? AxisY.Scale[2]:'auto']):['auto', 'auto', 'auto'],
                    Visible: (typeof AxisY.Visible === 'undefined' || AxisY.Visible)
                },
                Tooltip: {
                    Template: Tooltip.Template?Tooltip.Template : 'Name: {{Name}}<br>Value: {{Value}}'
                }
            };
            this.Block = (function () {
                this.Content.innerHTML = `<div class="mt-chart col">
                                        <div class="mt-chart-caption">
                                          <div class='mt-chart-title'>${Title}</div>
                                          <div class="mt-chart-legend row"></div>
                                        </div>
                                        <div class="mt-chart-kek row flex-100">
                                          <div class="mt-chart-y row"></div>
                                          <div class="col flex-100">
                                            <div class="mt-chart-area row flex-100">
                                              <svg class="mt-chart-svg"></svg>
                                              <div class="mt-chart-grid" style=" position: absolute;"></div>
                                            </div>
                                            <div class="mt-chart-x row"></div>
                                           </div>
                                        </div>
                                      </div>`;
                const _Legend     = this.Content.querySelector('.mt-chart-legend');
                const _AxisX      = this.Content.querySelector('.mt-chart-x');
                const _AxisY      = this.Content.querySelector('.mt-chart-y');
                const _ChartArea  = this.Content.querySelector('.mt-chart-area');
                const _Grid       = this.Content.querySelector('.mt-chart-grid');
                const _Svg        = this.Content.querySelector('.mt-chart-svg');
                return {
                    get Legend(){
                        return _Legend;
                    },
                    set Legend(v){
                        _Legend.innerHTML = v;
                    },
                    get AxisX(){
                        return _AxisX;
                    },
                    set AxisX(v){
                        _AxisX.innerHTML = v;
                    },
                    get AxisY(){
                        return _AxisY;
                    },
                    set AxisY(v){
                        _AxisY.innerHTML = v;
                    },
                    get ChartArea(){
                        return _ChartArea;
                    },
                    set ChartArea(v){
                        _ChartArea.innerHTML = v;
                    },
                    get Grid(){
                        return _Grid;
                    },
                    set Grid(v){
                        _Grid.innerHTML = v;
                    },
                    get Svg(){
                        return _Svg;
                    },
                    set Svg(v){
                        _Svg.innerHTML = v;
                    },
                }
            }.bind(this))();

            /********************************************************************************/
            const Builders = {
                /**
                 *
                 * @param Serie
                 * @param i
                 * @returns {string}
                 * @constructor
                 */
                MakeLegend(Serie, i){
                    return `<div class="mt-chart-legend__item row">
                          <input class="mt-legend-checkbox" type="checkbox" checked="checked" id="legcheck${Serie.Name}${i}">
                          <div class="mt-legend-icon" style="background-color: ${Serie.Color}"></div>
                          <label class="mt-legend-label" for="legcheck${Serie.Name}${i}">${Serie.Name}</label>
                        </div>`;
                },
                /**
                 *
                 * @param scale
                 * @param i
                 * @param name
                 * @param color
                 * @returns {*}
                 * @constructor
                 */
                MakeAxisY(){
                    /*if (!scale)
                     return '';
                     let caption = '';
                     if (i>0)
                     caption = `<div class="mt-chart-axis-caption"><div style="transform: rotate(-90deg)">${name}</div></div>`;
                     let a = '';
                     for (let j = 0; j< scale.length; j++){
                     a += `<div class="mt-chart-label mt-chart-label__y"><span>${scale[j]}</span></div>`;
                     }
                     return `<div class="mt-chart-axis__y row" ${(i>0)? ('style="color: '+color+'; font-weight: bold;"'):''} data-line="${i}">${caption}<div class="mt-chart-labels col">${a}</div></div>`;*/
                    let i = 0;
                    if (!chart.Options.AxisY.Visible){
                        i = 1;
                        if (chart._ScaleY.Scales.length < 2)
                            return '';
                    }
                    let accum = '';
                    for (i; i <chart._ScaleY.Scales.length; i++){
                        let index = chart._ScaleY.Dict.indexOf(i);//.filter(x=>x===i && x !==0)[0];
                        let scale = chart._ScaleY.Scales[i];
                        let caption = '';
                        //let a = '';
                        if (i>0)
                            caption = `<div class="mt-chart-axis-caption"><div style="transform: rotate(-90deg)">${chart.Options.Series[index].Title}</div></div>`;
                        let a = '';
                        for (let j = 0; j< scale.length; j++){
                            a += `<div class="mt-chart-label mt-chart-label__y"><span>${scale[j]}</span></div>`;
                        }
                        accum += `<div class="mt-chart-axis__y row" ${(i>0)? ('style="color: '+chart.Options.Series[index].Color+'; font-weight: bold;"'):''} data-line="${i}">${caption}<div class="mt-chart-labels col">${a}</div></div>`;

                    }
                    return accum;
                },
                MakeAxisX(){
                    if (!chart.Options.Labels.Visible)
                        return '';
                    let labels = chart.Options.Labels.Data;

                    const style = `transform: rotate(${Buffer.ParametersAxisX.Angle}deg); margin-top: ${Buffer.ParametersAxisX.MarginTop}px; width: ${Buffer.ParametersAxisX.Width}px; margin-left: ${Buffer.ParametersAxisX.MarginLeft}px;`;
                    let a = '';
                    for (let i = 0 ; i < labels.length; i++){
                        a += `<div class="mt-chart-label mt-chart-label__x"><span style="${style}">${labels[i]}</span></div>`
                    }
                    //console.log(`AxisX forecastHeight: ${Math.round(h/4+ (Math.sqrt(Math.pow(wFact, 2) - Math.pow(w, 2))))}`);
                    return a;
                },
                MakeGrid(a,b){
                    return Lure.Chart.GetGrid(a,b);
                },
                MakeGraph(serie, i){
                    let index = chart._ScaleY.Dict[i];
                    let scale = chart._ScaleY.Scales[index];
                    let mm = chart._ScaleY.MinMax[index];
                    let DataOrdinata = Lure.Chart.GetOrdinata(serie.Data, scale, mm, chart.Height);
                    let DataAbscissa = Lure.Chart.GetAbscissa(chart.Options.Labels.Data, chart.Width);
                    let points = Lure.Chart.GetPoints(DataAbscissa, DataOrdinata);
                    return Lure.Chart.GetPath(points, chart.Options.Series[i].Type, i, chart.Options.Series[i].Color, chart.Options.Series[i].Width);
                },
                CalcAxisX(){
                    let c = Lure.CreateElementFromString(`<div class="mt-chart-label mt-chart-label__x"><span>${chart.Options.Labels.Data[0]}</span></div>`);
                    let size = Lure.GetInlineSize(c, getComputedStyle(c.querySelector('span')).fontSize);
                    let w = chart.Width/chart.Options.Labels.Data.length;
                    let h = size.height;
                    let wFact = size.width;
                    let angle;
                    if (chart.Options.Labels.Rotation !== 'auto'){
                        angle = parseFloat(chart.Options.Labels.Rotation);
                    }
                    else{
                        let cos = (w-h)/(wFact+h);
                        if (cos < 0.1)
                            cos = 0;
                        if (cos > 1)
                            cos = 1;
                        angle = (-90*(1-cos));
                    }
                    return {
                        Height: Math.round(h/4+ (Math.sqrt(Math.pow(wFact, 2) - Math.pow(w, 2)))),
                        Width: wFact,
                        MarginTop:  (wFact>w)? ((Math.sqrt(Math.pow(wFact, 2) - Math.pow(w, 2))) - h) : 0,
                        MarginLeft: (wFact>w)? (-w/2):(-wFact/2),
                        Angle: angle,
                    }

                }
            };
            /**
             *
             * @returns {string}
             * @constructor
             */
            function Builder(){
                let Legend = '';
                let AxeY = '';
                let AxeX = '';
                let Grid = '';
                let Svg = '';

                const isGraph = (chart.Options.Series.filter(x=>x.Type === 'pie')).length !== chart.Options.Series.length;
                console.log('isGraph',isGraph);
                let PathBuilder;
                if (isGraph)
                    PathBuilder = Builders.MakeGraph;

                for (let i = 0; i < chart.Options.Series.length; i++){
                    Legend += Builders.MakeLegend(chart.Options.Series[i], i);
                    AxeY += Builders.MakeAxisY(chart._ScaleY.Scales[i], i, chart.Options.Series[chart._ScaleY.Dict[i]].Title? chart.Options.Series[chart._ScaleY.Dict[i]].Title:chart.Options.Series[chart._ScaleY.Dict[i]].Name, chart.Options.Series[chart._ScaleY.Dict[i]].Color);
                    Svg += PathBuilder(chart.Options.Series[i], i);
                }
                Legend = `<div class="mt-chart-legend row">${Legend}</div>`;
                AxeY = `<div class="mt-chart-y row">${AxeY}</div>`;
                AxeX = Builders.MakeAxisX();
                Grid = Builders.MakeGrid(chart.Options.Labels.Data.length, chart._ScaleY.Scales[0].length-1);
                chart.Content.innerHTML= `<div class="mt-chart col">
                        <div class="mt-chart-caption">
                          <div class='mt-chart-title'>${Title}</div>
                          <div class="mt-chart-legend row">${Legend}</div>
                        </div>
                        <div class="mt-chart-kek row flex-100">
                          <div class="mt-chart-y row">${AxeY}</div>
                          <div class="col flex-100">
                            <div class="mt-chart-area row flex-100">
                              <svg class="mt-chart-svg">${Svg}</svg>
                              <div class="mt-chart-grid" style=" position: absolute;">${Grid}</div>
                            </div>
                            <div class="mt-chart-x row">${AxeX}</div>
                           </div>
                        </div>
                      </div>`
            }

            this.__GetPath = function(serie, line){
                //debugger;
                switch (serie.Type){
                    case 'line':
                        return this.__GetPathLine(serie, line);
                    case 'bar':
                        return this.__GetPathBar(serie, line);
                    case 'pie':
                        return '';
                }
            }.bind(this);
            this.__GetPathLine = function (serie, line) {
                if (!Buffer.Abscissa || Buffer.Width !== this.Width)
                    Buffer.Abscissa = Lure.Chart.GetAbscissa(chart.Options.Labels.Data, this.Width);
                let index = this._ScaleY.Dict[line];
                let scale = this._ScaleY.Scales[index];
                let mm = chart._ScaleY.MinMax[index];
                //debugger;
                let DataOrdinata = Lure.Chart.GetOrdinata(serie.Data, scale, mm, chart.Height);
                let points = Lure.Chart.GetPoints(Buffer.Abscissa, DataOrdinata);
                Buffer.SeriesPoints[line] = points;

                const n = points.length;

                let xs = [];        //x
                let ys = [];        //y
                let dys = [];       //dx
                let dxs = [];       //dy
                let ds = [];        //derivative
                let ms = [];        //desired slope (m) at each point using Fritsch-Carlson method
                for(let i = 0; i < n; i++) {
                    xs[i] = points[i][0];
                    ys[i] = points[i][1];
                }
                // Calculate deltas and derivative
                for(let i = 0; i < n - 1; i++) {
                    dys[i] = ys[i + 1] - ys[i];
                    dxs[i] = xs[i + 1] - xs[i];
                    ds[i] = dys[i] / dxs[i];
                }
                // Determine desired slope (m) at each point using Fritsch-Carlson method
                // See: http://math.stackexchange.com/questions/45218/implementation-of-monotone-cubic-interpolation
                ms[0] = ds[0];
                ms[n - 1] = ds[n - 2];
                for(let i = 1; i < n - 1; i++) {
                    if(ds[i] === 0 || ds[i - 1] === 0 || (ds[i - 1] > 0) !== (ds[i] > 0)) {
                        ms[i] = 0;
                    } else {
                        ms[i] = 3 * (dxs[i - 1] + dxs[i]) / (
                            (2 * dxs[i] + dxs[i - 1]) / ds[i - 1] +
                            (dxs[i] + 2 * dxs[i - 1]) / ds[i]);
                        if(!isFinite(ms[i])) {
                            ms[i] = 0;
                        }
                    }
                }
                let d = `M ${xs[0]},${ys[0]}`;
                let dots = '<g class="mt-chart-dots">';
                for(let i = 0; i < n - 1; i++) {
                    d += ` C ${xs[i] + dxs[i] / 3},${ys[i] + ms[i] * dxs[i] / 3} ${xs[i + 1] - dxs[i] / 3},${ys[i + 1] - ms[i + 1] * dxs[i] / 3} ${xs[i + 1]},${ys[i + 1]}`;
                    if (serie.Point.Visible)
                        dots += Lure.Chart.GetPathLineDot(xs[i] , ys[i], line, i, serie.Color, serie.Point.Radius );
                }
                if (serie.Point.Visible)
                    dots += Lure.Chart.GetPathLineDot(xs[n-1] , ys[n-1], line, n-1, serie.Color, serie.Point.Radius );
                dots += '</g>';
                return `<g class="mt-chart-serie"><path data-line="${line}" d="${d}" fill="none" stroke="${serie.Color}" stroke-width="${serie.Width}"></path> ${dots}</g>`;

            }.bind(this);
            this.__GetPathBar = function (serie, line) {
                if (!Buffer.Abscissa || Buffer.Width !== this.Width)
                    Buffer.Abscissa = Lure.Chart.GetAbscissa(chart.Options.Labels.Data, this.Width);
                let index = this._ScaleY.Dict[line];
                let scale = this._ScaleY.Scales[index];
                let mm = chart._ScaleY.MinMax[index];
                //debugger;
                let DataOrdinata = Lure.Chart.GetOrdinata(serie.Data, scale, mm, chart.Height);
                let points = Lure.Chart.GetPoints(Buffer.Abscissa, DataOrdinata);
                Buffer.SeriesPoints[line] = points;
                let height = this.Height;
                let wd = serie.Width;


                let bricks = '<g class="mt-chart-serie" data-type="Bar">';
                let GradientId = '';
                if (this.Options.SeriesOptions.BarGradient){
                    GradientId = 'bar_' + Math.random().toString(36).replace("0.", '');
                    bricks += `<linearGradient id="${GradientId}"  x1="0" y1="0%"><stop offset="0%" stop-color="rgba(0,0,0,0.2)"/><stop offset="33%" stop-color="rgba(255,255,255,0.2)"/><stop offset="100%" stop-color="rgba(0,0,0,0.3)"/></linearGradient>`;
                }
                // let d = `M ${points[0][0]}  ${points[0][1]}`;

                let dots = '';
                for (let i = 0; i < points.length; i++){
                    let d =`M ${points[i][0]-wd/2} ${height} L ${(points[i][0]+wd/2)} ${height} ${(points[i][0]+wd/2)} ${points[i][1]} ${points[i][0]-wd/2} ${points[i][1]}Z`;
                    // debugger;
                    bricks += `<path class="mt-chart-tooltipable" data-line="${line}" data-item="${i}" d="${d}" fill="${serie.Color}" stroke="#000" stroke-width="0"></path>`;
                    if (this.Options.SeriesOptions.BarGradient)
                        bricks += `<path class="mt-chart-tooltipable"  data-line="${line}" data-item="${i}" d="${d}" fill="url(#${GradientId})" ></path>`;
                    //dots += Lure.Chart.GetPathLineDot(points[i][0] , points[i][1], line, i, serie.Color, serie.Point.Radius );
                }
                bricks += dots+'</g>';
                return bricks;
            }.bind(this);


            (function Init(){
                /* let Legend = '';
                 for (let i = 0; i < this.Options.Series.length; i++){
                 Legend += Lure.Chart.MakeLegend(this.Options.Series[i], i);
                 }*/
                this.Block.Legend = Buffer.Legend;
                Buffer.ParametersAxisX = Builders.CalcAxisX();
                console.log('this.Height-Buffer.ParametersAxisX.Height',this.Height,Buffer.ParametersAxisX.Height);
                this._ScaleY = Lure.Chart.GetScaleY(this.Options.Series, (this.Height-Buffer.ParametersAxisX.Height), this);

                this.Block.AxisX = Builders.MakeAxisX();
                this.Block.Grid  = Lure.Chart.GetGrid(this.Options.Labels.Data.length, this._ScaleY.Scales[0].length-1);

                const isGraph = this.isGraph;
                console.log('isGraph',isGraph);
                let PathBuilder;
                if (isGraph)
                    PathBuilder = Builders.MakeGraph;
                let AxeY = '';
                //let Svg = '';
                let SvgBar = '';
                let SvgLine = '';

                /*
                 for (let i = 0; i < chart._ScaleY.Scales.length; i++){
                 let index = this._ScaleY.Dict[i];
                 //debugger;
                 AxeY += Builders.MakeAxisY(chart._ScaleY.Scales[index], i, chart.Options.Series[i].Title, chart.Options.Series[i].Color);
                 }*/
                AxeY = Builders.MakeAxisY();
                this.Block.AxisY = AxeY;
                for (let i = 0; i < chart.Options.Series.length; i++){

                    //AxeY += Builders.MakeAxisY(chart._ScaleY.Scales[i], i, chart.Options.Series[chart._ScaleY.Dict[i]].Title? chart.Options.Series[chart._ScaleY.Dict[i]].Title:chart.Options.Series[chart._ScaleY.Dict[i]].Name, chart.Options.Series[chart._ScaleY.Dict[i]].Color);
                    //Svg += PathBuilder(chart.Options.Series[i], i);
                    switch (chart.Options.Series[i].Type){
                        case 'line':
                            SvgLine += this.__GetPathLine(chart.Options.Series[i], i);
                            break;
                        case 'bar':
                            SvgBar += this.__GetPathBar(chart.Options.Series[i], i);
                            break;
                    }
                    //Svg += this.__GetPath(chart.Options.Series[i], i);
                    // this.__GetPath(chart.Options.Series[i], i)
                }


                this.Block.Svg   = SvgBar+SvgLine;



                this.Block.AxisY.style.height = this.Height+'px';


                //console.log(`AxisX FactHeight: ${this.Block.AxisX.clientHeight}`);
                // this.Block.AxisX.style.height = this.BuidlerData.AxisXOptions.Height+'px';

            }.bind(this))();
            /********************************************************************************/
            /*******/



            /*<tooltips>*/
            this.Tooltip = new Lure.Content({
                Name: 'Tooltipchek',
                Target: this.Block.ChartArea,
                Content: `<div class="mt-chart-tooltip">
                        <div class="val">${this.Options.Tooltip.Template}</div>
                      </div>`,
                Visible: false,
                Controller: {
                    Data: {},
                },
                BeforeShow: function (a,b) {

                },
                Prop: function () {
                    this._Timer = null;
                    this._Timer2 = null;
                },
                Shower: function () {
                    clearTimeout(this._Timer);
                    clearTimeout(this._Timer2);
                    this.Content.style.display = '';
                    this.Content.style.opacity = '1';
                },
                Hider: function () {
                    clearTimeout(this._Timer);
                    this._Timer = setTimeout(
                        function () {
                            this.Content.style.opacity = '0';
                            this._Timer2 = setTimeout(function () {
                                this.Content.style.display = 'none';
                            }.bind(this), 200)

                        }.bind(this), 500);
                },
                Show: function (options) {
                    clearTimeout(this._Timer);
                    this.Data.Name = options.data[0];
                    this.Data.Value = options.data[1];
                    this.Refresh();
                    this.Content.style.left = (options.pos[0] + 7)+"px";
                    this.Content.style.top = (options.pos[1] - this.Content.clientHeight - 7)+"px";
                    this.Content.style.backgroundColor = options.color;
                    //this._Timer = setTimeout(this.Hide, 2000);
                },
                Methods: function () {
                    this.Do = function (e) {
                        let tag = e.currentTarget.tagName.toLowerCase();
                        switch (tag){
                            case 'circle':
                                this.DoCircle(e);
                                break;
                            case 'path':
                                this.DoBar(e);
                                break;

                        }


                    }.bind(this);
                    this.DoCircle = function (e) {
                        let circle = e.currentTarget;
                        let i = parseInt(circle.dataset['line']);
                        let j = parseInt(circle.dataset['item']);
                        let color = circle.attributes['stroke'].value;
                        //console.log(` parseInt(circle.attributes['r'].value`,  parseInt(circle.attributes['r'].value) );
                        let width = parseInt(circle.attributes['stroke-width'].value);
                        circle.attributes['fill'].value = color;
                        circle.attributes['r'].value = parseInt(circle.attributes['r'].value) + width;
                        circle.attributes['stroke'].value = "#fff";


                        //console.log('', i, j, Buffer.SeriesPoints[i][j], [e.offsetX, e.offsetY]);
                        let o = {
                            data: [Series[i].Name, Series[i].Data[j]],
                            color: color,
                            pos: Buffer.SeriesPoints[i][j]  //[e.offsetX, e.offsetY]
                        };
                        this.Show(o);
                    }.bind(this);
                    this.DoBar = function (e) {
                        let bar = e.currentTarget;
                        let i = parseInt(bar.dataset['line']);
                        let j = parseInt(bar.dataset['item']);

                        // bar.attributes['stroke-width'].value = 2;

                        //console.log('', i, j, Buffer.SeriesPoints[i][j], [e.offsetX, e.offsetY]);

                        let o = {
                            data: [chart.Options.Series[i].Name, chart.Options.Series[i].Data[j]],
                            color: chart.Options.Series[i].Color,
                            pos: Buffer.SeriesPoints[i][j]  //[e.offsetX, e.offsetY]
                        };
                        this.Show(o);
                    }.bind(this);

                },
                AfterBuild: function () {

                }
            });
            Lure.AddEventListenerGlobal('mouseover', '.mt-chart-point, .mt-chart-tooltipable', function (e) {
                this.Tooltip.Do(e);
            }, this.Content, this);
            Lure.AddEventListenerGlobal('mouseout', '.mt-chart-point', function (e) {
                //console.log(e.currentTarget.dataset['tooltip']);
                let circle = e.currentTarget;
                let width = parseInt(circle.attributes['stroke-width'].value);
                circle.attributes['stroke'].value = circle.attributes['fill'].value;
                circle.attributes['fill'].value = "#fff";
                circle.attributes['r'].value -= width;
                chart.Tooltip.Hide();
            }, this.Content);
            /*</tooltips>*/

            const getSuperdata = function () {
                let superdata = [];
                for (let i =0; i< Series.length; i++){
                    let index = this._ScaleY.Dict[i];
                    let scale = this._ScaleY.Scales[index];
                    let mm = this._ScaleY.MinMax[index];
                    let DataOrdinata = Lure.Chart.GetOrdinata(Series[i].Data, scale, mm, this.Block.Svg.Height);
                    this._Abscissa = Lure.Chart.GetAbscissa(Labels.Data, this.Block.Svg.Width);
                    let points = Lure.Chart.GetPoints(this._Abscissa, DataOrdinata);
                    let h = 0;//
                    superdata[i] = {
                        h: this.Block.Svg.Height,
                        Name: chart.Options.Series[i].Name,
                        Data: chart.Options.Series[i].Data,
                        DataPoints: points,
                        Color: chart.Options.Series[i].Color,
                        Path: Lure.Chart.GetPath(points, chart.Options.Series[i].Type, i, chart.Options.Series[i].Color, chart.Options.Series[i].Width),
                        Width: chart.Options.Width,
                        options:{
                            pointSize: Series[i].Width? 4+Series[i].Width/4: 4
                        }
                    }
                }
                chart.SuperData = superdata;
                return superdata;
            }.bind(this);

            this.TestB = function () {
                let per = performance.now();
                Builder();
                Lure.Perf(per, 'builder');
            };
            this.Refresh = function () {


            }.bind(this);
            this.Refresh();
            setTimeout(function(){

            }.bind(this), 0);

            this.Buffer = Buffer;
        }
        get Height(){
            //return this.__svg.clientHeight;
            return this.Block.Svg.clientHeight;
        }
        get Width(){
            return this.Block.Svg.clientWidth;
            //return this.__svg.clientWidth;
        }



        /*statics*/
        static GetSeriePointOptions(serie, isGraph){
            let p = serie.Point ? serie.Point : {};
            p.Visible = (typeof p.Visible === 'undefined' || p.Visible);
            p.Radius = p.Radius? p.Radius : (4+serie.Width/4);
            if (Number.isNaN(p.Radius))
                debugger;
            return p;
        }

        static GetScaleY(series, height, ctx){
            if (ctx.Type === 'pie'){
                return [];
            }
            let min = series[0].Data[0];
            let max = series[0].Data[0];
            let isAutoScale = true;
            let isAutoStep = true;
            if (ctx.Options.AxisY.Scale[0] !== 'auto' && ctx.Options.AxisY.Scale[1] !== 'auto')
            {
                isAutoScale = false;
                min = ctx.Options.AxisY.Scale[0];
                max = ctx.Options.AxisY.Scale[1];
            }
            if (ctx.Options.AxisY.Scale[2] !== 'auto')
                isAutoStep = false;
            let mm = [ [series[0].Data[0],series[0].Data[0]] ];
            let index = 0;
            let scales = [];

            let sc = {
                Scales: [],
                Dict: [],
                MinMax: null
            };
            for (let i = 0; i < series.length; i++){
                sc.Dict[i] = 0;
                if (series[i].OwnAxis){
                    index++;
                    if (typeof series[i].OwnAxis[0] !== 'undefined')
                        mm.push(series[i].OwnAxis);
                    else
                        mm.push([series[i].Data[0],series[i].Data[0]]);
                    sc.Dict[i] = index;
                }
                for (let j = 0; j < series[i].Data.length; j++){
                    if (isAutoScale){
                        if (series[i].Data[j] < min)
                            min = series[i].Data[j];
                        if (series[i].Data[j] > max)
                            max = series[i].Data[j];
                    }
                    if (series[i].OwnAxis && typeof series[i].OwnAxis[0] === 'undefined'){
                        if (series[i].Data[j] < mm[index][0])
                            mm[index][0] = series[i].Data[j];
                        if (series[i].Data[j] > mm[index][1])
                            mm[index][1] = series[i].Data[j];
                    }
                }
            }
            mm[0] = [min, max];
            sc.MinMax = mm;
            for (let i = 0; i < mm.length; i++){
                let order = mm[i][1].toString().length;
                let step;
                if (i===0 && !isAutoStep){
                    step = ctx.Options.AxisY.Scale[2];
                }
                else{
                    step = mm[i][2]? mm[i][2] : ( (mm[i][1]-mm[i][0] )*40 /height / (Math.pow(10, order-1))/5 ).toFixed(1) * Math.pow(10, order-1)*5;
                }
                let s = mm[i][0];
                let scale = [];
                if (order < 3 || true){
                    //debugger;
                    while (s <= mm[i][1]){
                        scale.push(s);
                        s += step;
                    }
                    scale.push(s);
                    sc.Scales.push(scale);
                }
            }
            return sc;
        }

        static GetAbscissa(labels, width){
            const stepX = width / (labels.length);
            return labels.map(function(a,i){return i*stepX});
        }
        static GetOrdinata(serie, scale, mm, height){
            let min = mm[0];
            let max = mm[1];
            const scaleCoefficient = scale[scale.length-1] / max;
            let ordinata = [];
            for (let j= 0; j < serie.length; j++){
                ordinata.push( height - (  (serie[j] - min) * height/(max-min)/scaleCoefficient )  );
            }
            //console.log('Y', Y);
            //console.log('ordinate', ordinate);
            //console.log(`min=${min} max=${max}`, height);
            //ordinata.push(ordinate);
            //console.log('ordinata', ordinata);
            return ordinata;



        }
        static GetPoints(X,Y){
            let points = [];
            //let length = X.length >= Y.length ? X.length:Y.length;
            for (let i = 0; i < Y.length; i++){
                points.push([X[i], Y[i]]);
            }
            return points;
        }
        static GetPath(points, type, line, color, width){
            switch (type){
                case 'line':
                    return Lure.Chart.GetPathLine(points, line, color, width);
                case 'bar':
                    return Lure.Chart.GetPathBar(points, line, color, width);
                case 'pie':
                    return '';
            }
        }
        static GetPathLine(points, line, color, width, isDots=true){
            const n = points.length;

            let xs = [];        //x
            let ys = [];        //y
            let dys = [];       //dx
            let dxs = [];       //dy
            let ds = [];        //derivative
            let ms = [];        //desired slope (m) at each point using Fritsch-Carlson method
            for(let i = 0; i < n; i++) {
                xs[i] = points[i][0];
                ys[i] = points[i][1];
            }
            // Calculate deltas and derivative
            for(let i = 0; i < n - 1; i++) {
                dys[i] = ys[i + 1] - ys[i];
                dxs[i] = xs[i + 1] - xs[i];
                ds[i] = dys[i] / dxs[i];
            }
            // Determine desired slope (m) at each point using Fritsch-Carlson method
            // See: http://math.stackexchange.com/questions/45218/implementation-of-monotone-cubic-interpolation
            ms[0] = ds[0];
            ms[n - 1] = ds[n - 2];
            for(let i = 1; i < n - 1; i++) {
                if(ds[i] === 0 || ds[i - 1] === 0 || (ds[i - 1] > 0) !== (ds[i] > 0)) {
                    ms[i] = 0;
                } else {
                    ms[i] = 3 * (dxs[i - 1] + dxs[i]) / (
                        (2 * dxs[i] + dxs[i - 1]) / ds[i - 1] +
                        (dxs[i] + 2 * dxs[i - 1]) / ds[i]);
                    if(!isFinite(ms[i])) {
                        ms[i] = 0;
                    }
                }
            }
            let d = `M ${xs[0]},${ys[0]}`;
            let dots = '<g class="mt-chart-dots">';
            for(let i = 0; i < n - 1; i++) {
                //console.log(d);
                d += ` C ${xs[i] + dxs[i] / 3},${ys[i] + ms[i] * dxs[i] / 3} ${xs[i + 1] - dxs[i] / 3},${ys[i + 1] - ms[i + 1] * dxs[i] / 3} ${xs[i + 1]},${ys[i + 1]}`;
                if (isDots)
                    dots += Lure.Chart.GetPathLineDot(xs[i] , ys[i], line, i, color, width );
            }
            dots += '</g>';
            //return d;
            //console.log(d);
            return `<g class="mt-chart-serie"><path data-line="${line}" d="${d}" fill="none" stroke="${color}" stroke-width="${width}"></path> ${dots}</g>`;
        }
        static GetPathLineDot(x,y, i,j, color, width){
            return `<circle class="mt-chart-point" data-line="${i}" data-item="${j}" cx="${x}" cy="${y}" r="${width}" stroke="${color}" stroke-width="2" fill="#fff" ></circle>`

        }
        static GetPathBar(points, line, color, width){
            const wd = 30;
            console.log('GetPathBar', points);
            // return '';
            let p = `<path data-line="${line}" d=${0} fill="${color}" stroke="${color}" stroke-width="${width}"></path>`;
            // let d = `M ${points[0][0]}  ${points[0][1]}`;
            let dots = '';
            for (let i = 0; i < points.length; i++){
                let d =`M ${points[i][0]} ${points[i][1]} L ${points[i][0]} ${points[i][1]}`;
                dots += Lure.Chart.GetPathLineDot(points[i][0] , points[i][1], line, i, color, width );
            }
            // debugger;
            return dots;
        }


        /*builder*/
        static MakeLegend(Serie, i){
            return `<div class="mt-chart-legend__item row">
                          <input class="mt-legend-checkbox" type="checkbox" checked="checked" id="legcheck${Serie.Name}${i}">
                          <div class="mt-legend-icon" style="background-color: ${Serie.Color}"></div>
                          <label class="mt-legend-label" for="legcheck${Serie.Name}${i}">${Serie.Name}</label>
                        </div>`;
        }

        static GetGrid(sizeX, sizeY){
            let grid = ``;
            for (let i = 0; i < sizeY; i++){
                grid += `<div class="mt-chart__grid-line row flex-100 flex-between">`;
                for (let j = 0; j < sizeX; j++) {
                    grid += `<div class='mt-chart__grid-item flex-100'></div>`;
                }
                grid += `</div>`;
            }
            grid += ``;
            return grid;
        }
    }
};

Lure.Chart = Lure.Plugin.Chart.Chart;


Lure.__GenegateString = function () {
    let gen = Math.random().toString(36).replace("0.", '').replace(/[\d]+/, '').substring(0,1);
    if (Lure.Select(`#${gen}`)){
        gen = Lure.__GenegateString();
    }
    return gen;
};





















