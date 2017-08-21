//
// Monsieur v0.9.0 [28.07.2017]
//
let Monsieur = (function(){
    class MonsieurClass {
        constructor() {
            let $this = this;
            this.Debug = false;
            //this.isHasEditables = false;
            this.isEditableEventsEnabled = false;
            //regexes
            const regexEach = new RegExp(/{{#each\s+(.+)}}/g);
            const regexIfOuter = new RegExp(/{{#if\s+(.+)}}([\s\S]*?){{#endif}}/g);
            const regexIfInner = new RegExp(/{{#if([\s\S]*?)}}/g);
            const regexExpressions = new RegExp(/{{([^#}]+)}}/g);
            const regexEditable = new RegExp(/<[^>]+class=['"][\w\d\s]*(editable)[\w\d\s]*['"][^>]*>([^<]*)<[^>]*>/g);
            //compile helpers
            const spaces = "\t";
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
                let EachList = s.match(/{{#each\s+(.+)}}/g);
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
                            spaces.repeat(lvl)+'/* EACH */(function(inner, $parent){                                                                  \r\n' +
                            spaces.repeat(lvl)+'    if (!inner || (Object.keys(inner).length === 0 && inner.constructor === Object && isNaN(inner)))   \r\n' +
                            spaces.repeat(lvl)+'        return "";                                                                                     \r\n' +
                            spaces.repeat(lvl)+'    let string_result= "";                                                                             \r\n' +
                            spaces.repeat(lvl)+'    for(let j = 0; j < inner.length; j++){                                                             \r\n' +
                            spaces.repeat(lvl)+'        let $this = inner[j];                                                                          \r\n' +
                            spaces.repeat(lvl)+'        let o = inner[j];                                                                              \r\n' +
                            spaces.repeat(lvl)+'        string_result += \`'+preParse(expression) + '\`;                                               \r\n' +
                            spaces.repeat(lvl)+'    }                                                                                                  \r\n' +
                            spaces.repeat(lvl)+'    //console.log("each item", string_result);                                                         \r\n' +
                            spaces.repeat(lvl)+'    return string_result;                                                                              \r\n' +
                            spaces.repeat(lvl)+'})('+ObjectName+', {$parent: typeof $parent !== "undefined"?$parent:null, $this: $this, i: i} ) +`                    \r\n';
                        s = s.replace(string_Each, eachComplied)

                    }
                }
                return s;
            };
            const preCompileEditable = function(s){
                let isEdit = false;
                return  s.replace(regexEditable, function (match, editable, content) {
                    match = match.replace(/<[\s\S]+?(>)/, function (a, b) {
                        return a.replace(b, ` data-line="{{i}}" data-property="${content.replace('{{','').replace('}}','')}">`);
                    });
                    return match.replace(content, `<div class="editable-helper editable-value">${content}</div><div class="editable-helper editable-icon"></div>`);
                });

            };
            const preParseObjectChecker = function (ObjectName) {
                //ok check if it's expression
                //new:   [^\s\d\+\-\%()*]+
                //old:   [^+\-%*\/()]+
                function checking(c) {
                    let s = c.replace(/\s/g, "");
                    let containsSpecialObject = (s.indexOf('$item')> -1 || s.indexOf('$this') > -1 || s.indexOf('$parent') > -1 ) ;
                    let containsSpecialObjectTreeBuiler = (s.indexOf('$index')> -1 || s.indexOf('$j')> -1 || s.indexOf('$key') > -1 || s.indexOf('$lvl') > -1 ) ;
                    let isSpecialSymbol = (s === "?" || s.indexOf("=") > -1 || s.indexOf(">") > -1|| s.indexOf("<") > -1);
                    let isString = s.match(/^"[\s\S]*"$/) !== null;
                    let isIterator = s === "i" || s === "j";
                    let isNumber = !isNaN(s);
                    if (containsSpecialObject || containsSpecialObjectTreeBuiler || isIterator || isNumber || isString ||isSpecialSymbol){
                        return c;
                    }
                    //  s = "o."+s;
                    return "o."+s;
                }
                /*if (ObjectName.indexOf('=') > -1)
                    debugger;*/
                ObjectName = ObjectName.replace(/[^\s+\-\/%()*]+/g, function (c) {
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


                //   ObjectName = "o."+ObjectName;
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
             * @param {bool} isListElement
             * @return {Function|*}
             * @constructor
             */
            this.Compile = function(DomString, isListElement) {
                //c = c.replace(/\n/g, "");
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

            this.EditablesEventListenerRun = function(content){
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
                if (frag.childElementCount > 0)
                {
                    let nodes = [];
                    for (let i = 0; i < frag.childElementCount; i++)
                        nodes.push(frag.childNodes[i]);
                    return nodes;
                }
            };
            /**
             *
             * @param {string, HTMLElement} SelectorOrHTMLelement
             * @param parent
             * @return {HTMLElement}
             * @constructor
             */
            this.Select = function(SelectorOrHTMLelement, parent = document){
                //debugger;
                if (typeof SelectorOrHTMLelement.tagName !== 'undefined' || SelectorOrHTMLelement === document)
                    return SelectorOrHTMLelement;
                try{
                    const isListElementCssSelector = SelectorOrHTMLelement.match(/^[a-zA-Z0-9.,\-_ \]\["=:*#]+$/g) !== null;
                    if (isListElementCssSelector)
                        return parent.querySelector(SelectorOrHTMLelement);
                    return null;
                }
                catch (e){
                    console.info('Monsieur.Select SelectorOrHTMLelement', SelectorOrHTMLelement);
                    console.info('Monsieur.Select e', e);
                }

            };
            /**
             *
             * @param {string} Selector
             * @param {HTMLElement} parent
             * @return {NodeList}
             * @constructor
             */
            this.SelectAll = function(Selector, parent = document){
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
             * @constructor
             */
            this.AddEventListenerGlobal = function(eventName, selector, handler, parent = document){
                parent.addEventListener(eventName, function(e) {
                    let target = e.target;
                    let isIt = false;
                    let event = Monsieur.EventClone(e);
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
                        handler(event);
                    }
                });
            };
            /**
             *
             * @param {HTMLElement} HTMLElement
             * @return {boolean}
             */
            this.isVisible = function (HTMLElement){
                let ContentStyle = window.getComputedStyle(HTMLElement);
                //check invisible state;
                if ( (ContentStyle.display === "none") || (ContentStyle.opacity === "0") || (ContentStyle.visibility === "hidden") )
                    return false;
                //check for null-size
                if ( (parseInt(ContentStyle.minWidth) === 0 || ContentStyle.minWidth === "auto")  && parseInt(ContentStyle.width) === 0)
                    return false;
                if ( (parseInt(ContentStyle.minHeight) === 0 || ContentStyle.minHeight === "auto") && parseInt(ContentStyle.height) === 0)
                    return false;

                return true;
            };
            /**
             *
             * @param e
             * @return {ClonedEvent}
             * @constructor
             */
            this.EventClone = function(e) {
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
            //this.Content = MonsieurContent;
            //this.Templator = Templator;
            /*editable*/
            //this.Editables = '.editable-waiting';

            this.Editable = {
                RemoveWaiting(){
                    let waiedites = document.querySelectorAll('.editable-waiting');
                    waiedites.forEach(function (item) {
                        item.classList.remove('editable-waiting');
                    });
                },
                RemoveEdits(){
                    let editables = document.querySelectorAll('.editable-editing');
                    editables.forEach(function (item) {
                        item.innerHTML = item._innerHTML;
                        item.classList.remove('editable-editing');
                     //   item.parentElement.style.paddingBottom = '';
                    //    item.parentElement.style.paddingTop = '';
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
                    if (!EditableElement.dataset['object']) //if no selectable data, just text editor is needed
                    {
                        let EditType = EditableElement.dataset['type'];
                        if (typeof EditType === 'undefined')
                            EditType = 'text';
                        EditableElement.innerHTML = `<input class="textbox editable-helper editable-editor editable-textbox" type="${EditType}" value="${ValuePrev}"><div class="editable-helper editable-save-button"></div>`;
                        EditableElement.querySelector('.editable-editor').focus();
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
                        string_Select += '</select><div class="editable-helper editable-save-button"></div>';
                        //let Select = Monsieur.CreateElementFromString(string_Select);
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
                        Monsieur.ErrorHint(EditableElement, "Пустое поле или неправильные данные");
                        return;
                    }
                    EditableElement.innerHTML = EditableElement._innerHTML;
                    EditableElement.dataset['value'] = ValueNew;
                    EditableElement.querySelector('.editable-value').innerHTML = ValueNew;
                    EditableElement.classList.remove('editable-editing');
                    DataObject[Property] = ValueNew;

                    //so server now
                    Controller.LineSave(Property, ValueNew, Monsieur.Editable.RemoveWaiting);
                }
            };
            ///
            this.Settings = {
                DialogBlur: null,                    //{string, jQuery, HTMLElement} - where blur on dialog
                DialogAnimation: 'monsieur-animation-dialog', //{string} -  css-animation class
                EditableClass:  'editable',
                EditableWaiting:  'editable-waiting',
            };
            this.Culture = {
                MonthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
                WeekDays: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
                WeekDaysShort: ["пн", "вт", "ср", "чт", "пт", "сб", "вс"],
            };
            this.TemplatorList = [];
            this.ContentList = {};
        };


        PerformanceNow(perfStart, text){
            if (!text)
                text = "Perf";
            console.info("[" + text + "]: " +Math.floor((window.performance.now()-perfStart)*100)/100 + "ms");
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
            dialog.classList.add('monsieur-confirm');
            if (Monsieur.Settings.DialogAnimation)
                dialog.classList.add(Monsieur.Settings.DialogAnimation);
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
                if (OnAgree !== null && OnAgree !== undefined)
                    OnAgree();
                if (Monsieur.Settings.DialogBlur)
                    Monsieur.Select(Monsieur.Settings.DialogBlur).classList.remove('monsieur-blur');
                //$(Monsieur.Settings.DialogBlur).removeClass('monsieur-blur');
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
                    if (OnCancel !== null)
                        OnCancel();
                    if (Monsieur.Settings.DialogBlur)
                        Monsieur.Select(Monsieur.Settings.DialogBlur).classList.remove('monsieur-blur');
                    //$(Monsieur.Settings.DialogBlur).removeClass('monsieur-blur');
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
            if (Monsieur.Settings.DialogBlur)
            {
                wrap.style.background = 'none';
                Monsieur.Select(Monsieur.Settings.DialogBlur).classList.add('monsieur-blur');
                //$(Monsieur.Settings.DialogBlur).addClass('monsieur-blur');
            }
        }
        //Confirmation dialog teamplate just
        NoFeature(name = ""){
            if (name !== "")
                name = "\""+name+"\"";
            this.ConfirmDialog(
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
            div.classList.add('monsieur-error-hint');
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
    return new MonsieurClass();
})();
let mr = Monsieur;

//sets = {
//  SubContent: [
//      {{sets}},                           -same object to create subs
// ],
//
// Controller:{                             - if needs some Templator
//    Type: Templator,                                    - class link
//    Target: {{string, jQuery, HTMLElement}}             -(optional) if Controller.Target is undefined, Controller.Target = sets.Target
//    Data: {{array}},                                    - data array
//    ListElement: {{string, jQuery, HTMLElement}},       -
//    EmptyMessage: "no items",                           -
//    Extra: {}                                           - templator extra

//  Control: {
//    Content: {string, jQuery, HTMLElement},
//    Global: {bool}                               - set global event listenert. Set true if control renders after init or it renders dynamicly
//    OnClick: {function}         // here this === current MonsieurContent
//    OnChange: {function}
// },}


class MonsieurContent {
    constructor({                       //--MonsieurContent Settings

                    Target     = null,              //{string, jQuery, HTMLElement} - where render;
                    Content    = null,              //{string}  - html content string
                    Name       = null,              //{string}  - MonsieurContent's name
                    Global     = false,             //{bool}   -for SubContent. Set true, if SubContent outside of Parent
                    Title      = "",                //{string} -header element, contains name/caption/title of content
                    Type       = "Untyped",         //{string} - if has - this content will be invosoble by default, if need be visible set next property:
                    Visible    = undefined,         //{bool} - make visible by default (if has no Type - visible by default)
                    SubContent = [],                //{Array} of MonsieurContent Settings
                    Dialog     = false,             //{bool} - make dialog absolute window with dialog wrapper
                    DialogWrapper = true,             //{bool} - show dialog  wrapper bg
                    DialogBlur = null,              //{string, jQuery, HTMLElement} target background for blur when dialog
                    DialogAnimation = null,         //{string} - css animation name
                    Show       = null,              //{function} - show method
                    Hide       = null,              //{function} - hide method
                    Shower     = function(){this.Content.style.display = '';},       //custom show handler
                    Hider      = function(){this.Content.style.display = 'none';},   //custom hide hanler
                    BeforeShow = function(){},      //{function} - calls before Shower() and Show()
                    Refresh    = function(data){
                        if (this.Controller)
                            this.Controller.Refresh(data)
                    },              //{function} - refresh content, may be call on page resize for example
                    OnClick    = null,              //{function} - this.click event
                    Controller = null,              //{object} contoller settings(help upper)
                    Control    = null,              //{object} (help upper)


                    Props      = function(){},      //{function}  - recomented for extra fields for MonsieurContent (this.Extrafield =...)
                    Methods    = function(){},      //{function}  - recomented for  extra methods for MonsieurContent (this.ExtraMethod = function(){...} )
                    AfterBuild = function(){},       //{function} - calls after MonsieurContent init
                    Disabled   = false,             // debugging,
                    Parent     = null                       //link to parent MonsieurContent of SubContent
                })

    {
        if (Disabled)
            return;
        let $this = this;
        this.isContent = true;
        this.Parent = Parent;
        if (Parent !== null){

            if (Target !== null)
                this.Target = Monsieur.Select(Target, this.Parent.Content);
            else
                this.Target = this.Parent.Content;
            if (Global)
                this.Target = Monsieur.Select(Target);
        }else{
            this.Target = Monsieur.Select(Target);
            //this.Content = Monsieur.Select(Target);
        }
        if (Content !== null)
        {
            this.Content = Monsieur.CreateElementFromString(Content);
            this._Content = Content;
            this.Target.appendChild(this.Content);
        }
        else{
            this.Content = this.Target;
        }
        if (this.Content === null || this.Target === null)
            return;
        this.TitleContent = Monsieur.Select(Title, this.Content);
        this.Type = Type;
        this.Name = Name;

        //method
        this.Select = function(s){
            return Monsieur.Select(s, $this.Content)
        };
        this.SelectAll = function(s){
            return Monsieur.SelectAll(s, $this.Content)
        };
        this._ContentNames = [];
        //extra properties
        Props.call(this);
        Methods.call(this);
        //--


        this.__private = {};
        this.__private.ToggleTimer = null;
        this.__private.Show = function(e) {
            let style = window.getComputedStyle($this.Content);
            let duration = eval(style.transitionDuration.replace('ms', '*1').replace('s', '*1000'));
            let durationAni = eval(style.animationDuration.replace('ms', '*1').replace('s', '*1000'));
            if (duration < durationAni)
                duration = durationAni;
            duration++;

            if ($this.Type !== "Untyped" && !$this.isVisible)
            {
                Monsieur.ContentList[$this.Type].forEach((item) =>
                {
                    if ((item) !== $this)
                        item.Hide();
                });
            }
            if (Dialog){
                $this.Content.classList.add('monsieur-dialog');
                console.log('DialogWrapper', DialogWrapper);
                if (DialogWrapper){
                    $this.DialogWrapper = Monsieur.CreateElementFromString('<div class="dialog-wrapper">');
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
                    Monsieur.Select(DialogBlur).classList.add('monsieur-blur');
                }
                if (DialogAnimation){
                    $this.Content.classList.add(DialogAnimation);
                }
            }
            BeforeShow.call($this, e);
            Shower.call($this, e);
            $this.Content.style.display = '';
            clearTimeout($this.__private.ToggleTimer);

            if (Show !== null) {
                $this.__private.ToggleTimer = setTimeout(function() {
                    Show.call($this, e);
                },duration);
            }
        };
        this.__private.Hide = function(e) {
            let style = window.getComputedStyle($this.Content);
            let duration = eval(style.transitionDuration.replace('ms', '*1').replace('s', '*1000'));
            let durationAni = eval(style.animationDuration.replace('ms', '*1').replace('s', '*1000'));
            if (duration < durationAni)
                duration = durationAni;
            duration++;
            if (Dialog)
            {
                if ($this.DialogWrapper)
                    $this.DialogWrapper.remove();
                if (DialogBlur)
                    $(DialogBlur).removeClass('monsieur-blur');
            }

            Hider.call($this, e);
            clearTimeout($this.__private.ToggleTimer);
            if (Hide !== null)
                $this.__private.ToggleTimer = setTimeout(function () {
                    Hide.call($this, e);
                }, duration);

        };
        if (OnClick){
            $this.Content.onclick = OnClick.bind($this);
            //this.Click = function(){$this.Content.trigger('click');}
        }
        this.Control = new MonsieurControl(Control, $this);
        //SubContent
        for (let i = 0; i < SubContent.length; i++){
            {
                if (!SubContent[i].Parent)
                    SubContent[i].Parent = $this;
                $this._ContentNames.push(SubContent[i].Name);
                $this[SubContent[i].Name] = new MonsieurContent( SubContent[i] );
            }
        }
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
                    Controller.Type = Templator;
                Controller.Parent = this;
                this.Controller = new Controller.Type(Controller);
            }
            if (this.Controller.isHasEditable)
            {
                Monsieur.EditablesEventListenerRun($this.Content);
            }
        }
        if (!Monsieur.ContentList[$this.Type]) //if list is empty, create it, else just add
            Monsieur.ContentList[$this.Type] = [];
        Monsieur.ContentList[$this.Type].push(this);

        //close button
        //FIXED  maybe be wrong selection
        Array.from(this.Content.children).forEach(function(item){
            if (item.classList.contains("close"))
                item.onclick = function (e) {
                    $this.Hide(e);
                }
        });
        /*let ContentCloser = this.Content.querySelector('.close');
        if (ContentCloser !== null)
            ContentCloser.onclick = function (e) {
                $this.Hide(e);
            };*/


        /**
         *
         * @param {string}stringName
         * @constructor
         * @returns {MonsieurContent}
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
         * @returns {MonsieurContent}
         */
        this.GetContent = function (stringName='root') {
            let parent = this.GetParent(stringName);
            if (parent.Name === stringName)
                return parent;
            let root = parent;
            let found = null;
            let searcher = function (content) {
                if (content._ContentNames)
                    for( let i = 0; i < content._ContentNames.length; i++){
                        let name = content._ContentNames[i];
                        if (name === stringName)
                            return content[name];
                        found = searcher(content[name])
                    }
                return found;
            };
            return searcher(root);

        };
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
            Monsieur.AddEventListenerGlobal(eventName,selector,func, $this.Content)
        };


        this.Refresh = Refresh.bind(this);
        this.AllContents = Monsieur.ContentList;


        AfterBuild.call(this);
    }
    Show(e){
        /* if (this.Control)
         this.Control.Active();*/
        this.__private.Show(e);
    }
    Hide(e){
        if (this.Control)
            this.Control.Disactive();
        this.__private.Hide(e);
    }
    Toggle(e){
        if (this.isVisible)
            this.Hide(e);
        else
            this.Show(e);
    }

    get isVisible(){
        return Monsieur.isVisible(this.Content);
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
    Remove(i){
        if (this.Controller)
            this.Controller.Remove(i);
    }
    Add(itemData, extraclass = false, isPrepend = false){
        if (this.Controller)
            this.Controller.Add(itemData, extraclass, isPrepend );
    }
    Edit(itemData, i){
        if (this.Controller)
            this.Controller.Edit(itemData, i);
    }
    Dispose(){
        this.Controller = undefined;
        this.Content.remove();
        let ths = this;
        ths = null;
    }
}
class MonsieurControl{
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
                    Content: Monsieur.SelectAll(control[i].Target),
                    _Content: control[i].Target,
                    Type: control[i].Type ? control[i].Type : "Untyped",
                    isGlobal: control[i].Global,
                    OnClick: control[i].OnClick ? control[i].OnClick : owner.Show,
                    OnChange: control[i].OnChange,
                    Active: function(){
                        Monsieur.SelectAll(control[i].Target).forEach(function (item) {
                            item.classList.add('active');
                        })
                    },
                    Disactive: function(){
                        Monsieur.SelectAll(control[i].Target).forEach(function (item) {
                            item.classList.remove('active');
                        });
                    }

                };
                //onclick
                controls[control[i].Name].Content.forEach(function (item) {
                    item.classList.add('pointer');
                });
                if (control[i].Global){

                    Monsieur.AddEventListenerGlobal('click', control[i].Target, function (e) {
                        Monsieur.SelectAll(control[i].Target).forEach(function (item) {
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
                            Monsieur.ContentList[owner.Type].forEach((item) =>
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
                        Monsieur.AddEventListenerGlobal('change', control[i].Target, function (e) {
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
                    Monsieur.SelectAll(this[k]._Content).forEach(function(item){
                        item.classList.remove('active');
                    })
            }

    }
}
class Templator{
    constructor(
        {
            Target = null,          //{HTMLelement}
            Data = [],              // {object}, {array} - if object Templator would be refresh, if array - rebuild
            ListElement = ".list_element",            //{string} - css selector or dom string
            //ListElementOnClick = null,                //{function} -
            EmptyMessage = "",
            EmptyHide = false,      //{bool} - Templator.Content would be hidden if Data.length = 0
            DataType = "untyped",  //TODO when refresh one of typed Templator, would be refreshed/added/removed all of same type Templators (exclude untyped ofcourse)

            PageSize = -1,
            DataCount = -1,         //if > 0 PageGet is requied!!!
            PageGet = null,         //{function} - requied if DataCount > 0

            ShowAllButton = true,

            LineSave = function(property, newValue, callback=()=>{}){setTimeout(()=>{callback()}, 500)},            // callback would remove editable-waiting css class;
            LineAdd = function(dataObject, callback=()=>{}){setTimeout(()=>{ callback()}, 500)},                     // callback would remove editable-waiting css class;

            NoAnimation = false,    //TODO
            NoBuild = false,

            BeforeBuild = function(){},
            AfterBuild = function(){},
            Parent = null           //MonsieurContent, which owns this Controller

        } = {})
    {
        //### DEFINES
        this.isController = true;
        this.Content = Monsieur.Select(Target);
        this.Target = Monsieur.Select(Target);
        this._Data = Data;
        this.EmptyMessage = EmptyMessage;
        this.ListElement = "";
        this.DataType = DataType;

        this.BeforeBuild = BeforeBuild.bind(this);
        this.AfterBuild = AfterBuild.bind(this);
        this.Parent = Parent;
        //paginating
        this.PageSize = PageSize;
        this._PageSize = PageSize;
        this._DataCount = DataCount > 0 ? DataCount : this._Data.length ;
        this._PageCursor = 0;
        this._PageGet = PageGet;
        //this._PagesCount = Math.ceil(this._DataCount / this.PageSize );

        //server handling
        this.LineAdd = LineAdd;
        this.LineSave = LineSave;
        this.Type = null; // Refresh or ItemList

        //settings
        this.isShowAllButton = ShowAllButton;
        this.isNoAnimaton = NoAnimation;
        this.isEmptyHide = EmptyHide;

        let $this = this;
        //fields to refresh (for refresh type)
        let Dictionary = [];
        this._Dictionary = Dictionary;
        const Refresher = function () {
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
        const Rebuilder = function () {
            let lines = "";
            $this.Content.style.display = '';
            if ($this._PageCursor === 0 )
                $this.Content.querySelectorAll('.mt-line, .mt-paginator, .mt-empty').forEach(function(item) {item.remove();});
            //pagination check
            let NextCount;
            //let line;
            let Limit = $this._Data.length;
            if ($this.PageSize > 0)
            {
                let paginator = $this.Content.querySelector('.mt-paginator');
                if (paginator !== null)
                    paginator.remove();
                Limit = parseInt($this._PageCursor) + parseInt($this.PageSize);
                if (Limit > $this._DataCount)
                    Limit = $this._DataCount;
                //how much will be load in next step
                NextCount = $this._DataCount - Limit;
                if (NextCount > $this.PageSize)
                    NextCount = $this.PageSize;
            }
            if ($this.Type === "ItemList" && $this._Data.length === 0 && $this.EmptyMessage !== "" && !$this.isEmptyHide)
            {
                let tag = $this.ListElement.match(/\s?([\w]+) /)[0].replace(/\s/g, "");
                let empty = document.createElement(tag);
                empty.classList.add('mt-empty');
                empty.innerHTML = $this.EmptyMessage;
                $this.Content.appendChild(empty);
                return;
            }
            else if ($this.Type === "ItemList" && $this._Data.length === 0 && $this.isEmptyHide){
                $this.Content.style.display = 'none';
                return;
            }
            else if ($this._Data.length === 0) {
                return;
            }
            //linebuilding
            for (let i = $this._PageCursor; i < Limit; i++)
                lines += $this._LineBuilder($this._Data[i], i, $this._Data.length);
            //appending
            //   debugger;
            if ($this.Content.children.length < 1)
            {
                $this.Content.innerHTML = lines;
            }
            else{
                lines = Monsieur.CreateElementsFromString(lines, $this.Content.tagName);
                lines.forEach(function (item) {
                    $this.Content.appendChild(item);
                });
            }
            /*{
             lines += $this._LineBuilder($this._Data[i], i, $this._Data.length);
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
                    also = Monsieur.CreateElementFromString(also, $this.Content.tagName);
                }
                else {
                    also = Monsieur.CreateElementFromString(`<div class='mt-paginator'><span class="mt-btn-next dotted pointer">Показать еще ${NextCount}</span>${showAll}</div>`);

                }
                let btnNext = also.querySelector('.mt-btn-next');
                //console.log('btnNext', btnNext);
                btnNext.onclick = function(){
                    if ($this._PageCursor >= $this._Data.length)
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
                Rebuilder();


            $this.AfterBuild();
        };
        const BuildWithIt = function (data) {
            for (let i = 0; i < data.length; i++)
                $this._Data.push(data[i]);
            Build();
        };




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
                            BuildValue: Monsieur.Compile(elemAttributes[i].value)
                        });
                    else {
                        fields.push({
                            Target: elemAttributes[i].name,
                            BuildValue: Monsieur.Compile(elemAttributes[i].value)
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
                        BuildValue: Monsieur.Compile(element.innerHTML)
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
        this.Refresh = function(data = null, isRefreshed = false){
            $this.PageSize = $this._PageSize;
            $this._PageCursor = 0;
            if (data !== null)
                $this._Data = data;
            $this.PageCursor = 0;
            Build();
            //Refresh in  depended Templators
            if ($this.DataType !== 'untyped' && !isRefreshed){
                Monsieur.TemplatorList.forEach(function (teplor) {
                    if (teplor.DataType === $this.DataType && teplor !== $this)
                        teplor.Refresh(data, true);
                })
            }
        };
        this.RefreshOne = function (i, isRefreshed = false) {
            let newItem = Monsieur.CreateElementFromString($this._LineBuilder($this._Data[i], i, $this._Data.length));
            console.log('$this.Items[i] old', $this.Items[i]);
            console.log('$this.Items[i] new', newItem);
            let itemOld = $this.Items[i];
            $this.Items[i].parentNode.replaceChild(newItem, itemOld);

            if ($this.DataType !== 'untyped' && !isRefreshed){
                Monsieur.TemplatorList.forEach(function (teplor) {
                    if (teplor.DataType === $this.DataType && teplor !== $this)
                        teplor.RefreshOne(i, true);
                })
            }
        };
        this.Add = function(item, extraclass = false, isPrepend = false, isAddedData = false){
            if ($this._Data.length === 0)
                $this.Content.querySelector(".mt-empty").remove();
            let fragment = document.createDocumentFragment();
            let elem = document.createElement($this.Content.tagName);

            if (!isPrepend)
            {
                if (!isAddedData)
                    elem.innerHTML = $this._LineBuilder(item, $this._Data.length, $this._Data.length+1);
                if (isAddedData)
                    elem.innerHTML = $this._LineBuilder(item, $this._Data.length-1, $this._Data.length);
                while (elem.childNodes[0]) {
                    fragment.appendChild(elem.childNodes[0]);
                }
                if (extraclass)
                    fragment.children[0].classList.add(extraclass);
                if (!isAddedData)
                    $this._Data.push(item);
                $this.Content.appendChild(fragment);
            }
            else{
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
                if(!isAddedData)
                    $this._Data.unshift(item);
                $this.Content.prepend(fragment);
            }
            //server saver
            if ($this.LineAdd !== null)
            {
                $this.LineAdd(item);
            }
            //Add in  depended Templators
            if ($this.DataType !== 'untyped' && !isAddedData){
                Monsieur.TemplatorList.forEach(function (teplor) {
                    if (teplor.DataType === $this.DataType  && teplor !== $this)
                        teplor.Add(item, extraclass, isPrepend, true);
                })
            }

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
            this._LineBuilder = Monsieur.Compile(ListElement, true);
            if (ListElement.match(/<[^>]+class=['"][\w\d\s]*(editable)[\w\d\s]*['"][^>]*>([^<]*)<[^>]*>/) !== null)
                this.isHasEditable = true;
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
        Monsieur.TemplatorList.push(this);
        if (!NoBuild)
            Build();
    }
    get Data(){
        return this._Data;
    }
    set Data(data){
        let $this = this;
        if (this.DataType !== 'untyped'){
            Monsieur.TemplatorList.forEach(function (teplor) {
                if (teplor.DataType === $this.DataType)
                    teplor._Data = data;
            });
        }
        else {
            this._Data = data;
        }
    }

    get Items(){
        return this.Content.querySelectorAll('.mt-line');
    }

    /**
     * Remove Data[i] element from Controller
     * @param {int} i
     * @constructor
     */
    Remove(i, isRemovedData = false){
        //TODO rendered indexes not changings
        this.Content.querySelector(`.mt-line[data-line="${i}"]`).remove();
        for (let j = i; j < this.Items.length; j++){
            this.Items[j].dataset['line'] =  parseInt( this.Items[j].dataset['line'] ) - 1;
            this.Items[j].querySelectorAll('[data-line]').forEach(function (item) {
                item.dataset['line'] = parseInt( item.dataset['line'] ) - 1;
            })
        }

        //remove in  depended Templators
        let $this = this;
        if (this.DataType !== 'untyped' && !isRemovedData){
            Monsieur.TemplatorList.forEach(function (teplor) {
                if (teplor.DataType === $this.DataType && teplor !== $this)
                    teplor.Remove(i, true);
            })
        }
        if  (!isRemovedData)
            this._Data.splice(i, 1);
        if (this._Data.length === 0)
            this.Refresh();
    }
    Edit(itemData, i, isEdited = false){
        console.log('edit this', this);
        let $this = this;
        if (!isEdited)
        {
            this._Data[i] = itemData;
            this.RefreshOne(i, true);
        }
        if (this.DataType !== 'untyped' && !isEdited){
            Monsieur.TemplatorList.forEach(function (teplor) {
                if (teplor.DataType === $this.DataType && teplor !== $this)
                    teplor.RefreshOne(i, true);
            })
        }
    }

}
class TreeBuilder{
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

            Parent = null               //MonsieurContent, which owns this Controller
        }
    )
    {
        //### DEFINES
        this.isController = true;
        this.Content = Monsieur.Select(Target);
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
        this.LineBuilder = Monsieur.Compile(Branch, true);
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
            let line = Monsieur.CreateElementFromString($this.LineBuilder(obj, Index, null, extra));
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

//Tutorial
//TargetButton = {string, HTMLElement} - button who start the tutor
//TargetContent = {string, HTMLElement} - select/element where search tutors
class MonsieurTutor{
    constructor(TargetButton = null, TargetContent = null){
        //### DEFINES
        let $this = this;
        this.TargetButton = Monsieur.Select(TargetButton);
        this.TargetContent = Monsieur.Select(TargetContent);
        const MT = `<div class="monsieur-tutor">
        <div class="cd-caption">
            <span>Шаг </span>
            <span class="monsieur-tutor_step"></span>
        </div>
        <div class="monsieur-tutor_desc"></div>
        <div class="monsieur-tutor_btns">
            <button class="button btn-tutor element btn-tutor-stop">Прервать обучение</button>
            <button class="button btn-tutor element btn-tutor-next">Далeе →</button></div>
        </div>`;
        this.Content = Monsieur.CreateElementFromString(MT);
        this.ContentBG = Monsieur.CreateElementFromString('<div class="monsieur-tutor-bg dialog-wrapper"></div>');
        this.Content.style.display = 'none';
        this.ContentBG.style.display = 'none';
        this._Description = this.Content.querySelector('.monsieur-tutor_desc');
        this._Step = this.Content.querySelector('.monsieur-tutor_step');
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
                if (!Monsieur.isVisible(Element) )
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
                Monsieur.Confirm("Сообщение", "На этом экране нет подсказок");
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

    }
}
class MonsieurLoading{
    constructor(
        {
            Target = 'body'
        } = {}
    ){
        this.Target = Monsieur.Select(Target);
        this.Content = Monsieur.CreateElementFromString(`<div class="ajax-loading" style="display: none">
    <svg xmlns="http://www.w3.org/2000/svg">
         <path d="" id="monsieur-arc1" fill="none" stroke="#449b22" stroke-width="5"></path>
         <path d="" id="monsieur-arc2" fill="none" stroke="#61c8de" stroke-width="5"></path>
         <path d="" id="monsieur-arc3" fill="none" stroke="#761c19" stroke-width="5"></path>
         <path d="" id="monsieur-arc4" fill="none" stroke="#333333" stroke-width="5"></path>
    </svg>
</div>`);
        this.Target.appendChild(this.Content);
        function DoArc(id, cx, cy, radius, max){
            // if (id == null) return;
            let circle = document.getElementById(id);
            let e = circle.getAttribute("d");
            let d = " M "+ (cx + radius) + " " + cy;

            for (let angle =0; angle < max; angle++)
            {
                let radians= angle * (Math.PI / 180);  // convert degree to radians
                let x = cx + Math.cos(radians) * radius;
                let y = cy + Math.sin(radians) * radius;
                d += " L "+x + " " + y;
            }
            circle.setAttribute("d", d)
        }
        DoArc("monsieur-arc1", 60, 60, 45, 160);
        DoArc("monsieur-arc2", 60, 60, 40, 130);
        DoArc("monsieur-arc3", 60, 60, 35, 100);
        DoArc("monsieur-arc4", 60, 60, 30, 70);

        //
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
}
class MonsieurTooltip{
    constructor({
                    Target    = document,           //Target-listener (global document by default)
                    Attribute = "data-tooltip",     // data-tooltip="Help text here"
                    Delay     = 400,                //delay before tooltip show
                    Time      = 1100,               //showing time
                    Cursor    = "help",             //item:hover cursor
                    Custom    = `<div class="monsieur-tooltip">`,               //custom html of tooltip

                })
    {
        let $this = this;
        let ToolTip = Monsieur.CreateElementFromString(Custom);
        let Timer = null;
        let Destr = null;
        this.Target = Monsieur.Select(Target);
        function Show(text){
            ToolTip.innerHTML = text;
            $this.Target.appendChild(ToolTip);

        }
        $this.Target.querySelectorAll(`[${Attribute}]`).forEach(function (item) {
            item.addEventListener('mouseover', function () {
                clearTimeout(Destr);
                Timer = setTimeout(function(){
                    Show(text);
                }, Delay);
            });
            item.addEventListener('mouseout', function () {
                clearTimeout(Timer);
                Destr = setTimeout(function () {
                    Custom.remove();
                }, Time)
            })
        });


      /*  $(Target).find(`[${Attribute}]`).mouseover(function (e) {
            let text = $(e.currentTarget).attr(Attribute);
            clearTimeout(Destr);
            Timer = setTimeout(function(){
                Show(text);
            }, Delay);
        });
        $(Target).find(`[${Attribute}]`).mouseout(function (e) {
            clearTimeout(Timer);
            Destr = setTimeout(function () {
                Custom.remove();
            }, Time)
        })*/
    }

}































