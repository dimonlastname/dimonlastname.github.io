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