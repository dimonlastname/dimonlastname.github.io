//
// Monsieur v0.7.9 [17.07.2017]
//
let Monsieur = (function(){
    class MonsieurClass {
        constructor() {
            this.Debug = false;

            const RegexpEach = new RegExp(/{{#EACH\s+(.+)}}/g);
            const RegexpIfMega = new RegExp(/{{#IF\s+(.+)}}([\s\S]*?){{#ENDIF}}/g);
            const RegexpParse = new RegExp(/{{ ?([^}]+)(\)?)}}/g);
            const RegexpIf = new RegExp(/#if([\s\S]*)/g);

            function CheckEditable(c) {
                return c;
                if (c === "")
                    return "";
                let elem = $(c);
                elem.attr('data-line', "{{i}}");
                elem.addClass('tpltr-line');
                let editables = elem.find('.editable');
                if (editables.length < 1)
                    return elem[0].outerHTML;
                editables = editables.filter(':not([data-field])'); //remove already checked in EACH CHECK
                editables.each(function (i, item) {
                    let innTxt = $(this).html();
                    $(this).html('<div class="editable-element editable-value">' + innTxt + '</div><div class="editable-element editable-icon"></div>');
                    $(this).attr('data-field', innTxt.replace(/{/g, "").replace(/}/g, ""));
                });
                c = elem[0].outerHTML;
                return c;
            }
            function CheckEach(c, ObjectName) {
                let elem;
                try {
                    elem = $(c);
                }
                catch (e) {
                    return c;
                }
                // elem.attr('data-line', "{{i}}");
                let editables = elem.find('.editable');
                if (editables.length < 1)
                    return c;
                editables.each(function (i, item) {
                    let innTxt = $(this).html();
                    $(this).html('<div class="editable-element editable-value">' + innTxt + '</div><div class="editable-element editable-icon"></div>');
                    $(this).attr('data-field', ObjectName + "[{{j}}]." + innTxt.replace(/{/g, "").replace(/}/g, ""));
                });
                c = elem[0].outerHTML;
                return c;
            }
            function Parse(c, ObjName) {
                //console.log('Parse', c);
               // return c;
                return c.replace(RegexpParse, function (a, b) {
                    let opers = b.match(/[+\-*\/]/g);
                    let values = b.split(/[+\-*\/]/);
                    let str;
                    //try to find sub operators (#if..#endif)
                    let theIF = b.replace(RegexpIf, function (s, condition) {
                        //console.log('condition', condition);
                        condition = condition
                            .replace(/&gt;/g, ">")
                            .replace(/&lt;/g, "<")
                            .replace(/#less/g, " < ")
                            .replace(/#more/g, " > ")
                            .replace(/\|/g, '"');
                        //console.log('condition',condition);
                        return `\`+
                        //Local if
                        (function(){
                            return (${condition}); 
                            return '';})()+\``;
                    });
                    if (b.match(RegexpIf)) {
                        return theIF;
                    }
                //    console.log('Parse afterIf', c);
                 //   console.log('Parse a, b', a, b);
                //    console.log('Parse values', values);

                    b = b.replace(/\s+/g, "");
                    b = b.replace(/[^+\-%*\/()]+/g, function(s){
                       // console.log('dsfsfs', s);
                        if (!$.isNumeric(s))
                        {
                            if (s !== "i" && s !== "j" && s.indexOf("$") < 0)
                                s = ObjName + "." + s;
                            else if (s === ObjName + ".$item")
                                s = ObjName;
                            else if (s === "$numInner")
                                s = "(j + 1)";
                            else if (s === "$denumInner")
                                s = "(inner.length - j)";
                            else if (s === "$itemInner")
                                s = "(inner[j])";
                            //treebuilder
                            else if (s === "$lvl" || s === "$key" || s === "$index")
                                s = ObjName + "." + b;
                        }
                        return s;
                    });
                    str = '${'+b+'}';
                    return str;
                });
            }
            function BuildIF(c) {
                return c.replace(RegexpIfMega, function (m, ObjectName, Text) {
                    Text = Text.replace(/\r/g, "").replace(/\n/g, "");
                    let ifmega = `\`+
                    //Mega IF
                    (function(inner){
                       if (inner === undefined || inner === null) return '';
                       if (Array.isArray(inner) && inner.length < 1) return '';
                       var text='';
                    try{
                       text=\`${Text}\`;
                    }catch(e){
                        console.error('#IF error', inner)
                    }
                    return text;})(o.${ObjectName})
+\``;
                    //console.log('MEGAIF',ifmega );
                    return ifmega;
                });
            }
            function BuildEach(c) {
                c = c.replace(/{{#each/g, "{{#EACH").replace(/{{#endeach/g, "{{#ENDEACH");
                let ma1 = c.match(/{{#EACH\s+(.+)}}/g);
                if (ma1)
                {
                    for (let i = ma1.length-1; i >=0 ; i--)
                    {
                        let isInsideEach = false;

                        let start = c.indexOf(ma1[i]);
                        let end = c.indexOf("{{#ENDEACH}}", start);

                        let prevStarts = c.slice(0, start).match(RegexpEach);
                        prevStarts = prevStarts!==null ? prevStarts.length: 0;
                        let prevEnds = c.slice(0, start).match(/{{#ENDEACH}}/g);
                        prevEnds = prevEnds!==null ? prevEnds.length: 0;
                        if ( (prevStarts > prevEnds ))
                        {
                            isInsideEach = true;
                        }
                        let each = c.slice(start, end+12);
                        let RepeatData = each.slice(ma1[i].length, each.length-12);
                        let ObjectName = ma1[i].replace(/{{#EACH\s+([\s\S]+)}}/, function(a,name){
                            return name;
                        });
                        let object = "o";
                        let parent;
                        if (i===0 || !isInsideEach)
                        {
                            object = "o."+ObjectName;
                            parent = `{
                                value: ${object},
                                i: i
                            }`;
                        }
                        else{
                            if (ObjectName.indexOf('$')> -1)
                                object = ObjectName;
                            else
                                object = "inner[j]."+ ObjectName;
                            parent = `{
                                value: ${object},
                                i: j,
                                parent: $parent
                            }`;

                        }

                        let eachCompiled = `\`+
//EACH
(function(inner, $parent){
    if (!inner || (jQuery.isEmptyObject(inner) && !$.isNumeric(inner) ) )
        return '';
    let ea='';
    for (let j = 0; j < inner.length; j++)
    {
        let $this = inner[j];
        ea+=\`${Parse(RepeatData, "inner[j]")}\`;
    }
    return ea;
})(${object}, ${parent})
+\``;
                        c = c.replace(each, eachCompiled);
                    }
                }
                return c;
            }
            this.Compile = function(c, isListElement) {
                //shield '
                c = c.replace(/'/g, "\\'");
                if (isListElement)
                {
                    c = BuildIF(c);
                    c = BuildEach(c);
                    c = CheckEditable(c);

                    c = c.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
                }
                c = Parse(c, "o");
                let f;
                let lets = `let $item = o;
if (o === undefined || (jQuery.isEmptyObject(o) && !jQuery.isNumeric(o)) ) 
    return '';
return \`${c}\``;

                try {
                    f = new Function('o', 'i', '$num', '$denum', lets);
                }
                catch (e){
                    console.info(lets);
                    console.error(e);
                }
                //console.log('Compiled:');
                //console.log(f);
                return f;
            };
            /*editable*/
            this.Editables = '.editable-waiting';
            this.Monsieur = this;

            ///
            this.Settings = {
                DialogBlur: null,                    //{string, jQuery, HTMLElement} - where blur on dialog
                DialogAnimation: 'monsieur-animation-dialog', //{string} -  css-animation class
            };
            this.Culture = {
                MonthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
                WeekDays: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
                WeekDaysShort: ["пн", "вт", "ср", "чт", "пт", "сб", "вс"],
            }
        };
        CheckCheckboxes(where) {
            let chboxes = where.find('input[type="checkbox"]');
            chboxes.each(function () {
                if ($(this).attr('data-checked') === "true")
                    $(this).attr('checked', true);
            });
        }
        Success(e){
            $('.editable-waiting').removeClass('editable-waiting');
        }

        ConfirmDialog(Caption, Message, OnAgree, OnCancel) {
            let dialog = document.createElement('div');
            dialog.classList.add('ConfirmDialog');
            if (Monsieur.Settings.DialogAnimation)
                dialog.classList.add(Monsieur.Settings.DialogAnimation);
            //###close button
            /* var close = document.createElement("div");
             close.classList.add("close", 'close-small');
             close.onclick = function() {
             dialog.remove();
             };
             dialog.appendChild(close);*/
            //###title
            let title = document.createElement("div");
            title.classList.add('cd-caption','cd-caption-red');
            title.innerHTML = Caption;
            dialog.appendChild(title);
            //###message field
            let msg = document.createElement("div");
            msg.classList.add('cd-text');
            msg.innerHTML = Message;
            dialog.appendChild(msg);
            //###buttonfield
            let buttons = document.createElement("div");
            /*buttons.style.display = "flex";
             buttons.style.justifyContent = "space-around";
             buttons.style.padding = "15px 0";*/
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
                    $(Monsieur.Settings.DialogBlur).removeClass('monsieur-blur');
                wrap.remove();
                dialog.remove();
            };
            dialog.getElementsByClassName("cd-buttons")[0].appendChild(btnOk);
            //###button cancel
            if (OnCancel !== null && OnCancel !== undefined)
            {
                let btnCancel = document.createElement("div");
                btnCancel.classList.add("button", "cd-button", "btn-diag-cancel");
                btnCancel.innerHTML = "Отмена";
                btnCancel.onclick = function(){
                    if (OnCancel !== null)
                        OnCancel();
                    if (Monsieur.Settings.DialogBlur)
                        $(Monsieur.Settings.DialogBlur).removeClass('monsieur-blur');
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
                $(Monsieur.Settings.DialogBlur).addClass('monsieur-blur');
            }
        }
        SuccessDialog(e){
            this.ConfirmDialog(
                "Выполнено",
                "",
                function(){}
            )
        }
        NoFeature(name){
            if (name)
                name = "\""+name+"\"";
            else
                name="";
            this.ConfirmDialog(
                "Error",
                "Sorry, function "+name+" is not available yet",
                function(){}
            )
        }
        ErrorHint(object, msg) {
            if (!msg)
                msg = "Поле не может быть пустым";
            let div = $("<div>");
            div.addClass('tpltr-error-hint');
            div.html(msg);
            object.parent().css('position', 'relative');
            object.parent().append(div);
            div.fadeIn(200);
            setTimeout(function(){
                div.fadeOut(200);
                setTimeout(function(){
                    object.parent().css('position', '');
                    div.remove();
                }, 500)
            }, 2000)
        }
    }
    return new MonsieurClass();
})();

// Monsieur Compiler v1.7.0
// ex.:
// c = '<div id="divId{{ID}}" data-type="{{type}}">{{Name}}</div>'
// or
// c = '<div id="divId{{ID}}" data-type="{{type}} data-line="{{i}}">
//          <div class=title>{{Name}}</div>
//          <div class="body">
//              {{#EACH Items}}
//                  <div id="SubDivId-{{i}}-{{j}}" data-subline="{{j}}">{{Name}}</div>
//              {{#ENDEACH}}
//          </div>
//      </div>'


Monsieur.TemplatorList = [];

//Editable
Monsieur.Edit = function (element) {

    element.parent().removeClass("editing");
    let Templator = element.closest('.tpltr-table')[0].Templator;
    let line = element.closest('.tpltr-line');
    let dataType = element.parent().attr('data-field');
    let index = line.attr('data-line');
    let datasaver = Templator.DataLineSave;
    let data = element.closest('.tpltr-table')[0].Templator.Data;
    let newValue = element.parent().children('.editable-textbox').val();
    let selectObjectFields = {};
    if (newValue === undefined)
    {
        newValue = element.parent().children('.editable-select').children('option:selected').val(); //.children('.editable-select option:selected') not working
        let atts = element.parent().children('.editable-select').children('option:selected')[0].attributes;
        for (let i = 0; i < atts.length; i++)
        {
            let item = atts[i];
            selectObjectFields[item.name.substr(17)] = item.value;
        }
    }
    if (newValue === "")
    {
        element.parent().removeClass("waiting");
        element.parent().html( element.parent().attr('data-old') );
        return;
    }
    console.log("SAVE >>> ", "data["+index+"]."+dataType+ " = '"+newValue+"'");
    let DataObjectString = "data["+index+"]."+dataType;
    eval(DataObjectString+ " = '"+newValue+"'");
    let EditableElem = element.parent();
    Editable.RemoveEdits();
    EditableElem.addClass('editable-waiting');
    EditableElem.find('.editable-value').html(newValue);

    DataObjectString = DataObjectString.substring(0, DataObjectString.lastIndexOf('.'));
    let DataObject = eval(DataObjectString);
    DataObject.$EditedField = dataType;
    DataObject.$selectObjectFields = selectObjectFields;
    datasaver(DataObject);
};
//Monsieur Templator v.1.2.0
//Target - Parent element css selector, if TargetItem not defined, data just fill out to Target (ex. ".block", "#Main", "select")
//Data - [] - massive of data, which elements may be objects or simple elements
//TargetItem - template to create it as many as [data] have; (ex. ".block-elem", "option")
//EmptyMessage - what show, if Data.length == 0
//PageSize - how much lines to show
//
// Usage:
// HTML fields should be contain names of data[i] keys, like:
// {{Name}}            === data[i].Name
// {{Person.Name}}     === data[i].Person.Name
// {{Person.Array[0]}} === data[i].Person.Array[0]
// {{Person.Array[i]}} === data[i].Person.Array[i] - but for what???
// {{Person.Array.length}} === data[i].Person.Array.length
// (!) don't forger brackets for sum numbers
// {{ 10+12 }} => 1012;
// {{(10+12)}} => 22
//
// if data is a simple array then HTML should write
// {{ELEM}} - it'll be a data[i] element
// indexes of elements:
// {{i}} - begins from 0
// {{j}} - begins from 0 in EACH
// {{$num}} - begins from 1
// {{$numInner}} - begins from 1 in EACH
// {{$denum}} - begins from end
// {{$denumInner}} - begins from end in EACH
//
// the if:
// {{#if (o.fame > 100) return '<div data-id="'+o.id+'"> more than 100</div>' #endif}} - returns '<div data-id="12">more than 100</div>' or '' (empty string)
//
// the EACH
// {{#EACH Items}}
//      <div>each[i,j][{{i}},{{j}}] ={{ELEM}}</div>    - returns <div>each[i,j][0,0] =Elem0Item0</div><div>each[i,j][0,1] =Elem0Item1</div>...<div>each[i,j][1,0] =Elem1Item0</div>....
// {{#ENDEACH}}
// for rebuild with new Data call Templator.Refresh(NewData)
// for rebuild with new page call Templator.BuildWithIt(PageData) - its will be add to old data after data[PageCursor];

// Extra = {
//      DataCount: {int},
//      DataGetter: {function},
//      PageSize: {int},
//      DataLineSaver: {function},   - call func to save line data to server
//      AfterBuild: {{function}}
// }
/*
 *  @param {string} TargetSelector
 *  @param {Array}  Data
 *  @param {string} TargetItemSelector
 *  @param {string} EmptyMessage
 *  @param {object} Extra
 */
function Templator1(TargetSelector, Data, TargetItemSelector, EmptyMessage, Extra) {
    //common props
    this.Target = TargetSelector;
    this.TargetItem = null;
    this.Data = Data;
    this.EmptyMessage = EmptyMessage;
    this.Refresh = function(data){
        if (data !== undefined)
            this.Data = data;
        this.PageCursor = 0;
        this.Build();
    };
    //ItemList props
    if (Extra !== undefined)
    {
        this.DataCount = Extra.DataCount;
        this.DataGetter = Extra.DataGetter; //function
        this.PageSize = Extra.PageSize;
        this.isShowAllButton = !!Extra.isShowAllButton; // if undefined it will be false;
        //
        this.DataLineSave = Extra.DataLineSaver;
        this.DataLineAdd = Extra.DataLineAdder;
    }


    this.PageCursor = 0;

    this.__DataCountReal = Data.length;

    this.Add = function(item, extraclass){ //add line to ItemList
        var x = this.Target;
        var line;// = this.Content;
        var Dictionary = this.Dictionary;
        if (this.Data.length === 0)
            $(x).find(".tpltr-empty").remove();
        var val = item;
        var $this = this;
        //val.$i = this.Data.length-1;
        //val.$num = this.Data.length;
        this.Data.push(item);
        /*if (typeof (item) != typeof {}) //if not an object  (simple array of string for grouplist)
            val = {ELEM: item};*/
        $(x).each(function(k){
                line = $this.__BuildLine[k](val, val, $this.Data.length-1, $this.Data.length);
                if (extraclass)
                {
                    line = $(line);
                    line.addClass(extraclass);
                }
                $(this).append(line);
            });

        if (this.DataLineAdd !== undefined)
            this.DataLineAdd(item)

    };
    this.RemoveDublicates = function(byField){
        var items = $(this.Target + " " + this.TargetItem);
        var used = [];
        for (var i = 0; i < items.length; i++){
            if ( used.indexOf( items[i].attributes[byField].value ) > -1)
            {
                items[i].remove();
            }
            else {
                used.push(items[i].attributes[byField].value);
            }
        }
    }; //for ItemList
    this.BuildWithIt = function(data){
        for (var i = 0; i < data.length; i++)
        {
            this.Data[this.PageCursor+i] = data[i];
        }
        this.Data.length = this.PageCursor + data.length;
        this.Build();
    }; //build with added downloaded page
    this.__BuildLine = null;// [ function(obj){return <tag>...</tag>},...]
    //Refresh props
    this.__Dictionary = [];
    this.FieldAdd = function(element){
        let node = element.nodeName;
        if (node === "defs" || node ==="g" || node ==="path" || node ==="text"|| node ==="clipPath")
            return; //ignore svg tags
        let rgx = new RegExp(/(\{\{\w*?.\w+\}\})|\{\{? (\{\{\w*?.\w+\}\}[\+\-\*/]\{\{\w*?.\w+\}\})? \}\}/);
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
            this.__Dictionary.push( {
                obj: element,
                fields: fields
            } );
        }
    };
    /////////
    this.Build = function(){
        let perf1 = performance.now();
        let x = this.Target;
        let data = this.Data;
        let $this = this;
        let lines = "";
        if (this._type === "ItemList")  // add mass data (lines)
        {
            if (this.PageCursor === 0)
                $(x).find(this.TargetItem).remove();
            $(x).find(".tpltr-paginator").remove(); //pagination btn
            $(x).find(".tpltr-empty").remove(); //pagination btn
            if (this.DataCount !== undefined)
            {
                this.__DataCountReal = data.length;
                data.length = this.DataCount;
            }
            let limit = this.PageCursor + data.length;
            let NextCount;
            let line;
            if (this.PageSize > 0)
            {
                limit = parseInt(this.PageCursor) + parseInt(this.PageSize);
                if (limit > data.length)
                    limit = data.length;
                //how much will be load in next step
                NextCount = data.length - limit;
                if (NextCount > this.PageSize)
                    NextCount = this.PageSize;
            }

            $(x).each(function(k){
                for (let i = $this.PageCursor; i < limit; i++)
                {
                    var val = data[i];
                    //val.$i = i;
                    //val.$num = i+1;
                    //val.$denum = limit - i;
                    /*if (typeof (data[i]) != typeof {}) //if not an object  (simple data array)
                        val = {ELEM: data[i]};*/
                    let xe = val;
                    line = $this.__BuildLine[k](val, val, i, (i+1), (limit - i));
                    //if should to save changed class list after rebuild
                    if (data[i].$classlist)
                    {
                        line = $(line);
                        line.attr('class', data[i].$classlist);
                        lines +=line[0].outerHTML;
                    }
                    else{
                        lines += line;
                    }
                }
                //save cursor index
                if ($this.PageSize > 0)
                    $this.PageCursor = limit;
                //empty data case
                if (data.length === 0)
                {
                    //var empty = $( $this.__BuildLine[k]({}) );
                    var empty = $($this.Content[k] );
                    empty.attr('class','tr tpltr-empty');
                    empty.html(EmptyMessage);
                    $(this).append(empty);
                }
                $(this).append(lines);
                lines = "";
            });
            //limit data case
            if (this.PageCursor < data.length && this.PageSize > 0)
            {
                var also;
                var TemplatorLink = this;
                var showAll = '<span> &nbsp; (Не загружено '+(data.length - this.PageCursor)+') &nbsp;</span>';
                if (this.isShowAllButton)
                {
                    showAll = '<span>&nbsp; или &nbsp;</span><span class="tpltr-nextAll  dotted pointer"> Все ('+ (data.length - this.PageCursor) +')</span>'
                }
                if ($(this.Target).is('table'))
                {
                    var colspan = $(this.Target + " tr:first-child th").length + 1;

                    also = '<tr class="tpltr-paginator"><td colspan="'+colspan+'" class="element block-head"><span class="tpltr-next dotted pointer">Показать еще '+ NextCount +' </span>'+showAll+'</td></tr>';
                    also = $(also);

                    also.find('.tpltr-next').click(function(){
                        if (TemplatorLink.DataCount > TemplatorLink.__DataCountReal)
                            TemplatorLink.DataGetter(TemplatorLink.PageCursor, TemplatorLink.PageSize);
                        else
                            TemplatorLink.Build();
                    });
                    also.find('.tpltr-nextAll').click(function(){
                        if (TemplatorLink.DataCount > TemplatorLink.__DataCountReal)
                        {
                            TemplatorLink.PageSize = 1000000; //1kk
                            TemplatorLink.DataGetter(TemplatorLink.PageCursor, (TemplatorLink.DataCount - TemplatorLink.PageCursor));
                        }
                        else
                            TemplatorLink.Build();
                    });
                }
                else {
                    also = $(c);
                    also.html('<span class="tpltr-next dotted pointer">Показать еще '+ NextCount +' </span>'+showAll);
                    also.find('.tpltr-next').click(function(){
                        if (TemplatorLink.DataCount > TemplatorLink.__DataCountReal)
                            TemplatorLink.DataGetter(TemplatorLink.PageCursor, TemplatorLink.PageSize);
                        else
                            TemplatorLink.Build();
                    });
                    also.find('.tpltr-nextAll').click(function(){
                        if (TemplatorLink.DataCount > TemplatorLink.__DataCountReal)
                        {
                            TemplatorLink.PageSize = 1000000; //1kk
                            TemplatorLink.DataGetter(TemplatorLink.PageCursor, (TemplatorLink.DataCount - TemplatorLink.PageCursor));
                        }
                        else
                            TemplatorLink.Build();
                    });
                }
                $(x).append(also);

            }

        }
        else if (this._type === "Refresh") //just update it
        {
            var Dictionary = this.__Dictionary;
            if (!data[0])
                data[0] = {};
            for (var i = 0; i < Dictionary.length; i++)
            {

                for (var j = 0; j < Dictionary[i].fields.length; j++)
                {
                    var isAttribute = Dictionary[i].fields[j].Target.indexOf('attributes') > -1;
                    var NewValue = Dictionary[i].fields[j].BuildValue(data[0]);
                    if (isAttribute)
                    {

                        Dictionary[i].obj.attributes[Dictionary[i].fields[j].Target.split(".")[1]].value = NewValue;
                    }
                    else {
                        Dictionary[i].obj[Dictionary[i].fields[j].Target] = Dictionary[i].fields[j].BuildValue(data[0]);
                    }

                }
            }
        }
        if (Monsieur.Debug)
            PerformanceNow(perf1, "Templator build");
    };
    this.__Templator = function(x, item){
        if ($(x).length < 1)
            return;
        if (item !== undefined) // if add mass data
        {

            this.TargetItem = item;
            this._type = "ItemList";
            //this.Content = $(x).find(this.TargetItem)[0].outerHTML;
            //this.__BuildLine = Monsieur.CompileTemplate( $(x).find(this.TargetItem)[0].outerHTML ) ;
            //$(x)[0].Templator = this;
            this.Content = [];
            this.__BuildLine = [];
            var $this = this;
            $(x).each(function(i){
                if (this !== undefined)
                {
                    $this.Content.push( $(this).find($this.TargetItem)[0].outerHTML );
                    $this.__BuildLine.push( Monsieur.Compile( $(this).find($this.TargetItem)[0].outerHTML, true ) );
                    this.Templator = $this;
                }

            });

        }
        else    // if just need to update in this DOMElem some data
        {
            this._type = "Refresh";
            var AllChildren  = $(x).find("*");
            AllChildren.push($(x)[0]);
            for (var i = 0; i < AllChildren.length; i++)
            {
                var child = AllChildren[i];
                this.FieldAdd(child);
            }
        }
        $(x).addClass('tpltr-table');
        $(x).find(this.TargetItem).addClass('tpltr-line');
        this.Build();
    };
    this.__Templator(TargetSelector, TargetItemSelector);
}

// target - item or query selector

class Templator
{
    /**
     * @return {Templator}
     */
    constructor(target, data,
        {
            ListElement,
            EmptyMessage,
            DataCount,
            DataGetter,
            PageSize,
            ShowAllButton = true,
            EmptyHide = false,
            DataLineSaver,
            DataLineAdder,
            NoAnimaton = false,
            AfterBuild = function(){},
            BeforeBuild = function(){},
            Parent = null
        }={}){
        this.isController = true;
        this.Content = $(target);
        this.Data = data;
        if (this.Content.length < 1)
            return null;
        let itemSelector;

        //////
        itemSelector = ListElement;
        this.EmptyMessage = EmptyMessage;
        this.DataCount = DataCount;
        this.DataGetter = DataGetter; //function
        this.PageSize = PageSize;
        this.isShowAllButton = ShowAllButton; // if undefined it will be false;
        this.isEmptyShow = !EmptyHide;
        //
        this.DataLineSave = DataLineSaver;
        this.DataLineAdd = DataLineAdder;
        this.NoAnimaton = NoAnimaton;

        this.AfterBuild = AfterBuild;
        this.BeforeBuild = BeforeBuild;
        this.Parent = Parent;
        ////////
        this.PageCursor = 0;
        /*if (item === undefined)
            item = $('[data-templator="item"]');*/
        //privates
        let rgx = new RegExp(/(\{\{\w*?.\w+\}\})|\{\{? (\{\{\w*?.\w+\}\}[\+\-\*/]\{\{\w*?.\w+\}\})? \}\}/);
        let Dictionary = [];
        let Content = [];
        let LineBuilder = [];
        let TemplatorCurrent = this;
        function FieldAdd(element){

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
        }
        function BuildWithIt(data){
            for (let i = 0; i < data.length; i++)
            {
                TemplatorCurrent.Data[TemplatorCurrent.PageCursor+i] = data[i];
            }
            TemplatorCurrent.Data.length = TemplatorCurrent.PageCursor + data.length;
            Build();
        } //build with added downloaded page
        function Build(){
            let perf1 = performance.now();
            let x = TemplatorCurrent.Content;
            let data = TemplatorCurrent.Data;

            let lines = "";
            if (TemplatorCurrent.BeforeBuild)
                TemplatorCurrent.BeforeBuild.call(TemplatorCurrent);

            if (TemplatorCurrent.Type === "ItemList")  // add mass data (lines)
            {
                TemplatorCurrent.Content.css('display', '');
                if (TemplatorCurrent.PageCursor === 0)
                    x.find('.tpltr-line').remove();
                x.find(".tpltr-paginator").remove(); //pagination btn
                x.find(".tpltr-empty").remove(); //pagination btn
                if (TemplatorCurrent.DataCount !== undefined)
                {
                    TemplatorCurrent.__DataCountReal = data.length;
                    data.length = TemplatorCurrent.DataCount;
                }
                let limit = TemplatorCurrent.PageCursor + data.length;
                let NextCount;
                let line;
                if (TemplatorCurrent.PageSize > 0)
                {
                    limit = parseInt(TemplatorCurrent.PageCursor) + parseInt(TemplatorCurrent.PageSize);
                    if (limit > data.length)
                        limit = data.length;
                    //how much will be load in next step
                    NextCount = data.length - limit;
                    if (NextCount > TemplatorCurrent.PageSize)
                        NextCount = TemplatorCurrent.PageSize;
                }
                x.each(function(k){
                    for (let i = TemplatorCurrent.PageCursor; i < limit; i++)
                    {
                        let val = data[i];
                        let xe = val;
                        try{
                            line = LineBuilder[k](val, i, (i+1), (limit - i));
                        }
                        catch (e){
                            console.info('TemplatorBuild', LineBuilder[k]);
                            console.error(e);
                        }
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
                    }
                    //save cursor index
                    if (TemplatorCurrent.PageSize > 0)
                        TemplatorCurrent.PageCursor = limit;
                    //empty data case
                    if (data.length === 0 && TemplatorCurrent.EmptyMessage && TemplatorCurrent.isEmptyShow)
                    {
                        //let empty = $( LineBuilder[k]({}) );
                        let empty = $(Content[k] );
                        //console.log('empty', empty);
                        //let empty = $(Content[k] );
                        empty.attr('class','tr tpltr-empty');
                        if (typeof TemplatorCurrent.EmptyMessage === "string")
                            empty.html(TemplatorCurrent.EmptyMessage);
                        else if (typeof TemplatorCurrent.EmptyMessage === "object")
                            empty.html(TemplatorCurrent.EmptyMessage[k]);
                        $(this).append(empty);
                    }
                    else if (data.length === 0 && !TemplatorCurrent.isEmptyShow){
                        TemplatorCurrent.Content.css('display', 'none');
                    }
                    $(this).append(lines);
                    lines = "";
                });
                //limit data case
                if (TemplatorCurrent.PageCursor < data.length && TemplatorCurrent.PageSize > 0)
                {
                    let also;
                    let showAll = '<span> &nbsp; (Не загружено '+(data.length - TemplatorCurrent.PageCursor)+') &nbsp;</span>';
                    if (TemplatorCurrent.isShowAllButton)
                    {
                        showAll = '<span>&nbsp; или &nbsp;</span><span class="tpltr-nextAll  dotted pointer"> Все ('+ (data.length - TemplatorCurrent.PageCursor) +')</span>'
                    }
                    if (TemplatorCurrent.Content.is('table'))
                    {
                        let colspan = $(TemplatorCurrent.Content).find("tr:first-child th").length + 1;

                        also = '<tr class="tpltr-paginator"><td colspan="'+colspan+'" class="element block-head"><span class="tpltr-next dotted pointer">Показать еще '+ NextCount +' </span>'+showAll+'</td></tr>';
                        also = $(also);
                    }
                    else {
                        also = $("<div class='tpltr-paginator'>");
                        also.html('<span class="tpltr-next dotted pointer">Показать еще '+ NextCount +' </span>'+showAll);
                    }
                    also.find('.tpltr-next').click(function(){
                        if (TemplatorCurrent.DataCount > TemplatorCurrent.__DataCountReal)
                        {
                            /*let promise = new Promise((resolve, fail) => {
                                TemplatorCurrent.DataGetter(TemplatorCurrent.PageCursor, TemplatorCurrent.PageSize, resolve);
                            });
                            promise.then(
                                result => {
                                    BuildWithIt(result);
                                },
                                error => console.log("Rejected: " + error)
                            );*/
                            TemplatorCurrent.DataGetter(TemplatorCurrent.PageCursor, TemplatorCurrent.PageSize, BuildWithIt);
                        }
                        else
                        {
                            Build();
                        }
                    });
                    also.find('.tpltr-nextAll').click(function(){
                        TemplatorCurrent.PageSize = TemplatorCurrent.Data.length;
                        if (TemplatorCurrent.DataCount > TemplatorCurrent.__DataCountReal)
                            TemplatorCurrent.DataGetter(TemplatorCurrent.PageCursor, (TemplatorCurrent.DataCount - TemplatorCurrent.PageCursor), BuildWithIt);
                        else
                            Build();
                    });
                    x.append(also);

                }

            }
            else if (TemplatorCurrent.Type === "Refresh") //just update it
            {

                if (!data)
                    data = {};
                for (let i = 0; i < Dictionary.length; i++)
                {

                    for (let j = 0; j < Dictionary[i].fields.length; j++)
                    {
                        let isAttribute = Dictionary[i].fields[j].Target.indexOf('attributes') > -1;
                        let NewValue = Dictionary[i].fields[j].BuildValue(data);
                        if (isAttribute)
                        {

                            Dictionary[i].obj.attributes[Dictionary[i].fields[j].Target.split(".")[1]].value = NewValue;
                        }
                        else {
                            Dictionary[i].obj[Dictionary[i].fields[j].Target] = Dictionary[i].fields[j].BuildValue(data);
                        }

                    }
                }
            }
            if (TemplatorCurrent.AfterBuild)
                TemplatorCurrent.AfterBuild.call(TemplatorCurrent);
            if (Monsieur.Debug)
                PerformanceNow(perf1, "Templator build");
        }

        //the constructor
        if (itemSelector !== undefined)
        {
            this.Type = "ItemList";
            if (itemSelector.match(/^[a-zA-Z.,\-_ #]+$/g) !== null) //just selector like ".list_element"
            {
                this.Content.find(itemSelector).addClass('tpltr-line');
                this.Content.each(function(i, tar){
                    Content.push( $(this).find(itemSelector)[0].outerHTML );
                    LineBuilder.push( Monsieur.Compile( $(this).find(itemSelector)[0].outerHTML, true ) );
                    tar.Templator = TemplatorCurrent;
                    $(this).find(itemSelector).remove();
                });
            }
            else{
                //addClass 'tpltr-line' without cast html
                let list_element = itemSelector.match(/<[^>]+>/)[0];
                let list_elementClassed;
                let pos = list_element.indexOf('class="');
                if (pos < 0)
                {
                    list_elementClassed = list_element.substr(0,list_element.length - 1) + ' class="tpltr-line"' + list_element.substr(list_element.length-1);
                }
                else
                {
                    pos = list_element.indexOf('"', pos+8);
                    list_elementClassed = list_element.substr(0,pos) + " tpltr-line" + list_element.substr(pos);
                }
                itemSelector = itemSelector.replace(list_element, list_elementClassed);

                this.Content.each(function(i, tar){
                    Content.push( itemSelector );
                    LineBuilder.push( Monsieur.Compile( itemSelector, true ) );
                    tar.Templator = TemplatorCurrent;
                });
            }
            this.Content.addClass('tpltr-table');
            this.RemoveDublicates = function(byField){
                let items = $(this.Content).find(this.ContentItem);
                let used = [];
                for (let i = 0; i < items.length; i++){
                    if ( used.indexOf( items[i].attributes[byField].value ) > -1)
                    {
                        items[i].remove();
                    }
                    else {
                        used.push(items[i].attributes[byField].value);
                    }
                }
            }; //for ItemList
        }
        else{
            this.Type = "Refresh";
            let AllChildren  = this.Content.find("*:not(g,path,clipPath,text,br)");
            AllChildren.push(this.Content[0]);
            for (let i = 0; i < AllChildren.length; i++)
                FieldAdd(AllChildren[i]);
        }
        Monsieur.TemplatorList.push(this);

        this.Refresh = function(data){
            if (data !== undefined)
                TemplatorCurrent.Data = data;
            TemplatorCurrent.PageCursor = 0;
            Build();
        };
        this.Add = function(item, extraclass, isPrepend = false){
            let line;// = this.Content;
            if (TemplatorCurrent.Data.length === 0)
                TemplatorCurrent.Content.find(".tpltr-empty").remove();

            TemplatorCurrent.Content.each(function(k){
                line = LineBuilder[k](item, TemplatorCurrent.Data.length-1, TemplatorCurrent.Data.length);
                if (extraclass)
                {
                    line = $(line);
                    line.addClass(extraclass);
                }
                if (!isPrepend)
                {
                    TemplatorCurrent.Data.push(item);
                    $(this).append(line);
                }
                else{
                    TemplatorCurrent.Data.unshift(item);
                    $(this).prepend(line);
                }
            });
            //server saver
            if (TemplatorCurrent.DataLineAdd !== undefined)
            {
                TemplatorCurrent.DataLineAdd(item)
            }
        };
        this.FieldAdd = function(element){
          //  console.log($(element)[0]);
            FieldAdd(element);
        };


        this._Debug = {
            LineBuilder: LineBuilder,
            Content: Content,
            Dictionary: Dictionary
        };
        Build();
    }

    get Items(){
        return this.Content.find('.tpltr-line');
    }
    Remove(i){
        this.Content.each(function () {
            $(this).find(`.tpltr-line:eq(${i})`).remove();
        });
        this.Data.splice(i, 1);
    }
}

//Monsieur TreeBuilder v.0.5.1
// Usage:
// Target is Parent object with sample of branch element
// ex:
//<div class="menu">                                                    -- parent (Target)
//    <div class="menu_element" data-id="{{id}}" data-type="{{type}}">  -- branch sample
//        <div class="menu_element-name">{{name}} + {{fame}}</div>
//    </div>
//</div>
// Usage:
// var TreeController = new TreeBuilder('.menu', Data, {
//      SubSelector: {{string, jQuery, HTMLElement}},
//      SubSelectorHandler: {{function}}
//      AfterBuild: {{function}}
// } );
/*
 *  @param {string} TargetSelector
 *  @param {Object} Data
 *  @param {Object} Extra
 */
class TreeBuilder{
    constructor(Target, Data, Extra){
        let $this = this;
        this.Data = Data;
        this.isController = true;
        this.Target = $(Target);
        this.Content = $(Target);
        if (Extra !== undefined){
            this.SubSelector = Extra.SubSelector;
            this.SubSelectorHandler = Extra.SubSelectorHandler;
            this.AfterBuild = Extra.AfterBuild;
            this.BeforeBuild = Extra.BeforeBuild;
            this.Parent = Extra.Parent;
        }
        let Lines = [];
        let Lvl = 0;
        let Index = 0;
        let LineBuilder = [];
        let TreeBuilderCurrent = this;

        $(Target).each(function(i) {
            Lines[i] = this.innerHTML;
            LineBuilder[i] = Monsieur.Compile(Lines[i], true);
        });
        /**
         * @return {string}
         */
        function BuildElement(obj, index, key, indexJ){
            Index++;
            obj.$lvl = Lvl;
            obj.$key = key;
            obj.$index = Index;
            let line = '';

            try{
                line = $(LineBuilder[index](obj,Lvl, indexJ) );
            }
            catch (e){
                console.error(e);
                console.info(LineBuilder[index], LineBuilder);

            }
            // return;
            for (let key in obj)
            {
                let ObjItem = obj[key];
                if (Array.isArray(ObjItem))
                {
                    Lvl++;
                    for (let i = 0; i < ObjItem.length; i++)
                    {
                        if (!TreeBuilderCurrent.SubSelector)
                        {
                            line.append(  BuildElement(ObjItem[i], index, key, i) );
                        }
                        else
                        {
                            line.addClass('tree-branch_has-sub');
                            line.children(TreeBuilderCurrent.SubSelector)
                                .addClass('tree-branch_the-sub')
                                .append(  BuildElement(ObjItem[i], index, key, i) );
                        }
                    }
                    Lvl--;
                }
            }
            return line;
        }
        function Build(newData){
            if ($this.BeforeBuild)
                $this.BeforeBuild.call($this);
            $(Target).each(function(i){
                //Lines[i] = this.innerHTML;
                //LineBuilder[i] = Monsieur.Compile(Lines[i], true);
                if (Array.isArray(newData))
                {
                    TreeBuilderCurrent.Target.eq(i).html('');
                    Lvl++;
                    for (let j = 0; j < newData.length; j++)
                        TreeBuilderCurrent.Target.eq(i).append(  BuildElement(newData[j], i, "root") );
                    Lvl--;
                }
                else{
                    TreeBuilderCurrent.Target.eq(i).html(BuildElement(newData, i, "root"));
                }

                Lvl = 0;
                Index = 0;
            });
            //this.__BuildLine = Monsieur.Compile(this.__Line, true);
            //after Build action
            if ($this.AfterBuild)
                $this.AfterBuild.call($this);
        }

        this.Data.$lvl = 0; //zero level of tree;

        let perf1 = performance.now();
        Build(this.Data);

        if (Monsieur.Debug)
            PerformanceNow(perf1, "TreeBuilder build");
        this._Debug = {};
        this._Debug.LineBuilder = LineBuilder;
        this._Debug.Lines = Lines;
        this.Refresh = function(newData){
            //$this.Target.html('');
            $this.Data = newData;
            Build($this.Data);
        }
    }
}
//Monsieur ComplexTableBuilder v.0.1.0
//
// NormalizeTableData - some first lines are header lines(HeadLinesCount == $(".TableSelector thead tr").length
//
// <table class="TableSelector">...</table>
//
//

// ex.1:
// ConfirmDialog(
//      "Warning!",
//      "This action is unsafe. Process was terminated.",
//      function(){}
//      );
// ex.2:
// ConfirmDialog(
//      "Warning!",
//      "This action is unsafe. Continue?",
//      function(){ DoSomething();  },
//      function(){ DoSomethingElse();  }
//      );
//
// (!) {function} OnAgree - can not be undefined
/*
 *  @param {string} Caption
 *  @param {string} Message
 *  @param {function} OnAgree
 *  @param {function} OnCancel
 */
function ConfirmDialog(Caption, Message, OnAgree, OnCancel) {
    Monsieur.ConfirmDialog(Caption, Message, OnAgree, OnCancel);
}


// Monsieur Tutor v0.9.10
// Чтобы сделать подсказку запишите ее текс в атрибут 'data-tutor'
// For tutorate an element need to add this element attribute 'data-tutor', which value is it's description
//
// ex.
// <div class="classname" data-tutor="Here is something tutor text">...</div>
//
// Если туторизованный элемент не виден, он будет показан. Если туторизванный элемент находится внутри невидимого
// необходимо написать родительский(будет вызван closest) селектор напр. {#parentId} , {.parentClass}
// ex.:
// <div class="parentClass invisible" id="parentId">
//     <div class="needshow" data-tutor="{.invisible} Here is something tutor text">...</div>
// </div>


const MonsieurTutor = {
    ColorTransparent: "",
    ButtonNextDefault: "",
    Data: [],
    TutorPosition: 0,
    Create: function (ButtonStarterSelector) {
        MonsieurTutor.ButtonStarter = $(ButtonStarterSelector);
        const MT = `<div class="MonsieurTutor">
        <div class="cd-caption">
            <span>Шаг </span>
            <span class="MonsieurTutor-step"></span>
        </div>
        <div class="MonsieurTutor-desc">Default msg Default msg Default msg Default msg Default msg</div>
        <div class="MonsieurTutor-btns">
            <button class="button btn-tutor element btn-tutor-stop">Прервать обучение</button>
            <button class="button btn-tutor element btn-tutor-next">Далeе →</button></div>
        </div>`;
        const MT_bg = '<div class="monsieur-bg dialog-wrapper"></div>';
        $('body').append(MT).append(MT_bg);
        MonsieurTutor.bg = $('.monsieur-bg');
        MonsieurTutor.TheTutor = $('.MonsieurTutor');
        MonsieurTutor.TheTutorDesc = $('.MonsieurTutor-desc');
        MonsieurTutor.TheTutorStep = $('.MonsieurTutor-step');
        MonsieurTutor.ButtonStop =  $('.btn-tutor-stop');
        MonsieurTutor.ButtonNext =  $('.btn-tutor-next');
        MonsieurTutor.ButtonStarter = $('.MonsieurTutorStarter');

        MonsieurTutor.ButtonNext.click(function () {
            MonsieurTutor.GoStep();
        });
        MonsieurTutor.ButtonStop.click(function () {
            MonsieurTutor.Stop();
        });
        MonsieurTutor.ButtonStarter.click(function () {
            MonsieurTutor.Run();
        });
    },
    ElemCssSet: function(Element){
        console.log(Element);
        if (!Element.is('tr'))
        {
            Element.css({
                zIndex: '11',
                position: 'relative',
                outline: '5px #bee0ff solid'
            });
            if (Element.css('background-color') === MonsieurTutor.ColorTransparent)
                Element.css('background-color', "#fff");
            if (!Element.is(":visible"))
            {
                if (!Element.is("table"))
                    Element.css('display', 'block');
                else
                    Element.css('display', 'table');
            }
            if (Element.length > 1)
                Element.eq(1).css({zIndex: '', outline: ''});
            return;
        }
        let nElements = Element.find('th, td');
        nElements.css({
            zIndex: '11',
            position: 'relative'
        });
        if (nElements.css('background-color') === MonsieurTutor.ColorTransparent)
            nElements.css('background-color', "#fff");
        if (Element.length > 1)
            Element.eq(1).css({zIndex: '', outline: ''});

    },
    ElemCssRestore: function () {
        let Element = MonsieurTutor.Data[MonsieurTutor.TutorPosition-1].obj;
        if (!Element.is('tr'))
        {
            Element.css({
                zIndex: '',
                position: '',
                outline: '',
                backgroundColor: '',
                display: ''
            });
            return;
        }
        let nElements = Element.find('th, td');
        nElements.css({
            zIndex: '',
            position: '',
        });
    },
    Run: function () {
        let TargetBlock = $('.content:visible');
        if (TargetBlock.length === 0)
            return;
        let Items = TargetBlock.find('*[data-tutor]')
            .filter(':not([data-line]), :not([data-line!="0"])')
            .not(function () {
                return $(this).closest('*[data-line]').is('[data-line!="0"]');
            }); //([data-line]) - list_element of templator
        if (Items.length === 0)
        {
            ConfirmDialog(
                "Сообщение",
                "На этом экране нет подсказок",
                function(){},
                null
            );
            return;
        }
        //*get transparent color of browser
        let temp = $('<div style="background:none;display:none;"/>').appendTo('body');
        MonsieurTutor.ColorTransparent = temp.css('background-color');
        temp.remove();
        //*/
        Items.each(function () {
            let item = {
                obj: $(this),
                desc: $(this).attr('data-tutor')
            };
            MonsieurTutor.Data.push(item);
        });
        MonsieurTutor.bg.css('display', 'block');
        MonsieurTutor.TheTutor.css('display', 'block');
        MonsieurTutor.ButtonNextDefault = MonsieurTutor.ButtonNext.html();
        MonsieurTutor.GoStep();
    },
    GoStep: function () {
        //restore prev element's css
        if (MonsieurTutor.TutorPosition > 0)
            MonsieurTutor.ElemCssRestore();
        if (MonsieurTutor.TutorPosition === MonsieurTutor.Data.length)
        {
            MonsieurTutor.Stop();
            return;
        }
        //select next elem
        let Element = MonsieurTutor.Data[MonsieurTutor.TutorPosition].obj;
        let ElementDesc = MonsieurTutor.Data[MonsieurTutor.TutorPosition].desc;
        // check for invisible parent
        let ElemParent = ElementDesc.match(/{([\s\S]+)}/);
        if (ElemParent !== null)
        {
            ElemParent = ElemParent[1];
            ElementDesc = ElementDesc.replace(/{([\s\S]+)}/, '');
            Element.push( Element.closest(ElemParent)[0]);
        }

        //set element visible
        MonsieurTutor.ElemCssSet(Element);
        //write new element title and desc
        MonsieurTutor.TheTutorStep.html((MonsieurTutor.TutorPosition+1) + "/"+MonsieurTutor.Data.length);
        MonsieurTutor.TheTutorDesc.html(ElementDesc);
        //caption next button
        if ((MonsieurTutor.TutorPosition+1) === MonsieurTutor.Data.length)
        {
            MonsieurTutor.ButtonNext.html('Завершить');
            MonsieurTutor.ButtonStop.css('opacity','0');
        }

        //move tutor desc box
        let posX = Element.offset().left + Element.outerWidth() + 10;
        let posY = Element.offset().top - MonsieurTutor.TheTutor.outerHeight() - 10;
        if (posY < 10)
            posY = 10;
        if ( (posX + MonsieurTutor.TheTutor.outerWidth()) > $(window).width() )
        {
            posX = Element.offset().left - MonsieurTutor.TheTutor.outerWidth() - 10;
            if ($(window).width() < MonsieurTutor.TheTutor.outerWidth() + Element.outerWidth())
            {
                posX = Element.offset().left + Element.outerWidth() - MonsieurTutor.TheTutor.outerWidth() - 20;
            }

        }
        if ($(window).scrollTop() > posY || $(window).scrollTop()+ $(window).height() < Element.offset().top + Element.height())
        {
            $('html, body').animate({scrollTop: posY - 10}, 300);
        }
        if (posX < 10)
            posX = 10;
        MonsieurTutor.TheTutor.css({
            left: posX,
            top: posY
        });

        MonsieurTutor.TutorPosition++;
    },
    Stop: function () {
        MonsieurTutor.ElemCssRestore();
        MonsieurTutor.bg.css('display', 'none');
        MonsieurTutor.TheTutor.css('display', 'none');
        MonsieurTutor.ButtonNext.html(MonsieurTutor.ButtonNextDefault);
        MonsieurTutor.ButtonStop.css('opacity','');
        MonsieurTutor.TutorPosition = 0;
        MonsieurTutor.Data = [];
    }
};





/*
(function(){
    var oldLog = console.log.bind(window.console);
    console.log = function (message) {
        CustomLog(message);
        oldLog.apply(console, arguments);
    };
})();
*/


function CustomLog(msg) {
    if (typeof(msg) !== "string")
        return;
    let div = $("<div>");
    div.css({
        padding: '10px 20px',
        marginTop: "5px",
        borderRadius: "5px",
        backgroundColor: '#d00',
        color: "#fff",
        display: "none"
    });
    div.html(msg);
    $('#custom-log').append(div);
    div.fadeIn(500);
    setTimeout(function(){
        div.fadeOut(500);
        setTimeout(function(){
            div.remove();
        }, 500)
    }, 5000)
}

function PerformanceNow(perfStart, text){
    if (!text)
        text = "Perf";
    let perfEnd = performance.now();
    console.info("[" + text + "]: " +Math.floor((perfEnd-perfStart)*100)/100 + "ms");
}




$(document).ready(function(){
    $('body').append('<div id="custom-log"></div>');
});




//----------- EDITABLE -------------------------------

const Editable = {
    RemoveEdits: function () {
        let some = $('.editable-editor').parent();
        some.each(function(){
            $(this).html( this.editableOld );
            $(this).css('padding', '')

        });
        //var val = $(".editable-textbox").val(); //FIXME add select option val
        $('.editable-waiting').removeClass('editable-waiting');
        $('.editable-editing').removeClass("editable-editing");
    },
    AddEdits: function (EditableElem) {
        EditableElem[0].editableOld = EditableElem.html();
        let oldText = EditableElem.children('.editable-value').html();
        EditableElem.addClass("editable-editing");
        EditableElem.css({paddingTop: 0, paddingBottom: 0});
        EditableElem.attr('data-valueOld', oldText);
        if (!EditableElem.attr('data-object')) //if no selectable data, just text editor is needed
        {
            let editType = EditableElem.attr('data-editable-type');
            if (typeof editType === 'undefined')
                editType="text";
            EditableElem.html('<input class="textbox editable-element editable-editor editable-textbox" type="'+editType+'" value="'+oldText+'"><div class="editable-element editable-save-button"></div>');
            EditableElem.children('.editable-editor').focus();
        }
        else
        { //if selectable data, and <select> is needed
            let select = $('<select class="select editable-element editable-editor editable-select">');
            let data = eval( EditableElem.attr('data-object') );
            console.log('-dataf-', EditableElem.attr('data-object'));
            console.log('-data-', data);
            let dataField = EditableElem.attr('data-field');
            let options = "";
            for (let i = 0; i < data.length; i++)
            {
                let attributes = "";
                if (typeof data[i] === typeof {})
                {
                    for (let key in data[i])
                    {
                        attributes += ' data-objectField-'+key+ '="'+data[i][key]+'"';
                    }
                    options += '<option class="editable-element" '+attributes+'>'+data[i][dataField]+'</option>';
                }
                else{
                    options += '<option class="editable-element" '+attributes+'>'+data[i]+'</option>';
                }
            }
            select.append(options);
            select.val(oldText);
            select.attr('data-valueOld', oldText);
            EditableElem.html(select);
            EditableElem.append('<div class="editable-element editable-save-button"></div>');
        }
    }
};
//show edits on editable field
$(document).on('dblclick', ".editable", function () {
    Editable.RemoveEdits();
    //show new
    let EditableElem = $(this).closest('.editable');
    Editable.AddEdits(EditableElem);
});


$(document).on('click', ".editable-icon", function () {
    Editable.RemoveEdits();
    //show new
    let EditableElem = $(this).closest('.editable');
    Editable.AddEdits(EditableElem);

});
//remove edits from editable field
$(document).click(function (e) {
    //let x = $(e.target).outerWidth() - e.offsetX - 5;
    //let y = $(e.target).outerHeight() - e.offsetY - 8;
    if (   $(e.target).is(".editable-editor")
        || $(e.target).is('.editable-save-button')
        || $(e.target).is('.editable-icon')
        || $(e.target).is('.editable-element')
        || $(".editable-editing:visible").length < 1
    )
    {
        return;
    }
    Editable.RemoveEdits();
});
//save edited on enter
$(document).on('keyup', '.editable-textbox', function (e) {
    if(e.which === 13) {
        $(this).parent().find('.editable-save-button').trigger('click');
    }

    let old = $(this).parent().attr('data-valueOld');
    let val = $(this).val();
    if (val !== old)
    {
        $(this).parent().addClass('editable-waiting');
    }
    else
    {
        $(this).parent().removeClass('editable-waiting');
    }
});

$(document).on('change', '.editable-editor', function(){
    if ($(this).val() !== $(this).attr('data-valueOld'))
        $(this).parent().addClass('editable-waiting');
    else
        $(this).parent().removeClass('editable-waiting');
});
//save edited
$(document).on('click', '.editable-save-button', function () {
    console.log('--editable-save-button--');
    if (!$(this).parent().hasClass('editable-waiting')) // if old value
    {
        Editable.RemoveEdits();
        return;
    }
    Monsieur.Edit( $(this) );
});





//show details line
$(document).on('click', '.item-detail-name', function(e){
    if ($(e.target).is('.editable-element') || $(e.target).is('.editable'))
        return;
    let line = $(this).parent().children('.item-details');
    let lines = $(this).parent().parent().find('.item-details');
    $(this).parent().parent().find('.item-detail-name.active').removeClass('active');
    $(this).addClass('active');
    lines.slideUp(200);
    if (!line.is(':visible'))
    {
        $(this).addClass('active');
        line.slideDown(200);
    }
    else
    {
        line.slideUp(200);
        $(this).removeClass('active');
    }
});





Monsieur.ContentList = {};


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
        Target     = null,              //{string, jQuery, HTMLElement}
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
        Shower     = function(){this.Content.css('display', '')},       //custom show handler
        Hider      = function(){this.Content.css('display', 'none')},   //custom hide hanler
        Refresh    = function(data){
            this.Controller.Refresh(data)
        },              //{function} - refresh content, may be call on page resize for example
        OnClick    = null,              //{function} - this.click event
        Controller = null,              //{object} contoller settings(help upper)
        Control    = null,              //{object} (help upper)

        AfterBuild = function(){},      //{function} - call after MonsieurContent init
        Props      = {},                //{object}  - extra fields for MonsieurContent
        Methods    = []                 //{Array} of {function}  - extra methods for MonsieurContent
    },
        parent)                         //link to parent MonsieurContent of SubContent
    {
        let $this = this;
        if (!parent)
        {
            this.Content = $(Target);
        }
        else
        {
            if (Global)
                this.Content = $(Target);
            else
                this.Content = parent.Content.find(Target);
            this.Parent = parent;
        }
        this.TitleContent = this.Content.find(Title);
        this.Type = Type;
        //extra fields
        for (let key in Props){
            $this[key] = Props[key]
        }
        //extra Methods
        for (let i = 0; i < Methods.length; i++){
            $this[Methods[i].name] = Methods[i].bind($this);
        }


        this.__private = {};
        this.__private.ToggleTimer = null;
        this.__private.Show = function(e) {

            let duration = parseInt($this.Content.css('transition-duration').replace('ms', '').replace(/(0.)?([0-9]+)s/, '$1$2'+"000"));
            let durationAni = parseInt($this.Content.css('animation-duration').replace('ms', '').replace(/(0.)?([0-9]+)s/, '$1$2'+"000"));
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
                $this.Content.addClass('monsieur-dialog');
                console.log('DialogWrapper', DialogWrapper);
                if (DialogWrapper){
                    $this.DialogWrapper = $('<div class="dialog-wrapper">');
                    $('body').append($this.DialogWrapper);
                    $this.DialogWrapper.click($this.Hide.bind($this));
                    let zIndexWrapper = parseInt($this.DialogWrapper.css('z-index'));
                    let zIndexContent = parseInt($this.Content.css('z-index'));
                    if (Number.isNaN(zIndexContent) || zIndexContent < zIndexWrapper)
                        $this.Content.css('z-index',   zIndexWrapper+1 );
                }

                if (DialogBlur)
                {
                    $this.DialogWrapper.css('background', 'none');
                    $(DialogBlur).addClass('monsieur-blur')
                }
                if (DialogAnimation){
                    $this.Content.addClass(DialogAnimation);
                }


            }
            Shower.call($this, e);
            clearTimeout($this.__private.ToggleTimer);

            if (Show !== null) {
                let ct = null;
                if (e && e.target)
                    ct = e.currentTarget;
                $this.__private.ToggleTimer = setTimeout(function() {
                    if (e && e.target)
                        e.currentTarget = ct;
                    Show.call($this, e);
                },duration);
            }
        };
        this.__private.Hide = function(e) {
            let duration = parseInt($this.Content.css('transition-duration').replace('ms', '').replace(/(0.)?([0-9]+)s/, '$1$2'+"000"));
            let durationAni = parseInt($this.Content.css('animation-duration').replace('ms', '').replace(/(0.)?([0-9]+)s/, '$1$2'+"000"));
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
            $this.Content.click(function () {
                OnClick.apply($this);
            });
            this.Click = function(){$this.Content.trigger('click');}
        }
        this.Control = new MonsieurControl(Control, $this);
        //SubContent
        for (let i = 0; i < SubContent.length; i++){
            $this[SubContent[i].Name] = new MonsieurContent( SubContent[i], $this );
        }
        if ( (Type === "Untyped" && Visible !== false) && !Dialog)
            Visible = true;
        else if ( (Type !== "Untyped" && Visible !== true) || ( Dialog && Visible !== true) )
            Visible = false;
        //if (Typed) Content is Visible
        if (Visible){
            this.Content.css('display', '');
            if (this.Control)
                this.Control.Active();
        }
        else { //not undefined
            this.Content.css('display', 'none');
        }
        if (Controller){
            if (!Controller.Extra)
                Controller.Extra = {};
            if (Controller.isController){
                this.Controller = Controller;
                this.Controller.Parent = this;
            }
            else{
                if (!Controller.Target)
                    Controller.Target = this.Content;
                if (!Controller.Data)
                    Controller.Data = [];
                Controller.Extra.Parent = this;
                this.Controller = new Controller.Type(Controller.Target, Controller.Data, Controller.Extra);
            }
        }
        if (!Monsieur.ContentList[$this.Type]) //if list is empty, create it, else just add
            Monsieur.ContentList[$this.Type] = [];
        Monsieur.ContentList[$this.Type].push(this);

        //close button
        this.Content.children('.close').click(function (e) {
            $this.Hide(e);
        });
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
    get Data(){
        if (this.Controller)
            return this.Controller.Data;
    }
    get isVisible(){
        let visible = this.Content.is(':visible');
        if (visible){ //check maybe it visible but has no visible area
            let s = this.Content.width()*this.Content.height();
            if (s === 0)
                visible = false;
        }

        return visible//this.__private.isVisible;
    }
    get Title(){
        return this.TitleContent.html();
    }
    set Title(t){
        this.TitleContent.html(t);
    }
    Dispose(){
        this.Controller = undefined;
        this.Content.remove();
        let ths = this;
        ths = undefined;
    }
}
class MonsieurHtml{
    constructor(target){
        this.Content = $(target);
    }
    get Value(){
        return this.Content.val()
    }
    set Value(val){
        this.Content.val(val)
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
                    Content: $(control[i].Content),
                    _Content: control[i].Content,
                    Type: control[i].Type ? control[i].Type : "Untyped",
                    isGlobal: control[i].Global,
                    OnClick: control[i].OnClick ? control[i].OnClick : owner.Show,
                    OnChange: control[i].OnChange,
                    Active: function(){$(control[i].Content).addClass('active')},
                    Disactive: function(){$(control[i].Content).removeClass('active')},

                };
                //onclick
                controls[control[i].Name].Content.addClass('pointer');
                if (control[i].Global){
                    $(document).on('click', control[i].Content, function(e){
                        $(control[i].Content).removeClass('active');
                        $(e.currentTarget).addClass('active');
                        if (controls[control[i].Name].OnClick)
                            controls[control[i].Name].OnClick.call(owner, e);
                    })
                }
                else{
                    controls[control[i].Name].Content.click(function (e) {
                        Monsieur.ContentList[owner.Type].forEach((item) =>
                        {
                            if ((item) !== owner)
                            {
                                if (item.Control)
                                    item.Control.Disactive();
                            }
                        });
                        //console.log('remover', e);
                        controls[control[i].Name].Content.removeClass('active');
                        $(e.currentTarget).addClass('active');
                        controls[control[i].Name].OnClick.call(owner, e);
                    });
                }

                if (control[i].OnChange)
                {
                    if (control[i].Global){
                        $(document).on('change', control[i].Content, function(e){
                            control[i].OnChange.call(owner, e);
                        })
                    }
                    else{
                        controls[control[i].Name].Content.change(function (e) {
                            control[i].OnChange.call(owner, e);
                        })
                    }
                }
            }
        }
    }
    Active(type = "Untyped"){
        for (let k in this)
            if (this[k].Type === type)
                this[k].Content.addClass('active');
    }
    Disactive(type = "Untyped"){
        for (let k in this)
            if (this[k].Type === type)
            {
                this[k].Content.removeClass('active');
                if (this[k].isGlobal)
                    $(this[k]._Content).removeClass('active');
            }

    }
}


class MonsieurInput //extends MonsieurHtml
{
    constructor(target){
        this.Content = $(target);
    }
    get Value(){
        return this.Content.val()
    }
    set Value(val){
        this.Content.val(val)
    }
}
class MonsieurButton
{
    constructor(target){
        this.Content = $(target);

    }
    get Click(){
        this.Content.trigger('click');
    }
    set Click(delegate){
        this.Content.click(delegate);
    }
    set Name(val){
        this.Content.val(val);
    }
}






class MonsieurTooltip{
    constructor({
        Target    = document,           //Target-listener (global document by default)
        Attribute = "data-tooltip",     // data-tooltip="Help text here"
        Delay     = 400,                //delay before tooltip show
        Time      = 1100,               //showing time
        Cursor    = "help",             //item:hover cursor
        Custom    = null,               //custom html of tooltip

    })
    {
        if (Custom === null)
            Custom = $(`<div class="monsieur-tooltip">`);
        else
            Custom = $(Custom);

        let Timer = null;
        let Destr = null;
        function Show(text){
            Custom.html(text);
            $(Target).append(Custom);

        }

        $(Target).find(`[${Attribute}]`).mouseover(function (e) {
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
        })
    }

}
class MonsieurLoading{
    constructor(
        {
            Target = 'body'
        } = {}
        ){
        this.Target = $(Target);
        this.Content = $(`<div class="ajax-loading" style="display: none">
    <svg xmlns="http://www.w3.org/2000/svg">
         <path d="" id="monsieur-arc1" fill="none" stroke="#449b22" stroke-width="5"></path>
         <path d="" id="monsieur-arc2" fill="none" stroke="#61c8de" stroke-width="5"></path>
         <path d="" id="monsieur-arc3" fill="none" stroke="#761c19" stroke-width="5"></path>
         <path d="" id="monsieur-arc4" fill="none" stroke="#333333" stroke-width="5"></path>
    </svg>
</div>`);
        this.Target.append(this.Content);
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
        this.Content.css('display', '');
        clearTimeout(this.TimeoutHide);
        this.Timeout = setTimeout(function(){
            $this.Content.css('display', 'block');
        }, 70);
    }
    Hide(){
        let $this = this;
        clearTimeout(this.Timeout);
        this.TimeoutHide = setTimeout(function(){
            $this.Content.css('display', 'none');
        }, 250); //hide may be called in same time as the show()
    }
}



