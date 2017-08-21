String.prototype.toDate = function(){
    var temp = this.replace(/[Date()\/]/g,"").split('+') ;
    return new Date(parseInt(temp));
};
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
String.prototype.toDateFormat = function(mask){
    var temp = this.replace(/[Date()\/]/g,"").split('+') ;
    return new Date(parseInt(temp)).format(mask);
};
String.prototype.multiLine = function(length){
    var str = this;
    var string1;
    var string2;
    if (str.length > length)
    {
        var index = str.lastIndexOf(" ", length);
        if (index > 0)
        {
            string1 = str.substr(0, index);
            string2 = str.substring(index).multiLine(length);
            return string1 + "\r\n" + string2;
        }
        else {
            index = str.indexOf(" ", length);
            if (index > 0)
            {
                string1 = str.substr(0, index);
                string2 = str.substring(index).multiLine(length);
                return string1 + "\r\n" + string2;
            }
            else
            {
                return str;
            }

        }

    }
    else
        return str;
};

Date.prototype.isToday = function () {
    var day = this.getDate();
    var month = this.getMonth();
    var year = this.getFullYear();
    var today = new Date();
    if (day == today.getDate() && month == today.getMonth() && year == today.getFullYear())
        return true;
    return false;
};
Date.prototype.isTodayMonth = function () {

    var month = this.getMonth();
    var year = this.getFullYear();
    var today = new Date();
    if (month == today.getMonth() && year == today.getFullYear())
        return true;
    return false;
};
Date.prototype.daysCount = function daysInMonth() {
    var month = this.getMonth();
    var year = this.getFullYear();
    return new Date(year, month+1, 0).getDate();
};
Date.prototype.format = function (format) {
    var date = this;
    if (date == null || date == undefined)
        return '';
    var data = date.getDate();
    var mo = date.getMonth();
    var year = date.getFullYear();
    var hour = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();
    return format
        .replace('DD', data.toString().length < 2? `0${data}`: data )
        .replace('D', data )
        .replace('MMM', Monsieur.Culture.MonthNames[mo] )
        .replace('MM', mo.toString().length < 2 ? '0'+mo:mo )
        .replace('M', mo )
        .replace('YYYY',year )
        .replace('YY',year.toString().substring(2,2) )
        .replace('Y',year )
        .replace('HH',hour.toString().length < 2 ? '0'+hour:hour )
        .replace('hh',hour )
        .replace('mm',min.toString().length < 2 ? '0'+min:min )
        .replace('ss',sec.toString().length < 2 ? '0'+sec:sec );
};

Array.prototype.mergeObjects = function (SupportArray, keyField){
    var TargetArray = this;
    if (!keyField)
        keyField = "ID";
    for( var i = 0; i < TargetArray.length; i++)
    {
        var id = TargetArray[i][keyField];
        for (var j = 0; j < SupportArray.length; j++)
        {
            if (SupportArray[j][keyField] == id)
            {
                for (var key in SupportArray[j])
                {
                    TargetArray[i][key] = SupportArray[j][key];
                }
            }
        }
    }
    return TargetArray;
};
//  ex.:
//  targetKey = "ClientID"
//  targetValueKey = "ClientName"
//  supportKey = "ID"
//  SupportValueKey = "Name"
Array.prototype.mergeObjectProp = function (SupportArray, targetKey, targetValueKey, supportKey, SupportValueKey){
    var TargetArray = this;

    for( var i = 0; i < TargetArray.length; i++)
    {
        var id = TargetArray[i][targetKey];
        var isValueFound = false;
        for (var j = 0; j < SupportArray.length; j++)
        {
            if (SupportArray[j][supportKey] == id)
            {
                TargetArray[i][targetValueKey] = SupportArray[j][SupportValueKey];
                isValueFound = true;
            }
        }
        if (!isValueFound)
            TargetArray[i][targetValueKey] = "Неизвестный ID = " + TargetArray[i][targetKey];
    }
};
Array.prototype.sum = function(field){
    var TargetArray = this;
    var sum = 0;
    for (var i = 0; i < TargetArray.length; i++)
        sum += parseInt(TargetArray[i][field]);
    return sum;
};
Array.prototype.averageHarm = function () {
    var array = this;
    var Harm = 0;
    if (!parseInt(array[0]))
    {
        for (var i = 0; i < array.length; i++)
            Harm += 1/ array[i].length;
    }
    else {
        for (var j = 0; j < array.length; j++)
            Harm += 1/ array[j];
    }
    Harm = array.length / Harm;
    return Harm;
};
Array.prototype.averageArith = function () {
    var array = this;
    var Arith = 0;
    if (!parseInt(array[0]))
    {
        for (var i = 0; i < array.length; i++)
            Arith += array[i].length;
    }
    else {
        for (var j = 0; j < array.length; j++)
            Arith += array[j];
    }
    Arith = Arith / array.length;
    return Arith;
};

Array.prototype.maxId = function(field){
    if (field == undefined)
        field = "ID";
    var arr = this;
    var maxId= arr[0][field];
    for(var i=0; i < arr.length; i++)
        if (arr[i][field] > maxId)
            maxId = arr[i][field];
    return maxId;
};
Array.prototype.sumField = function(field){
    if (field == undefined)
        field = "ID";
    var arr = this;
    var sum = arr[0][field];
    for(var i=0; i < arr.length; i++)
        sum += arr[i][field];
    return sum;
};
Date.prototype.addDay = function(days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
};
Date.prototype.addMonth = function(mo) {
    var dat = new Date(this.valueOf());
    dat.setMonth(dat.getMonth() + mo);
    return dat;
};
Date.prototype.addYear = function(yyyy) {
    var dat = new Date(this.valueOf());
    dat.setFullYear(dat.getFullYear() + yyyy);
    return dat;
};
Date.prototype.setHoursZero = function() {
    var dat = new Date(this.valueOf());
    dat.setHours(0,0,0,0);
    return dat;
};
Date.prototype.setHoursMax = function() {
    var dat = new Date(this.valueOf());
    dat.setHours(23,59,59,59);
    return dat;
};
Date.prototype.setDateMin = function(){
    var month = this.getMonth();
    var year = this.getFullYear();
    return new Date(year, month, 1);
};
Date.prototype.YearStart = function() {
    var dat = new Date(this.valueOf());
    dat = new Date(dat.getFullYear(), 0, 1);
    return dat;
};
Date.prototype.YearEnd = function() {
    var dat = new Date(this.valueOf());
    dat = new Date(dat.getFullYear() + 1, 0, 1);
    dat.setMilliseconds(-1);
    return dat;
};


if (!Array.prototype.forEach){
    Array.prototype.forEach = function (func) {
        for (var i = 0; i < this.length; i++){
            func(this[i], i);
        }
    }
}
if (!NodeList.prototype.forEach){
    NodeList.prototype.forEach = Array.prototype.forEach;
}
if (!Element.prototype.remove) {
    Element.prototype.remove = function() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    };
}
if (!Element.prototype.matches)
    Element.prototype.matches = Element.prototype.msMatchesSelector;

if (!Element.prototype.closest) {
    Element.prototype.closest = function(css) {
        var node = this;

        while (node) {
            if (node.matches(css)) return node;
            else node = node.parentElement;
        }
        return null;
    };
}

/**
 *  @param {Array} array
 */
function uniq_fast(array) {
    var seen = {};
    var out = [];
    var len = array.length;
    var j = 0;
    for(var i = 0; i < len; i++) {
        var item = array[i];
        if(seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    return out;
}